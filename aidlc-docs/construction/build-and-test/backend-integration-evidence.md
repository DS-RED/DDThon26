# 백엔드 교차 슬라이스 통합 테스트 증적 (P1 + P2)

- **일자**: 2026-09-07
- **작성**: P2 (백엔드 · 메뉴/매장 + 데이터·공통 인프라)
- **범위**: P1(인증/주문/세션/SSE) + P2(메뉴/매장) **서버 레벨 end-to-end**
- **결과**: **PASS — 44/44** (신규 통합 3건 포함)

> 이 문서는 서버 백엔드의 교차 슬라이스 통합 검증 증적입니다.
> P3 브라우저 E2E(Playwright)는 [build-and-test-summary.md](./build-and-test-summary.md)에서 별도 관리하며(현 환경 BLOCKED), 여기 결과와 합산하지 않습니다.

## 무엇을 검증했나

신규 테스트: [`server/tests/integration.test.js`](../../../server/tests/integration.test.js).

기존 per-slice 스위트(auth/orders/menu/store/sse)는 supertest로 개별 라우트를 검증하지만, SSE는 mock req/res로만 확인했습니다. 이 통합 테스트는 **실제 HTTP 서버를 띄우고(`http.createServer(app).listen(0)`) 관리자 대시보드가 SSE를 소켓으로 실시간 수신**하는 것을 검증합니다. supertest 요청과 SSE 라이브 연결이 동일한 app 모듈 인스턴스(= 동일 인메모리 DB + 동일 SSE 구독 레지스트리)를 공유하므로, supertest로 만든 주문이 스트리밍 리스너까지 실제로 전달됩니다.

검증 흐름(단일 시나리오, `full lifecycle propagates over SSE and lands in history`):

1. **테이블 로그인** (P1 auth) → 테이블 토큰 발급
2. **고객 메뉴 조회** `GET /menu?available=true` (P2 menu) → 품절 항목 숨김 확인
3. **관리자 SSE 구독** `GET /events` (P1 sse) → `connected` 수신, storeId 일치
4. **주문 생성** `POST /orders` (P1 orders) → 관리자 `order.created` 라이브 수신, `order.id` 일치
   - **가격 스냅샷**: P2 메뉴 단가가 P1 주문 `total_amount`로 흘러들어감(`price*qty` 합) 검증
5. **상태 변경** `PATCH /orders/:id/status` → `order.updated` 라이브 수신(`status: preparing`)
6. **세션 종료** `POST /tables/:id/close` → `session.closed` 라이브 수신, `movedOrders>=1`
7. **정합성**: 현재 주문 0건, 이력(`/history`) 1건 이상

추가 통합 케이스 2건:

- **SSE 관리자 전용**: 테이블 토큰으로 `/events` 구독 시 401 거절
- **교차 매장 가드**: 이 매장 관리자 토큰으로 다른 매장 리소스 변경 시도 → 403/404 차단

## 실행 환경 / 명령

```
Node v24.19.0
DB: :memory: (better-sqlite3, NODE_ENV=test)
JWT_SECRET=test-secret (테스트 전용)

$ cd server && node --test
```

- 인메모리 DB·테스트 시드 사용, 사용자/실 DB 및 서버 소스 무변경.
- SSE `waitFor(event, timeout=2s)`로 이벤트 수신을 확정(타임아웃 시 실패).
- `after` 훅에서 SSE 구독 `_reset()` + 서버 close + DB close로 핸들 정리.

## 결과 (전체 트리)

```
▶ auth routes ................................................. 6/6  ✔
▶ E2E: customer order → admin live dashboard (P1 + P2) ........ 3/3  ✔
    ✔ full lifecycle propagates over SSE and lands in history
    ✔ SSE stream rejects a table token (admin-only dashboard)
    ✔ cross-store guard: admin of this store cannot mutate another store
▶ menu routes ................................................ 14/14 ✔
▶ orders lifecycle .......................................... 10/10 ✔
▶ table management ........................................... 2/2  ✔
▶ sse publisher .............................................. 3/3  ✔
▶ store routes ............................................... 6/6  ✔

ℹ tests 44
ℹ suites 7
ℹ pass 44
ℹ fail 0
ℹ duration_ms ~1300
```

## 범위 밖 / 열린 항목

- 브라우저 기반 고객·관리자 E2E(Playwright)는 P3/P4 소유이며 현 환경에서 시스템 라이브러리 누락으로 BLOCKED — [build-and-test-summary.md](./build-and-test-summary.md) 참조.
- 이 통합 테스트는 단일 프로세스·인메모리 검증입니다. 다중 프로세스 SSE 팬아웃(수평 확장)은 데모 범위 밖(요구사항: 단일 매장·단일 프로세스).
- P1↔P3 테이블 로그인 계약 불일치([open-issues.md](../../../docs/contracts/open-issues.md) ISSUE-001)는 미해결 — 본 테스트는 P1 실제 계약(`/api/auth/table/login`)을 기준으로 검증합니다.
