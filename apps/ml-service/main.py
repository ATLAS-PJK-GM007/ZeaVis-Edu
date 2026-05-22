from fastapi import FastAPI, File, HTTPException, UploadFile

from model import ImageDecodeError, LABELS, SERVICE_NAME, SERVICE_VERSION, model_service
from schemas import HealthResponse, MetadataResponse, PredictionResponse


app = FastAPI(title="ZeaVis ML Service", version=SERVICE_VERSION)


@app.on_event("startup")
def load_model() -> None:
    model_service.load()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=model_service.model_loaded)


@app.get("/metadata", response_model=MetadataResponse)
def metadata() -> MetadataResponse:
    return MetadataResponse(
        service_name=SERVICE_NAME,
        service_version=SERVICE_VERSION,
        model_path=str(model_service.model_path),
        model_loaded=model_service.model_loaded,
        input_size=model_service.input_size,
        labels=LABELS,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)) -> PredictionResponse:
    if file.content_type is None or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image")

    if not model_service.model_loaded:
        raise HTTPException(status_code=503, detail="Model is not loaded")

    image_bytes = await file.read()

    try:
        label, confidence, probabilities = model_service.predict(image_bytes)
    except ImageDecodeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        import logging

        logging.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed") from exc

    return PredictionResponse(
        label=label,
        confidence=confidence,
        probabilities=probabilities,
    )
