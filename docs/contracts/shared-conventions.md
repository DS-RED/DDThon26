# 공유 규약 (Shared Conventions) — 초안 (P2 작성)

> 이 문서는 4인 협업(P1~P4)이 동일한 계약(contract) 위에서 병렬 개발하기 위한 초안입니다.
> P2가 초안을 작성했으며, 각 도메인 담당자가 리뷰 후 확정합니다.

## 1. 공통 원칙
- **백엔드**: Node.js + Express, ESM(`"type": "module"`), better-sqlite3, zod 검증.
- **가격**: 항상 정수(KRW), 소수점 없음.
- **시간**: SQLite `datetime('now')` (UTC, `YYYY-MM-DD HH:MM:SS`).
- **경로 규약**: `/api/stores/:storeId/...` 하위로 도메인 리소스를 중첩.

## 2. 에러 응답 포맷
모든 에러는 아래 JSON 구조로 반환한다.
```json
{ "error": { "message": "사람이 읽을 수 있는 메시지", "details": <선택: 검증 이슈 등> } }
```
| 상태 | 의미 |
|------|------|
| 400 | 잘못된 요청 / 검증 실패 (`details`에 zod issues) |
| 401 | 인증 필요 (관리자 엔드포인트) — P1 구현 |
| 404 | 리소스 없음 |
| 409 | 충돌 |
| 500 | 서버 내부 오류 |

## 3. 인증 (P1 소유)
- 관리자 전용 엔드포인트(메뉴/분류/매장/주문 관리)는 `Authorization: Bearer <JWT>` 필요.
- P2 슬라이스는 `requireAdmin` **placeholder**(통과 스텁)를 사용 중.
  - `server/src/middleware/auth.js` — P1이 실제 JWT 검증으로 교체(`TODO(P1)`).
- 인증 성공 시 `req.admin = { id, storeId }` 를 채운다(합의).

## 4. 폴더 소유권
| 경로 | 담당 |
|------|------|
| `server/src/orders/`, SSE | P1 |
| `server/src/menu/`, `server/src/store/`, `server/src/db/` | P2 |
| `client-customer/` | P3 |
| `client-admin/` | P4 |
| `server/src/config`, `middleware`, `utils`, `app.js`, `server.js` | P2 초안 → 공동 |

## 5. SSE 이벤트 (P1 소유, 참고용 플레이스홀더)
- 엔드포인트(안): `GET /api/stores/:storeId/events` (text/event-stream).
- 이벤트 타입(안): `order.created`, `order.updated`, `session.updated`.
- 상세 스키마는 P1이 `docs/contracts/sse-events.md`로 확정.
