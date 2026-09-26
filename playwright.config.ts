import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  // WebKit decodes the full five-hero animation set much more slowly than
  // Chromium on the Windows CI host. Keep the assertion deadlines strict but
  // allow long, multi-battle end-to-end flows to finish instead of timing out.
  timeout: 180000,
  fullyParallel: false,
  workers: 1,
  retries: 1,
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
      name: "android-portrait",
      use: { ...devices["Pixel 7"], viewport: { width: 412, height: 915 } },
    },
    {
      name: "iphone-webkit",
      use: {
        ...devices["iPhone 13"],
        viewport: { width: 390, height: 844 },
        defaultBrowserType: "webkit",
      },
    },
  ],
});
