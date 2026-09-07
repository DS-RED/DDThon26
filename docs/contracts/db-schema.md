# DB 스키마 계약 — 초안 (P2 작성)

> 원본(SQL): [`server/src/db/schema.sql`](../../server/src/db/schema.sql)
> P2가 전체 스키마 초안을 작성했습니다. **P2 소유 테이블**은 P2가 구현/유지하고,
> **계약 전용(Contract-only) 테이블**은 구조만 합의하고 P1이 로직을 구현합니다.

## 소유권 요약
| 테이블 | 소유 | 비고 |
|--------|------|------|
| `stores` | **P2** | 매장 |
| `categories` | **P2** | 메뉴 분류 |
| `menu_items` | **P2** | 메뉴 |
| `admin_users` | P1 | 관리자 계정(bcrypt) |
| `tables` | P1 | 테이블 |
| `table_sessions` | P1 | 착석 세션 |
| `orders` | P1 | 주문 |
| `order_items` | P1 | 주문 항목(가격 스냅샷) |
| `order_history` | P1 | 완료 주문 이력(JSON 스냅샷) |

## P2 소유 테이블 상세

### stores
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK, AUTOINCREMENT |
| store_code | TEXT | NOT NULL, UNIQUE |
| name | TEXT | NOT NULL |
| created_at | TEXT | DEFAULT datetime('now') |

### categories
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| store_id | INTEGER | NOT NULL, FK→stores(id) ON DELETE CASCADE |
| name | TEXT | NOT NULL |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| created_at | TEXT | DEFAULT datetime('now') |

### menu_items
| 컬럼 | 타입 | 제약 |
|------|------|------|
| id | INTEGER | PK |
| store_id | INTEGER | NOT NULL, FK→stores(id) ON DELETE CASCADE |
| category_id | INTEGER | FK→categories(id) ON DELETE SET NULL (nullable) |
| name | TEXT | NOT NULL |
| price | INTEGER | NOT NULL, CHECK(price >= 0) |
| description | TEXT | nullable |
| image_url | TEXT | nullable (외부 URL) |
| display_order | INTEGER | NOT NULL DEFAULT 0 |
| is_available | INTEGER | NOT NULL DEFAULT 1, CHECK IN(0,1) |
| created_at | TEXT | DEFAULT datetime('now') |
| updated_at | TEXT | DEFAULT datetime('now') |

인덱스: `idx_categories_store(store_id)`, `idx_menu_store(store_id)`, `idx_menu_category(category_id)`.

## 계약 전용 테이블 (P1 확정 대상)
`admin_users`, `tables`, `table_sessions`, `orders`, `order_items`, `order_history`
구조는 `schema.sql`에 초안으로 정의되어 있습니다. 주문 흐름/상태 전이/이력 정책은 P1이 확정합니다.

## 마이그레이션 / 시드
- 마이그레이션: `npm run migrate` (`applySchema`, `IF NOT EXISTS`로 idempotent).
- 시드: `npm run seed` (데모 매장 `demo-001` 존재 시 no-op).
