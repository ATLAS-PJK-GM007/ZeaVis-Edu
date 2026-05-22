from io import BytesIO
import logging
import os
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError
import tensorflow as tf


LABELS = ["Bercak Daun", "Daun Sehat", "Karat Daun", "Hawar Daun"]
SERVICE_NAME = "zeavis-ml-service"
SERVICE_VERSION = "0.1.0"


class ImageDecodeError(ValueError):
    pass


class ModelService:
    def __init__(self) -> None:
        self.input_size = int(os.getenv("MODEL_INPUT_SIZE", "224"))
        self.model_path = self._resolve_model_path(os.getenv("MODEL_PATH", "../../Machine_Learning/best_model/best_model.keras"))
        self.model: tf.keras.Model | None = None
        self.load_error: str | None = None

    def _resolve_model_path(self, model_path: str) -> Path:
        path = Path(model_path)
        if path.is_absolute():
            return path
        return (Path(__file__).resolve().parent / path).resolve()

    @property
    def model_loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        try:
            self.model = tf.keras.models.load_model(self.model_path, compile=False)
            self.load_error = None
        except Exception as exc:
            self.model = None
            self.load_error = str(exc)
            logging.exception("Failed to load ML model from %s", self.model_path)

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
        except (UnidentifiedImageError, OSError) as exc:
            raise ImageDecodeError("Uploaded file is not a valid image") from exc

        image = image.resize((self.input_size, self.input_size))
        image_array = np.asarray(image, dtype=np.float32)
        return np.expand_dims(image_array, axis=0)

    def predict(self, image_bytes: bytes) -> tuple[str, float, dict[str, float]]:
        if self.model is None:
            raise RuntimeError("Model is not loaded")

        batch = self.preprocess(image_bytes)
        raw_predictions = self.model.predict(batch, verbose=0)[0]
        probabilities_array = np.asarray(raw_predictions, dtype=np.float32)
        top_index = int(np.argmax(probabilities_array))
        probabilities = {
            label: float(probabilities_array[index])
            for index, label in enumerate(LABELS)
        }

        return LABELS[top_index], float(probabilities_array[top_index]), probabilities


model_service = ModelService()
