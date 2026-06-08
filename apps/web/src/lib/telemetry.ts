/**
 * Client‑side telemetry for the ZeaVis Edu web app.
 *
 * In development, metrics are collected in‑memory and exposed at /metrics
 * via a Vite plugin.  In production they are served through the same plugin
 * (or proxied by nginx in production mode).
 *
 * Metric name prefix: zeavis_web_
 */

// ── Web Vitals ──────────────────────────────────────────

export type MetricEntry = {
  name: string;
  value: number;
  rating?: string;
};

const vitalsBuffer: MetricEntry[] = [];

export function reportWebVitals(metric: MetricEntry): void {
  vitalsBuffer.push(metric);
  if (vitalsBuffer.length > 30) vitalsBuffer.splice(0, vitalsBuffer.length - 30);
}

// ── Page‑view counter ───────────────────────────────────

let pageViewCount = 0;
const routeViews: Record<string, number> = {};

export function trackPageView(path: string): void {
  pageViewCount++;
  routeViews[path] = (routeViews[path] || 0) + 1;
}

// ── API call timing ─────────────────────────────────────
// Track how long API calls take from the browser side

const apiLatencies: number[] = [];
const MAX_API_SAMPLES = 100;

export function recordApiCall(method: string, path: string, durationMs: number, status: number): void {
  apiLatencies.push(durationMs);
  if (apiLatencies.length > MAX_API_SAMPLES) apiLatencies.shift();
  console.debug(`[telemetry] api ${method} ${path} → ${status} (${durationMs.toFixed(0)}ms)`);
}

// ── Error tracking (client-side JS errors) ──────────────

let errorCount = 0;

export function trackError(source: string): void {
  errorCount++;
  console.debug(`[telemetry] error from ${source} (total: ${errorCount})`);
}

// ── Diagnosis actions ───────────────────────────────────

let scanCount = 0;
let diagnosisSuccess = 0;
let diagnosisFailure = 0;

export function trackScan(): void {
  scanCount++;
}

export function trackDiagnosisResult(success: boolean): void {
  if (success) diagnosisSuccess++;
  else diagnosisFailure++;
}

// ── Metrics serialisation (consumed by vite-plugin) ────

export function collectMetrics(): string {
  const lines: string[] = [];

  lines.push('# HELP zeavis_web_page_views_total Total page views');
  lines.push('# TYPE zeavis_web_page_views_total counter');
  lines.push(`zeavis_web_page_views_total ${pageViewCount}`);

  lines.push('# HELP zeavis_web_route_views_total Page views per route');
  lines.push('# TYPE zeavis_web_route_views_total counter');
  for (const [route, count] of Object.entries(routeViews)) {
    lines.push(`zeavis_web_route_views_total{route="${route}"} ${count}`);
  }

  lines.push('# HELP zeavis_web_vital Web Vitals observed this session');
  lines.push('# TYPE zeavis_web_vital gauge');
  for (const v of vitalsBuffer) {
    lines.push(`zeavis_web_vital{name="${v.name}",rating="${v.rating ?? 'unknown'}"} ${v.value}`);
  }

  if (apiLatencies.length > 0) {
    const avg = apiLatencies.reduce((a, b) => a + b, 0) / apiLatencies.length;
    lines.push('# HELP zeavis_web_api_call_duration_ms Average API call duration from browser');
    lines.push('# TYPE zeavis_web_api_call_duration_ms gauge');
    lines.push(`zeavis_web_api_call_duration_ms ${avg.toFixed(2)}`);
  }

  lines.push('# HELP zeavis_web_client_errors_total Client-side JS errors');
  lines.push('# TYPE zeavis_web_client_errors_total counter');
  lines.push(`zeavis_web_client_errors_total ${errorCount}`);

  lines.push('# HELP zeavis_web_scans_total Scan button clicks');
  lines.push('# TYPE zeavis_web_scans_total counter');
  lines.push(`zeavis_web_scans_total ${scanCount}`);

  lines.push('# HELP zeavis_web_diagnoses_total Diagnosis results from browser');
  lines.push('# TYPE zeavis_web_diagnoses_total counter');
  lines.push(`zeavis_web_diagnoses_total{result="success"} ${diagnosisSuccess}`);
  lines.push(`zeavis_web_diagnoses_total{result="failure"} ${diagnosisFailure}`);

  lines.push('# HELP zeavis_web_active_users User activity (1 = active this session)');
  lines.push('# TYPE zeavis_web_active_users gauge');
  lines.push(`zeavis_web_active_users 1`);

  return lines.join('\n') + '\n';
}
