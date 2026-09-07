# API 계약 — 인증 / 주문 / 세션 / SSE (P1 소유)

> Base URL: `http://localhost:3000`
> 에러 포맷은 [shared-conventions.md](./shared-conventions.md) 참고.
> **임시 진행 메모**: P1 담당자 합류 전, P2가 임시로 초안 구현했습니다. 합류 후 리뷰/이관 대상.

## 인증 (Auth)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/admin/login` | 관리자 로그인 → JWT |
| POST | `/api/auth/table/login` | 테이블(태블릿) 로그인 → JWT |

**관리자 로그인 요청/응답**
```json
// req
{ "storeCode": "demo-001", "username": "admin", "password": "admin1234" }
// res 200
{ "token": "<jwt>", "admin": { "id": 1, "storeId": 1, "username": "admin" } }
```
- 실패 시 401 `Invalid credentials` (어느 항목이 틀렸는지 노출 안 함).
- 로그인 시도 제한: 창(기본 15분) 내 실패 N회(기본 5) 초과 시 429.

**테이블 로그인 요청/응답**
```json
// req
{ "storeCode": "demo-001", "tableNumber": "1", "password": "0000" }
// res 200
{ "token": "<jwt>", "table": { "id": 1, "storeId": 1, "tableNumber": "1" } }
```

**JWT 규약**
- 헤더: `Authorization: Bearer <jwt>`
- 클레임: `sub`(id), `storeId`, `role`(`admin` | `table`), admin은 `username`, table은 `tableNumber`
- 만료: 16시간(FR-A1), `JWT_SECRET` 환경변수로 서명

## 주문 (Orders)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/stores/:storeId/orders` | table | 주문 생성(세션 자동 시작, 가격 스냅샷) → 201 |
| GET | `/api/stores/:storeId/orders/mine` | table | 내 테이블의 현재 세션 주문 |
| GET | `/api/stores/:storeId/orders?tableId=` | admin | 현재(활성 세션) 주문, 테이블 필터 |
| GET | `/api/stores/:storeId/orders/:orderId` | admin | 주문 상세 |
| PATCH | `/api/stores/:storeId/orders/:orderId/status` | admin | 상태 변경(pending/preparing/completed) |
| DELETE | `/api/stores/:storeId/orders/:orderId` | admin | 주문 삭제(직권) → 204 |

**주문 생성 요청/응답**
```json
// req  (토큰의 테이블/매장 사용, body는 항목만)
{ "items": [ { "menu_item_id": 1, "quantity": 2 }, { "menu_item_id": 2, "quantity": 1 } ] }
// res 201
{ "id": 1, "store_id": 1, "table_id": 1, "session_id": 1, "status": "pending",
  "total_amount": 12500, "created_at": "...",
  "items": [ { "id": 1, "menu_item_id": 1, "menu_name": "아메리카노", "unit_price": 4000, "quantity": 2 } ] }
```
- `unit_price`/`menu_name`은 **주문 시점 스냅샷**. `total_amount` = Σ(unit_price×quantity).
- 판매중지(is_available=false) 메뉴 주문 시 400.

## 테이블 / 세션 (Tables & Sessions)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/stores/:storeId/tables` | admin | 대시보드 요약(테이블별 활성세션/주문수/총액/최신 미리보기) |
| POST | `/api/stores/:storeId/tables` | admin | 테이블 초기 설정(번호+비밀번호) → 201 |
| POST | `/api/stores/:storeId/tables/:tableId/close` | admin | 세션 종료(이용 완료) → 주문 이력 이동 + 현재 리셋 |

**대시보드 요약 항목**
```json
{ "id": 1, "table_number": "1", "session_id": 1, "order_count": 1,
  "total_amount": 12500, "latest_orders": [ /* 최신 주문 DTO(최대 3) */ ] }
```

**세션 종료 응답**: `{ "sessionId": 1, "movedOrders": 2 }`
- 종료 시 해당 세션 주문을 `order_history`에 JSON 스냅샷으로 이동, 세션 status=closed.
- 이후 현재 주문 조회에서 제외 → 다음 고객은 0에서 시작.

## 주문 이력 (History)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/stores/:storeId/history?tableId=&date=` | admin | 과거 이력(완료 시각 역순), 테이블/날짜(YYYY-MM-DD) 필터 |

## 실시간 (SSE)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/stores/:storeId/events?token=<jwt>` | admin | `text/event-stream` 구독 |

- EventSource는 헤더 설정이 어려워 **`?token=` 쿼리** 또는 `Authorization: Bearer` 허용.
- 이벤트: `connected`(초기), `order.created`, `order.updated`, `order.deleted`, `session.closed`.
- 25초 주기 하트비트 주석(`: ping`), 클라이언트 재연결 힌트 `retry: 3000`.
- payload: order.* 는 주문 DTO(또는 삭제 시 `{id, table_id, session_id}`), session.closed 는 `{tableId, sessionId, movedOrders}`.
