import { defineConfig } from 'vitest/config';

/** Unit tests for shared logic (no browser). Browser tests live in tests/e2e (Playwright). */
export default defineConfig({
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
