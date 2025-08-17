# Messenger Structure API

Discord + Mattermost 스타일 메신저의 서버-프로젝트-채널 구조 관리 API

## API DOCS
http://localhost:3001/api-docs

## 🏗 시스템 아키텍처

```
┌─────────────────────┐         ┌─────────────────────┐
│   NestJS 서버       │   API   │   Spring 서버       │
│  (구조 관리)        │ ←────→  │  (실시간 채팅)      │
└─────────────────────┘         └─────────────────────┘
        │                               │
        └────────── PostgreSQL ─────────┘
```

### 서비스 분담
- **NestJS**: 서버/프로젝트/채널 구조 관리, JWT 토큰 검증, 음성/화상 기능(추후)
- **Spring**: 실시간 채팅 메시징, STOMP WebSocket, JWT 토큰 발급, 사용자 인증

## 🛠 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: NestJS 10.x
- **Database**: PostgreSQL 14+
- **Language**: TypeScript

## 🚀 실행 방법

### 필수 요구사항
```bash
Node.js 18+
PostgreSQL 14+
npm 8+
```

### 설치 및 실행
```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일에서 DB 정보 및 API 키 설정

# 데이터베이스 생성
createdb messenger_db

# 서버 실행
npm run start:dev
```


## 🗄 데이터베이스

### PostgreSQL 설정
```sql
-- 데이터베이스 생성
CREATE DATABASE aurora;

### 주요 테이블
- `users` - 사용자 정보
- `server` - 서버 정보  
- `project` - 프로젝트 정보
- `channel` - 채널 정보
- `event` - 프로젝트 일정
- `*member` - 각 레벨별 멤버십 및 권한

## 📄 환경 변수

### 필수 환경 변수
```env
# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_DATABASE=aurora

# JWT (Spring 서버)
JWT_SECRET=shared_secret_key

# Spring 서버 연동
SPRING_CHAT_SERVER_URL=http://localhost:8080
SPRING_CHAT_API_KEY=api_key_from_spring_team
```

### 선택 환경 변수
```env
NODE_ENV=development
PORT=3001
```


### 의존성
- PostgreSQL 데이터베이스 연결 필요
- Spring 서버와 HTTP 통신 (채널 생성/삭제 알림용)


## 🔗 외부 연동

### Spring 서버 연동
- 채널 생성/삭제 시 Spring 서버에 HTTP 요청
- JWT 토큰 검증을 위해 동일한 시크릿 키 사용

### 향후 확장
- 음성/화상 기능 추가 예정 (WebRTC)
- Redis 캐싱 추가 가능성

## 📦 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start:prod
```