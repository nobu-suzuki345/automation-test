import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 10_000,
  use: {
    browserName: "chromium",
    headless: true,
    baseURL: "http://localhost:3333",
  },
  webServer: {
    command: "bun run server.ts",
    port: 3333,
    reuseExistingServer: true,
    timeout: 10_000,
  },
});
