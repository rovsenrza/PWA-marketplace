import { defineConfig } from '@playwright/test';

/**
 * Tests run against the production build (vite preview) in the system Chrome.
 * E2E_PORT gives a run its own preview server (parallel worktrees): with it set, an occupied port fails
 * the run instead of silently reusing another checkout's server.
 */
const PORT = Number(process.env.E2E_PORT || 4173);

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: 'chrome',
    viewport: { width: 402, height: 874 },
  },
  webServer: {
    command: `npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.E2E_PORT,
  },
});
