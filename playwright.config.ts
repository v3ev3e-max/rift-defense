import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 810 },
      },
    },
    {
      name: "android-landscape",
      use: { ...devices["Pixel 7"], viewport: { width: 915, height: 412 } },
    },
    {
      name: "iphone-webkit",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 844, height: 390 },
        defaultBrowserType: "webkit",
      },
    },
  ],
});
