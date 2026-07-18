/* §10.4 visual regression — fixed-seed deterministic screenshots: superposition +
   each facet settled + dossier open + record, light & dark. The engine freezes at
   sim-frame 240 under ?seed (fixed dt), so shots are pixel-stable by construction. */
import { test, expect } from "@playwright/test";

const FACETS = ["columns", "frame", "tables", "lattice", "surface", "clusters", "vector", "orbit"];

test.describe("visual regression (fixed seed)", () => {
  test.skip(({ isMobile }) => isMobile, "desktop VR set");

  for (const scheme of ["light", "dark"]) {
    test.describe(scheme, () => {
      test.use({ colorScheme: scheme });

      test(`superposition — ${scheme}`, async ({ page }) => {
        await page.goto("/?seed=1");
        await page.waitForSelector("body[data-settled]", { timeout: 20000 });
        await expect(page).toHaveScreenshot(`superposition-${scheme}.png`);
      });

      for (const f of FACETS) {
        test(`facet ${f} settled — ${scheme}`, async ({ page }) => {
          await page.goto(`/?seed=1#/${f}`);
          await page.waitForSelector("body[data-settled]", { timeout: 20000 });
          await expect(page).toHaveScreenshot(`facet-${f}-${scheme}.png`);
        });
      }

      test(`dossier open — ${scheme}`, async ({ page }) => {
        await page.goto("/?seed=1#/columns");
        await page.waitForSelector("body[data-settled]", { timeout: 20000 });
        await page.locator("#view-columns .dossier > button").first().click();
        await page.waitForTimeout(300); // 180 ms expand + settle
        await expect(page).toHaveScreenshot(`dossier-open-${scheme}.png`);
      });

      test(`record — ${scheme}`, async ({ page }) => {
        await page.goto("/?seed=1#/record");
        await page.waitForSelector("body[data-settled]", { timeout: 20000 });
        await expect(page).toHaveScreenshot(`record-${scheme}.png`);
      });
    });
  }
});
