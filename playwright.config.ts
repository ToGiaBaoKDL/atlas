import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

const systemChrome = ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find(existsSync);
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? systemChrome;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4321",
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ...(executablePath ? { launchOptions: { executablePath } } : {}),
  },
  webServer: {
    command: "node tests/serve.mjs",
    url: "http://127.0.0.1:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { hasTouch: true, isMobile: true, viewport: { width: 375, height: 812 } },
    },
  ],
});
