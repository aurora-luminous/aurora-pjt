# syntax=docker/dockerfile:1
FROM node:22-bookworm AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY nest-cli.json tsconfig.json tsconfig.build.json* ./
COPY src ./src
RUN npm run build
RUN npm prune --production

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3001
EXPOSE 10000-10100/udp

CMD ["node", "dist/main"]