import { Elysia } from 'elysia';
import { env } from './config/env';
import { healthRoutes } from './routes/health';
import { statusRoutes } from './routes/status';

const app = new Elysia().use(healthRoutes).use(statusRoutes).listen(env.port);

console.log(`ZeaVis Edu API running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
