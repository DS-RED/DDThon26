# P3 브라우저 E2E

```bash
cd server
npm ci
cd ../client-customer
npm ci
npx playwright install --with-deps chromium
npm run test:e2e
```

Playwright 지원 OS/브라우저 라이브러리가 필요하다. localhost의 3101(테스트 서버), 5174(Vite) 포트를 사용한다. 기존 서버 재사용은 금지하고 테스트별 테이블을 생성한다. DB는 메모리이며 프로세스 종료 시 사라진다.

시나리오 5개: 정상 주문/5초 복귀/이용 완료, 주문 거절 시 카트 유지, 응답 유실 시 중복 전송 차단, 캐시 토큰 갱신, 작은 화면의 오버플로/44px 버튼/다이얼로그 키보드·포커스.

테스트 결과는 test-results/에 기록한다. 마지막 시나리오 성공 시 customer-mobile.png 생성. 이번 환경은 Chromium 실행에 필요한 libnspr4.so가 없어 5개 모두 브라우저 시작에서 실패했다. 스크린샷 확인 및 UI 실측은 수행하지 못했다.

P1 세션 식별 계약이 필요한 카트 자동 초기화는 별도 미완료이며 이 테스트로 완료 처리하지 않는다.
