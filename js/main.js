/* SUPERPOSITION boot (PLAN §6 load order).
   Runs deferred: re-render views from data (ADR-004), start router, detect tier,
   then start the normal field; legacy QA imports remain after first paint (P2+). The field is a
   progressive enhancement — every failure path lands on the static T0 ground. */

import { renderAll, FACET_ORDER } from "./render-dom.js";
import { createRouter } from "./router.js";
import { detectTier, TIERS } from "./field/tier.js";
import { createUIShell } from "./ui-shell.js";
import { createAppearanceController } from "./field/appearance.js";
import { createFallbackRecipeController } from "./field/v2/fallback-controller.js";

const body = document.body;
const q = new URLSearchParams(location.search);

const data = window.__RESUME__;
if (data) renderAll(data, document);

let engine = null;
const fallbackController = createFallbackRecipeController(document, { seed: q.get("seed") });
const appearance = createAppearanceController(document, { seed: q.get("seed") });
const activeController = () => engine || fallbackController;
const router = createRouter(document, {
  onState(id, detail = {}) {
    const target = activeController();
    if (detail.togglePause) { target.togglePause?.(); return; }
    appearance.setState(id);
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

let swipe = null, lastSwipeAt = -Infinity;
const touchPointers = new Set();
const gestureControls = 'a,button,input,select,textarea,[role="button"],[role="slider"],#sand-lab,.index-overlay,.system-panel';
addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse') return;
  touchPointers.add(e.pointerId);
  if (touchPointers.size !== 1 || e.isPrimary === false) { swipe = null; return; }
  if (e.target.closest?.(gestureControls) || document.body.dataset.index === 'open') { swipe = null; return; }
  swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
}, { passive: true });
addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse') return;
  const started = swipe;
  touchPointers.delete(e.pointerId);
  swipe = null;
  if (!started || started.id !== e.pointerId || touchPointers.size) return;
  if(body.dataset.fieldTouchOwned==='1')return;
  if (!document.getSelection()?.isCollapsed) return;
  const now = performance.now(), dx = e.clientX - started.x, dy = e.clientY - started.y;
  if (now - started.t < 600 && now - lastSwipeAt >= 700 && Math.abs(dx) > 80 && Math.abs(dx) > 2.5 * Math.abs(dy)) {
    lastSwipeAt = now;
    domainStep(dx < 0 ? 1 : -1, { wrap: true });
  }
}, { passive: true });
addEventListener('pointercancel', (e) => { touchPointers.delete(e.pointerId); swipe = null; }, { passive: true });
// Phone orientation and ordinary touch scrolling do not steer or strike the plate.

const tier = detectTier({ force: q.get("force") });
body.dataset.tier = String(tier);
body.dataset.renderer = TIERS[tier].renderer;
// js/head.js gave the page its sand form before first paint. If this load will not start
// the resonance field after all, give the legacy page back at once.
const wantSand = (tier === 1 || tier === 2) && !q.has("seed") && !q.get("force");
if (!wantSand) document.documentElement.classList.remove("sand", "sand-pending");

// The resonance engine could not hold frame rate or lost its device: land on the static ground.
function toStatic(reason) {
  engine = null;
  document.documentElement.dataset.fieldStartup="fallback";
  document.documentElement.classList.remove("sand","sand-pending");
  body.dataset.fieldError = String(reason).slice(0, 160);
  body.dataset.tier = "0";
  body.dataset.renderer = "static";
  delete body.dataset.engine;
  fallbackController.setState(router.current, { first: true });
  appearance.setState(router.current);
}

if (tier > 0) {
  const initializeField = async () => {
      if(!wantSand&&!q.has("seed")&&!q.get("force")){toStatic("animated appearance unavailable");return;}
      // Hardware WebGPU and no QA parameter: the resonance field (js/field/resonance.js).
      // Anything else, or any failure, continues into the legacy field below.
      if(document.documentElement.dataset.fieldStartup==="fallback"){toStatic("startup watchdog");return;}
      if (wantSand) {
        document.documentElement.dataset.fieldStartup="preparing";
        try {
          const { Resonance } = await import("./field/resonance.js");
          if(document.documentElement.dataset.fieldStartup==="fallback"){toStatic("startup watchdog");return;}
          const initialized = await Resonance.init(document, { theme: fallbackController, mobile: tier === 2, appearance, state: router.current, onFail: toStatic });
          if(document.documentElement.dataset.fieldStartup==="fallback"){initialized.dispose();toStatic("startup watchdog");return;}
          engine=initialized;document.documentElement.dataset.fieldStartup="ready";
          engine.setState?.(router.current, { first: true });
          body.dataset.renderer = "webgpu";
          body.dataset.engine = "resonance"; if (q.has("timing")) document.documentElement.dataset.fieldEngineReady = String(performance.now());
          uiShell.updateSystem();
          return;
        } catch (err) {
          engine = null;
          if(err?.code==='APPEARANCE_SUPERSEDED'&&document.documentElement.dataset.fieldStartup!=='fallback'){document.documentElement.classList.add('sand');return initializeField();}
          document.documentElement.classList.remove("sand", "sand-pending");
          console.warn("resonance: " + (err?.message || err));
          body.dataset.resonanceError = String(err?.message || err).slice(0, 160);
          toStatic(err?.message || err); return;
        }
      }
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
  };
  if (wantSand) void initializeField();
  else requestAnimationFrame(() => requestAnimationFrame(initializeField));
}
