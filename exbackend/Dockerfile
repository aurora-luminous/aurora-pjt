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
RUN npm run build   # tsc → dist/ 생성

# 3) 런타임 (슬림 & 비루트)
FROM node:18-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# 디렉토리 권한만 보장
RUN chown -R node:node /app
USER node

# 프로덕션 의존성만
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# 빌드 결과물만 복사
COPY --from=build --chown=node:node /app/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main.js"]
