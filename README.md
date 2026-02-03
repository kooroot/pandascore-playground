# PandaScore Playground

PandaScore API를 활용한 LoL e스포츠 대시보드. 실시간 경기 스코어, 예정된 경기 일정, 대회 정보, 팀 정보를 한눈에 확인할 수 있습니다.

![Stack](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![Stack](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Stack](https://img.shields.io/badge/Vite_7-646CFF?logo=vite&logoColor=white)
![Stack](https://img.shields.io/badge/Bun-000000?logo=bun&logoColor=white)
![Stack](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white)

## Tech Stack

| Layer | Tech |
|-------|------|
| Runtime | Bun |
| Frontend | React 19 + TypeScript |
| Build | Vite 7 |
| Routing | TanStack Router (file-based) |
| Data Fetching | TanStack Query |
| Styling | Tailwind CSS v4 + shadcn/ui |
| API Server | Hono |
| API | [PandaScore](https://pandascore.co) Free Plan |

## Pages

- **Dashboard** (`/`) — 라이브 경기, 통계 요약, 예정/최근 경기 목록
- **Tournaments** (`/tournaments`) — 진행 중/예정된 대회 (리그 > 시리즈 > 토너먼트 트리)
- **Matches** (`/matches`) — 라이브/예정/완료 탭으로 전체 경기 조회
- **Teams** (`/teams`) — 팀 검색 및 정보 조회

## Getting Started

### 1. PandaScore API 토큰 발급

[pandascore.co](https://pandascore.co)에서 무료 계정을 만들고 API 토큰을 발급받으세요.

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 발급받은 토큰을 입력합니다:

```
PANDASCORE_TOKEN=your-token-here
```

### 3. 의존성 설치 및 실행

```bash
cd dashboard
bun install
bun run dev
```

- Vite 개발 서버: `http://localhost:5173`
- API 프록시 서버: `http://localhost:3001`

`bun run dev` 명령어 하나로 프론트엔드와 API 프록시 서버가 동시에 실행됩니다.

## Project Structure

```
pandascore-playground/
├── .env.example              # 환경변수 템플릿
├── get_lol_live.py           # 라이브 경기 조회 스크립트 (Python)
├── get_lol_tournaments.py    # 대회 조회 스크립트 (Python)
└── dashboard/
    ├── server/
    │   └── index.ts          # Hono API 프록시 (PandaScore 토큰 서버사이드 관리)
    ├── src/
    │   ├── routes/           # TanStack Router 파일 기반 라우트
    │   ├── components/       # React 컴포넌트
    │   ├── lib/
    │   │   ├── api.ts        # API 클라이언트 (타입 정의 포함)
    │   │   └── utils.ts      # 유틸리티 함수
    │   ├── index.css         # 테마, 커스텀 스타일
    │   └── main.tsx          # 앱 엔트리포인트
    ├── package.json
    └── vite.config.ts
```

## API Proxy

API 토큰이 클라이언트에 노출되지 않도록 Hono 기반 프록시 서버를 사용합니다.

```
Client → localhost:3001/api/* → api.pandascore.co/* (Bearer Token 자동 첨부)
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | 프론트엔드 + API 서버 동시 실행 |
| `bun run dev:client` | 프론트엔드만 실행 |
| `bun run server:dev` | API 서버만 실행 (watch 모드) |
| `bun run build` | 프로덕션 빌드 |
| `bun run lint` | ESLint 실행 |

## License

MIT
