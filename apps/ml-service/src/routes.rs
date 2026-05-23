use serde::{Deserialize, Serialize};
use crate::config::{LABELS, SERVICE_NAME, SERVICE_VERSION};

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
    pub predictions: Vec<PredictionResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PredictionResult {
    pub label: String,
    pub confidence: f32,
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
    fn prediction_response_serializes() {
        let response = PredictionResponse {
            predictions: vec![
                PredictionResult {
                    label: "Bercak Daun".to_string(),
                    confidence: 0.95,
                },
                PredictionResult {
                    label: "Daun Sehat".to_string(),
                    confidence: 0.05,
                },
            ],
        };

        let json = serde_json::to_string(&response).expect("failed to serialize");
        assert!(json.contains("Bercak Daun"));
        assert!(json.contains("0.95"));
    }
}
