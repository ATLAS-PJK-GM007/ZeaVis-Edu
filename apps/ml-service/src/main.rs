mod config;
mod error;
mod image;
mod model;
mod routes;

use anyhow::Result;
use config::Config;
use model::ModelService;
use routes::{router, AppState};
use std::sync::Arc;
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing subscriber with EnvFilter
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::from_default_env())
        .init();

    // Load configuration from environment
    let config = Config::from_env()?;

    // Create ModelService and wrap in Arc
    let model = Arc::new(ModelService::new(&config.model_path, config.input_size));

    // Log model status
    tracing::info!(
        model_loaded = model.is_loaded(),
        model_path = ?config.model_path,
        "Model service initialized"
    );

    // Create AppState
    let state = AppState { model };

    // Bind TcpListener to host:port
    let addr = format!("{}:{}", config.host, config.port);
    let listener = TcpListener::bind(&addr).await?;

    tracing::info!(address = %addr, "Server listening");

    // Serve with Axum
    axum::serve(listener, router(state)).await?;

    Ok(())
}
