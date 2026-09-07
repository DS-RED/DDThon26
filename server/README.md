# Table Order — Server (P2 슬라이스)

테이블오더 서비스 백엔드. **P2 담당 영역**(매장/메뉴 도메인 + 데이터·공통 인프라)이 구현되어 있으며,
주문/세션/SSE/인증(P1)은 계약(contract)만 정의된 상태입니다.

## 스택
- Node.js (ESM) + Express
- better-sqlite3 (SQLite)
- zod (요청 검증)
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

## 환경 변수
`.env.example` 참고.
| 변수 | 기본값 | 설명 |
|------|--------|------|
| PORT | 3000 | 서버 포트 |
| NODE_ENV | development | `test`면 로깅 비활성 |
| DB_PATH | server/data/table-order.sqlite | `:memory:` 지정 시 인메모리 |

## 디렉터리
```
server/src/
  config/        설정 (env → config)
  db/            connection, schema.sql, migrate, seed
  middleware/    logger, error-handler, validate, auth(placeholder)
  utils/         http-error
  store/         매장 repository/service/controller/routes
  menu/          메뉴+분류 schema/repository/service/controller/routes
  app.js         Express 앱 팩토리 (createApp)
  server.js      부트스트랩 + listen
tests/           store.test.js, menu.test.js, helpers.js
```

## API
[docs/contracts/api-menu-store.md](../docs/contracts/api-menu-store.md) 참고.

## 다른 슬라이스와의 계약
- 인증: `middleware/auth.js`의 `requireAdmin`은 **placeholder**. P1이 JWT 검증으로 교체.
- 주문/세션/SSE 테이블은 `schema.sql`에 구조만 정의(계약). P1이 로직 구현.
