/* SUPERPOSITION boot (PLAN §6 load order).
   Runs deferred: re-render views from data (ADR-004), start router, detect tier,
   then dynamic-import the field engine after first paint (P2+). The field is a
   progressive enhancement — every failure path lands on the static T0 ground. */

import { renderAll, FACET_ORDER } from "./render-dom.js";
import { createRouter } from "./router.js";
import { detectTier, TIERS } from "./field/tier.js";
import { createUIShell } from "./ui-shell.js";
import { createFallbackRecipeController } from "./field/v2/fallback-controller.js";

const body = document.body;
const q = new URLSearchParams(location.search);

const data = window.__RESUME__;
if (data) renderAll(data, document);

let engine = null;
const fallbackController = createFallbackRecipeController(document, { seed: q.get("seed") });
const activeController = () => engine || fallbackController;
const router = createRouter(document, {
  onState(id, detail = {}) {
    const target = activeController();
    if (detail.togglePause) { target.togglePause?.(); return; }
    target.setState?.(id, detail);
  },
});

const uiShell = createUIShell(document, { getEngine: activeController });

const mainEl = document.querySelector("main");
mainEl.addEventListener(
  "scroll",
  () => {
    if (!engine) return;
    const max = mainEl.scrollHeight - mainEl.clientHeight;
    engine.setScroll(max > 0 ? mainEl.scrollTop / max : 0);
  },
  { passive: true }
);

function domainStep(dir, { wrap }) {
  const cur = body.dataset.facet;
  if (body.dataset.state === "record") return;
  if (!cur) { router.go(dir > 0 ? FACET_ORDER[0] : FACET_ORDER[FACET_ORDER.length - 1]); return; }
  const i = FACET_ORDER.indexOf(cur) + dir;
  if (wrap) router.go(FACET_ORDER[(i + FACET_ORDER.length) % FACET_ORDER.length]);
  else if (i >= 0 && i < FACET_ORDER.length) router.go(FACET_ORDER[i]);
  else if (i < 0) router.go("home");
}

let wheelAcc = 0, wheelCooldownUntil = 0, wheelAccReset = 0;
mainEl.addEventListener(
  "wheel",
  (e) => {
    const now = performance.now();
    if (now < wheelCooldownUntil) { wheelAcc = 0; return; }
    const atBottom = mainEl.scrollTop + mainEl.clientHeight >= mainEl.scrollHeight - 2;
    const atTop = mainEl.scrollTop <= 2;
    const dir = e.deltaY > 0 ? 1 : -1;
    if ((dir > 0 && !atBottom) || (dir < 0 && !atTop)) { wheelAcc = 0; return; }
    if (now > wheelAccReset) wheelAcc = 0;
    wheelAccReset = now + 250;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) >= 120) {
      wheelAcc = 0;
      wheelCooldownUntil = now + 900;
      domainStep(dir, { wrap: false });
    }
  },
  { passive: true }
);

let swipe = null;
addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse") return;
  swipe = { x: e.clientX, y: e.clientY, t: performance.now() };
}, { passive: true });
addEventListener("pointerup", (e) => {
  if (!swipe || e.pointerType === "mouse") return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, dt = performance.now() - swipe.t;
  swipe = null;
  if (dt < 600 && Math.abs(dx) > 60 && Math.abs(dx) > 2 * Math.abs(dy)) {
    domainStep(dx < 0 ? 1 : -1, { wrap: true });
  }
}, { passive: true });

if (matchMedia("(pointer: coarse)").matches && "DeviceOrientationEvent" in window) {
  const listen = () =>
    addEventListener("deviceorientation", (e) => {
      if (engine && e.gamma !== null) {
        engine.setParallax(e.gamma / 30, (e.beta - 45) / 30);
      }
    }, { passive: true });
  if (typeof DeviceOrientationEvent.requestPermission === "function") {
    const askOnce = () => {
      DeviceOrientationEvent.requestPermission().then((s) => s === "granted" && listen()).catch(() => {});
      removeEventListener("pointerdown", askOnce);
    };
    addEventListener("pointerdown", askOnce, { passive: true });
  } else {
    listen();
  }
}

const tier = detectTier({ force: q.get("force") });
body.dataset.tier = String(tier);
body.dataset.renderer = TIERS[tier].renderer;

if (tier > 0) {
  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {
      try {
        const { FieldEngine } = await import("./field/engine.js");
        engine = await FieldEngine.init(document.getElementById("field"), {
          tier,
          seed: q.get("seed"),
          force: q.get("force"),
          run: q.has("run"),
          data,
        });
        body.dataset.tier = String(engine.tier);
        body.dataset.renderer = engine.renderer;
        if (q.has("seed")) window.__engineDebug = engine;
        engine.setState(router.current, { first: true });
        uiShell.updateSystem();
      } catch (err) {
        body.dataset.tier = "0";
        body.dataset.renderer = "static";
        fallbackController.setState(router.current, { first: true });
      }
    });
  });
}
