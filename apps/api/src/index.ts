import { Elysia } from 'elysia';
import { env } from './config/env';
import { healthRoutes } from './routes/health';
import { statusRoutes } from './routes/status';
import { diseaseRoutes } from './routes/diseases';
import { classificationRoutes } from './routes/classifications';
import { dashboardRoutes } from './routes/dashboard';

const app = new Elysia()
  .use(healthRoutes)
  .use(statusRoutes)
  .use(diseaseRoutes)
  .use(classificationRoutes)
  .use(dashboardRoutes)
  .listen(env.port);

console.log(`ZeaVis Edu API running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
