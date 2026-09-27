import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['username-login.spec.ts', 'admin.spec.ts'],
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5173', channel: 'chrome', headless: true },
  webServer: { command: 'pnpm --filter @tian-xin-ge/admin dev -- --host 127.0.0.1', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 30_000 },
});
