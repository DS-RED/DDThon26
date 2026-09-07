# P1 백엔드(인증/주문/세션 + SSE) — 코드 생성 계획

> **Unit**: `p1-backend-orders-sessions`
> **담당 역할**: P1 (임시 진행 — P1 담당자 합류 지연으로 P2가 임시 구축)
> **방식**: 린(Lean) — Code Generation Part1(계획)→Part2(구현)
> **작성일**: 2026-09-07
> **전제**: P2 슬라이스(서버 골격, DB 스키마, 메뉴/매장)가 이미 리포에 존재. 그 위에 P1 도메인을 추가.

---

## Unit Context

**담당 범위 (P1)**
- 인증: 관리자 로그인(JWT+bcrypt), 테이블 태블릿 로그인, 로그인 시도 제한, 실제 `requireAdmin`/`requireTable` 미들웨어(P2 placeholder 대체)
- 테이블 세션 라이프사이클: 세션 자동 시작(첫 주문)~종료(이용 완료→이력 이동→현재 리셋)
- 주문: 생성(가격 스냅샷·총액 계산), 현재 세션 조회, 상세, 상태 변경, 직권 삭제
- 주문 이력: 세션 종료 시 스냅샷 이동, 조회(테이블/날짜 필터)
- 테이블 관리: 초기 설정(번호+비밀번호), 대시보드 요약
- SSE 발행: `order.created/updated/deleted`, `session.closed` + `/events` 구독 엔드포인트

**요구사항 추적**
- FR-A1 매장 인증(JWT 16h, bcrypt, 시도 제한) → auth 모듈
- FR-A2 실시간 모니터링(SSE) → sse 모듈 + 대시보드 요약
- FR-A3 테이블 관리/세션/주문 삭제 → tables + sessions + orders
- FR-C1 테이블 자동 로그인 → auth table login
- FR-C4 주문 생성 → orders.create
- FR-C5 현재 세션 주문 조회 → orders /mine

**경계**: 프론트(P3/P4) 미포함. DB 스키마는 P2 소유(P1은 계약 테이블 로직만 구현).

---

## 기술 선택
| 항목 | 선택 |
|------|------|
| 인증 토큰 | jsonwebtoken (JWT, 16h) |
| 비밀번호 해시 | bcryptjs (순수 JS, 네이티브 빌드 불요) |
| 실시간 | SSE (Express res 스트림, 인메모리 fan-out) |
| 검증 | zod |
| 테스트 | node:test + supertest, 인메모리 SQLite |

---

## 실행 단계 (Steps)

- [x] **Step 1. 설정/의존성 확장**: package.json(jsonwebtoken, bcryptjs), config(jwt/bcrypt/login limit), .env.example
- [x] **Step 2. 인증 모듈**: auth/{tokens, password, service(로그인+시도제한), schema, controller, routes}
- [x] **Step 3. 미들웨어 교체**: middleware/auth.js → 실제 requireAdmin/requireTable(JWT 검증)
- [x] **Step 4. 세션 모듈**: sessions/{repository, service(ensureActiveSession, closeTableSession→이력이동)}
- [x] **Step 5. 주문 모듈**: orders/{repository, service(가격 스냅샷·총액·상태·삭제·이력), controller, routes, schema}
- [x] **Step 6. 테이블 모듈**: tables/{repository, service(초기설정·대시보드요약·세션종료), controller, routes, schema}
- [x] **Step 7. SSE 모듈**: sse/sse.js(publish, eventsHandler, 하트비트) + 서비스 연동
- [x] **Step 8. 앱 조립**: app.js에 auth/orders/tables 라우터 마운트
- [x] **Step 9. 시드 갱신**: seed.js — 실제 bcrypt 해시(admin/table 비밀번호), 데모 테이블 3개
- [x] **Step 10. 테스트**: auth/orders/sse.test.js 추가, menu.test.js를 관리자 토큰 사용으로 갱신, helpers에 loginAdmin/loginTable
- [x] **Step 11. 계약/문서**: docs/contracts/api-auth-orders-sessions.md, shared-conventions·README 갱신
- [x] **Step 12. 코드 요약**: aidlc-docs/construction/p1-backend-orders-sessions/code/summary.md

---

## 완료 기준
- `npm test` 전체 통과 (P2 13 + P1/갱신 포함 총 35)
- 로컬 기동 후 로그인→주문→SSE 수신→세션 종료→이력 조회 end-to-end 동작
- 공유 계약 문서 반영
