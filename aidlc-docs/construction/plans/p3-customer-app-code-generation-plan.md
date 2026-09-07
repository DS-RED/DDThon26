# P3 고객 앱 — 코드 생성 계획

단위: `p3-customer-app` · 상태: **APPROVED — 2026-09-07, 구현 진행 중** · 기준: `a7cf83a`

관련 문서: [실행 계획](../../inception/plans/execution-plan.md), [설계·스토리·인수 조건](../p3-customer-app/design.md).

## 범위 및 선행조건

- 소유: `client-customer/`. React/Vite 고객 앱, FR-C1~C5. 백엔드·관리자 앱·DB 변경은 포함하지 않는다.
- P1 실제 인증/주문 API, P2 메뉴/매장 API와 CORS를 소비한다. 계약은 `docs/contracts/api-auth-orders-sessions.md`, `api-menu-store.md`, `shared-conventions.md`다.
- P1 착석 세션 조회 계약은 미확정이다. 해당 연동은 Step 8의 게이트이며 나머지 구현/검증은 독립 진행할 수 있다.
- 이 계획 및 설계 승인 후 아래 순서로 구현한다. 구현 체크박스는 실제 파일과 동작이 존재할 때만 완료 처리한다.
- 기존 미추적 P3 계약 초안 2개는 보존한다. 그 안의 제안 URL/없는 필드는 사용하지 않는다.

## 실행 단계

- [x] **Step 1 — 앱 기반**: `client-customer/package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `.gitignore`, `.env.example`, `src/main.jsx`, `src/App.jsx`, `src/styles.css`. React SPA, 개발 서버, build/test 스크립트, 화면 탐색, 공통 레이아웃 구성. 버전 호환성 및 기존 설치 환경 확인.
- [x] **Step 2 — API·저장·표시 공통층**: `src/api/client.js`, `auth.js`, `menu.js`, `orders.js`, `src/storage/customer-storage.js`, `src/utils/format.js`. fetch 오류 분류·요청 취소·타임아웃, 실제 계약 DTO, 원화/UTC 변환. `tests/storage.test.js`, `format.test.js`로 손상 저장값·시간 검증. CUS-01~05 공통.
- [x] **Step 3 — 설정·자동 로그인**: `src/auth/AuthProvider.jsx`, `src/pages/SetupPage.jsx`. 최초 성공 정보 저장, 기동 복원, 재인증 단일화, 실패 복구, table/store 변경 시 캐시 격리. `tests/auth.test.jsx`. CUS-01.
- [x] **Step 4 — 메뉴·카테고리**: `src/pages/MenuPage.jsx`, `src/components/MenuCard.jsx`, `CategoryNav.jsx`, `MenuDetailDialog.jsx`. 전체 메뉴 API, 품절 표시/담기 차단, 기타 분류, 빈 상태/로딩/에러, 이미지 대체 및 접근성. `tests/menu.test.jsx`. CUS-02.
- [x] **Step 5 — 장바구니**: `src/cart/cart-reducer.js`, `CartProvider.jsx`, `src/pages/CartPage.jsx`. 수량/삭제/합계/전체 비우기/저장·복원, 매장·테이블 격리. `tests/cart.test.js`, `cart-page.test.jsx`. CUS-03.
- [x] **Step 6 — 주문 확인·제출·성공**: `src/checkout/useCheckout.js`, `src/components/OrderConfirmDialog.jsx`, `src/pages/OrderSuccessPage.jsx`. 최신 메뉴 검증, 변경 가격 재확인, 단일 제출, 성공 응답 ID/금액 및 카트 비우기, 5초 복귀. 오류/응답 불명 시 카트 유지 및 재전송 차단. `tests/checkout.test.jsx`. CUS-04.
- [x] **Step 7 — 현재 주문 내역**: `src/pages/OrdersPage.jsx`, `src/components/OrderCard.jsx`. `/mine` 응답의 items, 최신순, 한글 상태, 10건 페이지네이션, 재진입/포커스/수동 갱신. 새 응답으로 교체하고 오래된 캐시를 누적하지 않음. `tests/orders.test.jsx`. CUS-05.
- [ ] **Step 8 — 착석 세션 전환**: P1의 현재 세션 식별 계약 확정 후 `src/session/useTableSession.js` 및 API 어댑터에 반영. 빈 주문 배열로 종료를 추정하지 않음. 세션 변경 시 카트·내역 초기화, 최초 주문 전환 보존, 요청 경합 검토. `tests/session.test.jsx`. 계약 미확정 시 이 단계는 미완료 상태로 두고 독립 검증을 진행. CUS-01/03/05.
- [ ] **Step 9 — 브라우저 통합·빌드 검증**: `playwright.config.js`, `e2e/customer-flow.spec.js`, 테스트 전용 서버/DB 픽스처. 실제 API로 로그인→메뉴→카트 복원→주문→내역, 거절/응답 유실/토큰 만료/세션 종료 검증. `npm ci`, `npm run build`, `npm test`, `npm run test:e2e` 실행. P3 동작에 필요한 테스트만 생성. CUS-01~05.
- [x] **Step 10 — 실행 안내·검증 기록**: `client-customer/README.md`, `aidlc-docs/construction/p3-customer-app/code/summary.md`, `aidlc-docs/construction/build-and-test/{build-instructions,unit-test-instructions,integration-test-instructions,e2e-test-instructions,build-and-test-summary}.md`. 실행 버전/명령/성공·실패·미실행을 기록하고 팀별 상태 및 감사 로그 갱신. 모든 인수 조건 확인 후 P3 검증 완료 제시.

## 완료 기준

- [ ] CUS-01~05 인수 조건 통과 및 실제 검증 증거 기록
- [ ] Step 8 미확정 계약 해결 또는 명시적 범위 조정 승인 기록
- [ ] 백엔드와 고객 브라우저 연동 확인. 목 테스트를 실제 API 통합으로 표기하지 않음
- [ ] 브라우저 화면에서 터치 영역·포커스·빈 상태·오류 상태 확인
- [ ] P4 미구현이면 전체 고객/관리자 브라우저 E2E 미실행을 별도 명시

## 계획 검토

위 실행 계획의 통합 문서 방식, 설계 기본값(품절 카드 표시, 10건 페이지네이션, 로컬 데모 자동 로그인 저장 정책) 및 Step 1~10의 구현 순서를 승인하면 코드 생성을 시작한다. 세션 계약 미확정은 구현 가능한 단계와 분리하되 최종 완료 조건에서 제외하지 않는다.

계획 승인 기록: 2026-09-07 사용자 “그래”. P3만 구현한다는 후속 범위 확인을 적용한다. Step 8은 기존 계획대로 P1 계약 의존사항이다.

## 구현 중 기록

- Step 1~7 앱 코드 구현. 테스트는 순수 로직 `storage.test.js`, `format.test.js`, `cart.test.js`와 공유 앱 픽스처를 사용하는 `app.test.jsx`에 통합했다. 계획의 auth/menu/cart-page/checkout/orders 개별 테스트 파일은 중복 픽스처를 줄이기 위해 이 파일로 묶었다. 기능/인수 조건 범위는 유지한다.
- Step 8: P1 계약 미확정으로 미구현. 존재하지 않는 세션 URL을 호출하거나 P1 서버를 수정하지 않았다.
- 초기 검증: P3 25개 테스트 및 production build 통과. API 응답 상태 검증 보강 후 재검증 예정.

## 게시 시 검증 상태

- Step 9: npm ci, 25개 테스트, build 통과. Playwright 브라우저 시작은 libnspr4.so 누락으로 차단되어 미완료.
- Step 10: README/코드 요약/검증 문서 작성 완료. 전체 인수 완료 발표는 Step 8 및 Step 9 해결 전까지 보류한다.
- 2026-09-07 사용자 “커밋하고 푸쉬해줘”에 따라 이 미완료 상태를 명시한 P3 구현을 작업 브랜치에 커밋/푸시한다.
