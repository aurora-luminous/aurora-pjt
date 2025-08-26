# 1) 의존성 설치
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 2) 빌드
FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build   # 예: tsc → dist/ 생성

# 3) 런타임 (가볍고 안전)
FROM node:18-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN addgroup -S nodejs && adduser -S node -G nodejs
USER node

# 프로덕션 의존성만
COPY package*.json ./
RUN npm ci --omit=dev

# 빌드 결과물만 복사
COPY --from=build /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/server.js"]
