ARG BUN_VERSION="1.3.1"

FROM oven/bun:${BUN_VERSION}-alpine AS base

RUN apk add --no-cache davfs2=1.6.1-r2


# ------------------------------
# DEPENDENCIES
# ------------------------------
FROM base AS deps

WORKDIR /deps

ARG TARGETARCH
ARG RESTIC_VERSION="0.18.1"
ENV TARGETARCH=${TARGETARCH}

RUN apk add --no-cache curl bzip2

RUN echo "Building for ${TARGETARCH}"
RUN if [ "${TARGETARCH}" = "arm64" ]; then \
      curl -L -o restic.bz2 "https://github.com/restic/restic/releases/download/v$RESTIC_VERSION/restic_$RESTIC_VERSION"_linux_arm64.bz2; \
      elif [ "${TARGETARCH}" = "amd64" ]; then \
      curl -L -o restic.bz2 "https://github.com/restic/restic/releases/download/v$RESTIC_VERSION/restic_$RESTIC_VERSION"_linux_amd64.bz2; \
      fi

RUN bzip2 -d restic.bz2 && chmod +x restic

# ------------------------------
# DEVELOPMENT
# ------------------------------
FROM base AS development

ENV NODE_ENV="development"

WORKDIR /app

COPY --from=deps /deps/restic /usr/local/bin/restic
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

FROM base AS production

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=deps /deps/restic /usr/local/bin/restic
COPY --from=builder /app/apps/server/dist ./
COPY --from=builder /app/apps/server/drizzle ./assets/migrations
COPY --from=builder /app/apps/client/dist/client ./assets/frontend

# Include third-party licenses and attribution
COPY ./LICENSES ./LICENSES
COPY ./NOTICES.md ./NOTICES.md
COPY ./LICENSE ./LICENSE.md

CMD ["bun", "./index.js"]

