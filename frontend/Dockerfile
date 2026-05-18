ARG BUILD_DATE
ARG VERSION
ARG NODE_ENV=production

FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build

ARG NODE_ENV

ENV NODE_ENV=$NODE_ENV

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

ARG BUILD_DATE
ARG VERSION

LABEL org.opencontainers.image.created=$BUILD_DATE \
	org.opencontainers.image.version=$VERSION \
	org.opencontainers.image.title="product-dashboard-frontend"

RUN mkdir -p /tmp/nginx-cache /tmp/nginx-client-temp /tmp/nginx-proxy-temp \
	&& sed -i 's|^pid\s\+/run/nginx.pid;|pid /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
	&& chown -R nginx:nginx /tmp/nginx-cache /tmp/nginx-client-temp /tmp/nginx-proxy-temp /var/cache/nginx /var/run /var/log/nginx /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD wget -q -O /dev/null http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]