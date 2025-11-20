ARG BUN_VERSION="1.3.1"

FROM oven/bun:${BUN_VERSION}-alpine AS base

RUN apk add --no-cache davfs2=1.6.1-r2 openssh-client


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
      curl -O https://downloads.rclone.org/rclone-current-linux-arm64.zip; \
      unzip rclone-current-linux-arm64.zip; \
      elif [ "${TARGETARCH}" = "amd64" ]; then \
      curl -L -o restic.bz2 "https://github.com/restic/restic/releases/download/v$RESTIC_VERSION/restic_$RESTIC_VERSION"_linux_amd64.bz2; \
      curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip; \
      unzip rclone-current-linux-amd64.zip; \
      fi

RUN bzip2 -d restic.bz2 && chmod +x restic
RUN mv rclone-*-linux-*/rclone /deps/rclone && chmod +x /deps/rclone


# ------------------------------
# DEVELOPMENT
# ------------------------------
FROM base AS development

ENV NODE_ENV="development"

WORKDIR /app

COPY --from=deps /deps/restic /usr/local/bin/restic
COPY --from=deps /deps/rclone /usr/local/bin/rclone
COPY ./package.json ./bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 4096

CMD ["bun", "run", "dev"]

# ------------------------------
# PRODUCTION
# ------------------------------
FROM oven/bun:${BUN_VERSION} AS builder

ARG APP_VERSION=dev

WORKDIR /app

COPY ./package.json ./bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN touch .env
RUN echo "VITE_APP_VERSION=${APP_VERSION}" >> .env

RUN bun run build

FROM base AS production

ENV NODE_ENV="production"

WORKDIR /app

COPY --from=builder /app/package.json ./
RUN bun install --production --frozen-lockfile

COPY --from=deps /deps/restic /usr/local/bin/restic
COPY --from=deps /deps/rclone /usr/local/bin/rclone
COPY --from=builder /app/dist/client ./dist/client
COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/app/drizzle ./assets/migrations

# Include third-party licenses and attribution
COPY ./LICENSES ./LICENSES
COPY ./NOTICES.md ./NOTICES.md
COPY ./LICENSE ./LICENSE.md

EXPOSE 4096

CMD ["bun", "run", "start"]

