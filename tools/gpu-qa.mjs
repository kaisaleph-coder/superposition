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

async function launchProbe(name, args = [], { headless = true, plain = false } = {}) {
  const entry = { name, args, headless, plain, errors: [], console: [] };
  let browser;
  try {
    // User-required preflight stays literally plain/default; specialized GPU launch
    // settings are only introduced after this launch succeeds.
    browser = plain ? await chromium.launch() : await chromium.launch({ headless, args });
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

await launchProbe("plain-default", [], { plain: true });

const sets = [
  [
    "swiftshader-webgl",
    ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
    { headless: true },
  ],
  [
    "swiftshader-vulkan-webgpu",
    [
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
    { headless: false },
  ],
];
for (const [name, args, options] of sets) await launchProbe(name, args, options);

const bestWebgl = report.launches.find((x) => x.name === "swiftshader-webgl" && (x.capabilities?.webgl2 || x.capabilities?.webgl)) || report.launches[0];
const bestWebgpu = report.launches.find((x) => x.name === "swiftshader-vulkan-webgpu" && x.capabilities?.webgpuAdapter);

async function rendererRun(kind, launch) {
  if (!launch) return { kind, available: false, states: [], errors: [], console: [], consoleExpected: [], consoleUnexpected: [], gpuErrors: [] };
  const run = {
    kind, available: true, launch: launch.name, states: [], errors: [], console: [],
    teardownErrors: [], teardownUnexpected: [], deviceLost: null,
  };
  let browser;
  let capturingRuntime = true;
  try {
    browser = await chromium.launch({ headless: launch.headless, args: launch.args });
    run.browserVersion = browser.version();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on("pageerror", (e) => {
      (capturingRuntime ? run.errors : run.teardownErrors).push(String(e));
    });
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

      if (kind === "webgpu" && domain === "home") {
        await page.evaluate(() => {
          const device = window.__engineDebug?._debug?.renderer?.backend?.device;
          if (!device || window.__spGpuLossWatchInstalled) return;
          window.__spGpuLossWatchInstalled = true;
          window.__spGpuDeviceLost = null;
          device.lost.then((info) => {
            window.__spGpuDeviceLost = {
              reason: String(info?.reason || "unknown"),
              message: String(info?.message || ""),
            };
          });
        });
      }
    }

    // Keep an explicit observation window after the final rendered state. Do not use
    // queue.onSubmittedWorkDone() here: software WebGPU implementations can leave that
    // promise pending despite presented frames, which would turn a renderer gate into
    // an unbounded synchronization test. Runtime page errors and device.lost remain live.
    if (kind === "webgpu") {
      await page.waitForTimeout(2000);
      run.deviceLost = await page.evaluate(() => window.__spGpuDeviceLost || null);
    }

    capturingRuntime = false;
    await page.close();
  } catch (e) {
    run.runError = String(e);
  } finally {
    capturingRuntime = false;
    await browser?.close().catch(() => {});
  }
  const classified = classifyConsole(run.console);
  run.consoleExpected = classified.expected;
  run.consoleUnexpected = classified.unexpected;
  run.teardownUnexpected = run.teardownErrors.filter(
    (message) => message !== "OperationError: Instance dropped in popErrorScope"
  );
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
    run.gpuErrors.length === 0 &&
    run.teardownUnexpected.length === 0;
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
  webgpuDeviceStable: report.webgpu.deviceLost === null,
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
