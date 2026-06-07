use prometheus::{Counter, CounterVec, Gauge, Histogram, HistogramOpts, HistogramVec, Opts, Registry, TextEncoder};
use std::sync::OnceLock;
use std::time::Instant;

fn global_registry() -> &'static Registry {
    static REGISTRY: OnceLock<Registry> = OnceLock::new();
    REGISTRY.get_or_init(|| {
        Registry::new_custom(Some("zeavis_ml".to_string()), None).expect("create registry")
    })
}

macro_rules! define_metric {
    ($name:ident, $ty:ty, $init:expr) => {
        pub fn $name() -> &'static $ty {
            static METRIC: OnceLock<$ty> = OnceLock::new();
            METRIC.get_or_init(|| {
                let m = $init;
                global_registry()
                    .register(Box::new(m.clone()))
                    .expect(concat!("register ", stringify!($name)));
                m
            })
        }
    };
}

// ── HTTP Metrics ────────────────────────────────────────

define_metric!(
    http_requests_total,
    Counter,
    Counter::new("zeavis_ml_http_requests_total", "Total number of HTTP requests")
        .expect("create counter")
);

define_metric!(
    http_request_duration_seconds,
    Histogram,
    Histogram::with_opts(
        HistogramOpts::new(
            "zeavis_ml_http_request_duration_seconds",
            "HTTP request duration in seconds",
        )
        .buckets(vec![0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]),
    )
    .expect("create histogram")
);

define_metric!(
    http_requests_active,
    Gauge,
    Gauge::new(
        "zeavis_ml_http_requests_active",
        "Number of active HTTP requests",
    )
    .expect("create gauge")
);

// ── Business Metrics ────────────────────────────────────

define_metric!(
    predictions_total,
    Counter,
    Counter::new(
        "zeavis_ml_predictions_total",
        "Total number of prediction requests",
    )
    .expect("create counter")
);

define_metric!(
    model_load_status,
    Gauge,
    Gauge::new(
        "zeavis_ml_model_load_status",
        "Model load status (1 = loaded, 0 = not loaded)",
    )
    .expect("create gauge")
);

/// Per-class prediction counter
define_metric!(
    predictions_by_class,
    CounterVec,
    CounterVec::new(
        Opts::new(
            "zeavis_ml_predictions_by_class_total",
            "Total predictions by predicted class label",
        ),
        &["label"],
    )
    .expect("create counter_vec")
);

/// Per-class ground-truth counter (for monitoring label distribution)
define_metric!(
    predictions_confidence,
    Histogram,
    Histogram::with_opts(
        HistogramOpts::new(
            "zeavis_ml_prediction_confidence",
            "Confidence values of predictions",
        )
        .buckets(vec![0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.99, 1.0]),
    )
    .expect("create histogram")
);

/// Latency of ONNX inference (model.predict call)
define_metric!(
    inference_duration_seconds,
    Histogram,
    Histogram::with_opts(
        HistogramOpts::new(
            "zeavis_ml_inference_duration_seconds",
            "ONNX model inference duration in seconds",
        )
        .buckets(vec![0.01, 0.025, 0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1.0, 2.0]),
    )
    .expect("create histogram")
);

/// Image size processed by the ML service
define_metric!(
    image_size_bytes,
    Histogram,
    Histogram::with_opts(
        HistogramOpts::new(
            "zeavis_ml_image_size_bytes",
            "Size of images sent for prediction in bytes",
        )
        .buckets(vec![1024.0, 10240.0, 51200.0, 102400.0, 204800.0, 512000.0, 1048576.0, 2097152.0]),
    )
    .expect("create histogram")
);

/// Error counter by error kind (e.g. bad_request, model_error, internal)
define_metric!(
    errors_total,
    CounterVec,
    CounterVec::new(
        Opts::new(
            "zeavis_ml_errors_total",
            "Total errors by kind",
        ),
        &["kind"],
    )
    .expect("create counter_vec")
);

// ── Request Guard (Drop-based cleanup for active gauge) ─

pub struct RequestMetricsGuard {
    start: Instant,
}

impl RequestMetricsGuard {
    pub fn new() -> Self {
        http_requests_active().inc();
        Self {
            start: Instant::now(),
        }
    }

    /// Record duration and request count before the guard drops.
    pub fn finish(&self) {
        http_request_duration_seconds().observe(self.start.elapsed().as_secs_f64());
        http_requests_total().inc();
    }
}

impl Drop for RequestMetricsGuard {
    fn drop(&mut self) {
        http_requests_active().dec();
    }
}

// ── Export ──────────────────────────────────────────────

pub fn encode_metrics() -> String {
    let encoder = TextEncoder::new();
    let mut buffer = String::new();
    let metric_families = global_registry().gather();
    encoder
        .encode_utf8(&metric_families, &mut buffer)
        .unwrap();
    buffer
}
