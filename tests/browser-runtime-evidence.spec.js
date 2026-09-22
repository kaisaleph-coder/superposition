/* Sprint 1 browser-runtime evidence.
   This test records the storage/locks/resource/error state and captures screenshots
   without changing the production runtime or origins. */
import { test, expect } from "@playwright/test";
import { writeFileSync } from "node:fs";

test("runtime evidence: home and standalone resume", async ({ page }, testInfo) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const badResponses = [];

  page.on("console", msg => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", err => pageErrors.push(String(err)));
  page.on("requestfailed", req => failedRequests.push({ url: req.url(), failure: req.failure() }));
  page.on("response", resp => {
    if (resp.status() >= 400) badResponses.push({ url: resp.url(), status: resp.status() });
  });

  const homeResponse = await page.goto("/?seed=271828&force=static", { waitUntil: "networkidle" });
  expect(homeResponse?.status()).toBe(200);

  const homeRuntime = await page.evaluate(async () => {
    const idb = typeof indexedDB.databases === "function"
      ? (await indexedDB.databases()).map(x => ({ name: x.name || "", version: x.version || 0 }))
      : "databases-api-unavailable";
    const locksSupported = !!navigator.locks?.request;
    let lockRoundTrip = null;
    if (locksSupported) {
      lockRoundTrip = await navigator.locks.request("superposition-runtime-evidence", lock => ({
        held: !!lock,
        name: lock?.name || ""
      }));
    }
    return {
      localStorageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage),
      indexedDB: idb,
      webLocksSupported: locksSupported,
      lockRoundTrip,
      resources: performance.getEntriesByType("resource").map(r => r.name).sort()
    };
  });

  expect(homeRuntime.localStorageKeys).toEqual([]);
  expect(homeRuntime.sessionStorageKeys).toEqual([]);
  if (Array.isArray(homeRuntime.indexedDB)) expect(homeRuntime.indexedDB).toEqual([]);
  expect(homeRuntime.webLocksSupported).toBeTruthy();
  expect(homeRuntime.lockRoundTrip).toEqual({ held: true, name: "superposition-runtime-evidence" });

  const homeShot = testInfo.outputPath(`runtime-home-${testInfo.project.name}.png`);
  await page.screenshot({ path: homeShot, fullPage: true });
  await testInfo.attach("runtime-home", { path: homeShot, contentType: "image/png" });

  const resumeResponse = await page.goto("/resume/", { waitUntil: "networkidle" });
  expect(resumeResponse?.status()).toBe(200);
  const resumeShot = testInfo.outputPath(`runtime-resume-${testInfo.project.name}.png`);
  await page.screenshot({ path: resumeShot, fullPage: true });
  await testInfo.attach("runtime-resume", { path: resumeShot, contentType: "image/png" });

  const resumeRuntime = await page.evaluate(async () => ({
    localStorageKeys: Object.keys(localStorage),
    sessionStorageKeys: Object.keys(sessionStorage),
    indexedDB: typeof indexedDB.databases === "function"
      ? (await indexedDB.databases()).map(x => ({ name: x.name || "", version: x.version || 0 }))
      : "databases-api-unavailable",
    webLocksSupported: !!navigator.locks?.request,
    resources: performance.getEntriesByType("resource").map(r => r.name).sort()
  }));

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
  expect(badResponses).toEqual([]);

  const evidence = {
    project: testInfo.project.name,
    home: homeRuntime,
    resume: resumeRuntime,
    consoleErrors,
    pageErrors,
    failedRequests,
    badResponses
  };
  writeFileSync(testInfo.outputPath(`runtime-evidence-${testInfo.project.name}.json`), JSON.stringify(evidence, null, 2));
});
