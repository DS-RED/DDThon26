# 교차팀 열린 이슈 (Cross-team Open Issues)

> 슬라이스(P1~P4) 경계를 넘는 계약 불일치·블로커·합의 필요 항목을 **한 곳에서** 추적한다.
> 규칙: **append 방식**으로 추가하고, 상태를 갱신한다(덮어쓰기 금지). 해결 시 `상태`를 `해결됨`으로 바꾸고 해결 커밋/PR을 적는다.
> 슬라이스 내부에서만 끝나는 항목은 각 문서(예: [p1-owner-review.md](../../aidlc-docs/construction/p1-backend-orders-sessions/p1-owner-review.md)의 후속 항목, [p3-customer-app.md](./p3-customer-app.md) §6)에서 관리한다. 여기에는 **여러 담당자의 대응이 필요한 것**만 올린다.

| ID | 요약 | 관련 담당 | 심각도 | 상태 |
|----|------|-----------|--------|------|
| ISSUE-001 | 테이블 로그인 계약 불일치 (경로·응답 형태) | P1 ↔ P3 | 높음(P3 배치 B 블로커) | 🔴 미해결 |

---

## ISSUE-001 · 테이블 로그인 계약 불일치 (P1 ↔ P3)

- **등록일**: 2026-09-07 (P2가 통합 점검 중 발견해 등록)
- **관련 담당**: **P1**(인증 구현 소유), **P3**(고객 앱 소비자)
- **심각도**: 높음 — P3 배치 B(로그인/주문/내역)를 블록
- **상태**: 🔴 미해결 — P1·P3 합의 필요

### 무엇이 다른가
P3 요청서([p3-requests-to-p1-orders-auth.md](./p3-requests-to-p1-orders-auth.md))가 기대하는 테이블 로그인과, P1이 실제 구현·문서화한 계약([api-auth-orders-sessions.md](./api-auth-orders-sessions.md))이 다르다.

| 항목 | P3 요청 (기대) | P1 실제 (구현·문서) |
|------|----------------|----------------------|
| 경로 | `POST /api/stores/:storeId/tables/login` | `POST /api/auth/table/login` |
| 요청 본문 | (경로에 `:storeId`) | `{ storeCode, tableNumber, password }` |
| 응답 형태 | `{ token, store_id, table_id, ... }` (flat, snake_case) | `{ token, table: { id, storeId, tableNumber } }` (nested, camelCase) |

파생 차이 3가지:
1. **경로**: 중첩형(`/api/stores/:storeId/...`) vs 평탄형(`/api/auth/...`). 신규 고객은 숫자 `storeId`를 미리 알 수 없고 `storeCode`(예: `demo-001`)만 아는 상황이므로, **P1의 `storeCode` 기반 요청이 로그인 시점엔 더 적절**함(참고 의견).
2. **응답 키 네이밍**: `store_id`/`table_id`(snake) vs `storeId`/`tableNumber`(camel). P1 인증 응답은 camelCase, P2 메뉴 응답은 DB 컬럼명 그대로 snake(`category_id`, `is_available`) — 리포 전반의 네이밍 규약이 명시돼 있지 않음(→ shared-conventions에 규약화 검토 필요).
3. **응답 중첩**: flat vs `table: {...}` nested.

### 영향
- P3 `client-customer`의 로그인/세션 연동(배치 B)이 실 API와 맞지 않아, 현재 P3는 mock 계약으로 화면만 선개발한 상태([p3-customer-app.md](./p3-customer-app.md) §4).
- 합의 전까지 P3는 주문 생성·현재 세션 조회를 실제로 연결할 수 없음.

### 대응 요청 (담당자 액션)
- **P1**: 아래 중 택1 결정 후 [api-auth-orders-sessions.md](./api-auth-orders-sessions.md)를 단일 기준으로 확정.
  - (a) 현행 유지(`/api/auth/table/login`, nested camelCase) → P3가 소비 코드를 맞춤. **권장**(구현·문서·테스트 이미 존재).
  - (b) P3 요청 형태로 변경(경로/응답) → P1이 라우트·응답·테스트 수정.
- **P3**: P1 확정본에 맞춰 `client-customer/src/api/auth.js` 등 소비 코드 정렬. mock → 실 API 교체.
- **공통(P2 검토 가능)**: 응답 JSON 네이밍 규약(camel vs snake)을 [shared-conventions.md](./shared-conventions.md)에 명문화할지 논의.

### 참고: 이미 각 문서에서 관리 중인 관련 항목
- P1 인가/보안 후속(관리자 store-scope, 테이블 로그인 rate limit, JWT 프로덕션 시크릿): [p1-owner-review.md](../../aidlc-docs/construction/p1-backend-orders-sessions/p1-owner-review.md) 후속 항목 1~3.
- P3 열린 항목(주문 스키마, 세션 흐름 등): [p3-customer-app.md](./p3-customer-app.md) §6.
