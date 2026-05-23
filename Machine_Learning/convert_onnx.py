#!/usr/bin/env python3
"""Convert TensorFlow SavedModel to ONNX format."""

import argparse
import subprocess
import sys
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(
        description="Convert TensorFlow SavedModel to ONNX format"
    )
    parser.add_argument(
        "--saved-model",
        type=Path,
        default=Path("model/saved_model"),
        help="Path to the TensorFlow SavedModel directory",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("model/model.onnx"),
        help="Path to the output ONNX model file",
    )
    parser.add_argument(
        "--opset",
        type=int,
        default=13,
        help="ONNX opset version to target",
    )

    args = parser.parse_args()

    # Check that saved model exists
    if not args.saved_model.exists():
        raise FileNotFoundError(f"SavedModel not found at {args.saved_model}")

    # Create output parent directory if needed
    args.output.parent.mkdir(parents=True, exist_ok=True)

    # Run tf2onnx conversion
    cmd = [
        sys.executable,
        "-m",
        "tf2onnx.convert",
        "--saved-model",
        str(args.saved_model),
        "--output",
        str(args.output),
        "--opset",
        str(args.opset),
    ]

    subprocess.run(cmd, check=True)

    print(f"ONNX model saved to {args.output}")


if __name__ == "__main__":
    main()
