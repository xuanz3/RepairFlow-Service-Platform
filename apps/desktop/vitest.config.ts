import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/**', 'dist/**', 'dist-electron/**', '.release-package/**'],
  },
});
