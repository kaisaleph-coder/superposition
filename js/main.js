/* SUPERPOSITION boot (PLAN §6 load order).
   Runs deferred: re-render views from data (ADR-004), start router, detect tier,
   then dynamic-import the field engine after first paint (P2+). The field is a
   progressive enhancement — every failure path lands on the static T0 ground. */

import { renderAll } from "./render-dom.js";
import { createRouter } from "./router.js";
import { detectTier, TIERS } from "./field/tier.js";

const body = document.body;
const q = new URLSearchParams(location.search);

const data = window.__RESUME__;
if (data) renderAll(data, document);

let engine = null;
const router = createRouter(document, {
  onState(id, detail = {}) {
    if (!engine) return;
    if (detail.togglePause) { engine.togglePause(); return; }
    engine.setState(id, detail);
  },
});

// §5.4 tier detection → DOM contract attrs
const tier = detectTier({ force: q.get("force") });
body.dataset.tier = String(tier);
body.dataset.renderer = TIERS[tier].renderer;

// Field engine loads after first paint, only above T0 (dynamic import per §6)
if (tier > 0) {
  requestAnimationFrame(() => {
    requestAnimationFrame(async () => {
      try {
        const { FieldEngine } = await import("./field/engine.js");
        engine = await FieldEngine.init(document.getElementById("field"), {
          tier,
          seed: q.get("seed"),
          force: q.get("force"),
          data,
        });
        // engine may have downgraded (e.g. WebGPU init failure → WebGL)
        body.dataset.tier = String(engine.tier);
        body.dataset.renderer = engine.renderer;
        engine.setState(router.current, { first: true });
      } catch (err) {
        // init failure → T0 static ground (§2.1); site remains fully functional
        body.dataset.tier = "0";
        body.dataset.renderer = "static";
      }
    });
  });
}
