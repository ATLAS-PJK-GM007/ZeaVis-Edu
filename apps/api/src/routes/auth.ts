import { Elysia } from 'elysia';
import type { AuthRequest, RegisterRequest } from '@zeavis/shared';
import { eq } from 'drizzle-orm';
import { createDbClient } from '../db/client';
import { users } from '../db/schema';
import { badRequest, serviceUnavailable } from '../lib/http-errors';
import {
  clearSessionCookie,
  createSession,
  createSessionCookie,
  deleteSession,
  getAuthFeatures,
  getCurrentUser,
  hashPassword,
  readSessionToken,
  verifyPassword,
} from '../lib/auth';
import { env } from '../config/env';

function normalizeEmail(email: unknown) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function normalizeName(name: unknown) {
  return typeof name === 'string' ? name.trim() : '';
}

function validatePassword(password: unknown) {
  return typeof password === 'string' && password.length >= 8;
}

export const authRoutes = new Elysia({ prefix: '/api/v1/auth' })
  .get('/me', async ({ request }) => {
    const user = await getCurrentUser(request.headers.get('cookie'));
    return {
      user,
      features: getAuthFeatures(),
    };
  })
  .post('/register', async ({ body, set }) => {
    const req = body as Partial<RegisterRequest> | undefined;
    const email = normalizeEmail(req?.email);
    const name = normalizeName(req?.name);

    if (!email || !email.includes('@') || !name || !validatePassword(req?.password)) {
      return badRequest('Name, valid email, and password with at least 8 characters are required');
    }

    try {
      const db = createDbClient();
      const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existing.length > 0) {
        return badRequest('Email is already registered');
      }

      const passwordHash = await hashPassword(req!.password!);
      const inserted = await db
        .insert(users)
        .values({ email, name, passwordHash, role: 'user' })
        .returning();

      const user = inserted[0];
      const token = await createSession(user.id);
      set.headers['Set-Cookie'] = createSessionCookie(token);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'user' as const,
        },
        features: getAuthFeatures(),
      };
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .post('/login', async ({ body, set }) => {
    const req = body as Partial<AuthRequest> | undefined;
    const email = normalizeEmail(req?.email);

    if (!email || !validatePassword(req?.password)) {
      return badRequest('Valid email and password are required');
    }

    try {
      const db = createDbClient();
      const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
      const user = rows[0];

      if (!user?.passwordHash || !(await verifyPassword(req!.password!, user.passwordHash))) {
        return badRequest('Invalid email or password');
      }

      const token = await createSession(user.id);
      set.headers['Set-Cookie'] = createSessionCookie(token);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role === 'expert' ? 'expert' as const : 'user' as const,
        },
        features: getAuthFeatures(),
      };
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .post('/logout', async ({ request, set }) => {
    await deleteSession(readSessionToken(request.headers.get('cookie')));
    set.headers['Set-Cookie'] = clearSessionCookie();
    return { ok: true };
  })
  .get('/google', ({ set }) => {
    if (!env.googleOAuthEnabled) {
      set.status = 404;
      return { error: 'Google OAuth is not configured' };
    }

    const params = new URLSearchParams({
      client_id: env.googleClientId!,
      redirect_uri: env.googleRedirectUri!,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    set.redirect = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  })
  .get('/google/callback', ({ set }) => {
    if (!env.googleOAuthEnabled) {
      set.status = 404;
      return { error: 'Google OAuth is not configured' };
    }

    set.redirect = `${env.webAppUrl}/login?oauth=not-implemented`;
  });
