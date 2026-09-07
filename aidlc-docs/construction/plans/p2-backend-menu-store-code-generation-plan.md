# P2 백엔드(메뉴/매장 + 데이터·공통 인프라) — 코드 생성 계획

> **Unit**: `p2-backend-menu-store`
> **담당 역할**: P2 (본 개발자)
> **방식**: 린(Lean) — 무거운 INCEPTION 단계 생략, Code Generation Part1(계획)→Part2(구현)
> **작성일**: 2026-09-07
> **단일 진실 소스(Single Source of Truth)**: 이 계획 파일. Part 2 구현은 이 계획을 정확히 따름.

---

## Unit Context

**담당 범위 (P2)**
- 메뉴 CRUD, 메뉴 노출 순서(display order) 조정
- 매장(Store) / 카테고리(Category) 관리
- SQLite 스키마 정의 · 마이그레이션 · 시드 데이터
- 공통 인프라: 서버 부트스트랩, 에러 핸들링/검증/로깅 미들웨어, 설정 로딩
- **공유 계약 초안 작성** (P2가 초안 → 팀 리뷰): 전체 DB 스키마, 메뉴/매장 API 명세, (SSE 이벤트/인증 규약은 P1과 합의 필요한 부분만 초안)

**타 슬라이스 의존/경계 (P2는 구현하지 않음, 계약만 제공)**
- P1 (주문/세션 + SSE 발행): Order/OrderItem/OrderHistory/TableSession/AdminUser 도메인 로직, SSE 스트림
- P3 (고객 프론트), P4 (관리자 프론트): 모든 React UI

**요구사항 추적 (requirements.md)**
- FR-A4 메뉴 관리 → 메뉴 CRUD/순서 API
- FR-C2 메뉴 조회 → 고객용 메뉴 조회 API (카테고리별)
- 매장/카테고리 데이터 → Store/Category 스키마·API
- NFR: SQLite 파일 DB, 로컬 실행, 시드 데이터로 즉시 시연, 입력 검증(필수 필드·가격 범위)

---

## 기술 선택 (린 결정, 소규모 MVP 기준)

| 항목 | 선택 | 비고 |
|------|------|------|
| 런타임 | Node.js | Q2: B |
| 웹 프레임워크 | **Express** | NestJS 대비 경량·빠른 스캐폴딩. NFR 미확정분을 MVP 기준 Express로 확정 |
| DB 드라이버 | **better-sqlite3** | 동기 API, 로컬/데모에 단순·견고 |
| 검증 | **zod** | 요청 바디 스키마 검증(필수 필드·가격 범위) |
| 언어 | JavaScript (ESM) | 소규모 MVP, 빌드 스텝 최소화 (TS 미도입) |
| 테스트 | **node:test** + supertest | 기본 내장 러너로 의존성 최소화 |

> 프레임워크/언어(TS 미도입 등)에 이견 있으시면 계획 승인 시 알려주세요.

---

## 대상 디렉토리 구조 (워크스페이스 루트, aidlc-docs 아님)

```
server/                         # 백엔드 (P2가 골격+메뉴/매장, P1이 주문/세션 추가)
├── package.json
├── .env.example
├── src/
│   ├── app.js                  # Express 앱 구성 (라우터/미들웨어 조립)
│   ├── server.js               # 부트스트랩 (포트 리슨, DB 초기화)
│   ├── config/
│   │   └── index.js            # 환경설정 로딩
│   ├── db/
│   │   ├── connection.js       # better-sqlite3 연결(싱글턴)
│   │   ├── schema.sql          # 전체 DB 스키마 (공유 계약 초안)
│   │   ├── migrate.js          # 스키마 적용/마이그레이션
│   │   └── seed.js             # 시드 데이터 (샘플 매장/카테고리/메뉴/관리자)
│   ├── middleware/
│   │   ├── error-handler.js    # 공통 에러 핸들러
│   │   ├── validate.js         # zod 기반 요청 검증 미들웨어
│   │   └── logger.js           # 요청 로깅
│   ├── store/
│   │   ├── store.repository.js
│   │   ├── store.service.js
│   │   ├── store.controller.js
│   │   └── store.routes.js
│   ├── menu/
│   │   ├── menu.repository.js
│   │   ├── menu.service.js
│   │   ├── menu.controller.js
│   │   ├── menu.routes.js
│   │   └── menu.schema.js       # zod 스키마 (메뉴/카테고리 검증)
│   └── utils/
│       └── http-error.js        # 표준 에러 객체
├── tests/
│   ├── menu.test.js
│   └── store.test.js
docs/contracts/                  # 공유 계약 초안 (팀 리뷰용)
├── db-schema.md                 # 전체 DB 스키마 문서 (P2 초안)
├── api-menu-store.md            # 메뉴/매장 API 명세 (P2 확정)
└── shared-conventions.md        # SSE 이벤트/JWT 인증 규약 (P1 합의 필요분 초안)
```

---

## 데이터 모델 (P2 초안, 공유 계약)

P2 소유 테이블: `stores`, `categories`, `menu_items`.
계약 초안으로만 정의(구현은 P1): `admin_users`, `tables`, `table_sessions`, `orders`, `order_items`, `order_history`.

핵심 필드(요약):
- **stores**: id, store_code(고유), name, created_at
- **categories**: id, store_id(FK), name, display_order
- **menu_items**: id, store_id(FK), category_id(FK), name, price, description, image_url, display_order, is_available, created_at, updated_at

---

## API 엔드포인트 (P2 담당)

**메뉴 (관리자/고객)**
- `GET    /api/stores/:storeId/menu`               — 카테고리별 메뉴 조회 (고객/공용)
- `GET    /api/stores/:storeId/menu/:id`           — 메뉴 상세
- `POST   /api/stores/:storeId/menu`               — 메뉴 등록
- `PUT    /api/stores/:storeId/menu/:id`           — 메뉴 수정
- `DELETE /api/stores/:storeId/menu/:id`           — 메뉴 삭제
- `PATCH  /api/stores/:storeId/menu/reorder`       — 노출 순서 조정

**카테고리**
- `GET    /api/stores/:storeId/categories`
- `POST   /api/stores/:storeId/categories`
- `PUT    /api/stores/:storeId/categories/:id`
- `DELETE /api/stores/:storeId/categories/:id`

**매장 / 헬스**
- `GET    /api/stores/:storeId`                    — 매장 정보
- `GET    /health`                                 — 헬스 체크

> 인증 미들웨어 훅 지점은 마련하되, 실제 JWT 검증 구현은 P1 계약 확정 후 연결(스텁/주석 처리). 관리자 전용 엔드포인트는 `requireAdmin` 자리표시자 미들웨어로 표시.

---

## 실행 단계 (Steps) — Part 2에서 순차 실행

- [x] **Step 1. 프로젝트 골격 셋업**: `server/package.json`(ESM, 스크립트), `.env.example`, `.gitignore`(node_modules, *.sqlite), 의존성 명시(express, better-sqlite3, zod, supertest)
- [x] **Step 2. 공통 인프라 — 설정/DB 연결**: `config/index.js`, `db/connection.js`
- [x] **Step 3. DB 스키마 & 마이그레이션**: `db/schema.sql`(P2 소유 + 계약용 타 테이블 포함), `db/migrate.js`
- [x] **Step 4. 공통 미들웨어**: `middleware/error-handler.js`, `middleware/validate.js`, `middleware/logger.js`, `utils/http-error.js`
- [x] **Step 5. 매장(Store) 레이어**: repository → service → controller → routes
- [x] **Step 6. 카테고리 + 메뉴(Menu) 레이어**: repository → service → controller → routes, `menu.schema.js`(zod: 필수 필드·가격 범위 검증), 노출 순서 조정 로직
- [x] **Step 7. 앱/서버 조립**: `app.js`(라우터·미들웨어 조립), `server.js`(부트스트랩, DB init)
- [x] **Step 8. 시드 데이터**: `db/seed.js` (샘플 매장 1, 카테고리 몇 개, 메뉴 여러 개[외부 이미지 URL], 관리자 계정 1[bcrypt 해시 자리표시자])
- [x] **Step 9. 단위 테스트**: `tests/store.test.js`, `tests/menu.test.js` (node:test + supertest, 인메모리/임시 DB)
- [x] **Step 10. 공유 계약 문서**: `docs/contracts/db-schema.md`, `docs/contracts/api-menu-store.md`, `docs/contracts/shared-conventions.md`
- [x] **Step 11. 문서/실행 안내**: `server/README.md` (설치·마이그레이션·시드·실행·테스트 방법)
- [x] **Step 12. 코드 요약 문서**: `aidlc-docs/construction/p2-backend-menu-store/code/` 에 생성물 요약(markdown)

---

## 범위 밖 (P2 미구현)
- 주문/장바구니/세션 라이프사이클 로직, SSE 발행 (P1)
- JWT 발급·검증 실제 구현 (P1 계약 확정 후) — P2는 훅 지점/자리표시자만
- 모든 프론트엔드 (P3/P4)

## 완료 기준
- Step 1~12 모두 [x]
- `npm install && npm run migrate && npm run seed && npm start` 로 로컬 기동, `/health` 및 메뉴/매장 API 동작
- `npm test` 통과
- 공유 계약 문서 초안 리포에 반영
