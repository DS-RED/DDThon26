# 테이블오더 서비스 (Table Order)

매장 테이블에서 QR/태블릿으로 메뉴를 보고 주문하면, 관리자 대시보드에 실시간(SSE)으로 반영되는 데모용 테이블오더 서비스입니다.

- **프론트엔드**: React SPA (Vite) — 고객용 / 관리자용
- **백엔드**: Node.js (Express, ESM) + SQLite(better-sqlite3)
- **실시간**: Server-Sent Events (SSE)
- **인증**: JWT + bcrypt
- 로컬 개발/데모 환경 기준(단일 매장, 수십 개 테이블 규모)

## 담당(슬라이스) 구성 — 4인 협업

| 파트 | 범위 | 위치 |
|------|------|------|
| **P1** | 인증 / 주문 / 세션 / SSE | `server/src/{auth,orders,sessions,tables,sse}` |
| **P2** | 매장·메뉴 도메인 + 데이터·공통 인프라 | `server/src/{store,menu,db,config,middleware,utils}`, `app.js` |
| **P3** | 고객용 SPA | `client-customer/` (예정) |
| **P4** | 관리자용 SPA | `client-admin/` (구현됨) |

> P1 슬라이스는 P2가 임시 구현 후 **P1 담당자가 리뷰/이관 완료**(조건부 승인, SSE JWT 헤더 전용 보안 수정 포함). 자세한 소유권은 [docs/contracts/shared-conventions.md](docs/contracts/shared-conventions.md) 참고.

## 빠른 시작

```bash
# 1) 백엔드 의존성 설치 + 스키마 생성 + 데모 데이터 시드 (한 번에)
npm run setup

# 2) 서버 실행 → http://localhost:3000
npm run server        # 또는 개발 모드: npm run server:dev

# 3) 테스트
npm test
```

루트에서 실행하는 스크립트는 모두 `server/`로 위임합니다. `server/`에서 직접 `npm ...` 을 실행해도 됩니다.

| 루트 스크립트 | 동작 |
|---------------|------|
| `npm run setup` | 서버 의존성 설치 + `migrate` + `seed` |
| `npm run migrate` | 스키마 생성 |
| `npm run seed` | 데모 데이터 시드(idempotent) |
| `npm run server` | 서버 시작 |
| `npm run server:dev` | 파일 변경 시 자동 재시작 |
| `npm test` | 서버 테스트 실행 |
| `npm run admin:install` | 관리자 SPA(client-admin) 의존성 설치 |
| `npm run admin:dev` | 관리자 SPA 개발 서버(vite) |
| `npm run admin:build` | 관리자 SPA 프로덕션 빌드 |

관리자 화면 실행 예: `npm run server:dev` (백엔드) + 별도 터미널에서 `npm run admin:install && npm run admin:dev`.

> 고객용 SPA(`client-customer/`)는 P3 합류 시 추가되며, 그때 루트 스크립트에 `customer:*` 항목을 덧붙일 예정입니다.

## 환경 변수 (.env)

서버는 시작 시 `server/.env` 를 자동으로 로드합니다(`dotenv`). 값은 셸/CI 환경 변수가 우선하며, 테스트(`NODE_ENV=test`)에서는 `.env` 를 무시합니다.

`server/.env.example` 을 복사해 사용하세요:

```bash
cp server/.env.example server/.env
```

주요 변수: `PORT`, `DB_PATH`, `CORS_ORIGINS`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`. 전체 목록과 설명은 [server/README.md](server/README.md#환경-변수) 참고.

## 데모 계정 (seed)

- 관리자: storeCode `demo-001`, username `admin`, password `admin1234`
- 테이블: storeCode `demo-001`, tableNumber `1`~`3`, password `0000`

## API 계약 문서

- 매장/메뉴 (P2): [docs/contracts/api-menu-store.md](docs/contracts/api-menu-store.md)
- 인증/주문/세션/SSE (P1): [docs/contracts/api-auth-orders-sessions.md](docs/contracts/api-auth-orders-sessions.md)
- 공유 규약: [docs/contracts/shared-conventions.md](docs/contracts/shared-conventions.md)
- DB 스키마: [docs/contracts/db-schema.md](docs/contracts/db-schema.md)

## 디렉터리

```
DDThon26/
├── server/            백엔드 (Express + SQLite)
├── client-customer/   고객용 SPA (P3, 예정)
├── client-admin/      관리자용 SPA (P4)
├── docs/contracts/    API/DB 계약 문서
└── aidlc-docs/        AI-DLC 워크플로 산출물(문서 전용)
```
