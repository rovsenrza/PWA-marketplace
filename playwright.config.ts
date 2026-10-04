import { defineConfig } from '@playwright/test';

/** Tests run against the production build (vite preview) in the system Chrome. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    channel: 'chrome',
    viewport: { width: 402, height: 874 },
  },
  webServer: {
    command: 'npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173/index.html',
    reuseExistingServer: true,
  },
});
