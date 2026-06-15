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
  const parts = idToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid id_token format');
  }
  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
  return JSON.parse(payload);
}

/**
 * Render a page for the Android system browser that uses Chrome's native
 * `intent://` protocol to open the Tauri app with the session URL.
 * Falls back to a clickable button if the intent is blocked.
 */
function renderTauriDeepLinkPage(targetUrl: string): Response {
  // Extract the path + query from the full URL for the intent
  let pathAndQuery = '/login';
  try {
    const u = new URL(targetUrl);
    pathAndQuery = u.pathname + u.search + u.hash;
  } catch { /* use default */ }

  const displayUrl = targetUrl.replace(/"/g, '&quot;');
  const escapedPath = pathAndQuery.replace(/"/g, '&quot;');
  // intent:// scheme: Chrome on Android opens the target app by package name
  // browser_fallback_url: shown if the app isn't installed
  // Use intent://login/... to produce data URI zeavisedu://login/login?token=xxx
  // which new URL() can parse (single-slash non-hierarchical URLs break WebView)
  const intentUrl = `intent://login${escapedPath}#Intent;scheme=zeavisedu;package=com.zeavis.edu;S.browser_fallback_url=${encodeURIComponent(targetUrl)};end`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kembali ke ZeaVis Edu</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f0fdf4">
<div style="text-align:center;padding:2rem;max-width:360px">
<p style="color:#166534;font-size:1.1rem;margin-bottom:1.5rem">Login Google berhasil!<br>Kembali ke aplikasi...</p>
<a href="${intentUrl.replace(/"/g, '&quot;')}" id="open-app" style="display:inline-block;background:#16a34a;color:white;padding:0.75rem 2rem;border-radius:0.5rem;text-decoration:none;font-weight:600;font-size:1rem;margin-bottom:1rem">Buka ZeaVis Edu</a>
<p style="color:#6b7280;font-size:0.8rem">Jika tombol di atas tidak berfungsi, salin dan buka URL ini di aplikasi ZeaVis Edu:</p>
<code style="display:block;word-break:break-all;font-size:0.7rem;color:#4b5563;background:#e5e7eb;padding:0.5rem;border-radius:0.25rem;margin-top:0.5rem">${displayUrl.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
</div>
<script>
// Auto-open the intent
window.location.href = ${JSON.stringify(intentUrl)};
</script>
</body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=utf-8' },
  });
}

function resolvePlatform(stateRaw: string | undefined): string {
  try {
    if (stateRaw) {
      const parsed = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf-8'));
      return parsed.platform ?? 'web';
    }
  } catch { /* ignore */ }
  return 'web';
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
  .get('/google', ({ query, set }) => {
    if (!env.googleOAuthEnabled) {
      set.status = 404;
      return { error: 'Google OAuth is not configured' };
    }

    const platform = (query as Record<string, string>).platform ?? 'web';
    const state = Buffer.from(JSON.stringify({ platform })).toString('base64url');

    const params = new URLSearchParams({
      client_id: env.googleClientId!,
      redirect_uri: env.googleRedirectUri!,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state,
    });

    set.status = 302;
    set.headers['Location'] = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  })
  .get('/google/callback', async ({ query, set, request }) => {
    if (!env.googleOAuthEnabled) {
      set.status = 404;
      return { error: 'Google OAuth is not configured' };
    }

    const q = query as Record<string, string>;
    const code = q.code;
    const error = q.error;
    const platform = resolvePlatform(q.state);

    // User denied or Google returned an error
    const makeErrorUrl = (msg: string) =>
      `${env.webAppUrl}/login?error=${encodeURIComponent(msg)}`;

    if (error || !code) {
      const url = makeErrorUrl(error ?? 'missing_code');
      if (platform === 'tauri') return renderTauriDeepLinkPage(url);
      set.status = 302;
      set.headers['Location'] = url;
      return;
    }

    // Exchange authorization code for tokens
    let idPayload: GoogleIdPayload;
    try {
      const tokens = await exchangeGoogleCode(code);
      idPayload = decodeGoogleIdToken(tokens.id_token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google auth failed';
      const url = makeErrorUrl(msg);
      if (platform === 'tauri') return renderTauriDeepLinkPage(url);
      set.status = 302;
      set.headers['Location'] = url;
      return;
    }

    // Validate email
    if (!idPayload.email_verified || !idPayload.email) {
      const url = makeErrorUrl('Email not verified by Google');
      if (platform === 'tauri') return renderTauriDeepLinkPage(url);
      set.status = 302;
      set.headers['Location'] = url;
      return;
    }

    const googleId = idPayload.sub;
    const email = idPayload.email.trim().toLowerCase();
    const name = idPayload.name?.trim() ?? email.split('@')[0];

    try {
      const db = createDbClient();

      let user = await db.select().from(users).where(eq(users.googleId, googleId)).limit(1).then(r => r[0] ?? null);

      if (!user) {
        user = await db.select().from(users).where(eq(users.email, email)).limit(1).then(r => r[0] ?? null);
        if (user) {
          await db.update(users).set({ googleId }).where(eq(users.id, user.id));
        }
      }

      if (!user) {
        const inserted = await db
          .insert(users)
          .values({ email, name, googleId, role: 'user' })
          .returning();
        user = inserted[0];
        authCounter.labels('register', 'true').inc();
      }

      const token = await createSession(user.id);
      set.headers['Set-Cookie'] = createSessionCookie(token, request.headers);

      authCounter.labels('login', 'true').inc();

      const successUrl = `${env.webAppUrl}/login?token=${encodeURIComponent(token)}`;
      if (platform === 'tauri') return renderTauriDeepLinkPage(successUrl);
      set.status = 302;
      set.headers['Location'] = successUrl;
    } catch (err) {
      const url = makeErrorUrl('Database unavailable');
      if (platform === 'tauri') return renderTauriDeepLinkPage(url);
      set.status = 302;
      set.headers['Location'] = url;
    }
  });
