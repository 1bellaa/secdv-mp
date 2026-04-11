import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:5173', // Ensure this matches your Vite port
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
});