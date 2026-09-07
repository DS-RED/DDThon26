# Code Generation Summary — p1-backend-orders-sessions

**Unit**: p1-backend-orders-sessions
**Role**: P1 (임시 진행 — 담당자 합류 지연으로 P2가 임시 구축)
**Generated**: 2026-09-07
**Approach**: Lean (Part 1 계획 → Part 2 구현)

## 생성/변경 아티팩트

### 인증 (신규)
| 파일 | 설명 |
|------|------|
| `server/src/auth/auth.tokens.js` | JWT sign(admin/table)/verify |
| `server/src/auth/password.js` | bcryptjs 해시/검증 |
| `server/src/auth/auth.service.js` | 관리자/테이블 로그인 + 인메모리 로그인 시도 제한 |
| `server/src/auth/auth.schema.js` | zod 로그인 스키마 |
| `server/src/auth/auth.controller.js`, `auth.routes.js` | `/api/auth/admin\|table/login` |

### 세션 (신규)
| 파일 | 설명 |
|------|------|
| `server/src/sessions/session.repository.js` | table_sessions CRUD |
| `server/src/sessions/session.service.js` | ensureActiveSession, closeTableSession(이력 이동) |

### 주문 (신규)
| 파일 | 설명 |
|------|------|
| `server/src/orders/orders.repository.js` | orders/order_items/order_history 데이터 접근 |
| `server/src/orders/orders.service.js` | 생성(스냅샷·총액), 목록/상세, 상태변경, 삭제, 이력 + SSE publish |
| `server/src/orders/orders.schema.js` | zod(주문 생성/상태) |
| `server/src/orders/orders.controller.js`, `orders.routes.js` | 주문/이력 라우트(table+admin) |

### 테이블 (신규)
| 파일 | 설명 |
|------|------|
| `server/src/tables/tables.repository.js` | tables 데이터 접근 |
| `server/src/tables/tables.service.js` | 초기 설정, 대시보드 요약, 세션 종료 위임 |
| `server/src/tables/tables.schema.js`, `tables.controller.js`, `tables.routes.js` | 테이블 라우트 + SSE `/events` |

### SSE (신규)
| 파일 | 설명 |
|------|------|
| `server/src/sse/sse.js` | 매장별 인메모리 fan-out, publish, eventsHandler(하트비트/재연결) |

### 변경
| 파일 | 변경 |
|------|------|
| `server/src/middleware/auth.js` | placeholder → 실제 requireAdmin/requireTable(JWT) |
| `server/src/config/index.js` | jwtSecret/jwtExpiresIn/bcryptRounds/login limit 추가 |
| `server/src/app.js` | auth/orders/tables 라우터 마운트 |
| `server/src/db/seed.js` | 실제 bcrypt 해시(admin `admin1234`, table `0000`), 테이블 3개 |
| `server/package.json`, `.env.example` | jsonwebtoken/bcryptjs, JWT/bcrypt/login env |
| `server/tests/menu.test.js`, `helpers.js` | 관리자 토큰 인증 반영, loginAdmin/loginTable |

### 테스트 (신규)
`server/tests/{auth,orders,sse}.test.js` — 로그인/권한, 주문 생명주기(생성→조회→상태→대시보드→세션종료→이력→삭제), SSE(구독/발행/교차매장 차단).

### 계약 문서
- `docs/contracts/api-auth-orders-sessions.md` (신규)
- `docs/contracts/shared-conventions.md` (인증/SSE 구현 반영)
- `server/README.md` (P1 섹션·데모 계정·env)

## 검증 상태 (실행 완료 ✅)
- Node 24.19.0 / npm 11.17.0
- `npm test` → **35/35 통과** (P2 13 + P1/갱신 22)
- 로컬 기동 end-to-end 스모크: admin/table 로그인 → 주문 생성(총액 12500 계산) → 대시보드 요약 → **SSE `order.created` 실시간 수신** → 세션 종료(movedOrders=2) → 이력 조회 정상

## 인수인계 메모 (P1 담당자)
- 임시 구현이며 리뷰/이관 대상. 로그인 시도 제한은 인메모리(단일 프로세스) — 다중 프로세스 배포 시 공유 저장소 필요.
- JWT_SECRET은 dev 폴백 사용 중 — 운영 시 반드시 환경변수 설정.
- 테이블 토큰 기반 고객 주문 흐름은 FR-C1/C4 기준 최소 구현. 자동 로그인 UX는 프론트(P3) 담당.
