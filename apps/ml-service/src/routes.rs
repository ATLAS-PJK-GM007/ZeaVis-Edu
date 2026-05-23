use serde::{Deserialize, Serialize};
use crate::config::{LABELS, SERVICE_NAME, SERVICE_VERSION};
use crate::model::{ModelService, Prediction};
use crate::error::ServiceError;
use crate::image::preprocess_image;
use axum::{
    extract::{State, Multipart},
    routing::{get, post},
    Json, Router,
};
use std::sync::Arc;

#[derive(Debug, Serialize, Deserialize)]
pub struct HealthResponse {
    pub status: String,
    pub model_loaded: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MetadataResponse {
    pub service_name: String,
    pub service_version: String,
    pub model_path: String,
    pub model_loaded: bool,
    pub input_size: u32,
    pub labels: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PredictionResponse {
    pub label: String,
    pub confidence: f32,
    pub probabilities: std::collections::BTreeMap<String, f32>,
}

#[derive(Clone)]
pub struct AppState {
    pub model: Arc<ModelService>,
}

pub fn health_response(model_loaded: bool) -> HealthResponse {
    HealthResponse {
        status: "ok".to_string(),
        model_loaded,
    }
}

pub fn metadata_response(model_path: String, model_loaded: bool, input_size: u32) -> MetadataResponse {
    MetadataResponse {
        service_name: SERVICE_NAME.to_string(),
        service_version: SERVICE_VERSION.to_string(),
        model_path,
        model_loaded,
        input_size,
        labels: LABELS.iter().map(|s| s.to_string()).collect(),
    }
}

pub fn prediction_response(prediction: Prediction) -> PredictionResponse {
    PredictionResponse {
        label: prediction.label,
        confidence: prediction.confidence,
        probabilities: prediction.probabilities,
    }
}

pub async fn health(State(state): State<AppState>) -> Json<HealthResponse> {
    Json(health_response(state.model.is_loaded()))
}

pub async fn metadata(State(state): State<AppState>) -> Json<MetadataResponse> {
    Json(metadata_response(
        state.model.model_path().to_string_lossy().to_string(),
        state.model.is_loaded(),
        state.model.input_size(),
    ))
}

pub async fn predict(
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<Json<PredictionResponse>, ServiceError> {
    // Extract the file field from multipart
    let mut file_data = None;
    while let Ok(Some(field)) = multipart.next_field().await {
        if field.name() == Some("file") {
            if let Some(content_type) = field.content_type() {
                if !content_type.starts_with("image/") {
                    return Err(ServiceError::BadRequest(
                        "Uploaded file must be an image".to_string(),
                    ));
                }
            } else {
                return Err(ServiceError::BadRequest(
                    "Uploaded file must be an image".to_string(),
                ));
            }
            file_data = Some(field.bytes().await);
            break;
        }
    }

    // Handle missing or multipart read errors
    let bytes = match file_data {
        Some(Ok(b)) => b,
        Some(Err(_)) => {
            return Err(ServiceError::BadRequest(
                "Uploaded file must be an image".to_string(),
            ))
        }
        None => {
            return Err(ServiceError::BadRequest(
                "Uploaded file must be an image".to_string(),
            ))
        }
    };

    // Preprocess the image
    let input = preprocess_image(&bytes, state.model.input_size())?;

    // Run prediction
    let prediction = state.model.predict(input)?;

    Ok(Json(prediction_response(prediction)))
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health))
        .route("/metadata", get(metadata))
        .route("/predict", post(predict))
        .with_state(state)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn health_response_with_model_loaded() {
        let response = health_response(true);
        assert_eq!(response.status, "ok");
        assert_eq!(response.model_loaded, true);
    }

    #[test]
    fn health_response_without_model_loaded() {
        let response = health_response(false);
        assert_eq!(response.status, "ok");
        assert_eq!(response.model_loaded, false);
    }

    #[test]
    fn metadata_response_includes_service_info() {
        let response = metadata_response("/path/to/model.onnx".to_string(), true, 224);

        assert_eq!(response.service_name, "zeavis-ml-service");
        assert_eq!(response.service_version, "0.1.0");
        assert_eq!(response.model_path, "/path/to/model.onnx");
        assert_eq!(response.model_loaded, true);
        assert_eq!(response.input_size, 224);
    }

    #[test]
    fn metadata_response_includes_all_labels() {
        let response = metadata_response("/path/to/model.onnx".to_string(), true, 224);

        assert_eq!(response.labels.len(), 4);
        assert_eq!(
            response.labels,
            vec!["Bercak Daun", "Daun Sehat", "Karat Daun", "Hawar Daun"]
        );
    }

    #[test]
    fn prediction_response_matches_prediction_contract() {
        let prediction = Prediction {
            label: "Karat Daun".to_string(),
            confidence: 0.6,
            probabilities: {
                let mut map = std::collections::BTreeMap::new();
                map.insert("Bercak Daun".to_string(), 0.1);
                map.insert("Daun Sehat".to_string(), 0.2);
                map.insert("Karat Daun".to_string(), 0.6);
                map.insert("Hawar Daun".to_string(), 0.1);
                map
            },
        };

        let response = prediction_response(prediction);

        assert_eq!(response.label, "Karat Daun");
        assert_eq!(response.confidence, 0.6);
        assert_eq!(response.probabilities.len(), 4);
        assert_eq!(response.probabilities.get("Bercak Daun"), Some(&0.1));
        assert_eq!(response.probabilities.get("Daun Sehat"), Some(&0.2));
        assert_eq!(response.probabilities.get("Karat Daun"), Some(&0.6));
        assert_eq!(response.probabilities.get("Hawar Daun"), Some(&0.1));
    }
}
