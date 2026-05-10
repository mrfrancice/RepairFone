# syntax=docker/dockerfile:1
# Multi-stage Dockerfile pour le frontend Angular RepairFone (servi par nginx)

# ---------- Stage 1 : build ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY angular.json tsconfig*.json tailwind.config.* postcss.config.* ./
COPY src ./src
COPY public ./public

# Build production (configuration prod par défaut)
RUN npm run build -- --configuration=production

# ---------- Stage 2 : runtime nginx ----------
FROM nginx:1.27-alpine AS runtime

# Configuration nginx pour SPA Angular (fallback index.html + proxy /api)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build artifacts
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
