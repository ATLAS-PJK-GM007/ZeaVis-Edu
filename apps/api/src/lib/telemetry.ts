import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

const registry = new Registry();

// Collect default Node.js metrics (CPU, memory, event loop, etc.)
collectDefaultMetrics({ register: registry });

// ── HTTP Metrics ────────────────────────────────────────

export const httpRequestCounter = new Counter({
  name: 'zeavis_api_http_requests_total',
  help: 'Total number of HTTP requests handled by the API',
  labelNames: ['method', 'path', 'status'] as const,
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: 'zeavis_api_http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'path'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

export const httpRequestsActive = new Gauge({
  name: 'zeavis_api_http_requests_active',
  help: 'Number of HTTP requests currently being processed',
  registers: [registry],
});

// ── Business Metrics ────────────────────────────────────

export const classificationCounter = new Counter({
  name: 'zeavis_api_classifications_total',
  help: 'Total number of classification predictions requested via API',
  labelNames: ['result'] as const,
  registers: [registry],
});

export const diagnosisCounter = new Counter({
  name: 'zeavis_api_diagnoses_total',
  help: 'Total number of diagnoses created',
  labelNames: ['disease'] as const,
  registers: [registry],
});

export const diagnosisUploadSize = new Histogram({
  name: 'zeavis_api_diagnosis_upload_bytes',
  help: 'Distribution of uploaded diagnosis image sizes in bytes',
  labelNames: ['status'] as const,
  buckets: [1024, 51200, 102400, 204800, 512000, 1048576, 2097152, 5242880],
  registers: [registry],
});

export const authCounter = new Counter({
  name: 'zeavis_api_auth_operations_total',
  help: 'Total authentication operations (login, register, refresh)',
  labelNames: ['operation', 'success'] as const,
  registers: [registry],
});

export const diseaseCatalogRequests = new Counter({
  name: 'zeavis_api_disease_catalog_requests_total',
  help: 'Total disease catalog page views',
  labelNames: ['type'] as const,  // 'list' | 'detail'
  registers: [registry],
});

export const expertReviewCounter = new Counter({
  name: 'zeavis_api_expert_reviews_total',
  help: 'Total expert reviews submitted',
  labelNames: ['verdict'] as const,  // 'verified' | 'corrected'
  registers: [registry],
});

export const dbQueryDuration = new Histogram({
  name: 'zeavis_api_db_query_duration_seconds',
  help: 'Histogram of database query durations',
  labelNames: ['operation'] as const,
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [registry],
});

export const imageModelInferenceDuration = new Histogram({
  name: 'zeavis_api_ml_inference_duration_seconds',
  help: 'Histogram of ML model inference durations (via API->ML service)',
  labelNames: ['result'] as const,  // 'success' | 'failure'
  buckets: [0.05, 0.1, 0.25, 0.5, 0.75, 1, 2, 5, 10],
  registers: [registry],
});

export const mlServiceRequests = new Counter({
  name: 'zeavis_api_ml_service_requests_total',
  help: 'Total requests forwarded to ML service',
  labelNames: ['status'] as const,  // 'success' | 'error'
  registers: [registry],
});

// ── Export ──────────────────────────────────────────────

export function getMetricsContentType(): string {
  return registry.contentType;
}

export async function getMetrics(): Promise<string> {
  return await registry.metrics();
}
