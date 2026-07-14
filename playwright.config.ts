import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "on-first-retry",
  },
  webServer: process.env.E2E_BASE_URL ? undefined : { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: true, timeout: 120_000 },
});
