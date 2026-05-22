import os
import logging
import traceback
import tensorflow as tf
from tensorflow.keras import layers, models

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

def build_clean_model(num_classes, img_size=(224, 224)):
    base_model = tf.keras.applications.EfficientNetV2B0(
        input_shape=img_size + (3,),
        include_top=False,
        weights=None,
    )
    inputs = tf.keras.Input(shape=img_size + (3,))
    x = base_model(inputs, training=False)
    x = layers.Conv2D(512, (3, 3), padding='same', activation='swish')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D((2, 2))(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Conv2D(256, (3, 3), padding='same', activation='swish')(x)
    x = layers.BatchNormalization()(x)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(1024, activation='swish')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.4)(x)
    outputs = layers.Dense(num_classes, activation='sigmoid', dtype='float32')(x)
    return models.Model(inputs, outputs)

logging.info("=== EXPORT STARTED ===")
try:
    MODEL_KERAS_PATH = "best_model/best_model.keras"
    OUTPUT_DIR = "model"
    saved_model_dir = os.path.join(OUTPUT_DIR, "saved_model")
    tflite_path = os.path.join(OUTPUT_DIR, "model.tflite")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    if not os.path.exists(MODEL_KERAS_PATH):
        raise FileNotFoundError(f"Model file not found at {MODEL_KERAS_PATH}")

    logging.info(f"Loading trained weights from {MODEL_KERAS_PATH}...")
    original_model = tf.keras.models.load_model(MODEL_KERAS_PATH, compile=False)
    
    logging.info("Building clean architecture...")
    clean_model = build_clean_model(num_classes=original_model.output_shape[-1])
    clean_model.set_weights(original_model.get_weights())
    logging.info("Weights cloned successfully.")

    logging.info(f"Exporting to SavedModel format at: {saved_model_dir}...")
    tf.saved_model.save(clean_model, saved_model_dir)
    logging.info("SavedModel export completed successfully.")

    logging.info(f"Converting to TFLite format at: {tflite_path}...")
    converter = tf.lite.TFLiteConverter.from_keras_model(clean_model)
    converter.target_spec.supported_ops = [
        tf.lite.OpsSet.TFLITE_BUILTINS,
        tf.lite.OpsSet.SELECT_TF_OPS,
    ]
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    tflite_model = converter.convert()
    with open(tflite_path, "wb") as f:
        f.write(tflite_model)
    logging.info("TFLite conversion completed successfully.")
    logging.info("=== EXPORT COMPLETED ===")

except Exception:
    logging.error("EXPORT FAILED")
    logging.error(traceback.format_exc())
