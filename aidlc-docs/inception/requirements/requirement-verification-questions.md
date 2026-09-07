# 요구사항 확인 질문 (Requirements Verification Questions)

아래 질문에 답변해 주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택한 **알파벳(A, B, C ...)** 을 입력하시면 됩니다.
제시된 선택지가 맞지 않으면 마지막 옵션(Other)을 고르고 `[Answer]:` 뒤에 직접 설명을 적어주세요.
모두 작성하신 후 "완료" 또는 "done"이라고 알려주세요.

---

## Question 1
프론트엔드(고객용/관리자용 웹 UI)를 어떤 기술로 구현할까요? (요구사항: 브라우저에서 동작하는 웹 UI)

A) React (SPA, 예: Vite + React)

B) Vue.js (SPA)

C) 순수 HTML/CSS/JavaScript (프레임워크 없음)

D) 서버 사이드 렌더링 프레임워크 (예: Next.js)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
백엔드 서버는 어떤 언어/프레임워크로 구현할까요?

A) Python (FastAPI)

B) Node.js (Express 또는 NestJS)

C) Java (Spring Boot)

D) Python (Django/DRF)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
데이터 저장소는 어떤 유형을 사용할까요? (매장/메뉴/주문/주문이력 저장)

A) 관계형 DB (PostgreSQL)

B) 관계형 DB (MySQL)

C) 경량 파일 기반 DB (SQLite) — 데모/로컬 실행에 적합

D) NoSQL 문서형 (MongoDB)

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
이 서비스의 실행/배포 대상 환경은 무엇인가요?

A) 로컬 개발 환경에서 실행 (데모/학습 목적, 단일 머신)

B) Docker 컨테이너 기반 (로컬 또는 서버 어디서나 실행)

C) 클라우드 배포 (AWS 등)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
실시간 주문 모니터링은 요구사항에 명시된 **Server-Sent Events(SSE)** 방식으로 구현하는 것이 맞나요?

A) 예 — SSE로 구현 (요구사항대로, 단방향 서버→관리자 푸시)

B) 아니요 — WebSocket으로 구현 (양방향)

C) 아니요 — 클라이언트 폴링(주기적 요청)으로 구현 (가장 단순)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
메뉴 이미지는 어떻게 관리할까요? (제약사항: 이미지 리사이징/최적화, 파일 업로드는 제외)

A) 외부 이미지 URL만 저장·표시 (관리자가 URL 입력) — 제약사항에 부합

B) 로컬 정적 파일 경로 참조 (미리 준비된 이미지 사용)

C) 이미지 없이 텍스트/플레이스홀더만 사용

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
초기 데이터(샘플 매장, 테이블, 메뉴, 관리자 계정)를 시드(seed) 데이터로 자동 생성해 바로 시연 가능하도록 할까요?

A) 예 — 샘플 매장/메뉴/관리자 계정 시드 데이터 포함 (즉시 시연 가능)

B) 아니요 — 빈 상태로 시작하고 관리자 화면에서 직접 입력

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
예상 사용 규모(동시성)는 어느 정도로 설계할까요? (성능/확장성 설계 판단용)

A) 소규모 — 단일 매장, 테이블 수십 개 수준 (MVP/데모)

B) 중규모 — 다수 매장, 매장당 수십~수백 테이블

C) 대규모 — 대규모 멀티테넌트, 고가용성 필요

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9: 보안 확장 (Security Extensions)
이 프로젝트에 보안 확장 규칙(Security Baseline)을 적용할까요?

A) 예 — 모든 SECURITY 규칙을 필수(blocking) 제약으로 적용 (프로덕션급 애플리케이션 권장)

B) 아니요 — 모든 SECURITY 규칙 생략 (PoC, 프로토타입, 실험적 프로젝트에 적합)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 10: 복원력 확장 (Resiliency Extensions)
이 프로젝트에 복원력 기준(Resiliency Baseline)을 적용할까요?

이 확장은 AWS Well-Architected Framework(신뢰성 축)에서 파생된 **설계 시점의 방향성 있는 모범 사례**(내결함성, 고가용성, 관측 가능성, 복구 가능성 등 15개 실무 영역)를 적용합니다. 단, 이것이 프로덕션 준비 완료나 특정 가용성/RTO/RPO 목표를 보장하지는 않으며, 정식 Well-Architected Review를 대체하지 않는 **출발점**입니다.

A) 예 — 복원력 기준을 설계 시점 방향성 지침으로 적용 (비즈니스 크리티컬 워크로드 권장)

B) 아니요 — 복원력 기준 생략 (빠른 반복이 더 중요한 PoC/프로토타입/실험적 프로젝트에 적합)

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 11: 속성 기반 테스트 확장 (Property-Based Testing Extension)
이 프로젝트에 속성 기반 테스트(PBT) 규칙을 적용할까요?

A) 예 — 모든 PBT 규칙을 필수(blocking) 제약으로 적용 (비즈니스 로직/데이터 변환/직렬화/상태 컴포넌트가 있는 프로젝트 권장)

B) 부분 — 순수 함수와 직렬화 왕복(round-trip)에 대해서만 PBT 규칙 적용 (알고리즘 복잡도가 제한적인 프로젝트에 적합)

C) 아니요 — 모든 PBT 규칙 생략 (단순 CRUD, UI 전용, 얇은 통합 계층에 적합)

X) Other (please describe after [Answer]: tag below)

[Answer]: C
