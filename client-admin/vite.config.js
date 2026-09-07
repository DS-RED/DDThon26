import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// P4 관리자 프론트. 백엔드(P1/P2)는 http://localhost:3000 에서 실행.
// 개발 중 CORS 없이 붙기 위해 /api 와 /health 를 백엔드로 프록시한다.
// SSE(/api/stores/:id/events)도 일반 HTTP라 그대로 프록시된다.
const BACKEND = process.env.VITE_BACKEND_ORIGIN || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/health': { target: BACKEND, changeOrigin: true },
    },
  },
});
