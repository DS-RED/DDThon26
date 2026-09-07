# Table Order — Server

테이블오더 서비스 백엔드.
- **P2**(매장/메뉴 도메인 + 데이터·공통 인프라): 구현 완료
- **P1**(인증/주문/세션/SSE): **임시 구현 완료** — P1 담당자 합류 전 P2가 임시로 진행(합류 후 리뷰/이관 대상)

## 스택
- Node.js (ESM) + Express
- better-sqlite3 (SQLite)
- zod (요청 검증)
- 인증: jsonwebtoken(JWT) + bcryptjs(bcrypt)
- 실시간: Server-Sent Events (SSE)
- 테스트: `node:test` + supertest

## 요구 사항
- Node.js 18+ (권장 20+)
- 네이티브 모듈 `better-sqlite3` 빌드를 위해 플랫폼 prebuilt 바이너리 사용(대부분 자동).

## 설치 & 실행
```bash
cd server
npm install          # 의존성 설치
npm run migrate      # 스키마 생성 (data/table-order.sqlite)
npm run seed         # 데모 데이터 (idempotent)
npm start            # http://localhost:3000
npm run dev          # 파일 변경 시 자동 재시작
```

## 테스트
```bash
npm test             # in-memory SQLite 로 실행 (DB_PATH=:memory:)
```

## 데모 계정 (seed)
- 관리자: storeCode `demo-001`, username `admin`, password `admin1234`
- 테이블: storeCode `demo-001`, tableNumber `1`~`3`, password `0000`

## 환경 변수
`.env.example` 참고.
| 변수 | 기본값 | 설명 |
|------|--------|------|
| PORT | 3000 | 서버 포트 |
| NODE_ENV | development | `test`면 로깅 비활성 |
| DB_PATH | server/data/table-order.sqlite | `:memory:` 지정 시 인메모리 |
| JWT_SECRET | dev 폴백 | JWT 서명 키(운영 시 반드시 설정) |
| JWT_EXPIRES_IN | 16h | 토큰 만료(FR-A1) |
| BCRYPT_ROUNDS | 10 | bcrypt 코스트 |
| LOGIN_MAX_ATTEMPTS / LOGIN_WINDOW_MS | 5 / 900000 | 로그인 시도 제한 |
| CORS_ORIGINS | `*` (모든 origin) | P3/P4 SPA용 허용 origin(쉼표 구분). 예: `http://localhost:5173,http://localhost:5174` |

## 디렉터리
```
server/src/
  config/        설정 (env → config)
  db/            connection, schema.sql, migrate, seed
  middleware/    logger, error-handler, validate, auth(requireAdmin/requireTable)
  utils/         http-error
  store/         (P2) 매장 repository/service/controller/routes
  menu/          (P2) 메뉴+분류 schema/repository/service/controller/routes
  auth/          (P1) tokens, password(bcrypt), service, controller, routes, schema
  orders/        (P1) 주문 repository/service/controller/routes/schema + history
  sessions/      (P1) 세션 라이프사이클 repository/service
  tables/        (P1) 테이블 관리/대시보드 repository/service/controller/routes/schema
  sse/           (P1) SSE 발행 + /events 핸들러
  app.js         Express 앱 팩토리 (createApp)
  server.js      부트스트랩 + listen
tests/           store/menu/auth/orders/sse.test.js, helpers.js
```

## API
- 매장/메뉴 (P2): [docs/contracts/api-menu-store.md](../docs/contracts/api-menu-store.md)
- 인증/주문/세션/SSE (P1): [docs/contracts/api-auth-orders-sessions.md](../docs/contracts/api-auth-orders-sessions.md)

## 슬라이스 소유권 메모
- P1(인증/주문/세션/SSE)은 담당자 합류 전 **임시 구현**. 합류 후 리뷰/이관 대상.
- `middleware/auth.js`는 P2 공통 인프라 위치이나 실제 JWT 구현은 P1 소유.
