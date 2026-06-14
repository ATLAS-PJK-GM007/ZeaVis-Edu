FROM oven/bun:1.3.14 AS deps
WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
<<<<<<< HEAD
=======
ENV BUN_INSTALL_FROZEN_LOCKFILE=0
>>>>>>> 02ae0221749491518468e6bd9c56084f9687cd34
RUN bun install --production

FROM oven/bun:1.3.14 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV API_PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY apps/api apps/api
COPY packages/shared packages/shared

EXPOSE 3000
CMD ["bun", "apps/api/src/index.ts"]
