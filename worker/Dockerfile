ARG BUILD_DATE
ARG VERSION
ARG NODE_ENV=production

FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci
COPY worker/src ./src

FROM node:20-alpine AS runner

ARG BUILD_DATE
ARG VERSION
ARG NODE_ENV

LABEL org.opencontainers.image.created=$BUILD_DATE \
  org.opencontainers.image.version=$VERSION \
  org.opencontainers.image.title="product-dashboard-worker"

WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src

ENV NODE_ENV=$NODE_ENV

RUN addgroup -S appgroup \
  && adduser -S appuser -G appgroup \
  && chown -R appuser:appgroup /app

USER appuser

CMD ["node", "src/worker.js"]
