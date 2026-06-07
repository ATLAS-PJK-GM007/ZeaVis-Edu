# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository overview

This repository contains the ZeaVis Edu application: a corn leaf disease classifier with a machine-learning pipeline (EfficientNetV2B0 training and export), a Rust/Axum/ONNX Runtime inference service, and a fullstack TypeScript application (React frontend, Elysia backend, PostgreSQL).

The ML pipeline lives under `Machine_Learning/`. The inference service lives under `apps/ml-service/`. Most ML commands should be run from the `Machine_Learning/` directory unless noted otherwise.

## Common commands

```bash
cd Machine_Learning
```

Set up a Python environment:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Run local dataset preprocessing after placing `dataset_1.zip`, `dataset_2.zip`, and `dataset_3.zip` beside `preprocessing.py`:

```bash
python preprocessing.py
```

Export a trained Keras model to SavedModel and TFLite after placing the Colab-trained model at `best_model/best_model.keras`:

```bash
python save_model.py
```

Convert the SavedModel export to ONNX for the Rust ML service:

```bash
python convert_onnx.py
```

Convert the SavedModel export to TensorFlow.js via CLI:

```bash
export PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION=python
tensorflowjs_converter \
  --input_format=tf_saved_model \
  --output_format=tfjs_graph_model \
  --signature_name=serving_default \
  --saved_model_tags=serve \
  model/saved_model \
  model/tfjs_model
```

Open the training notebook locally if needed:

```bash
jupyter notebook notebook.ipynb
```

There is no project test suite, lint command, or build system configured in the ML pipeline.

## Fullstack app commands

The TypeScript application scaffold lives at the repository root and uses Bun workspaces with Moon tasks.

Install dependencies:

```bash
bun install
```

Run all development tasks through Moon:

```bash
bun run dev
```

Run type checks:

```bash
bun run typecheck
```

Run production builds:

```bash
bun run build
```

Run the API directly:

```bash
cd apps/api && bun run start
```

Run the web app directly:

```bash
cd apps/web && bun run dev
```

Run the ML service directly:

```bash
cd apps/ml-service && cargo run
```

Run the Telemetry stack:

```bash
# Start all telemetry services (Prometheus, Ingester, Vector, ClickHouse, Query Proxy, Telemetry UI)
make telemetry-up

# Local dev mode (port bindings exposed)
make telemetry-up-local

# Check health of all telemetry services
make telemetry-status

# View telemetry logs
make telemetry-logs [s=<service>]

# Build telemetry components
make telemetry-build

# Send a test metric
make telemetry-test-metric

# Stop telemetry
make telemetry-down
```

## High-level architecture

- `Machine_Learning/preprocessing.py` prepares the training dataset locally. It extracts three source ZIP files, merges selected class folders into `dataset/`, maps selected Mandarin labels from Dataset 3 via `desc.json`, removes known problematic image files, then creates `dataset.zip` for upload to Google Drive/Colab.
- `Machine_Learning/notebook.ipynb` is the training workflow intended for Google Colab with GPU enabled. It trains an EfficientNetV2B0-based classifier and saves the best model to Google Drive as `best_model.keras`.
- `Machine_Learning/save_model.py` is the production export step. It loads `best_model/best_model.keras`, rebuilds a clean EfficientNetV2B0 architecture without training-time augmentation layers, copies weights into that model, exports `model/saved_model/`, and writes `model/model.tflite`.
- `Machine_Learning/convert_onnx.py` converts the SavedModel to ONNX format (`model/model.onnx`) for use by the Rust inference service.
- TensorFlow.js export is intentionally done with the `tensorflowjs_converter` CLI rather than from Python to avoid protobuf/runtime conflicts documented in the README.
- `apps/ml-service/` is a Rust/Axum service that loads the ONNX model and serves HTTP endpoints for health checks, metadata, and image classification predictions. It uses ONNX Runtime for cross-platform inference performance.

## Telemetry architecture

The repository includes a full Prometheus → ClickHouse metric pipeline as a git submodule at `telemetry/`. Each ZeaVis Edu service exposes a `GET /metrics` endpoint:

- **Web app** (`apps/web`): In dev mode, a Vite plugin serves client-side session metrics (page views, Web Vitals). In production, nginx proxies `/metrics` to the API service. Source: `apps/web/src/lib/telemetry.ts`, `apps/web/vite-plugin-metrics.ts`.
- **API** (`apps/api`): Uses `prom-client` for Node.js default metrics plus custom HTTP, auth, classification, and diagnosis counters/histograms. Source: `apps/api/src/lib/telemetry.ts`, exposed via `apps/api/src/routes/metrics.ts`.
- **ML service** (`apps/ml-service`): Uses the `prometheus` Rust crate for HTTP metrics, prediction counts, and model load status. Source: `apps/ml-service/src/telemetry.rs`.

All three share the `zeavis_` metric prefix and are scraped by the Telemetry Prometheus instance via `file_sd_configs` (see `telemetry/prometheus/targets/zeavis-edu.json`).

The telemetry stack is managed from the project root via `make telemetry-*` targets (see `Makefile`). The Docker Compose files in `telemetry/deploy/` define 6 services (Prometheus, Metric Ingester, Vector, ClickHouse, Query Proxy, Telemetry UI).

## Fullstack application architecture

The root TypeScript workspace is a Bun + Moon monorepo:

- `apps/web/` contains the React + Vite + TypeScript frontend with React Router, TanStack Query, Zustand, Tailwind, and shadcn/ui-style components.
- `apps/api/` contains the Elysia backend with health/status routes and Drizzle/PostgreSQL configuration.
- `apps/ml-service/` contains the Rust/Axum inference service with ONNX Runtime for model predictions.
- `packages/shared/` contains shared TypeScript types and utilities consumed by both apps.

The backend reads `DATABASE_URL` for Drizzle/PostgreSQL, but the initial health/status endpoints do not require a live database connection. The ML service reads `MODEL_PATH` (default `../../Machine_Learning/model/model.onnx`) and `MODEL_INPUT_SIZE` (default `224`).

## Model labels and dataset mapping

The classifier targets four Indonesian labels:

- `Bercak Daun` — Gray Leaf Spot
- `Hawar Daun` — Northern/Southern Leaf Blight
- `Karat Daun` — Common Rust
- `Daun Sehat` — healthy corn leaf

Dataset handling is part of the model logic:

- Dataset 1 contributes `Bercak Daun`, `Hawar Daun`, and `Daun Sehat`; its `Karat Daun` folder is intentionally ignored because the README states it is not representative.
- Dataset 2 contributes `Common_Rust` mapped to `Karat Daun` and `Healthy` mapped to `Daun Sehat`.
- Dataset 3 is routed through Mandarin label mappings in `PEMETAAN_KATEGORI` inside `preprocessing.py`.

## Important generated/local artifacts

The following files/directories are generated or externally supplied during the ML workflow and may not exist in a fresh clone:

- `Machine_Learning/dataset_1.zip`, `dataset_2.zip`, `dataset_3.zip` — manually downloaded source datasets.
- `Machine_Learning/dataset/` and `Machine_Learning/dataset.zip` — generated by `preprocessing.py`.
- `Machine_Learning/best_model/best_model.keras` — trained model downloaded from Colab/Google Drive.
- `Machine_Learning/model/saved_model/`, `model/model.tflite`, `model/model.onnx`, and `model/tfjs_model/` — production exports.

## Notes for future changes

- Keep README command examples and this file in sync when changing the ML pipeline.
- Preserve the current class label names unless the training notebook, preprocessing mappings, and downstream app/API expectations are updated together.
- `save_model.py` assumes the clean architecture matches the trained model weights exactly; changes to the notebook model architecture usually require corresponding changes in `build_clean_model()`.
- The Rust ML service expects the ONNX model at the path specified by `MODEL_PATH`. Ensure `convert_onnx.py` is run after `save_model.py` to generate the ONNX artifact before deploying the service.

