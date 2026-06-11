#!/usr/bin/env bash
set -euo pipefail

# Download best_model.keras from Hugging Face Hub.
#
# Usage:
#   bash download_model.sh                 # public repo — no auth needed
#   HF_TOKEN=hf_xxx bash download_model.sh # private repo

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST="${SCRIPT_DIR}/best_model/best_model.keras"
REPO_ID="MythEclipse2737/zeavis-edu-model"

: "${HF_TOKEN:=}"

FORCE="${1:-}"

if [ -f "$DEST" ] && [ "$FORCE" != "--force" ]; then
    echo "Model already exists at $DEST (use --force to overwrite)"
    exit 0
fi

mkdir -p "$(dirname "$DEST")"

if command -v huggingface-cli &>/dev/null; then
    huggingface-cli download "$REPO_ID" "best_model/best_model.keras" --local-dir "$(dirname "$DEST")" $( [ -n "$HF_TOKEN" ] && echo "--token $HF_TOKEN" )
elif command -v hf &>/dev/null; then
    hf download "$REPO_ID" "best_model/best_model.keras" --output "$DEST"
elif command -v curl &>/dev/null; then
    URL="https://huggingface.co/${REPO_ID}/resolve/main/best_model/best_model.keras"
    curl -fL -o "$DEST" $( [ -n "$HF_TOKEN" ] && echo "-H Authorization: Bearer $HF_TOKEN" ) "$URL"
else
    echo "ERROR: Need curl or huggingface-cli installed."
    exit 1
fi

if [ -f "$DEST" ]; then
    echo "Downloaded: $DEST"
    ls -lh "$DEST"
else
    echo "ERROR: Download failed."
    exit 1
fi
