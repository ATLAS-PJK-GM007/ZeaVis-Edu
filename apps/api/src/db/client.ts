import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../config/env';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function createDbClient() {
  if (!env.databaseUrl) {
    throw new Error('DATABASE_URL is required to create a database client');
  }

  db ??= drizzle(postgres(env.databaseUrl), { schema });
  return db;
}
