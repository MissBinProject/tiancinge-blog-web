import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    { command: 'pnpm run dev:web', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
    { command: 'pnpm run dev:admin', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 120_000 },
  ],
});
