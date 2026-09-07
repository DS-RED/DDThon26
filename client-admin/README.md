# client-admin (P4: 관리자 프론트엔드)

4인 병렬 개발(`docs/team-role-division.md`)의 **P4** — 관리자용 React SPA.

- 매장 로그인
- **실시간 모니터링 대시보드** (SSE 구독: P1이 발행하는 주문 이벤트를 실시간 반영)
- 테이블 관리 (초기 설정 · 세션 종료 · 과거 주문 내역)
- 주문 관리 (상태 변경 · 직권 삭제)
- 메뉴 관리 (분류/메뉴 CRUD · 판매중지 토글)

## 스택
React 18 + React Router 6 + Vite. 상태는 Context + hooks (외부 상태 라이브러리 없음).

## 실행

먼저 백엔드(P1/P2)가 `http://localhost:3000`에서 실행 중이어야 합니다.
```bash
cd server && npm install && npm run seed && npm start   # (별도 터미널)
```

관리자 프론트:
```bash
cd client-admin
npm install
npm run dev            # http://localhost:5174
```
Vite dev 서버가 `/api`·`/health`를 백엔드(3000)로 프록시하므로 CORS 설정이 필요 없습니다.
백엔드 origin이 다르면 `VITE_BACKEND_ORIGIN`로 지정하세요(`.env.example` 참고).

데모 로그인: 매장코드 `demo-001` / 아이디 `admin` / 비밀번호 `admin1234`.

## 연동 계약 (P1/P2)
- 인증: `POST /api/auth/admin/login` → `{ token, admin:{ id, storeId, username } }`. 이후 `Authorization: Bearer <token>`. 로그인 응답의 `admin.storeId`를 이후 모든 `/api/stores/:storeId/...` 호출에 사용.
- 모니터링: `GET /api/stores/:storeId/tables` (테이블별 요약), `GET .../orders?tableId=`, `PATCH .../orders/:id/status`, `DELETE .../orders/:id`, `POST .../tables/:id/close`, `GET .../history`.
- 메뉴/분류: `GET/POST/PUT/DELETE .../menu`, `.../categories`.
- **SSE**: `GET /api/stores/:storeId/events` — `connected`, `order.created`, `order.updated`, `order.deleted`, `session.closed`. 인증은 `Authorization: Bearer` **헤더**로만(토큰을 URL에 싣지 않음). 표준 `EventSource`가 헤더를 못 실으므로 `fetch` + `ReadableStream`으로 스트림을 직접 읽어 헤더를 설정하고 자동 재연결한다(`useOrderStream`). 이벤트 수신 시 대시보드 요약/상세를 재조회해 화면을 갱신.

계약 원본: `docs/contracts/api-auth-orders-sessions.md`, `docs/contracts/api-menu-store.md`, `docs/contracts/shared-conventions.md`.

## 구조
```
src/
  api/           client.js(fetch 래퍼·토큰·401 처리), endpoints.js(도메인 API)
  auth/          AuthContext.jsx(로그인/로그아웃·localStorage), ProtectedRoute.jsx
  hooks/         useOrderStream.js(SSE 구독)
  components/    Layout.jsx(네비/로그아웃), Toast.jsx
  pages/         LoginPage · DashboardPage(모니터링) · TablesPage(테이블·이력) · MenuPage(메뉴)
  lib/format.js  통화/시간 표시
```

## 참고
- 401 응답 시 자동 로그아웃(토큰 만료·무효). JWT 만료 16시간.
- 가격은 정수(KRW) 계약. 시간은 백엔드 UTC 문자열을 로컬 시각으로 표시.
