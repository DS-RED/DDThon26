# AI-DLC State Tracking

## Project Information
- **Project Type**: Greenfield
- **Project Name**: 테이블오더 서비스 (Table Order Service)
- **Start Date**: 2026-09-07T02:41:38Z
- **Current Stage**: INCEPTION - Requirements Analysis (awaiting approval)

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
- [x] Requirements Analysis (awaiting user approval)
- [ ] User Stories
- [ ] Workflow Planning
- [ ] Application Design
- [ ] Units Generation

### 🟢 CONSTRUCTION PHASE
- [ ] Per-Unit Design & Code Generation
- [ ] Build and Test

### 🟡 OPERATIONS PHASE
- [ ] Operations (Placeholder)
