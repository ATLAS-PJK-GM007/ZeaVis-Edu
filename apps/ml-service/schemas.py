from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class MetadataResponse(BaseModel):
    service_name: str
    service_version: str
    model_path: str
    model_loaded: bool
    input_size: int
    labels: list[str]


class PredictionResponse(BaseModel):
    label: str
    confidence: float
    probabilities: dict[str, float]
