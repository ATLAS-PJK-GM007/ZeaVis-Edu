use crate::config::{CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_LOW, DEFAULT_TEMPERATURE, LABELS};
use crate::error::ServiceError;
use ndarray::Array4;
use ort::{session::Session, value::TensorRef};
use serde::Serialize;
use std::collections::BTreeMap;
use std::path::Path;
use std::sync::Mutex;

/// Prediction result with temperature-calibrated probabilities and status.
#[derive(Debug, Clone, Serialize)]
pub struct Prediction {
    pub status: String, // "confident", "uncertain", "rejected"
    pub label: String,
    pub confidence: f32,
    pub probabilities: BTreeMap<String, f32>,
}

/// Service for running ONNX model inference with temperature-scaled calibration.
///
/// The ONNX model outputs raw logits. Temperature scaling + softmax is applied
/// in predict() to produce calibrated probabilities and a decision status:
///   - confident:  max_prob >= conf_threshold_high
///   - uncertain:  conf_threshold_low <= max_prob < conf_threshold_high
///   - rejected:   max_prob < conf_threshold_low
pub struct ModelService {
    model_path: std::path::PathBuf,
    input_size: u32,
    temperature: f32,
    conf_threshold_high: f32,
    conf_threshold_low: f32,
    session: Option<Mutex<Session>>,
}

impl ModelService {
    pub fn new(model_path: &Path, input_size: u32) -> Self {
        Self::with_calibration(model_path, input_size, DEFAULT_TEMPERATURE,
                               CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_LOW)
    }

    /// Creates a new ModelService with temperature scaling and confidence thresholds.
    pub fn with_calibration(model_path: &Path, input_size: u32,
                            temperature: f32, conf_high: f32, conf_low: f32) -> Self {
        let session = Session::builder()
            .ok()
            .and_then(|mut builder| builder.commit_from_file(model_path).ok())
            .map(Mutex::new);

        Self {
            model_path: model_path.to_path_buf(),
            input_size,
            temperature,
            conf_threshold_high: conf_high,
            conf_threshold_low: conf_low,
            session,
        }
    }

    pub fn is_loaded(&self) -> bool {
        self.session.is_some()
    }

    pub fn model_path(&self) -> &Path {
        &self.model_path
    }

    pub fn input_size(&self) -> u32 {
        self.input_size
    }

    pub fn temperature(&self) -> f32 {
        self.temperature
    }

    /// Runs inference and returns temperature-calibrated Prediction.
    ///
    /// The ONNX model outputs raw logits (no softmax). Temperature scaling
    /// is applied: probs = softmax(logits / T).
    pub fn predict(&self, input: Array4<f32>) -> Result<Prediction, ServiceError> {
        let session = self.session.as_ref()
            .ok_or_else(|| ServiceError::ModelUnavailable("Model is not loaded".to_string()))?;

        let mut session_guard = session.lock()
            .map_err(|_| ServiceError::PredictionFailed("Prediction failed".to_string()))?;

        let input = TensorRef::from_array_view(&input)
            .map_err(|_| ServiceError::PredictionFailed("Prediction failed".to_string()))?;
        let outputs = session_guard.run(ort::inputs![input])
            .map_err(|_| ServiceError::PredictionFailed("Prediction failed".to_string()))?;

        let output_tensor = outputs[0].try_extract_tensor::<f32>()
            .map_err(|_| ServiceError::PredictionFailed("Prediction failed".to_string()))?;

        let logits: Vec<f32> = output_tensor.1.iter().copied().collect();

        Self::calibrate_prediction(&logits, self.temperature,
                                   self.conf_threshold_high, self.conf_threshold_low)
    }

    /// Applies temperature scaling + softmax to raw logits, determines status.
    fn calibrate_prediction(logits: &[f32], temperature: f32,
                            conf_high: f32, conf_low: f32) -> Result<Prediction, ServiceError> {
        if logits.len() != LABELS.len() {
            return Err(ServiceError::PredictionFailed("Prediction failed".to_string()));
        }

        // Reject non-finite values
        if logits.iter().any(|p| !p.is_finite()) {
            return Err(ServiceError::PredictionFailed("Prediction failed".to_string()));
        }

        // Temperature scaling: divide by T
        let T = if temperature > 0.0 { temperature } else { 1.0 };
        let scaled: Vec<f32> = logits.iter().map(|l| l / T).collect();

        // Numerically stable softmax: shift by max to avoid overflow
        let max_logit = scaled.iter().cloned().fold(f32::NEG_INFINITY, f32::max);
        let exp_vals: Vec<f32> = scaled.iter().map(|l| (l - max_logit).exp()).collect();
        let sum: f32 = exp_vals.iter().sum();
        let probs: Vec<f32> = exp_vals.iter().map(|e| e / sum).collect();

        // Find top probability
        let top_idx = probs.iter().enumerate()
            .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal))
            .map(|(idx, _)| idx)
            .unwrap_or(0);

        let confidence = probs[top_idx];
        let top_label = LABELS[top_idx].to_string();

        // Determine status
        let status = if confidence >= conf_high {
            "confident"
        } else if confidence >= conf_low {
            "uncertain"
        } else {
            "rejected"
        };

        let mut probabilities = BTreeMap::new();
        for (i, &prob) in probs.iter().enumerate() {
            probabilities.insert(LABELS[i].to_string(), prob);
        }

        Ok(Prediction {
            status: status.to_string(),
            label: top_label,
            confidence,
            probabilities,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const T: f32 = 1.0;
    const HIGH: f32 = 0.70;
    const LOW: f32 = 0.45;

    #[test]
    fn calibrate_probs_selects_top_label() {
        let logits = [1.0, 2.0, 3.0, 0.5];
        let result = ModelService::calibrate_prediction(&logits, T, HIGH, LOW);
        assert!(result.is_ok());
        let p = result.unwrap();
        // Index 2 = Hawar Daun (highest logit)
        assert_eq!(p.label, "Hawar Daun");
        assert!(p.confidence > 0.5);
        assert_eq!(p.status, "confident");
    }

    #[test]
    fn calibrate_probs_uncertain_when_borderline() {
        let logits = [0.0, 0.4, 0.0, 0.0]; // softmax with low max
        let result = ModelService::calibrate_prediction(&logits, 2.0, HIGH, LOW);
        assert!(result.is_ok());
        let p = result.unwrap();
        // T=2.0 flattens further — likely uncertain or rejected
        assert!(p.status == "uncertain" || p.status == "rejected");
    }

    #[test]
    fn calibrate_probs_rejects_low_confidence() {
        let logits = [0.01, 0.01, 0.01, 0.02];
        let result = ModelService::calibrate_prediction(&logits, 10.0, HIGH, LOW);
        assert!(result.is_ok());
        let p = result.unwrap();
        assert_eq!(p.status, "rejected");
    }

    #[test]
    fn calibrate_probs_all_probabilities_present() {
        let logits = [1.0, 2.0, 3.0, 4.0];
        let result = ModelService::calibrate_prediction(&logits, T, HIGH, LOW);
        assert!(result.is_ok());
        let p = result.unwrap();
        assert_eq!(p.probabilities.len(), 4);
        assert!(p.probabilities.contains_key("Bercak Daun"));
        assert!(p.probabilities.contains_key("Daun Sehat"));
        assert!(p.probabilities.contains_key("Hawar Daun"));
        assert!(p.probabilities.contains_key("Karat Daun"));
    }

    #[test]
    fn calibrate_probs_rejects_wrong_length() {
        let logits = [0.25, 0.25, 0.25];
        let result = ModelService::calibrate_prediction(&logits, T, HIGH, LOW);
        assert!(result.is_err());
    }

    #[test]
    fn calibrate_probs_rejects_nan() {
        let logits = [0.1, f32::NAN, 0.6, 0.1];
        let result = ModelService::calibrate_prediction(&logits, T, HIGH, LOW);
        assert!(result.is_err());
    }

    #[test]
    fn temperature_one_gives_same_ranking() {
        let logits = [0.0, 1.0, 2.0, 3.0];
        let r1 = ModelService::calibrate_prediction(&logits, 1.0, 0.0, 0.0).unwrap();
        let r2 = ModelService::calibrate_prediction(&logits, 2.0, 0.0, 0.0).unwrap();
        assert_eq!(r1.label, r2.label);
        assert!(r1.confidence > r2.confidence); // T=2 flattens
    }

    #[test]
    fn missing_model_file_creates_unloaded_service() {
        let service = ModelService::new(Path::new("/nonexistent/model.onnx"), 224);
        assert!(!service.is_loaded());
    }

    #[test]
    fn unloaded_service_returns_model_unavailable() {
        let service = ModelService::new(Path::new("/nonexistent/model.onnx"), 224);
        let result = service.predict(ndarray::Array4::zeros((1, 224, 224, 3)));
        assert!(result.is_err());
        match result.unwrap_err() {
            ServiceError::ModelUnavailable(msg) => assert_eq!(msg, "Model is not loaded"),
            _ => panic!("expected ModelUnavailable error"),
        }
    }
}
