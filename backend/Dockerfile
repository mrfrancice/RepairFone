# syntax=docker/dockerfile:1
# Multi-stage Dockerfile pour le backend NestJS RepairFone

# ---------- Stage 1 : build ----------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests first for better layer caching
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --omit=dev

# ---------- Stage 2 : runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root user for security
RUN addgroup -S app && adduser -S app -G app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/package.json ./

USER app
EXPOSE 3000

# Healthcheck branché sur l'endpoint health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
