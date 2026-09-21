import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import os from "node:os";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(import.meta.url);
const pwVersion = require("@playwright/test/package.json").version;
const outDir = "gpu-qa";
fs.mkdirSync(outDir, { recursive: true });
const origin = "http://127.0.0.1:8080";
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
const expectedDomains = routes.map(([domain]) => domain);

const report = {
  timestamp: new Date().toISOString(),
  os: { platform: os.platform(), release: os.release(), arch: os.arch() },
  playwright: pwVersion,
  executablePath: chromium.executablePath(),
  origin,
  launches: [],
};

const expectedConsole = [
  { id: "webgpu-unavailable-probe", re: /^warning: No available adapters\.?$/ },
  { id: "swiftshader-readpixels", re: /^warning: \[\.WebGL-.*GPU stall due to ReadPixels/ },
];

function classifyConsole(messages = []) {
  const expected = [], unexpected = [];
  for (const message of messages) {
    const hit = expectedConsole.find(({ re }) => re.test(message));
    (hit ? expected : unexpected).push(hit ? { id: hit.id, message } : message);
  }
  return { expected, unexpected };
}

function gpuErrorStrings(values = []) {
  const re = /(GPUDevice|createBuffer|allocation|buffer failed|device lost|DeviceLost|OperationError|RangeError)/i;
  return values.filter((v) => re.test(String(v)));
}

async function caps(page) {
  return await page.evaluate(async () => {
    const c = document.createElement("canvas");
    let gl = null, gl2 = null;
    try { gl = c.getContext("webgl"); } catch {}
    try { gl2 = c.getContext("webgl2"); } catch {}
    const info = (g) => g ? {
      version: g.getParameter(g.VERSION),
      renderer: g.getParameter(g.RENDERER),
      vendor: g.getParameter(g.VENDOR),
      unmaskedRenderer: (() => {
        const e = g.getExtension("WEBGL_debug_renderer_info");
        return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : null;
      })(),
    } : null;
    let webgpuAdapter = false, webgpuInfo = null, webgpuLimits = null;
    if (navigator.gpu) {
      try {
        const a = await navigator.gpu.requestAdapter();
        webgpuAdapter = !!a;
        webgpuInfo = a?.info ? {
          vendor: a.info.vendor,
          architecture: a.info.architecture,
          device: a.info.device,
          description: a.info.description,
        } : null;
        webgpuLimits = a?.limits ? {
          maxBufferSize: Number(a.limits.maxBufferSize),
          maxStorageBufferBindingSize: Number(a.limits.maxStorageBufferBindingSize),
        } : null;
      } catch {}
    }
    return { webgpu: !!navigator.gpu, webgpuAdapter, webgpuInfo, webgpuLimits, webgl: info(gl), webgl2: info(gl2) };
  });
}

async function launchProbe(name, args = []) {
  const entry = { name, args, plain: name === "plain-default", errors: [], console: [] };
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args });
    entry.browserVersion = browser.version();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => entry.errors.push(String(e)));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) entry.console.push(m.type() + ": " + m.text());
    });
    await page.goto(origin + "/?force=static&seed=271828", { waitUntil: "load" });
    entry.capabilities = await caps(page);
    await page.close();
  } catch (e) {
    entry.launchError = String(e);
  } finally {
    await browser?.close().catch(() => {});
  }
  const classified = classifyConsole(entry.console);
  entry.consoleExpected = classified.expected;
  entry.consoleUnexpected = classified.unexpected;
  entry.gpuErrors = gpuErrorStrings([...entry.errors, ...entry.consoleUnexpected]);
  report.launches.push(entry);
  return entry;
}

await launchProbe("plain-default", []);

const sets = [
  ["swiftshader-webgl", ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"]],
  ["vulkan-dawn", ["--enable-unsafe-webgpu", "--enable-features=Vulkan,UseSkiaRenderer", "--use-angle=vulkan", "--disable-vulkan-surface", "--enable-dawn-features=allow_unsafe_apis"]],
  ["swiftshader-dawn", ["--enable-unsafe-webgpu", "--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader", "--enable-dawn-features=allow_unsafe_apis"]],
];
for (const [name, args] of sets) await launchProbe(name, args);

const bestWebgl = report.launches.find((x) => x.capabilities?.webgl2 || x.capabilities?.webgl) || report.launches[0];
const bestWebgpu = report.launches.find((x) => x.capabilities?.webgpuAdapter);

async function rendererRun(kind, launch) {
  if (!launch) return { kind, available: false, states: [], errors: [], console: [], consoleExpected: [], consoleUnexpected: [], gpuErrors: [] };
  const run = { kind, available: true, launch: launch.name, states: [], errors: [], console: [] };
  let browser;
  try {
    browser = await chromium.launch({ headless: true, args: launch.args });
    run.browserVersion = browser.version();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => run.errors.push(String(e)));
    page.on("console", (m) => {
      if (["error", "warning"].includes(m.type())) run.console.push(m.type() + ": " + m.text());
    });
    for (const [domain, hash] of routes) {
      const query = kind === "webgl" ? "?force=webgl&seed=271828&run=1" : "?seed=271828&run=1";
      await page.goto(origin + "/" + query + hash, { waitUntil: "load" });
      await page.waitForFunction(
        ({ expected, renderer }) =>
          document.body.dataset.renderDomain === expected &&
          document.body.dataset.renderer === renderer &&
          Number(document.body.dataset.surfaceLayers) > 0,
        { expected: domain, renderer: kind },
        { timeout: 15000 }
      );
      await page.waitForTimeout(1000);
      const state = await page.evaluate(() => ({
        renderer: document.body.dataset.renderer,
        tier: document.body.dataset.tier,
        domain: document.body.dataset.renderDomain,
        recipe: document.body.dataset.recipe,
        topology: document.body.dataset.topology,
        layers: document.body.dataset.layers,
        surfaceLayers: document.body.dataset.surfaceLayers,
        cost: document.body.dataset.cost,
        chromatic: document.body.dataset.chromatic,
        particles: document.body.dataset.particles || null,
        gpuProfile: document.body.dataset.gpuProfile || null,
        fps: document.body.dataset.fps || null,
      }));
      const file = path.join(outDir, `${kind}-${domain}.png`);
      await page.screenshot({ path: file, fullPage: false });
      run.states.push({ domain, ...state, screenshot: file, screenshotExists: fs.existsSync(file) });
    }
  } catch (e) {
    run.runError = String(e);
  } finally {
    await browser?.close().catch(() => {});
  }
  const classified = classifyConsole(run.console);
  run.consoleExpected = classified.expected;
  run.consoleUnexpected = classified.unexpected;
  run.gpuErrors = gpuErrorStrings([...run.errors, ...run.consoleUnexpected, run.runError || ""]);
  return run;
}

report.webgl = await rendererRun("webgl", bestWebgl);
report.webgpu = await rendererRun("webgpu", bestWebgpu);

function statesExactly(run, renderer) {
  return run.available &&
    run.states.length === expectedDomains.length &&
    run.states.every((s, i) =>
      s.domain === expectedDomains[i] &&
      s.renderer === renderer &&
      Number(s.surfaceLayers) > 0 &&
      s.screenshotExists
    );
}
function clean(run) {
  return run.available &&
    !run.runError &&
    run.errors.length === 0 &&
    run.consoleUnexpected.length === 0 &&
    run.gpuErrors.length === 0;
}

const swiftshaderWebgpu = /swiftshader/i.test(String(bestWebgpu?.capabilities?.webgpuInfo?.architecture || ""));
const portableParticlePass = !swiftshaderWebgpu || (
  report.webgpu.states.length === expectedDomains.length &&
  report.webgpu.states.every((s) =>
    s.gpuProfile === "portable-swiftshader" &&
    Number(s.particles) > 0 &&
    Number(s.particles) <= 32768
  )
);

report.verdict = {
  plainLaunch: !report.launches[0]?.launchError,
  plainProbeClean: report.launches[0]?.errors.length === 0 && report.launches[0]?.consoleUnexpected.length === 0 && report.launches[0]?.gpuErrors.length === 0,
  webglExecutedAllStates: statesExactly(report.webgl, "webgl"),
  webglErrorClean: clean(report.webgl),
  webgpuAdapterAvailable: !!bestWebgpu,
  webgpuExecutedAllStates: statesExactly(report.webgpu, "webgpu"),
  webgpuErrorClean: clean(report.webgpu),
  portableParticleProfile: portableParticlePass,
};
report.pass = Object.values(report.verdict).every(Boolean);
report.failed = Object.entries(report.verdict).filter(([, value]) => !value).map(([key]) => key);

fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.pass) {
  console.error("STRICT GPU GATE FAILED:", report.failed.join(", "));
  process.exitCode = 1;
}
