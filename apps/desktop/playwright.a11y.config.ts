import { defineConfig } from '@playwright/test';
const nodeExecutable = JSON.stringify(process.execPath);
export default defineConfig({
  testDir: './tests/a11y',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 960 } },
  webServer: {
    command: `${nodeExecutable} ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 120000,
  },
});
