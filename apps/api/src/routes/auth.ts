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
import { authCounter } from '../lib/telemetry';

// ── Google OAuth Helpers ──────────────────────────────────────────────

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
}

interface GoogleIdPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
}

async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId!,
      client_secret: env.googleClientSecret!,
      redirect_uri: env.googleRedirectUri!,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${err}`);
  }

  return res.json() as Promise<GoogleTokenResponse>;
}

function decodeGoogleIdToken(idToken: string): GoogleIdPayload {
  // JWT: header.payload.signature — we only need the payload
  // Google's id_token is verified via the token endpoint (direct server-to-server),
  // so we can safely decode without verifying the signature here.
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid id_token format');
  }
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload);
}

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
    const user = await getCurrentUser(request.headers.get('cookie'), request.headers);
    return {
      user,
      features: getAuthFeatures(),
    };
  })
  .post('/register', async ({ body, set, request }) => {
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
      set.headers['Set-Cookie'] = createSessionCookie(token, request.headers);

      authCounter.labels('register', 'true').inc();

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'user' as const,
        },
        token,
        features: getAuthFeatures(),
      };
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .post('/login', async ({ body, set, request }) => {
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
        authCounter.labels('login', 'false').inc();
        return badRequest('Invalid email or password');
      }

      const token = await createSession(user.id);
      set.headers['Set-Cookie'] = createSessionCookie(token, request.headers);

      authCounter.labels('login', 'true').inc();

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role === 'expert' ? 'expert' as const : 'user' as const,
        },
        token,
        features: getAuthFeatures(),
      };
    } catch (error) {
      return serviceUnavailable('Database unavailable');
    }
  })
  .post('/logout', async ({ request, set }) => {
    const cookieHeader = request.headers.get('cookie');
    await deleteSession(readSessionToken(cookieHeader));
    set.headers['Set-Cookie'] = clearSessionCookie(request.headers);
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

    set.status = 302;
    set.headers['Location'] = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  })
  .get('/google/callback', async ({ query, set, request }) => {
    if (!env.googleOAuthEnabled) {
      set.status = 404;
      return { error: 'Google OAuth is not configured' };
    }

    const code = (query as Record<string, string>).code;
    const error = (query as Record<string, string>).error;

    // User denied or Google returned an error
    if (error || !code) {
      set.status = 302;
      set.headers['Location'] = `${env.webAppUrl}/login?error=${encodeURIComponent(error ?? 'missing_code')}`;
      return;
    }

    // Exchange authorization code for tokens
    let idPayload: GoogleIdPayload;
    try {
      const tokens = await exchangeGoogleCode(code);
      idPayload = decodeGoogleIdToken(tokens.id_token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google auth failed';
      set.status = 302;
      set.headers['Location'] = `${env.webAppUrl}/login?error=${encodeURIComponent(msg)}`;
      return;
    }

    // Validate email
    if (!idPayload.email_verified || !idPayload.email) {
      set.status = 302;
      set.headers['Location'] = `${env.webAppUrl}/login?error=${encodeURIComponent('Email not verified by Google')}`;
      return;
    }

    const googleId = idPayload.sub;
    const email = idPayload.email.trim().toLowerCase();
    const name = idPayload.name?.trim() ?? email.split('@')[0];

    try {
      const db = createDbClient();

      // 1. Try to find user by googleId
      let user = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1).then(r => r[0] ?? null);

      // 2. If not found, try by email (link existing account)
      if (!user) {
        user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0] ?? null);
        if (user) {
          // Link googleId to existing account
          await db.update(users).set({ googleId }).where(eq(users.id, user.id));
        }
      }

      // 3. Create new user if nothing matched
      if (!user) {
        const inserted = await db
          .insert(users)
          .values({ email, name, googleId, role: 'user' })
          .returning();
        user = inserted[0];
        authCounter.labels('register', 'true').inc();
      }

      // Create session
      const token = await createSession(user.id);
      set.headers['Set-Cookie'] = createSessionCookie(token, request.headers);

      authCounter.labels('login', 'true').inc();

      // Redirect to web app with token in URL for localStorage fallback
      set.status = 302;
      set.headers['Location'] = `${env.webAppUrl}/login?token=${encodeURIComponent(token)}`;
    } catch (err) {
      set.status = 302;
      set.headers['Location'] = `${env.webAppUrl}/login?error=${encodeURIComponent('Database unavailable')}`;
    }
  });
