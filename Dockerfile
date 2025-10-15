ARG BUN_VERSION="1.3.0"

FROM oven/bun:${BUN_VERSION}-alpine AS runner_base

RUN apk add --no-cache davfs2=1.6.1-r2

# ------------------------------
# DEVELOPMENT
# ------------------------------
FROM runner_base AS development

ENV NODE_ENV="development"

WORKDIR /app

COPY ./package.json ./bun.lock ./
COPY ./packages/schemas/package.json ./packages/schemas/package.json
COPY ./apps/client/package.json ./apps/client/package.json
COPY ./apps/server/package.json ./apps/server/package.json

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "dev"]

# ------------------------------
# PRODUCTION
# ------------------------------
FROM oven/bun:${BUN_VERSION} AS builder

WORKDIR /app

COPY ./package.json ./bun.lock ./

COPY ./packages/schemas/package.json ./packages/schemas/package.json
COPY ./apps/client/package.json ./apps/client/package.json
COPY ./apps/server/package.json ./apps/server/package.json

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM runner_base AS production

ENV NODE_ENV="production"

# RUN bun i ssh2

RUN apk add --no-cache davfs2=1.6.1-r2

WORKDIR /app

COPY --from=builder /app/apps/server/dist ./
COPY --from=builder /app/apps/server/drizzle ./assets/migrations
COPY --from=builder /app/apps/client/dist/client ./assets/frontend


CMD ["bun", "./index.js"]

