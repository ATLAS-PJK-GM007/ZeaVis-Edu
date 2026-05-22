import { createAppStatus } from '@zeavis/shared';
import { Elysia } from 'elysia';

export const statusRoutes = new Elysia({ prefix: '/api/v1' }).get('/status', () =>
  createAppStatus(),
);
