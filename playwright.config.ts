import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const systemChrome = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find(existsSync);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? systemChrome;
const testOrigin = "http://127.0.0.1:4329";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: testOrigin,
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "ATLAS_TEST_PORT=4329 node tests/serve.mjs",
    url: testOrigin,
    reuseExistingServer: false,
    timeout: 30_000,
  },
  projects: [
    {
      name: "desktop",
      grepInvert: /@mobile/,
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      grepInvert: /@desktop/,
      use: { hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } },
    },
  ],
});
