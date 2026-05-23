use crate::config::LABELS;
use crate::error::ServiceError;
use ndarray::Array4;
use ort::Session;
use serde::Serialize;
use std::collections::BTreeMap;
use std::path::Path;

/// Prediction result containing the top label, confidence, and all probabilities.
#[derive(Debug, Clone, Serialize)]
pub struct Prediction {
    pub label: String,
    pub confidence: f32,
    pub probabilities: BTreeMap<String, f32>,
}

/// Service for running ONNX model inference.
///
/// Stores the model path, input size, and an optional ONNX session.
/// If the model fails to load, the session remains None and predictions will fail.
pub struct ModelService {
    model_path: std::path::PathBuf,
    input_size: u32,
    session: Option<Session>,
}

impl ModelService {
    /// Creates a new ModelService, attempting to load the ONNX model from the given path.
    ///
    /// If the model file does not exist or fails to load, the session is stored as None.
    /// This allows the service to report unloaded state via health checks.
    pub fn new(model_path: &Path, input_size: u32) -> Self {
        let session = Session::builder()
            .ok()
            .and_then(|builder| builder.commit_from_file(model_path).ok());

        Self {
            model_path: model_path.to_path_buf(),
            input_size,
            session,
        }
    }

    /// Returns true if the model is loaded and ready for inference.
    pub fn is_loaded(&self) -> bool {
        self.session.is_some()
    }

    /// Returns the path to the model file.
    pub fn model_path(&self) -> &Path {
        &self.model_path
    }

    /// Returns the input size (width/height) for the model.
    pub fn input_size(&self) -> u32 {
        self.input_size
    }

    /// Runs inference on the given input array.
    ///
    /// Returns ModelUnavailable if the model is not loaded.
    /// Returns PredictionFailed if inference fails or output format is invalid.
    pub fn predict(&self, input: Array4<f32>) -> Result<Prediction, ServiceError> {
        let session = self
            .session
            .as_ref()
            .ok_or_else(|| ServiceError::ModelUnavailable("Model is not loaded".to_string()))?;

        // Run inference
        let outputs = session
            .run(ort::inputs![input]?)
            .map_err(|_| ServiceError::PredictionFailed("Prediction failed".to_string()))?;

        // Extract output as f32 vector
        let output_tensor = outputs[0]
            .try_extract_tensor::<f32>()
            .map_err(|_| ServiceError::PredictionFailed("Prediction failed".to_string()))?;

        let probabilities: Vec<f32> = output_tensor.iter().copied().collect();

        Self::prediction_from_probabilities(&probabilities)
    }

    /// Maps a probability vector to a Prediction with label and all probabilities.
    ///
    /// Expects a vector of length 4 (one per label in LABELS).
    /// Returns PredictionFailed if the length is incorrect.
    pub fn prediction_from_probabilities(probs: &[f32]) -> Result<Prediction, ServiceError> {
        if probs.len() != LABELS.len() {
            return Err(ServiceError::PredictionFailed("Prediction failed".to_string()));
        }

        // Find the index with the highest probability
        let top_idx = probs
            .iter()
            .enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(idx, _)| idx)
            .unwrap_or(0);

        let top_label = LABELS[top_idx].to_string();
        let confidence = probs[top_idx];

        // Build probabilities map
        let mut probabilities = BTreeMap::new();
        for (i, &prob) in probs.iter().enumerate() {
            probabilities.insert(LABELS[i].to_string(), prob);
        }

        Ok(Prediction {
            label: top_label,
            confidence,
            probabilities,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prediction_mapping_selects_top_label_and_all_probabilities() {
        let probs = [0.1, 0.2, 0.6, 0.1];
        let result = ModelService::prediction_from_probabilities(&probs);

        assert!(result.is_ok());
        let prediction = result.unwrap();

        // Top label should be Karat Daun (index 2 with 0.6 probability)
        assert_eq!(prediction.label, "Karat Daun");
        assert_eq!(prediction.confidence, 0.6);

        // All probabilities should be present
        assert_eq!(prediction.probabilities.len(), 4);
        assert_eq!(prediction.probabilities.get("Bercak Daun"), Some(&0.1));
        assert_eq!(prediction.probabilities.get("Daun Sehat"), Some(&0.2));
        assert_eq!(prediction.probabilities.get("Karat Daun"), Some(&0.6));
        assert_eq!(prediction.probabilities.get("Hawar Daun"), Some(&0.1));
    }

    #[test]
    fn prediction_mapping_rejects_wrong_output_length() {
        let probs = [0.25, 0.25, 0.25]; // Only 3 values instead of 4
        let result = ModelService::prediction_from_probabilities(&probs);

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::PredictionFailed(msg) => {
                assert_eq!(msg, "Prediction failed");
            }
            _ => panic!("expected PredictionFailed error"),
        }
    }

    #[test]
    fn missing_model_file_creates_unloaded_service() {
        let model_path = Path::new("/nonexistent/model.onnx");
        let service = ModelService::new(model_path, 224);

        assert!(!service.is_loaded());
        assert_eq!(service.model_path(), model_path);
        assert_eq!(service.input_size(), 224);
    }

    #[test]
    fn unloaded_service_returns_model_unavailable() {
        let model_path = Path::new("/nonexistent/model.onnx");
        let service = ModelService::new(model_path, 224);

        let dummy_input = ndarray::Array4::zeros((1, 224, 224, 3));
        let result = service.predict(dummy_input);

        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::ModelUnavailable(msg) => {
                assert_eq!(msg, "Model is not loaded");
            }
            _ => panic!("expected ModelUnavailable error"),
        }
    }
}
