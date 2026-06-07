/**
 * Client‑side telemetry for the ZeaVis Edu web app.
 *
 * In development, metrics are collected in‑memory and exposed at /metrics
 * via a Vite plugin.  In production they are sent as HTTP beacons to the
 * Telemetry pipeline (see METRICS.md).
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
  // Keep last 20 entries in memory for the /metrics endpoint
  if (vitalsBuffer.length > 20) vitalsBuffer.shift();
  console.debug(`[telemetry] ${metric.name}: ${metric.value} (${metric.rating ?? 'n/a'})`);
}

// ── Page‑view counter ───────────────────────────────────

let pageViewCount = 0;

export function trackPageView(path: string): void {
  pageViewCount++;
  console.debug(`[telemetry] pageview: ${path} (total: ${pageViewCount})`);
}

// ── Metrics serialisation (consumed by vite‑plugin) ────

export function collectMetrics(): string {
  const lines: string[] = [];

  // ── Default process‑like metrics ──────────────────────
  lines.push('# HELP zeavis_web_page_views_total Total page views');
  lines.push('# TYPE zeavis_web_page_views_total counter');
  lines.push(`zeavis_web_page_views_total ${pageViewCount}`);

  lines.push('# HELP zeavis_web_vital_bucket Web Vitals observed this session');
  lines.push('# TYPE zeavis_web_vital_bucket gauge');
  for (const v of vitalsBuffer) {
    lines.push(`zeavis_web_vital_bucket{name="${v.name}",rating="${v.rating ?? 'unknown'}"} ${v.value}`);
  }

  return lines.join('\n') + '\n';
}
