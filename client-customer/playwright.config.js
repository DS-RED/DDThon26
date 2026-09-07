import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:5174', viewport: { width: 1180, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } } : {}) },
  webServer: [
    { command: 'node e2e/server.mjs', url: 'http://127.0.0.1:3101/health', reuseExistingServer: false },
    { command: 'npm run dev -- --port 5174', url: 'http://127.0.0.1:5174', env: { VITE_API_BASE_URL: 'http://127.0.0.1:3101' }, reuseExistingServer: false },
  ],
});
