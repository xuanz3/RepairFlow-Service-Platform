import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/media',
  testMatch: '**/*.e2e.ts',
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 120000,
});
