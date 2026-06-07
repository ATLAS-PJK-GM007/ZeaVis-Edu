import { Elysia } from 'elysia';
import { getMetrics, getMetricsContentType } from '../lib/telemetry';

export const metricsRoutes = new Elysia()
  .get('/metrics', async () => {
    const body = await getMetrics();
    return new Response(body, {
      headers: { 'Content-Type': getMetricsContentType() },
    });
  });
