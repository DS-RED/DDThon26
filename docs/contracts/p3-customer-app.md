# P3 슬라이스 계획 — 고객용 앱 (client-customer)

> 담당: **P3** · 폴더 소유권: `client-customer/` (shared-conventions.md §4)
> 목적: 팀 싱크용. P3가 무엇을 만들고, 어떤 공유 계약을 소비하며, 어떤 결정을 내렸는지 공유한다.
> 방식: 린(lean) — 인셉션 세부 단계는 스킵하고, 공유 계약을 소비해 Construction(코드 생성)으로 진행.

---

## 1. 범위 (요구사항 매핑)

| FR | 기능 | 착수 상태 | 의존 |
|----|------|-----------|------|
| FR-C1 | 테이블 자동 로그인/세션 | 🔴 대기 | **P1** (고객 인증 계약) |
| FR-C2 | 메뉴 조회/탐색 | 🟢 착수 가능 | P2 계약 (확정됨) |
| FR-C3 | 장바구니 (localStorage) | 🟢 착수 가능 | 없음 (P3 단독) |
| FR-C4 | 주문 생성 | 🔴 대기 | **P1** (`api-orders.md`) |
| FR-C5 | 현재 세션 주문 내역 | 🔴 대기 | **P1** (주문 조회 + 세션) |

> 범위 외(다른 담당): 실시간 SSE·관리자 화면(P4), 주문/세션/인증 백엔드 로직(P1).

## 2. 소비하는 공유 계약

- 공통 규약: `docs/contracts/shared-conventions.md`
- 매장/메뉴 API: `docs/contracts/api-menu-store.md`
- DB 스키마(참고): `docs/contracts/db-schema.md`, `server/src/db/schema.sql`
- 주문/인증 계약: **미존재** → `p3-requests-to-p1-orders-auth.md`로 요청 중

### 소비 규칙 (준수)
- Base URL: `http://localhost:3000`
- 모든 리소스 경로는 `/api/stores/:storeId/...` 중첩형
- 에러 응답: `{ "error": { "message": ..., "details": ... } }`
- 가격: 정수(KRW) — **원화 포맷팅은 프론트(P3) 책임**
- `is_available`, 기타 boolean 필드는 boolean으로 직렬화됨

## 3. 배치 A — 지금 착수 (블로커 없음): 메뉴 + 장바구니

### 소비 API (P2, 인증 불필요·공개)
- `GET /api/stores/:storeId/menu` → `[{ category, items }]` (미분류는 `category: null`)
- `GET /api/stores/:storeId/categories`
- `GET /api/stores/:storeId` (매장명 표시용)
- 데모 데이터: 매장 `demo-001`, 카테고리 커피/티/디저트, 메뉴 7개

### P3 결정 사항 (리뷰 요청)
- **품절 처리**: `is_available: false` 메뉴(시드의 "초코 브라우니")는 카드에 표시하되 **비활성(회색+담기 불가)** 로 렌더. (숨김 아님)
- **미분류**: `category: null` 그룹은 "기타" 섹션으로 최하단 표시.
- **원화 표기**: `4000` → `4,000원` 프론트 포맷.
- **장바구니 저장 키**: `localStorage["cart:{storeId}:{tableId}"]` (세션 전환 시 초기화는 배치 B에서 세션 연동 후 확정).
- **장바구니 항목 스냅샷**: `{ menu_item_id, name, unit_price, quantity }` 저장 → 주문 시 서버 스냅샷 규약(order_items)과 정합.

## 4. 배치 B — P1 계약 확정 후: 로그인 + 주문 + 내역

- 선행: `docs/contracts/api-orders.md` + 고객 인증 규약 (P1 작성) — 요청서 참조.
- 계약 확정 전에는 **mock 계약으로 화면 선개발**, 확정 시 실 API로 교체.
- schema.sql 초안 기준 예상 데이터 형태:
  - `orders.status`: `pending | preparing | completed`
  - `order_items`: `menu_name`, `unit_price`, `quantity` (주문 시점 스냅샷)
  - `table_sessions.status`: `active | closed`

## 5. 협업 규칙

- `client-customer/` **밖의 파일은 수정하지 않는다** (충돌 방지).
- 작은 PR·잦은 머지. 계약 변경 발견 시 즉시 팀 공유.
- P3 진행 상황은 `aidlc-docs/aidlc-state.md` / `audit.md`에 **append**(덮어쓰기 금지).

## 6. 열린 항목 (팀 확인 필요)

- [ ] 고객 인증/토큰 규약 — P1 (요청서 참조)
- [ ] `POST /api/.../orders` 요청·응답 스키마 — P1
- [ ] 현재 세션 주문 조회 + 세션 ID 획득 흐름 — P1
- [ ] 주문 성공 후 리다이렉트 대기 시간: **5초** 확정 여부 (MVP 범위 문서 기준)
- [ ] 주문 내역 UI: **단순 리스트/페이지네이션** 채택 (무한 스크롤 대신) — 이의 없으면 확정
