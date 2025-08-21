# Build stage
FROM node:18.20-alpine AS builder

# Alpine에 필요한 패키지 설치
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && ln -sf /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (빌드용 - devDependencies 포함)
RUN npm ci && npm cache clean --force

# 소스 코드 복사
COPY . .

# TypeScript 빌드
RUN npm run build

# Production stage
FROM node:18.20-alpine AS production

# Alpine에 필요한 패키지 설치
RUN apk add --no-cache \
    libc6-compat \
    dumb-init \
    && ln -sf /lib/libc.musl-x86_64.so.1 /lib64/ld-linux-x86-64.so.2

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 애플리케이션 복사
COPY --from=builder /app/dist ./dist

# 비root 사용자 생성 및 권한 설정
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
RUN chown -R nestjs:nodejs /app
USER nestjs

# 포트 노출
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --version || exit 1

# 애플리케이션 실행
CMD ["node", "dist/main"]