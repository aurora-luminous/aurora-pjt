# Aurora Project

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 프로젝트 구조

이 프로젝트는 Next.js 13+ App Router를 사용하여 구성되었으며, 라우팅 그룹(Route Groups)을 활용해 기능별로 체계적으로 구조화되어 있습니다.

### 📁 폴더 구조

```
src/app/
├── layout.tsx                 # 루트 레이아웃
├── page.tsx                   # 메인 페이지 (/)
├── globals.css                # 글로벌 스타일
├── favicon.ico               # 파비콘
├── components/               # 공통 컴포넌트
├── lib/                     # 유틸리티 라이브러리
├── types/                   # 공통 타입 정의
├── (auth)/                  # 인증 관련 라우팅 그룹
│   ├── layout.tsx           # 인증 레이아웃
│   ├── components/          # 인증 관련 컴포넌트
│   ├── hooks/              # 인증 관련 훅
│   ├── types/              # 인증 관련 타입
│   ├── login/
│   │   └── page.tsx        # 로그인 페이지 (/login)
│   └── register/
│       └── page.tsx        # 회원가입 페이지 (/register)
├── (projects)/             # 프로젝트 관련 라우팅 그룹
│   ├── components/         # 프로젝트 관련 컴포넌트
│   ├── hooks/             # 프로젝트 관련 훅
│   ├── types/             # 프로젝트 관련 타입
│   ├── [project_id]/      # 동적 라우팅: 프로젝트 상세
│   │   ├── layout.tsx     # 프로젝트 상세 레이아웃
│   │   ├── page.tsx       # 프로젝트 상세 페이지 (/[project_id])
│   │   ├── settings/      # 프로젝트 설정
│   │   │   └── page.tsx   # 설정 페이지 (/[project_id]/settings)
│   │   ├── messages/      # 프로젝트 메시지
│   │   │   ├── page.tsx   # 메시지 목록 (/[project_id]/messages)
│   │   │   └── [user_id]/
│   │   │       └── page.tsx   # 사용자별 메시지 (/[project_id]/messages/[user_id])
│   │   └── channels/      # 채널 관리
│   │       └── [channel_id]/
│   │           └── page.tsx   # 채널 페이지 (/[project_id]/channels/[channel_id])
│   └── projects/
│       ├── layout.tsx     # 프로젝트 목록 레이아웃
│       └── create/
│           └── page.tsx   # 프로젝트 생성 페이지 (/projects/create)
└── (server-setup)/        # 서버 설정 관련 라우팅 그룹
    ├── layout.tsx         # 서버 설정 레이아웃
    ├── components/        # 서버 설정 관련 컴포넌트
    ├── hooks/            # 서버 설정 관련 훅
    ├── types/            # 서버 설정 관련 타입
    └── server-connect/
        └── page.tsx      # 서버 연결 페이지 (/server-connect)
```

### 🚀 라우팅 그룹 (Route Groups)

이 프로젝트는 Next.js의 라우팅 그룹 기능을 활용하여 코드를 논리적으로 구조화했습니다. 라우팅 그룹은 폴더명을 괄호`()`로 감싸서 생성하며, URL 경로에는 영향을 주지 않고 파일 구조만 정리하는 역할을 합니다.

#### 📋 라우팅 그룹 설명

1. **`(auth)` - 인증 그룹**
   - 로그인, 회원가입 등 사용자 인증 관련 페이지
   - URL: `/login`, `/register`
   - 공통 인증 레이아웃과 컴포넌트 공유

2. **`(projects)` - 프로젝트 그룹**
   - 프로젝트 관리, 상세 보기, 설정, 메시지, 채널 관리 페이지
   - URL: `/[project_id]`, `/[project_id]/settings`, `/[project_id]/messages`, `/[project_id]/messages/[user_id]`, `/[project_id]/channels/[channel_id]`, `/projects/create`
   - 동적 라우팅을 활용한 프로젝트 및 채널 개별 페이지

3. **`(server-setup)` - 서버 설정 그룹**
   - 서버 연결 및 설정 관련 페이지
   - URL: `/server-connect`
   - 서버 관리 기능들을 별도 그룹으로 분리

#### 🎯 라우팅 그룹의 장점

- **코드 구조화**: 기능별로 파일을 논리적으로 그룹화
- **레이아웃 공유**: 각 그룹별로 독립적인 레이아웃 적용 가능
- **컴포넌트 재사용**: 그룹 내에서 관련 컴포넌트와 훅 공유
- **타입 안전성**: 그룹별 타입 정의로 더 나은 개발 경험
- **유지보수성**: 기능 추가 시 해당 그룹에만 집중하여 개발 가능

## Getting Started

개발 서버를 실행하려면:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 페이지 구성

각 페이지는 다음과 같이 구성되어 있습니다:

- **메인 페이지** (`/`) - 프로젝트 홈페이지
- **로그인** (`/login`) - 사용자 로그인
- **회원가입** (`/register`) - 신규 사용자 등록
- **프로젝트 생성** (`/projects/create`) - 새 프로젝트 생성
- **프로젝트 상세** (`/[project_id]`) - 개별 프로젝트 정보
- **프로젝트 설정** (`/[project_id]/settings`) - 프로젝트 설정
- **프로젝트 메시지** (`/[project_id]/messages`) - 프로젝트 메시지 목록
- **사용자 메시지** (`/[project_id]/messages/[user_id]`) - 특정 사용자와의 메시지
- **채널** (`/[project_id]/channels/[channel_id]`) - 프로젝트 내 채널
- **서버 연결** (`/server-connect`) - 서버 연결 설정
