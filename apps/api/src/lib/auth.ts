import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { and, eq, gt } from 'drizzle-orm';
import type { AuthUser } from '@zeavis/shared';
import { createDbClient } from '../db/client';
import { sessions, users } from '../db/schema';
import { env } from '../config/env';

export const sessionCookieName = 'zeavis_session';

export type CurrentUser = AuthUser;

export function getAuthFeatures() {
  return {
    googleOAuthEnabled: env.googleOAuthEnabled,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

function hashToken(token: string) {
  return createHash('sha256').update(`${env.sessionSecret}:${token}`).digest('hex');
}

function isSecureRequest(headers?: { get(name: string): string | null }) {
  if (env.secureCookies) return true;
  // Detect HTTPS behind proxy (X-Forwarded-Proto)
  const proto = headers?.get('x-forwarded-proto');
  if (proto === 'https') return true;
  return false;
}

function buildSameSite(headers?: { get(name: string): string | null }) {
  return isSecureRequest(headers) ? 'SameSite=None; Secure' : 'SameSite=Lax';
}

export function createSessionCookie(token: string, headers?: { get(name: string): string | null }) {
  const maxAge = 60 * 60 * 24 * 30;
  const sameSite = buildSameSite(headers);
  return `${sessionCookieName}=${token}; HttpOnly; Path=/; ${sameSite}; Max-Age=${maxAge}`;
}

export function clearSessionCookie(headers?: { get(name: string): string | null }) {
  const sameSite = buildSameSite(headers);
  return `${sessionCookieName}=; HttpOnly; Path=/; ${sameSite}; Max-Age=0`;
}

export function readSessionToken(cookieHeader: string | null | undefined) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const sessionCookie = cookies.find((cookie) => cookie.startsWith(`${sessionCookieName}=`));
  if (!sessionCookie) return null;

  return decodeURIComponent(sessionCookie.slice(sessionCookieName.length + 1));
}

/**
 * Extract bearer token from Authorization header.
 * Used as fallback when cookies are blocked (e.g. Android WebView third-party blocking).
 */
export function readBearerToken(headers?: { get(name: string): string | null }) {
  if (!headers) return null;
  const auth = headers.get('authorization');
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export async function createSession(userId: string) {
  const db = createDbClient();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return token;
}

export async function deleteSession(token: string | null) {
  if (!token) return;

  const db = createDbClient();
  await db.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
}

export async function getCurrentUser(
  cookieHeader: string | null | undefined,
  headers?: { get(name: string): string | null },
): Promise<CurrentUser | null> {
  // Try cookie first, then Authorization header (for Android WebView where 3rd-party cookies are blocked)
  const token = readSessionToken(cookieHeader) ?? readBearerToken(headers);
  if (!token) return null;

  const db = createDbClient();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  const user = rows[0];
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === 'expert' ? 'expert' : 'user',
  };
}

export function requireUser(user: CurrentUser | null): CurrentUser {
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export function requireExpert(user: CurrentUser | null): CurrentUser {
  const currentUser = requireUser(user);
  if (currentUser.role !== 'expert') {
    throw new Error('FORBIDDEN');
  }
  return currentUser;
}
