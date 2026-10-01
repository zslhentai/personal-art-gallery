import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4173/personal-art-gallery/",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop-chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath: process.env.CHROMIUM_PATH },
      },
    },
    {
      name: "iphone-390-chromium",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        launchOptions: { executablePath: process.env.CHROMIUM_PATH },
      },
    },
    {
      name: "iphone-390-webkit",
      use: {
        ...devices["iPhone 13"],
        launchOptions: { executablePath: process.env.WEBKIT_PATH },
      },
    },
  ],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/personal-art-gallery/",
    reuseExistingServer: !process.env.CI,
  },
});
