import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './acceptance',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:3001',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  webServer: {
    command: 'cd ../backend && npm run dev',
    port: 3001,
    timeout: 30000,
    reuseExistingServer: true,
  },
});
