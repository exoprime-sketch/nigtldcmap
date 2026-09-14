import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against the candidate build, not a dev server.
 *
 * The suite runs on exactly the bundle the release QA measured: the same
 * `.verify/candidate/build` tree, served by the same static server the CDP
 * audits use, on a fixed port so `webServer` can wait for it. Nothing here
 * replaces the meaning review - these tests check that a screen loads, that its
 * controls do something, and that the reference screens still state the values
 * confirmed against the source.
 */
const PORT = Number(process.env.NIGT_E2E_PORT || 4317);

export default defineConfig({
  testDir: "e2e",
  // The detail sweep visits 152 routes; the default 30s cap is per test.
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: process.env.CI ? 1 : 0,
  forbidOnly: Boolean(process.env.CI),
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: "reports/final-data-integration/playwright-report" }]]
    : [["list"]],
  outputDir: "reports/final-data-integration/playwright-artifacts",
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // Kept on failure only: a passing run should leave nothing behind.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
  ],
  webServer: {
    command: "node scripts/v137/serve-candidate-v137.mjs",
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
