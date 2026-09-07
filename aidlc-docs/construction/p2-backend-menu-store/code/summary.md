# Code Generation Summary — p2-backend-menu-store

**Unit**: p2-backend-menu-store
**Role**: P2 (백엔드 · 메뉴/매장 도메인 + 데이터·공통 인프라)
**Generated**: 2026-09-07
**Approach**: Lean (Code Generation Part 1 계획 → Part 2 코드 생성)

## 생성된 아티팩트

### 공통 인프라 (P2 초안 → 공동)
| 파일 | 설명 |
|------|------|
| `server/package.json` | ESM, express/better-sqlite3/zod, node:test 스크립트 |
| `server/.env.example`, `.gitignore` | 환경 변수 예시 / 무시 규칙 |
| `server/src/config/index.js` | env → config, `:memory:` 지원, `isTest` |
| `server/src/db/connection.js` | lazy singleton `getDb`/`closeDb`, WAL, FK on |
| `server/src/db/schema.sql` | 전체 스키마(soft 소유권 주석) |
| `server/src/db/migrate.js` | `applySchema(db)` + CLI |
| `server/src/db/seed.js` | idempotent 데모 시드(매장/분류/메뉴/admin/테이블) |
| `server/src/utils/http-error.js` | `HttpError` + `badRequest/notFound/conflict` |
| `server/src/middleware/error-handler.js` | `notFoundHandler`, `errorHandler` (JSON) |
| `server/src/middleware/validate.js` | `validateBody(zodSchema)` → `req.validated` |
| `server/src/middleware/logger.js` | 요청 로거(test 시 무음) |
| `server/src/middleware/auth.js` | `requireAdmin` **placeholder** (TODO(P1) JWT) |
| `server/src/app.js` | `createApp()` 팩토리(사이드이펙트 없음) |
| `server/src/server.js` | 부트스트랩(스키마 적용 + listen + graceful shutdown) |

### 매장 도메인 (P2 소유)
`server/src/store/{store.repository,store.service,store.controller,store.routes}.js`
- GET `/api/stores`, GET `/api/stores/:storeId`

### 메뉴 도메인 (P2 소유)
`server/src/menu/{menu.schema,menu.repository,menu.service,menu.controller,menu.routes}.js`
- 분류 CRUD: `/api/stores/:storeId/categories[/:categoryId]`
- 메뉴 CRUD + reorder: `/api/stores/:storeId/menu[/:itemId]`, `PATCH /menu/reorder`
- `is_available` boolean 직렬화, 분류별 그룹 응답, category 소유 검증

### 테스트
`server/tests/{helpers,store.test,menu.test}.js` — supertest + in-memory SQLite (`DB_PATH=:memory:`).
커버리지: health, 매장 조회/404/400, 메뉴·분류 CRUD, reorder(정상/오류), 검증 실패, foreign category 거부.

### 계약 문서 (공유 초안 — P2 작성)
- `docs/contracts/shared-conventions.md`
- `docs/contracts/db-schema.md`
- `docs/contracts/api-menu-store.md`
- `server/README.md`

## 검증 상태
- 정적 리뷰 완료. 업데이트 스키마의 default 재설정 버그 발견 → 수정(부분 수정 시 누락 필드 보존).
- ⚠️ 자동 테스트 미실행: **이 머신에 Node.js/npm 미설치**로 `npm install`/`npm test` 실행 불가.
  담당자 환경에서 `cd server && npm install && npm test`로 검증 필요.

## 다른 슬라이스 대상 계약(placeholder)
- 인증: `requireAdmin` 스텁 → P1이 JWT로 교체.
- 주문/세션/SSE 테이블: `schema.sql`에 구조만 정의 → P1이 로직 구현.
