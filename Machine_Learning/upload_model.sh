#!/usr/bin/env bash
set -euo pipefail

# Upload exported model artifacts (ONNX, TFLite) to Hugging Face Hub.
#
# Usage:
#   bash upload_model.sh
#   HF_TOKEN=hf_xxx bash upload_model.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ID="MythEclipse2737/zeavis-edu-model"
: "${HF_TOKEN:=}"
: "${HF_USER:=MythEclipse2737}"

echo "Uploading model artifacts to Hugging Face Hub..."

if ! command -v huggingface-cli &>/dev/null && ! python3 -c "from huggingface_hub import HfApi" 2>/dev/null; then
    echo "ERROR: huggingface_hub not installed. pip install huggingface_hub"
    exit 1
fi

python3 << PYEOF
import os, sys
sys.path.insert(0, "${SCRIPT_DIR}")

from huggingface_hub import HfApi

api = HfApi(token="${HF_TOKEN}" if "${HF_TOKEN}" else None)

model_dir = "${SCRIPT_DIR}/model"
onnx = os.path.join(model_dir, "model.onnx")
tflite = os.path.join(model_dir, "model.tflite")
saved_model_pb = os.path.join(model_dir, "saved_model", "saved_model.pb")
repo_id = "${REPO_ID}"

files_to_upload = []
for local, remote in [
    (onnx, "model/model.onnx"),
    (tflite, "model/model.tflite"),
    (saved_model_pb, "model/saved_model/saved_model.pb"),
]:
    if os.path.isfile(local):
        files_to_upload.append((local, remote))
        print(f"  Queued: {local} -> {remote}")
    else:
        print(f"  Skip (not found): {local}")

for local, remote in files_to_upload:
    print(f"  Uploading {remote}...")
    api.upload_file(
        path_or_fileobj=local,
        path_in_repo=remote,
        repo_id=repo_id,
        repo_type="model",
    )
    print(f"  ✅ {remote} uploaded")

if not files_to_upload:
    print("  Nothing to upload.")
else:
    print(f"Upload complete: https://huggingface.co/{repo_id}")
PYEOF
