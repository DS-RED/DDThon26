# API 계약 — 매장/메뉴 도메인 (P2 소유)

> Base URL: `http://localhost:3000`
> 에러 포맷은 [shared-conventions.md](./shared-conventions.md) 참고.

## 인증
아래 표에서 **admin** 으로 표시된 엔드포인트는 `Authorization: Bearer <JWT>` 헤더가 필요하다.
- 토큰은 `POST /api/auth/admin/login` 으로 발급받는다(상세: [api-auth-orders-sessions.md](./api-auth-orders-sessions.md)).
- `server/src/middleware/auth.js` 의 `requireAdmin` 이 **실제 JWT 검증**을 수행한다(과거 P2 placeholder는 P1 구현으로 대체 완료). 성공 시 `req.admin = { id, storeId, username }`.
- 헤더 누락/형식 오류/만료 → **401**.
- 표에서 인증이 `-` 인 조회 엔드포인트(매장/분류/메뉴 GET)는 토큰 없이 호출 가능(고객 화면용).
- ⚠️ **알려진 갭**: 현재 메뉴/분류 관리 엔드포인트는 토큰의 `storeId` 와 경로 `:storeId` 의 일치를 **강제하지 않는다**. 즉 매장 A 관리자 토큰으로 매장 B 메뉴를 변경할 수 있다(주문 도메인은 `assertStoreScope` 로 이미 방지). 단일 매장 데모에서는 무해하나, 다중 매장 시 store-scope 검증 추가 필요. 추후 개선 항목.

## Health
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | `{ "status": "ok" }` |

## 매장 (Stores)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/stores` | - | 매장 목록 |
| GET | `/api/stores/:storeId` | - | 매장 단건 (404 없음) |

**Store 객체**
```json
{ "id": 1, "store_code": "demo-001", "name": "데모 카페", "created_at": "2026-09-07 02:41:38" }
```

## 분류 (Categories)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/stores/:storeId/categories` | - | 분류 목록 |
| POST | `/api/stores/:storeId/categories` | admin | 분류 생성 → 201 |
| PUT | `/api/stores/:storeId/categories/:categoryId` | admin | 수정 |
| DELETE | `/api/stores/:storeId/categories/:categoryId` | admin | 삭제 → 204 |

**요청 본문 (생성)**: `{ "name": "커피", "display_order": 0 }`

## 메뉴 (Menu items)
| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| GET | `/api/stores/:storeId/menu` | - | 분류별 그룹 목록. `?available=true`면 고객용 뷰(품절 메뉴 제외 + 빈 분류 숨김) |
| POST | `/api/stores/:storeId/menu` | admin | 메뉴 생성 → 201 |
| PATCH | `/api/stores/:storeId/menu/reorder` | admin | 표시 순서 일괄 변경(트랜잭션) |
| GET | `/api/stores/:storeId/menu/:itemId` | - | 메뉴 단건 |
| PUT | `/api/stores/:storeId/menu/:itemId` | admin | 부분 수정 |
| DELETE | `/api/stores/:storeId/menu/:itemId` | admin | 삭제 → 204 |

> ⚠️ 라우팅 주의: `/menu/reorder`는 반드시 `/menu/:itemId` **앞에** 정의.

**GET /menu 응답 (분류별 그룹)**
```json
[
  { "category": { "id": 1, "name": "커피", "display_order": 0 },
    "items": [ { "id": 1, "category_id": 1, "name": "아메리카노", "price": 4000,
                 "description": "...", "image_url": "https://...",
                 "display_order": 0, "is_available": true,
                 "created_at": "...", "updated_at": "..." } ] },
  { "category": null, "items": [ /* 미분류 메뉴 */ ] }
]
```
`is_available`은 항상 **boolean**으로 직렬화된다(DB는 0/1).

`?available=true`(고객 메뉴 화면용): `is_available === false`인 메뉴는 제외되고, 해당 분류에 노출 가능한 메뉴가 하나도 없으면 그 분류 그룹도 응답에서 빠진다. 관리자 화면은 파라미터 없이 호출해 품절 메뉴까지 모두 받는다.

**메뉴 생성/수정 본문**
```json
{ "category_id": 1, "name": "아메리카노", "price": 4000,
  "description": "설명", "image_url": "https://example.com/a.jpg",
  "display_order": 0, "is_available": true }
```
- `name`: 1–100자 필수
- `price`: 정수 0–100,000,000
- `category_id`: nullable, 해당 매장 소유가 아니면 400
- PUT은 부분 수정(최소 1개 필드).

**PATCH /menu/reorder 본문**
```json
{ "items": [ { "id": 1, "display_order": 10 }, { "id": 2, "display_order": 20 } ] }
```
매장에 없는 id 포함 시 400. 응답은 갱신된 전체 메뉴 목록(flat).
