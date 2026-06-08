import type { Plugin } from 'vite';

/**
 * Vite plugin that exposes a /metrics endpoint during development.
 *
 * The endpoint returns Prometheus‑text metrics collected in
 * src/lib/telemetry.ts.
 */
export function metricsPlugin(): Plugin {
  let telemetryModule: typeof import('./src/lib/telemetry') | null = null;

  return {
    name: 'zeavis-metrics',

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only handle GET /metrics
        if (req.method !== 'GET' || !req.url?.startsWith('/metrics')) {
          return next();
        }

        // Lazy‑load the telemetry module (ensures the app is bootstrapped first)
        if (!telemetryModule) {
          try {
            telemetryModule = await server.ssrLoadModule('./src/lib/telemetry.ts') as typeof import('./src/lib/telemetry');
          } catch {
            // If the module isn't ready yet, return an empty body
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('# telemetry module not yet loaded\n');
            return;
          }
        }

        const body = telemetryModule.collectMetrics();
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end(body);
      });
    },
  };
}
