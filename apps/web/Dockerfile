FROM oven/bun:1.3.14 AS builder
WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
<<<<<<< HEAD
=======
ENV BUN_INSTALL_FROZEN_LOCKFILE=0
>>>>>>> 02ae0221749491518468e6bd9c56084f9687cd34
RUN bun install

COPY packages/shared packages/shared
COPY apps/web apps/web
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN bun run --cwd packages/shared build
RUN bun run --cwd apps/web build

# =============================================================================
# Stage 2: nginx (Alpine package — includes sub_filter module)
# Alpine's nginx package is built with --with-http_sub_module
# =============================================================================
FROM alpine:3.20 AS runner
RUN apk add --no-cache nginx

COPY apps/web/nginx.conf /etc/nginx/http.d/default.conf
COPY --from=builder /app/apps/web/dist /var/lib/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
