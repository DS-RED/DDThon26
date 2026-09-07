# P3 빌드 안내

범위는 client-customer 유닛이다. Node 22.12 이상, npm 필요. 검증 환경은 Node 24.15.0/npm 11.16.0.

```bash
cd client-customer
npm ci
npm run build
```

산출물: client-customer/dist/. Vite 환경변수 VITE_API_BASE_URL은 빌드 시 반영한다. dist와 node_modules는 Git에서 제외한다.

샌드박스에서 esbuild 실행이 EPERM이면 제한이 없는 승인된 실행 환경에서 재시도한다. 이 세션에서는 승인된 재현 설치 및 빌드가 통과했다.
