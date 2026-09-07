# AI-DLC State Tracking

## Project Information
- **Project Type**: Greenfield
- **Project Name**: 테이블오더 서비스 (Table Order Service)
- **Start Date**: 2026-09-07T02:41:38Z
- **Current Stage**: P3 기본 앱 구현, 25개 테스트/build 통과. 세션 계약 및 브라우저 E2E 미완료. P1/P2 구현 유지.
- **Active Role (this session)**: P3 — 고객용 React 앱 (`client-customer/`)
- **Build Scope**: P3 고객 앱 및 관련 설계·검증·진행 기록만 변경. P1/P2 백엔드와 P4 관리자 앱 소스는 변경하지 않음.
- **Baseline Commit**: `a7cf83a` (2026-09-07 확인)
- **Working Branch**: `feat/p3-customer-app`

## Technology Decisions (from Requirements Analysis)
- **Frontend**: React SPA (Vite + React)
- **Backend**: Node.js + Express (P2 구현으로 확정), JS/ESM
- **Data Store**: SQLite (file-based, local/demo)
- **Realtime**: Server-Sent Events (SSE)
- **Deploy Target**: Local development environment (single machine)
- **Menu Images**: External image URLs only
- **Seed Data**: Included (sample store/menu/admin)
- **Scale**: Small (single store, dozens of tables, MVP/demo)

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | No | Requirements Analysis |
| Resiliency Baseline | No | Requirements Analysis |
| Property-Based Testing | No | Requirements Analysis |

## Workspace State
- **Existing Code**: Yes — P1/P2 `server/`. P3 고객 앱 구현. P4 앱 없음.
- **Reverse Engineering Needed**: P3 연동 범위 API/폴더/의존성 재확인 완료, 실행 계획 및 설계 초안에 기록.
- **Programming Languages**: JavaScript (ESM), SQL
- **Build System**: npm (`server/package-lock.json`), Node test runner. P3 Vite 및 Vitest/Playwright 구성 존재.
- **Project Structure**: 백엔드 기존 구현 + 고객/관리자 SPA 신규 예정
- **Workspace Root**: `/home/kali/aidlc-workshop/DDThon26`

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: See code-generation.md Critical Rules

## Input Documents
- `requirements/table-order-requirements.md` — 테이블오더 서비스 요구사항 정의서
- `requirements/constraints.md` — 구현 예외사항 (제외 기능)

## Stage Progress
### 🔵 INCEPTION PHASE
- [x] Workspace Detection
- [ ] Reverse Engineering (N/A - Greenfield)
- [x] Requirements Analysis (APPROVED 2026-09-07)
- [x] User Stories (P3 통합 계획/설계 승인 — 2026-09-07 사용자 “그래”; 다른 유닛 과거 승인 대체 아님)
- [x] Workflow Planning (P3 통합 계획/설계 승인 — 2026-09-07 사용자 “그래”; 다른 유닛 과거 승인 대체 아님)
- [x] Application Design (P3 통합 계획/설계 승인 — 2026-09-07 사용자 “그래”; 다른 유닛 과거 승인 대체 아님)
- [x] Units Generation (P3 통합 계획/설계 승인 — 2026-09-07 사용자 “그래”; 다른 유닛 과거 승인 대체 아님)

### 🟢 CONSTRUCTION PHASE
- [x] P1/P2 Code Generation (과거 기록, 전체 단위 설계 완료를 의미하지 않음)
  - [x] p2-backend-menu-store (2026-09-07)
  - [x] p1-backend-orders-sessions (2026-09-07, TEMP — P1 담당자 합류 전 P2가 임시 구축; P1 담당자 리뷰/이관 완료: aidlc-docs/construction/p1-backend-orders-sessions/p1-owner-review.md, 조건부 승인. SSE JWT를 헤더 전용으로 보안 수정)
  - [x] p4-admin-frontend (2026-09-07, client-admin/ — 로그인·실시간 모니터링(SSE)·테이블/주문/메뉴 관리, vite build 성공 + 백엔드 연동 스모크 통과)
- [x] Build and Test (Node 24.19.0, server `npm test` 41/41 통과; client-admin `vite build` 성공, end-to-end 스모크 통과)
- [x] P3 Functional/NFR Design (통합 설계 승인, 사용자 “그래”)
- [ ] P3 Code Generation (Step 1~7, 10 구현. Step 8 P1 세션 계약 미확정)
- [ ] P3 Build and Test (npm ci/build 및 25개 테스트 통과. 브라우저 E2E는 libnspr4.so 누락으로 차단)
- [ ] 전체 서비스 고객/관리자 브라우저 E2E (P4 범위 밖, 미실행)
- [x] P2 공통 인프라 보강: CORS 활성화 (P3/P4 SPA 크로스 오리진 지원, 2026-09-07)
- [x] P2 고객용 메뉴 `?available=true` 필터 (2026-09-07)
- [x] P2 문서 싱크: api-menu-store.md 관리자 JWT 인증 반영 (2026-09-07)
- [x] P2 보안: 메뉴/분류 store-scope 가드 (교차 매장 403, 2026-09-07)
- [x] P2 카테고리 reorder 엔드포인트 (2026-09-07)
- [x] P2 공통 인프라: .env 로딩(dotenv) + 루트 통합 스크립트 + 루트 README (2026-09-07)

### 🟡 OPERATIONS PHASE
- [ ] Operations (Placeholder)

## P3 Session Update — 2026-09-07

- [Execution Plan](inception/plans/execution-plan.md)
- [P3 Design / Acceptance Criteria](construction/p3-customer-app/design.md)
- [P3 Code Generation Plan](construction/plans/p3-customer-app-code-generation-plan.md)
- 사용자 요청 “구래 진행해”에 따라 리뷰에서 제안한 P3 계획 작성 진행. 새 계획의 구현 승인은 아직 기록되지 않음.
- 착수 시 존재한 미추적 `docs/contracts/p3-customer-app.md`, `p3-requests-to-p1-orders-auth.md` 원문 보존. 현재 인증/주문 계약과 다른 부분은 실행 계획·설계에 정리.
- P1 인수 검토 및 착석 세션 식별 계약은 열린 의존사항. 카트 자동 초기화 완료를 주장하지 않음.
- `a7cf83a`의 37개 테스트 통과는 기존 audit의 보고값이며 이번 문서 작업에서 재실행한 값은 아님.
- 세 확장 opt-out 유지. 기존 기본 보안/사용성 요구사항은 계속 적용.

## P3 Implementation Update — 2026-09-07

- 사용자 “그래”로 계획 승인 후 client-customer 기본 구현. 후속 입력으로 P3 유닛만 담당임을 두 번 재확인.
- npm ci 및 npm run build 통과, npm test 25/25 통과.
- Playwright 5개 시나리오 작성, libnspr4.so 누락으로 실행 미완료.
- Step 8은 P1 계약 대기. 전체 P3 인수 완료로 표시하지 않음.
- 사용자 “커밋하고 푸쉬해줘” 요청으로 P3 변경과 진행 기록을 feat/p3-customer-app 브랜치에 게시.
- 결과: [P3 검증 요약](construction/build-and-test/build-and-test-summary.md).
