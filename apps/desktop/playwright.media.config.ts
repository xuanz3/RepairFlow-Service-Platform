import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/media',
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 120000,
});
