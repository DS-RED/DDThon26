# P1 소유자 리뷰 / 이관 승인 (인증 · 주문 · 세션 · SSE)

- **리뷰어**: P1 담당자 (이관받음)
- **대상 커밋**: `332f4b0 feat(server): P1 backend slice (temp)` — P2가 임시 구축
- **일자**: 2026-09-07
- **검증**: `node --test` **35/35 통과** (로컬 디스크에서 재현 확인). SMB/UNC 공유에서는 `better-sqlite3` 네이티브 빌드 실패 → 코드 결함 아님, 환경 이슈.

## 판정: **조건부 승인 (Accept with follow-ups)**
구조·기능·계약 모두 요구사항을 충족. 아래 후속 항목만 정리하면 P1 정식 소유로 이관 완료.

## 잘 된 점
- 계층형 아키텍처(controller/service/repository/schema)가 P2와 일관.
- 인증: JWT 16h(FR-A1), bcrypt, 관리자 로그인 시도 제한(429), 실패 시 항목 비노출 401.
- 세션 라이프사이클: 첫 주문 시 자동 시작 → 종료 시 `order_history`로 스냅샷 이동(팀 역할분담의 "이력 이동" 문구와 일치) + 현재 리셋.
- 주문: 생성 시 메뉴명/단가 스냅샷 + 총액 계산, 판매중지 메뉴 400, 상태 검증, 트랜잭션 처리.
- SSE: 25초 하트비트 `unref`, 연결 종료 정리, `retry` 힌트. (인증 방식은 후속 항목 6 참고 — 헤더 전용으로 변경 완료.)

## 후속 항목 (심각도순)

### 1. [중 · 인가] 관리자 엔드포인트에 매장 스코프 검증 누락
`assertStoreScope`가 **테이블 엔드포인트(createOrder/listMine)에만** 걸려 있고, 관리자 엔드포인트에는 없음. `requireAdmin`도 `req.admin.storeId`와 URL `:storeId`를 비교하지 않음.
→ 매장 A 관리자 토큰으로 `/api/stores/B/orders`, `/history`, `/tables`, `.../close` 등 **타 매장 데이터 조회·변경 가능**.
- 영향: 단일 매장 MVP에서는 낮음. 다중 매장 계약에서는 인가 취약점.
- 대상: `orders.controller`(listCurrent/getOrder/updateStatus/deleteOrder/listHistory), `tables.controller`(listTables/createTable/closeSession).
- 권장 수정: `assertStoreScope(req, req.admin)`를 관리자 컨트롤러에도 적용하거나, `requireAdmin`에서 `payload.storeId === params.storeId` 강제.

### 2. [하 · 보안] 테이블 로그인에 시도 제한 없음
관리자 로그인만 429 제한. 테이블 비밀번호(0000) 브루트포스 가능. → 동일 리미터를 `tableLogin`에도 적용 권장.

### 3. [하 · 배포] JWT 시크릿 개발용 기본값
`jwtSecret` 미설정 시 `dev-only-insecure-secret-change-me` 폴백. → `NODE_ENV=production`에서 미설정이면 부팅 거부 또는 경고 로그 권장.

### 4. [정보 · 이식성] `better-sqlite3` 네이티브 빌드
SMB/UNC 공유 위 Windows node에서 `npm install` 시 컴파일 실패(cmd.exe가 UNC를 cwd로 못 씀). 로컬 디스크/WSL 네이티브에서는 정상(35/35). 팀 실행 가이드에 "DB·프로젝트는 네이티브 FS에" 명시 필요. (참고: 이관 전 로컬 P1 초안은 `node:sqlite`로 이 마찰을 회피했음 — 채택 여부는 팀 표준 우선.)

### 5. [나잇] `attemptKey`가 공백 구분자 사용(주석은 `|`). 표기 통일.

### 6. [중 · 보안] SSE JWT를 쿼리(`?token=`)로 전달 — **해결됨 (2026-09-07)**
임시 구현은 `EventSource` 헤더 제약 때문에 JWT를 `?token=` 쿼리로 받았음. 쿼리 문자열은 접근 로그(`requestLogger`가 `req.originalUrl` 기록)·프록시 로그·브라우저 히스토리에 평문으로 남아 토큰 유출 위험.
→ `sse.js`를 **`Authorization: Bearer` 헤더 전용**으로 변경(쿼리 폴백 제거). 클라이언트(`client-admin/useOrderStream`)는 `fetch` + `ReadableStream`으로 SSE를 직접 읽어 헤더를 설정하도록 재작성. 계약 문서·테스트(`sse.test.js` mockReq)도 헤더 기반으로 갱신. 백엔드 35/35 통과, `client-admin` vite build 성공.

## 이관 메모
임시 구현을 그대로 P1 기준으로 채택. 위 1~3번을 P1 소유 후속 커밋으로 처리 예정. 계약 문서는 `docs/contracts/api-auth-orders-sessions.md` 기준 유지.
