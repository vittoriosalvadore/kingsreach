const { defineConfig, devices } = require('@playwright/test');

// The game is a static page; serve the repo root with the project's own
// no-cache server and drive it in a real headless Chromium (Three.js needs WebGL,
// so jsdom/headless-DOM won't do).
module.exports = defineConfig({
  testDir: '.',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8000',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python3 serve.py',
    cwd: '..',
    url: 'http://localhost:8000/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
