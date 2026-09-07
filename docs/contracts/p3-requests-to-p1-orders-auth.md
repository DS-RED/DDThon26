# 계약 요청 — 주문/인증 (P3 → P1)

> 보내는 이: **P3** (고객용 앱, client-customer) · 받는 이: **P1** (주문/세션/인증 + SSE)
> 목적: 고객 앱(FR-C1/C4/C5)이 막혀 있음. P1이 아래를 `docs/contracts/api-orders.md` (+ 인증 규약)로 확정해 주면 P3가 착수 가능.
> 아래 **제안(Proposal)** 은 P3가 필요로 하는 형태의 초안이며, 최종 확정은 P1 소유.

---

## 1. 고객 태블릿 인증 (FR-C1) — 🔴 블로커

현재 `shared-conventions.md`의 JWT는 **관리자용**만 정의됨. 고객 태블릿 인증 규약이 없음.

**확인 필요**
1. 고객 앱이 API 호출 시 인증이 필요한가? (메뉴 조회는 공개지만, **주문 생성/내역 조회**는?)
2. 로컬 저장 대상은 **자격증명**(store_code + table_number + table password)인가, **발급 토큰**인가?
3. 자동 로그인은 저장 자격증명으로 매번 재인증인가, 저장 토큰 재사용인가?

**P3 제안 (초안)**
```
POST /api/stores/:storeId/tables/login
  body: { "table_number": "1", "password": "..." }
  200 : { "token": "<JWT>", "store_id": 1, "table_id": 5,
          "session_id": 12 | null }     // 현재 active 세션 (없으면 null)
```
- 이후 고객 요청은 `Authorization: Bearer <token>` 사용 (관리자와 동일 헤더 규약).
- 앱은 최초 1회 로그인 후 `token`(또는 자격증명)을 localStorage 저장 → 자동 로그인.

## 2. 주문 생성 (FR-C4) — 🔴 블로커

**확인 필요**
- 엔드포인트 경로, 요청/응답 스키마, `session_id` 자동 발급 여부(첫 주문 시 세션 생성?).

**P3 제안 (초안)**
```
POST /api/stores/:storeId/orders
  auth: Bearer <고객 token>
  body: {
    "table_id": 5,
    "items": [ { "menu_item_id": 1, "quantity": 2 } ]   // 단가·이름은 서버가 스냅샷
  }
  201 : {
    "order_id": 101,
    "order_number": "A-101",     // 화면 표시용 (형식 P1 확정)
    "session_id": 12,            // 첫 주문이면 서버가 새 세션 생성 후 반환
    "status": "pending",
    "total_amount": 8000,
    "created_at": "..."
  }
```
- 실패 시 `shared-conventions.md` 에러 포맷 준수 → P3는 카트 유지 + 에러 메시지 표시.
- 가격/이름은 **서버가 스냅샷**(order_items 규약)으로 확정 — 클라이언트 값 신뢰 안 함.

## 3. 현재 세션 주문 내역 (FR-C5) — 🔴 블로커

**확인 필요**
- 주문 전 세션 ID를 클라이언트가 아는가? (로그인 응답의 `session_id`로 충분한가?)
- 필터링(현재 세션만)은 **서버**가 하는가, 클라이언트가 `session_id`로 거르는가?

**P3 제안 (초안)**
```
GET /api/stores/:storeId/tables/:tableId/orders?session=current
  auth: Bearer <고객 token>
  200 : [ {
    "order_id": 101, "order_number": "A-101",
    "status": "pending|preparing|completed",
    "created_at": "...", "total_amount": 8000,
    "items": [ { "menu_name": "아메리카노", "unit_price": 4000, "quantity": 2 } ]
  } ]        // 현재 active 세션 주문만, 시간순
```
- `session=current` 로 서버가 현재 active 세션만 반환하는 방식을 선호(클라 세션 관리 부담↓).
- 고객 화면 상태 실시간성: 요구사항상 "선택사항" + SSE는 관리자 전용(Q5) → **고객 내역은 재조회(새로고침) 기반 정적**으로 처리 예정. 이의 있으면 알려주세요.

## 4. 요약 — P1에게 필요한 것

- [ ] `docs/contracts/api-orders.md` 작성 (위 3개 엔드포인트 확정)
- [ ] 고객 인증 규약을 `shared-conventions.md` §3에 추가 (관리자와 별개)
- [ ] `session_id` 발급/조회 흐름 명확화 (로그인 응답 포함 여부)
- [ ] `order_number` 표시 형식 확정
