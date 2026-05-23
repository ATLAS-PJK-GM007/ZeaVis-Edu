use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub detail: String,
}

#[derive(Debug)]
pub enum ServiceError {
    BadRequest(String),
    ModelUnavailable(String),
    PredictionFailed(String),
}

impl IntoResponse for ServiceError {
    fn into_response(self) -> Response {
        let (status, detail) = match self {
            ServiceError::BadRequest(msg) => (StatusCode::BAD_REQUEST, msg),
            ServiceError::ModelUnavailable(msg) => (StatusCode::SERVICE_UNAVAILABLE, msg),
            ServiceError::PredictionFailed(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };

        let body = Json(ErrorResponse { detail });
        (status, body).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::to_bytes;

    #[tokio::test]
    async fn bad_request_maps_to_400() {
        let error = ServiceError::BadRequest("invalid input".to_string());
        let response = error.into_response();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);

        let body = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("failed to read body");
        let json: serde_json::Value = serde_json::from_slice(&body).expect("invalid json");

        assert_eq!(json["detail"], "invalid input");
    }

    #[tokio::test]
    async fn model_unavailable_maps_to_503() {
        let error = ServiceError::ModelUnavailable("model not loaded".to_string());
        let response = error.into_response();

        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let body = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("failed to read body");
        let json: serde_json::Value = serde_json::from_slice(&body).expect("invalid json");

        assert_eq!(json["detail"], "model not loaded");
    }

    #[tokio::test]
    async fn prediction_failed_maps_to_500() {
        let error = ServiceError::PredictionFailed("inference error".to_string());
        let response = error.into_response();

        assert_eq!(response.status(), StatusCode::INTERNAL_SERVER_ERROR);

        let body = to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("failed to read body");
        let json: serde_json::Value = serde_json::from_slice(&body).expect("invalid json");

        assert_eq!(json["detail"], "inference error");
    }
}
