# AI-DLC State Tracking

## Project Information
- **Project Type**: Greenfield
- **Project Name**: 테이블오더 서비스 (Table Order Service)
- **Start Date**: 2026-09-07T02:41:38Z
- **Current Stage**: CONSTRUCTION - P2 COMPLETE + P1 (temp) COMPLETE & verified (36/36 tests pass); P2 CORS 활성화 완료
- **My Role (this developer)**: P2 — 백엔드 · 메뉴/매장 도메인 + 데이터·공통 인프라
- **Build Scope**: P2 slice only (menu/store CRUD, SQLite schema+migration+seed, common middleware, server bootstrap). P1/P3/P4 owned by teammates.

## Technology Decisions (from Requirements Analysis)
- **Frontend**: React SPA (Vite + React)
- **Backend**: Node.js (Express or NestJS — finalize in NFR/tech stack stage)
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
- **Existing Code**: No
- **Reverse Engineering Needed**: No
- **Programming Languages**: (없음 - 신규 프로젝트)
- **Build System**: (없음)
- **Project Structure**: Empty (Greenfield)
- **Workspace Root**: c:\Users\USER\Desktop\DDThon26

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
- [ ] User Stories
- [ ] Workflow Planning
- [ ] Application Design
- [ ] Units Generation

### 🟢 CONSTRUCTION PHASE
- [x] Per-Unit Design & Code Generation
  - [x] p2-backend-menu-store (2026-09-07)
  - [x] p1-backend-orders-sessions (2026-09-07, TEMP — P1 담당자 합류 전 P2가 임시 구축; P1 담당자 리뷰/이관 완료: aidlc-docs/construction/p1-backend-orders-sessions/p1-owner-review.md, 조건부 승인. SSE JWT를 헤더 전용으로 보안 수정)
  - [x] p4-admin-frontend (2026-09-07, client-admin/ — 로그인·실시간 모니터링(SSE)·테이블/주문/메뉴 관리, vite build 성공 + 백엔드 연동 스모크 통과)
- [x] Build and Test (Node 24.19.0, server `npm test` 41/41 통과; client-admin `vite build` 성공, end-to-end 스모크 통과)
- [x] P2 공통 인프라 보강: CORS 활성화 (P3/P4 SPA 크로스 오리진 지원, 2026-09-07)
- [x] P2 고객용 메뉴 `?available=true` 필터 (2026-09-07)
- [x] P2 문서 싱크: api-menu-store.md 관리자 JWT 인증 반영 (2026-09-07)
- [x] P2 보안: 메뉴/분류 store-scope 가드 (교차 매장 403, 2026-09-07)
- [x] P2 카테고리 reorder 엔드포인트 (2026-09-07)
- [x] P2 공통 인프라: .env 로딩(dotenv) + 루트 통합 스크립트 + 루트 README (2026-09-07)

### 🟡 OPERATIONS PHASE
- [ ] Operations (Placeholder)
