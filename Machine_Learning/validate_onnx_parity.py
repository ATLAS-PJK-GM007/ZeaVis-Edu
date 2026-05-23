#!/usr/bin/env python3
"""Validate parity between Keras and ONNX models on test images."""

import argparse
import logging
from pathlib import Path

import numpy as np
import onnxruntime as ort
import tensorflow as tf
from PIL import Image, UnidentifiedImageError


LABELS = ["Bercak Daun", "Daun Sehat", "Karat Daun", "Hawar Daun"]


class ParityError(RuntimeError):
    """Raised when Keras and ONNX predictions do not match."""
    pass


def preprocess_image(image_path, input_size):
    """
    Load and preprocess an image for model inference.

    Args:
        image_path: Path to the image file.
        input_size: Target size (int) for square resize.

    Returns:
        Preprocessed image as float32 NHWC batch (1, input_size, input_size, 3).

    Raises:
        ParityError: If image cannot be loaded or processed.
    """
    try:
        img = Image.open(image_path).convert("RGB")
    except (FileNotFoundError, UnidentifiedImageError, OSError) as e:
        raise ParityError(f"Failed to load image {image_path}: {e}")

    try:
        img = img.resize((input_size, input_size), Image.Resampling.BILINEAR)
    except Exception as e:
        raise ParityError(f"Failed to resize image {image_path}: {e}")

    img_array = np.array(img, dtype=np.float32)
    img_batch = np.expand_dims(img_array, axis=0)

    return img_batch


def predict_keras(model, image_batch):
    """
    Run inference on Keras model.

    Args:
        model: Loaded Keras model.
        image_batch: Preprocessed image batch (1, H, W, 3).

    Returns:
        Predictions array (1, num_classes).
    """
    predictions = model.predict(image_batch, verbose=0)
    return predictions


def predict_onnx(session, image_batch):
    """
    Run inference on ONNX model.

    Args:
        session: ONNX Runtime InferenceSession.
        image_batch: Preprocessed image batch (1, H, W, 3).

    Returns:
        Predictions array (1, num_classes).
    """
    input_name = session.get_inputs()[0].name
    predictions = session.run(None, {input_name: image_batch})
    return predictions[0]


def validate_image(image_path, keras_model, onnx_session, input_size, atol):
    """
    Validate that Keras and ONNX predictions match for a single image.

    Args:
        image_path: Path to the test image.
        keras_model: Loaded Keras model.
        onnx_session: ONNX Runtime InferenceSession.
        input_size: Input size for preprocessing.
        atol: Absolute tolerance for np.allclose comparison.

    Raises:
        ParityError: If predictions do not match or image cannot be processed.
    """
    img_batch = preprocess_image(image_path, input_size)

    keras_pred = predict_keras(keras_model, img_batch)
    onnx_pred = predict_onnx(onnx_session, img_batch)

    keras_label_idx = np.argmax(keras_pred[0])
    onnx_label_idx = np.argmax(onnx_pred[0])

    if keras_label_idx != onnx_label_idx:
        keras_label = LABELS[keras_label_idx]
        onnx_label = LABELS[onnx_label_idx]
        raise ParityError(
            f"Top-1 label mismatch for {image_path}: "
            f"Keras={keras_label}, ONNX={onnx_label}"
        )

    if not np.allclose(keras_pred, onnx_pred, atol=atol):
        max_diff = np.max(np.abs(keras_pred - onnx_pred))
        raise ParityError(
            f"Predictions diverge for {image_path}: "
            f"max difference={max_diff:.6e} (atol={atol})"
        )

    label = LABELS[keras_label_idx]
    logging.info(f"PASS: {image_path} -> {label}")


def main():
    """Validate parity between Keras and ONNX models."""
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(
        description="Validate parity between Keras and ONNX models"
    )
    parser.add_argument(
        "images",
        nargs="+",
        type=Path,
        help="Image files to validate",
    )
    parser.add_argument(
        "--keras-model",
        type=Path,
        default=Path("best_model/best_model.keras"),
        help="Path to the Keras model",
    )
    parser.add_argument(
        "--onnx-model",
        type=Path,
        default=Path("model/model.onnx"),
        help="Path to the ONNX model",
    )
    parser.add_argument(
        "--input-size",
        type=int,
        default=224,
        help="Input image size (square)",
    )
    parser.add_argument(
        "--atol",
        type=float,
        default=1e-4,
        help="Absolute tolerance for prediction comparison",
    )

    args = parser.parse_args()

    if not args.keras_model.exists():
        msg = f"Keras model not found at {args.keras_model}"
        logging.error(msg)
        raise FileNotFoundError(msg)

    if not args.onnx_model.exists():
        msg = f"ONNX model not found at {args.onnx_model}"
        logging.error(msg)
        raise FileNotFoundError(msg)

    logging.info(f"Loading Keras model from {args.keras_model}...")
    keras_model = tf.keras.models.load_model(args.keras_model, compile=False)

    logging.info(f"Loading ONNX model from {args.onnx_model}...")
    onnx_session = ort.InferenceSession(
        str(args.onnx_model),
        providers=["CPUExecutionProvider"],
    )

    logging.info(f"Validating {len(args.images)} image(s)...")
    for image_path in args.images:
        try:
            validate_image(
                image_path,
                keras_model,
                onnx_session,
                args.input_size,
                args.atol,
            )
        except ParityError as e:
            logging.error(str(e))
            raise


if __name__ == "__main__":
    main()
