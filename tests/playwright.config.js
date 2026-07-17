/* SUPERPOSITION QA (PLAN §10) — chromium desktop + chromium mobile emulation.
   All assertions are on the DOM contract (§5.6): <body data-*> only. */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 45_000,
  retries: 0,
  workers: 1, // one agent, one server, deterministic order
  reporter: [["list"], ["json", { outputFile: "../test-results/results.json" }]],
  use: {
    baseURL: "http://localhost:8080",
    screenshot: "only-on-failure",
  },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02 } },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
  ],
  webServer: {
    command: "python -m http.server 8080",
    port: 8080,
    reuseExistingServer: true,
    cwd: "..",
  },
});
