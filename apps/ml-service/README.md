# ZeaVis ML Service

FastAPI service for serving corn leaf disease predictions from the trained Keras model.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The default model path is `../../Machine_Learning/best_model/best_model.keras`. Override it with `MODEL_PATH` if needed.

## Run

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

## Endpoints

- `GET /health` — service status and model loaded status.
- `GET /metadata` — service name, version, labels, input size, model path, and model loaded status.
- `POST /predict` — multipart image upload for disease classification.

## Verify

```bash
curl http://localhost:8001/health
curl http://localhost:8001/metadata
curl -X POST http://localhost:8001/predict -F "file=@/path/to/corn-leaf.jpg"
```
