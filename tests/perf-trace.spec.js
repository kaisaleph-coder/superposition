/* §6 long-task budget: 0 tasks > 50 ms after boot (P4 trace). DOM-driven boot signal. */
import { test, expect } from "@playwright/test";

test.describe("long tasks", () => {
  test("no main-thread long task > 50 ms after field boot (§6)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop trace");
    await page.goto("/?seed=1&run=1");
    await page.waitForSelector("body[data-settled]", { timeout: 20000 });
    // observe long tasks for 5 running seconds AFTER boot+settle
    const longTasks = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const tasks = [];
          const obs = new PerformanceObserver((list) => {
            for (const e of list.getEntries()) tasks.push(Math.round(e.duration));
          });
          obs.observe({ type: "longtask", buffered: false });
          setTimeout(() => { obs.disconnect(); resolve(tasks); }, 5000);
        })
    );
    expect(longTasks.filter((d) => d > 50)).toEqual([]);
  });
});
