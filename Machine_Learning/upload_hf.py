#!/usr/bin/env python3
"""Upload trained model artifacts to Hugging Face Hub.

Runs the full export pipeline (SavedModel → TFLite → ONNX → TFJS) then
pushes all artifacts to a Hugging Face model repository.

Requires ``HF_TOKEN`` environment variable to be set for authentication.
"""

import json
import logging
import os
import subprocess
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
HF_REPO = "MythEclipse2737/corn-leaf-disease-classifier"
CLASS_NAMES = ["Bercak Daun", "Daun Sehat", "Hawar Daun", "Karat Daun"]

# Paths relative to this script's directory
SCRIPT_DIR = Path(__file__).resolve().parent
MODEL_DIR = SCRIPT_DIR / "model"
SAVED_MODEL_DIR = MODEL_DIR / "saved_model"
BEST_MODEL = SCRIPT_DIR / "best_model" / "best_model.keras"
TFLITE_PATH = MODEL_DIR / "model.tflite"
ONNX_PATH = MODEL_DIR / "model.onnx"
TFJS_DIR = MODEL_DIR / "tfjs_model"
LABELS_PATH = MODEL_DIR / "labels.json"
README_PATH = MODEL_DIR / "README.md"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def run_cmd(cmd: list[str], *, env: dict | None = None, cwd=None) -> None:
    """Run a subprocess command, logging and raising on failure."""
    label = " ".join(str(p) for p in cmd)
    logging.info("Running: %s", label)
    run_env = os.environ.copy()
    if env:
        run_env.update(env)
    subprocess.run(cmd, check=True, env=run_env, cwd=cwd)


# ---------------------------------------------------------------------------
# Export pipeline
# ---------------------------------------------------------------------------
def run_export_pipeline() -> None:
    """Execute save_model.py, convert_onnx.py, and the TFJS converter."""
    # 1. SavedModel + TFLite
    run_cmd([sys.executable, str(SCRIPT_DIR / "save_model.py")])

    # 2. ONNX
    run_cmd([sys.executable, str(SCRIPT_DIR / "convert_onnx.py")])

    # 3. TensorFlow.js (non-blocking — known protobuf version issue)
    logging.info("Converting SavedModel to TensorFlow.js format...")
    try:
        run_cmd(
            [
                "tensorflowjs_converter",
                "--input_format=tf_saved_model",
                "--output_format=tfjs_graph_model",
                "--signature_name=serving_default",
                "--saved_model_tags=serve",
                str(SAVED_MODEL_DIR),
                str(TFJS_DIR),
            ],
            env={"PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION": "python"},
        )
    except subprocess.CalledProcessError:
        logging.warning(
            "TFJS conversion failed (likely protobuf version mismatch). "
            "Skipping — SavedModel, TFLite, and ONNX are still available."
        )
    logging.info("Export pipeline completed.")


# ---------------------------------------------------------------------------
# Hugging Face upload
# ---------------------------------------------------------------------------
def generate_labels_json() -> None:
    """Write `labels.json` so downstream tools know the class order."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    with open(LABELS_PATH, "w") as fh:
        json.dump(CLASS_NAMES, fh, ensure_ascii=False, indent=2)
    logging.info("Labels written to %s", LABELS_PATH)


def generate_readme() -> None:
    """Write a minimal HF model card."""
    content = """---
language:
  - id
tags:
  - agriculture
  - corn
  - leaf-disease
  - efficientnet-v2
  - tensorflow
  - image-classification
license: mit
datasets:
  - zeavis-edu/corn-leaf-dataset
---
# ZeaVis Edu — Corn Leaf Disease Classifier

Classifies corn leaf diseases into one of four categories:

- **Bercak Daun** — Gray Leaf Spot
- **Hawar Daun** — Northern / Southern Leaf Blight
- **Karat Daun** — Common Rust
- **Daun Sehat** — Healthy corn leaf

## Model

| Attribute          | Detail                                              |
| ------------------ | --------------------------------------------------- |
| Architecture       | EfficientNetV2B0 (transfer learning)                |
| Input              | RGB image, 224×224 pixels                           |
| Output             | Softmax probabilities over 4 classes                |
| Framework          | TensorFlow 2.x / Keras (float32)                    |
| Augmentation       | Flip, Rotation, Zoom, MixUp, CutMix, RandomErasing  |
| Optimizer          | AdamW + EMA + Label Smoothing 0.2                   |
| Training           | 3-phase: Head → Partial FT → Full FT                |

## Usage

```python
import tensorflow as tf
import numpy as np
from PIL import Image

model = tf.keras.models.load_model("best_model.keras")
img = Image.open("corn_leaf.jpg").resize((224, 224))
x = tf.keras.applications.efficientnet_v2.preprocess_input(
    np.expand_dims(np.array(img), 0).astype("float32")
)
preds = model.predict(x)
print(["Bercak Daun", "Daun Sehat", "Hawar Daun", "Karat Daun"][np.argmax(preds)])
```

## Files

| File                   | Format          | Use                       |
| ---------------------- | --------------- | ------------------------- |
| `best_model.keras`     | Keras v3        | Training / fine-tuning    |
| `model.saved_model/`   | TF SavedModel   | TensorFlow Serving        |
| `model.tflite`         | TFLite          | Mobile / edge devices     |
| `model.onnx`           | ONNX            | Cross-platform inference  |
| `model.tfjs_model/`    | TensorFlow.js   | Browser / Node.js         |
| `labels.json`          | JSON            | Class label mapping       |

## Limitations

This model is intended for **educational and research purposes** only.
Always consult with agricultural experts before making crop management
decisions.
"""
    with open(README_PATH, "w") as fh:
        fh.write(content)
    logging.info("README written to %s", README_PATH)


def upload_to_hub() -> None:
    """Upload all artifacts to the Hugging Face Hub repository."""
    from huggingface_hub import HfApi, create_repo, login

    login(token=os.environ["HF_TOKEN"])
    api = HfApi()

    # Ensure repo exists (public)
    create_repo(HF_REPO, repo_type="model", exist_ok=True, private=False)
    logging.info("Repo ready: https://huggingface.co/%s", HF_REPO)

    # --- Single files ---
    files_to_upload = [
        (BEST_MODEL, "best_model.keras"),
        (TFLITE_PATH, "model/model.tflite"),
        (ONNX_PATH, "model/model.onnx"),
        (LABELS_PATH, "model/labels.json"),
        (README_PATH, "README.md"),
    ]

    for local_path, repo_path in files_to_upload:
        if not local_path.exists():
            logging.warning("Skipping missing file: %s", local_path)
            continue
        logging.info("Uploading %s → %s", local_path.name, repo_path)
        api.upload_file(
            path_or_fileobj=str(local_path),
            path_in_repo=repo_path,
            repo_id=HF_REPO,
            repo_type="model",
        )

    # --- Folders ---
    folders_to_upload = [
        (SAVED_MODEL_DIR, "model/saved_model"),
    ]
    if TFJS_DIR.exists():
        folders_to_upload.append((TFJS_DIR, "model/tfjs_model"))
    else:
        logging.info("Skipping TFJS folder (not generated).")

    for local_dir, repo_dir in folders_to_upload:
        if not local_dir.exists():
            logging.warning("Skipping missing folder: %s", local_dir)
            continue
        logging.info("Uploading folder %s → %s", local_dir.name, repo_dir)
        api.upload_folder(
            folder_path=str(local_dir),
            path_in_repo=repo_dir,
            repo_id=HF_REPO,
            repo_type="model",
        )

    logging.info(
        "Upload complete! Visit https://huggingface.co/%s", HF_REPO
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    token = os.environ.get("HF_TOKEN")
    if not token:
        logging.warning(
            "HF_TOKEN environment variable is not set. "
            "Skipping Hugging Face upload. "
            "On Colab, set it via the Secrets manager (🔑 key icon in the left panel)."
        )
        return

    logging.info("=== HUGGING FACE UPLOAD PIPELINE ===")

    # 1. Run the export pipeline to generate all artifacts
    run_export_pipeline()

    # 2. Generate metadata files
    generate_labels_json()
    generate_readme()

    # 3. Upload everything to Hugging Face Hub
    upload_to_hub()


if __name__ == "__main__":
    main()
