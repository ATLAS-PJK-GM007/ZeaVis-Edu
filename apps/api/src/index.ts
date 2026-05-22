import { Elysia } from 'elysia';
import { env, assertRequiredEnv } from './config/env';
import { healthRoutes } from './routes/health';
import { statusRoutes } from './routes/status';
import { diseaseRoutes } from './routes/diseases';
import { classificationRoutes } from './routes/classifications';
import { diagnosisRoutes } from './routes/diagnoses';
import { dashboardRoutes } from './routes/dashboard';
import { authRoutes } from './routes/auth';
import { expertRoutes } from './routes/expert';

assertRequiredEnv();

const app = new Elysia()
  .use(healthRoutes)
  .use(statusRoutes)
  .use(authRoutes)
  .use(diseaseRoutes)
  .use(classificationRoutes)
  .use(diagnosisRoutes)
  .use(expertRoutes)
  .use(dashboardRoutes)
  .listen(env.port);

console.log(`ZeaVis Edu API running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
