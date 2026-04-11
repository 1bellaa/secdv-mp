import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // 1. Tell Playwright EXACTLY where your test files are
  testDir: './tests',

  // 2. Look for files ending in .spec.ts or .test.ts
  testMatch: /.*\.spec\.ts/,

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // 3. Optional: Define which browsers to test on (helpful for demos)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});