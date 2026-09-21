import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const rawOrigin = process.env.PREVIEW_URL;
if (!rawOrigin) throw new Error("PREVIEW_URL is required");

const parsed = new URL(rawOrigin);
if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".workers.dev")) {
  throw new Error(`Refusing non-Cloudflare preview origin: ${rawOrigin}`);
}
const origin = parsed.origin;
const outDir = "staging-live";
fs.mkdirSync(outDir, { recursive: true });

const routes = [
  ["home", ""],
  ["finance", "#/columns"],
  ["restaurant", "#/tables"],
  ["construction", "#/frame"],
  ["investor", "#/surface"],
  ["entrepreneur", "#/vector"],
  ["ai", "#/lattice"],
  ["skills", "#/clusters"],
  ["hobbies", "#/orbit"],
];

const report = {
  timestamp: new Date().toISOString(),
  origin,
  host: parsed.hostname,
  os: { platform: os.platform(), release: os.release(), arch: os.arch() },
  browser: {},
  http: {},
  runs: {},
};

const expectedConsole = [
  /^warning: \[\.WebGL-.*GPU stall due to ReadPixels/,
];

function classifyConsole(values) {
  const expected = [], unexpected = [];
  for (const value of values) {
    const hit = expectedConsole.some((re) => re.test(value));
    (hit ? expected : unexpected).push(value);
  }
  return { expected, unexpected };
}

async function checkHttp() {
  const required = [
    "/",
    "/index.html",
    "/404.html",
    "/css/main.css",
    "/js/main.js",
    "/vendor/three.webgpu.min.js",
    "/content/resume.data.js",
    "/assets/favicon.svg",
  ];
  const results = [];
  for (const pathname of required) {
    const r = await fetch(origin + pathname, { redirect: "manual" });
    results.push({
      pathname,
      status: r.status,
      location: r.headers.get("location"),
      contentType: r.headers.get("content-type"),
    });
    if (!r.ok) throw new Error(`Required staging asset failed: ${pathname} -> ${r.status}`);
    if (r.headers.get("location")) throw new Error(`Unexpected redirect: ${pathname} -> ${r.headers.get("location")}`);
  }
  const miss = await fetch(origin + "/__superposition_missing_route__", { redirect: "manual" });
  const missText = await miss.text();
  if (miss.status !== 404) throw new Error(`Expected 404, received ${miss.status}`);
  if (!/no such state|404/i.test(missText)) throw new Error("404 response did not contain expected static 404 content");
  report.http = { required: results, missing: { status: miss.status, bytes: missText.length } };
}

function attachTelemetry(page, run, phaseRef) {
  page.on("pageerror", (e) => {
    const target = phaseRef.runtime ? run.errors : run.teardownErrors;
    target.push(String(e));
  });
  page.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) run.console.push(m.type() + ": " + m.text());
  });
  page.on("requestfailed", (req) => {
    run.requestFailures.push({ url: req.url(), error: req.failure()?.errorText || "unknown" });
  });
  page.on("response", (res) => {
    if (res.status() >= 400) run.badResponses.push({ url: res.url(), status: res.status() });
  });
}

function finishTelemetry(run) {
  const c = classifyConsole(run.console);
  run.consoleExpected = c.expected;
  run.consoleUnexpected = c.unexpected;
  run.teardownUnexpected = run.teardownErrors.filter(
    (message) => message !== "OperationError: Instance dropped in popErrorScope"
  );
  run.pass =
    !run.runError &&
    run.errors.length === 0 &&
    run.consoleUnexpected.length === 0 &&
    run.requestFailures.length === 0 &&
    run.badResponses.length === 0 &&
    run.teardownUnexpected.length === 0 &&
    run.states.length === routes.length &&
    run.states.every((s) => s.screenshotExists);
  return run;
}

async function plainPreflight() {
  const run = {
    kind: "plain-preflight",
    errors: [], teardownErrors: [], console: [], requestFailures: [], badResponses: [], states: [],
  };
  let browser;
  const phase = { runtime: true };
  try {
    browser = await chromium.launch();
    report.browser.version = browser.version();
    report.browser.executablePath = chromium.executablePath();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    attachTelemetry(page, run, phase);
    const response = await page.goto(origin + "/?force=static&seed=271828", { waitUntil: "load" });
    if (!response?.ok()) throw new Error(`Plain preflight navigation failed: ${response?.status()}`);
    if (new URL(page.url()).hostname !== parsed.hostname) throw new Error(`Preview redirected off origin: ${page.url()}`);
    const state = await page.evaluate(() => ({
      renderer: document.body.dataset.renderer,
      tier: document.body.dataset.tier,
      domain: document.body.dataset.renderDomain,
      title: document.title,
    }));
    if (state.renderer !== "static" || state.domain !== "home") {
      throw new Error(`Plain preflight state mismatch: ${JSON.stringify(state)}`);
    }
    const file = path.join(outDir, "plain-home.png");
    await page.screenshot({ path: file, fullPage: false });
    run.states.push({ ...state, screenshot: file, screenshotExists: fs.existsSync(file) });
    phase.runtime = false;
    await page.close();
  } catch (e) {
    run.runError = String(e);
  } finally {
    phase.runtime = false;
    await browser?.close().catch(() => {});
  }
  return finishTelemetry(run);
}

async function routeRun(kind, launch, query, viewport, { requireRenderer, requireSurface = false, watchDevice = false } = {}) {
  const run = {
    kind, errors: [], teardownErrors: [], console: [], requestFailures: [], badResponses: [],
    states: [], deviceLost: null,
  };
  let browser;
  const phase = { runtime: true };
  try {
    browser = await chromium.launch(launch);
    run.browserVersion = browser.version();
    const context = await browser.newContext(viewport);
    const page = await context.newPage();
    attachTelemetry(page, run, phase);

    for (const [domain, hash] of routes) {
      const response = await page.goto(origin + "/" + query + hash, { waitUntil: "load" });
      if (!response?.ok()) throw new Error(`${kind} ${domain} navigation failed: ${response?.status()}`);
      if (new URL(page.url()).hostname !== parsed.hostname) throw new Error(`${kind} redirected off preview origin: ${page.url()}`);

      await page.waitForFunction(
        ({ expected, renderer, surface }) =>
          document.body.dataset.renderDomain === expected &&
          (!renderer || document.body.dataset.renderer === renderer) &&
          (!surface || Number(document.body.dataset.surfaceLayers) > 0),
        { expected: domain, renderer: requireRenderer, surface: requireSurface },
        { timeout: 18000 }
      );
      await page.waitForTimeout(700);

      if (watchDevice && domain === "home") {
        await page.evaluate(() => {
          const device = window.__engineDebug?._debug?.renderer?.backend?.device;
          if (!device || window.__stagingLossWatch) return;
          window.__stagingLossWatch = true;
          window.__stagingDeviceLost = null;
          device.lost.then((info) => {
            window.__stagingDeviceLost = {
              reason: String(info?.reason || "unknown"),
              message: String(info?.message || ""),
            };
          });
        });
      }

      const state = await page.evaluate(() => ({
        renderer: document.body.dataset.renderer,
        tier: document.body.dataset.tier,
        domain: document.body.dataset.renderDomain,
        recipe: document.body.dataset.recipe || null,
        topology: document.body.dataset.topology || null,
        surfaceLayers: document.body.dataset.surfaceLayers || "0",
        particles: document.body.dataset.particles || null,
        gpuProfile: document.body.dataset.gpuProfile || null,
        fps: document.body.dataset.fps || null,
      }));
      if (requireRenderer && state.renderer !== requireRenderer) {
        throw new Error(`${kind} renderer mismatch at ${domain}: ${state.renderer}`);
      }
      if (requireSurface && Number(state.surfaceLayers) <= 0) {
        throw new Error(`${kind} surface layer failure at ${domain}`);
      }

      const file = path.join(outDir, `${kind}-${domain}.png`);
      await page.screenshot({ path: file, fullPage: false });
      run.states.push({ expectedDomain: domain, ...state, screenshot: file, screenshotExists: fs.existsSync(file) });
    }

    if (watchDevice) {
      await page.waitForTimeout(1500);
      run.deviceLost = await page.evaluate(() => window.__stagingDeviceLost || null);
      if (run.deviceLost) throw new Error(`WebGPU device lost: ${JSON.stringify(run.deviceLost)}`);
    }

    phase.runtime = false;
    await page.close();
    await context.close();
  } catch (e) {
    run.runError = String(e);
  } finally {
    phase.runtime = false;
    await browser?.close().catch(() => {});
  }
  return finishTelemetry(run);
}

await checkHttp();

report.runs.plain = await plainPreflight();
report.runs.staticDesktop = await routeRun(
  "static-desktop",
  { headless: true },
  "?force=static&seed=271828",
  { viewport: { width: 1440, height: 900 } },
  { requireRenderer: "static" }
);
report.runs.staticMobile = await routeRun(
  "static-mobile",
  { headless: true },
  "?force=static&seed=271828",
  { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { requireRenderer: "static" }
);
report.runs.webgl = await routeRun(
  "webgl",
  {
    headless: true,
    args: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
  },
  "?force=webgl&seed=271828&run=1",
  { viewport: { width: 1440, height: 900 } },
  { requireRenderer: "webgl", requireSurface: true }
);
report.runs.webgpu = await routeRun(
  "webgpu",
  {
    headless: false,
    args: [
      "--enable-unsafe-webgpu",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-gpu",
      "--enable-features=Vulkan",
      "--use-angle=vulkan",
      "--use-vulkan=swiftshader",
      "--use-webgpu-adapter=swiftshader",
      "--disable-vulkan-surface",
      "--ozone-platform=x11",
      "--window-size=1440,900",
    ],
  },
  "?seed=271828&run=1",
  { viewport: { width: 1440, height: 900 } },
  { requireRenderer: "webgpu", requireSurface: true, watchDevice: true }
);

report.pass = Object.values(report.runs).every((run) => run.pass);
report.failedRuns = Object.entries(report.runs).filter(([, run]) => !run.pass).map(([name]) => name);

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

if (!report.pass) {
  console.error("LIVE STAGING ACCEPTANCE FAILED:", report.failedRuns.join(", "));
  process.exitCode = 1;
}
