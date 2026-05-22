import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

export function createDbClient() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required to create a database client');
  }

  const client = postgres(env.databaseUrl);
  return drizzle(client, { schema });
}
