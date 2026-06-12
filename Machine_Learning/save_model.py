import os
import json
import logging
import traceback
import tensorflow as tf
from tensorflow.keras import layers, models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)


def cbam_block(x, ratio=8, name="cbam"):
    """Convolutional Block Attention Module — lightweight foreground attention."""
    channels = x.shape[-1]

    # Channel attention
    avg_pool = layers.GlobalAveragePooling2D()(x)
    max_pool = layers.GlobalMaxPooling2D()(x)
    ca = layers.Dense(channels // ratio, activation="swish", name=f"{name}_ca1")(avg_pool)
    ca = layers.Dense(channels, activation="sigmoid", name=f"{name}_ca2")(ca)
    ca2 = layers.Dense(channels // ratio, activation="swish", name=f"{name}_ca3")(max_pool)
    ca2 = layers.Dense(channels, activation="sigmoid", name=f"{name}_ca4")(ca2)
    ca_out = layers.Add(name=f"{name}_ca_add")([ca, ca2])
    ca_out = layers.Reshape((1, 1, channels), name=f"{name}_ca_reshape")(ca_out)
    x = layers.Multiply(name=f"{name}_ca_mul")([x, ca_out])

    # Spatial attention
    from keras import ops
    avg_sp = ops.mean(x, axis=-1, keepdims=True)
    max_sp = ops.max(x, axis=-1, keepdims=True)
    sp = layers.Concatenate(name=f"{name}_sa_cat")([avg_sp, max_sp])
    sp = layers.Conv2D(1, 7, padding="same", activation="sigmoid", name=f"{name}_sa_conv")(sp)
    x = layers.Multiply(name=f"{name}_sa_mul")([x, sp])
    return x


def build_clean_model(num_classes, target_size=(224, 224)):
    """Build the production architecture: CBAM + lightweight head, outputting raw logits.

    Mirrors the notebook's build_model() exactly so set_weights() maps correctly.
    """
    base_model = tf.keras.applications.EfficientNetV2B0(
        input_shape=target_size + (3,),
        include_top=False,
        weights=None,
    )
    base_model.trainable = False

    inputs = tf.keras.Input(shape=(None, None, 3), name="input")
    x = layers.Resizing(target_size[0], target_size[1], interpolation="bilinear",
                        name="resize_input")(inputs)
    x = layers.GaussianNoise(0.05, name="gauss_noise")(x)
    x = base_model(x, training=False)
    # CBAM attention — focus on leaf regions, ignore background
    x = cbam_block(x, ratio=8, name="cbam")
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dropout(0.3, name="drop_gap")(x)
    x = layers.Dense(512, activation="swish", name="dense_head")(x)
    x = layers.BatchNormalization(name="bn_head")(x)
    x = layers.Dropout(0.4, name="drop_head")(x)
    # Raw logits (no softmax) — temperature scaling applied at inference
    outputs = layers.Dense(num_classes, activation="linear", dtype="float32", name="logits")(x)
    return models.Model(inputs, outputs)


def _read_labels_for_classes():
    """Detect number of classes from model/labels.json or best_model/calibration.json."""
    for path in ["model/labels.json", "best_model/calibration.json"]:
        if os.path.exists(path):
            with open(path) as f:
                meta = json.load(f)
            labels = meta.get("labels")
            if labels:
                return len(labels)
    log.warning("Could not detect num_classes from metadata; defaulting to 4.")
    return 4


log.info("=== EXPORT STARTED (v3.0) ===")
try:
    CKPT_DIR = "best_model"
    WEIGHTS_PATH = os.path.join(CKPT_DIR, "model.weights.h5")
    MODEL_KERAS_PATH = os.path.join(CKPT_DIR, "best_model.keras")
    OUTPUT_DIR = "model"
    saved_model_dir = os.path.join(OUTPUT_DIR, "saved_model")
    tflite_path = os.path.join(OUTPUT_DIR, "model.tflite")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Use weights H5 as primary source (portable, no Lambda serialization issues)
    if not os.path.exists(WEIGHTS_PATH):
        raise FileNotFoundError(
            f"Weights file not found at {WEIGHTS_PATH}. "
            "Run the notebook Cell 31 (Save Model) first to generate it."
        )

    log.info(f"Detecting model configuration...")
    num_classes = _read_labels_for_classes()

    log.info(f"Building export architecture ({num_classes} classes)...")
    clean_model = build_clean_model(num_classes=num_classes)

    log.info(f"Loading trained weights from {WEIGHTS_PATH}...")
    clean_model.load_weights(WEIGHTS_PATH)
    log.info("Weights loaded successfully.")


    # ─── Export SavedModel (raw logits) ───
    log.info(f"Exporting SavedModel (raw logits) at: {saved_model_dir}...")
    tf.saved_model.save(clean_model, saved_model_dir)
    log.info("SavedModel export completed successfully.")

    # ─── Export TFLite (INT8 quantization) ───
    log.info(f"Converting to TFLite INT8 at: {tflite_path}...")

    # Representative dataset for INT8 quantization
    def representative_dataset():
        val_dir = "dataset_split/val"
        if not os.path.exists(val_dir):
            log.warning("Validation dir not found; skipping representative dataset.")
            return
        ds = tf.keras.utils.image_dataset_from_directory(
            val_dir, shuffle=True, batch_size=1, image_size=(224, 224)
        )
        for images, _ in ds.take(200):
            yield [tf.cast(images, tf.float32)]

    converter = tf.lite.TFLiteConverter.from_keras_model(clean_model)
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,
    ]
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    if os.path.exists("dataset_split/val"):
        converter.representative_dataset = representative_dataset

    tflite_model = converter.convert()
    with open(tflite_path, "wb") as f:
        f.write(tflite_model)
    log.info("TFLite conversion completed successfully.")

    # ─── Export model metadata ───
    # Load labels and calibration from training output
    labels_path = os.path.join(OUTPUT_DIR, "labels.json")
    cal_path = os.path.join("best_model", "calibration.json")

    labels_meta = {"labels": None, "temperature": 1.0, "conf_threshold_high": 0.70,
                   "conf_threshold_low": 0.45}

    if os.path.exists(labels_path):
        with open(labels_path) as f:
            labels_meta.update(json.load(f))

    if os.path.exists(cal_path):
        with open(cal_path) as f:
            cal = json.load(f)
        labels_meta["temperature"] = cal.get("temperature", 1.0)

    labels_meta["version"] = "3.0"
    labels_meta["architecture"] = "EfficientNetV2B0 + CBAM + Dense(512)"
    labels_meta["output_type"] = "logits"
    labels_meta["input_range"] = [0, 255]
    labels_meta["input_size"] = [224, 224]
    labels_meta["preprocessing"] = "resize_bilinear_224x224_no_normalization"

    with open(labels_path, "w") as f:
        json.dump(labels_meta, f, indent=2)
    log.info(f"Labels + calibration metadata saved to {labels_path}")

    log.info("=== EXPORT COMPLETED (v3.0) ===")

except Exception:
    log.error("EXPORT FAILED")
    log.error(traceback.format_exc())
