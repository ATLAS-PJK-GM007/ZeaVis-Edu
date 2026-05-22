export const env = {
  port: Number(Bun.env.API_PORT ?? 3000),
  databaseUrl: Bun.env.DATABASE_URL,
};
