/* FieldEngine (PLAN §5.3) — the ONLY public surface of the field.
   init(canvas, opts) → { setWeights, setState, setPointer, pause, resume,
   togglePause, dispose, state, tier, renderer }. Everything QA-observable is
   mirrored to <body data-*> (§5.6): data-renderer, data-tier, data-paused,
   data-fps (test mode), data-settled (test mode), data-field-boot-ms. */

import * as THREE from "three/webgpu";
import { TIERS, downshift } from "./tier.js";
import { FACET_IDS, buildAttractors, buildCitizenship, packTargets } from "./attractors.js";
import { createSim, MODES } from "./sim.tsl.js";
import { createRenderMesh } from "./render.tsl.js";
import { createPointer } from "./pointer.js";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const BLEND_MS = 1150, BOOT_MS = 2000, SETTLE_FRAME = 240;

export const FieldEngine = {
  async init(canvas, { tier, seed = null, force = null, data = null, run = false } = {}) {
    const body = canvas.ownerDocument.body;
    const testMode = seed !== null && seed !== undefined && seed !== "";
    const seedNum = testMode ? (parseFloat(seed) || 1) * 17.13 : Math.random() * 1000;

    const renderer = new THREE.WebGPURenderer({
      canvas, antialias: false, alpha: true,
      forceWebGL: force === "webgl",
    });
    await renderer.init();
    const backend = renderer.backend.isWebGPUBackend ? "webgpu" : "webgl";
    // tier follows the actual backend (webgpu request may land on webgl)
    if (backend === "webgl" && (tier === 1 || tier === 2)) tier = tier === 1 ? 3 : 4;
    const N = TIERS[tier].particles;
    const mobile = tier === 2 || tier === 4;

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.setClearColor(0x000000, 0); // paper is CSS; canvas stays transparent

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 100);

    // buffers (CPU boot ≈ tens of ms at 131k; §2.2 zero-asset geometry)
    const { gens, domainOf } = buildAttractors(N, data);
    const targetsData = packTargets(N, gens);
    const citData = buildCitizenship(N, data);
    const domData = new Uint32Array(N);
    for (let i = 0; i < N; i++) domData[i] = domainOf(i);

    const sim = createSim(N, { targetsData, citData, domData, seed: seedNum });
    const { mesh, uniforms: rUniforms } = createRenderMesh(N, sim, { mobile });
    scene.add(mesh);

    // dark scheme: pale particles (§3.1); Klein unchanged
    const darkMq = matchMedia("(prefers-color-scheme: dark)");
    const applyScheme = () => rUniforms.uInk.value.set(darkMq.matches ? "#C9CFDB" : "#10131A");
    applyScheme();
    darkMq.addEventListener("change", applyScheme);

    // ---------- state ----------
    let simT = 0, wallLast = performance.now(), frame = 0;
    let stateId = "home", modeFrom = { ...MODES.home }, modeTo = { ...MODES.home };
    let blendStart = 0, blendDur = BOOT_MS / 1000, yaw = 0.6;
    let userPaused = false, hiddenPaused = false, offscreenPaused = false, frozen = false;
    let rafId = 0, running = false, disposed = false, settled = false;
    let curTier = tier, drawN = N, lowStreak = 0, fpsFrames = 0, fpsClock = performance.now();
    let bootMarked = false, scrollP = 0;

    const doc = canvas.ownerDocument;
    const pointer = createPointer(canvas);

    const repeatVisit = (() => {
      try { return sessionStorage.getItem("sp-boot") === "1"; } catch { return false; }
    })();

    const eased = () => easeInOut(Math.min(1, (simT - blendStart) / blendDur));

    function dispatchRetarget(newStateIdx) {
      sim.prevEased.value = eased();
      sim.uniforms.state.value = newStateIdx;
      renderer.compute(sim.kernels.retarget);
      blendStart = simT;
      blendDur = BLEND_MS / 1000;
    }

    function stateIndexOf(id) {
      const i = FACET_IDS.indexOf(id);
      return i === -1 ? 7 : i; // 7 = home/citizenship (record keeps last/home targets)
    }

    // boot: seeded noise → superposition over 2 s (§3.4); instant on repeat visits
    sim.uniforms.state.value = 7;
    renderer.compute(sim.kernels.init);
    if (repeatVisit || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sim.prevEased.value = 1;
      renderer.compute(sim.kernels.retarget); // fromT ← toT: start settled
      blendStart = -10; blendDur = 0.001;
    } else {
      blendStart = 0; blendDur = BOOT_MS / 1000;
    }
    try { sessionStorage.setItem("sp-boot", "1"); } catch {}

    function updatePauseAttr() {
      const paused = userPaused || hiddenPaused || offscreenPaused;
      body.toggleAttribute("data-paused", paused);
      if (!paused && !running && !disposed) { running = true; wallLast = performance.now(); rafId = requestAnimationFrame(loop); }
      if (paused && running) { running = false; cancelAnimationFrame(rafId); }
    }

    function sampleFps(now) {
      fpsFrames++;
      if (now - fpsClock >= 1000) {
        const fps = (fpsFrames * 1000) / (now - fpsClock);
        fpsFrames = 0; fpsClock = now;
        body.dataset.fps = fps.toFixed(0);
        if (fps < 45) {
          if (++lowStreak >= 3 && curTier !== downshift(curTier)) {
            curTier = downshift(curTier);
            drawN = Math.min(drawN, TIERS[curTier].particles);
            mesh.count = drawN;
            body.dataset.tier = String(curTier);
            lowStreak = 0;
          }
        } else lowStreak = 0;
      }
    }

    function loop(now) {
      if (!running || disposed) return;
      rafId = requestAnimationFrame(loop);
      stepOnce(now);
    }

    function stepOnce(now, forceDt) {
      const dt = forceDt ?? (testMode ? 1 / 60 : Math.min((now - wallLast) / 1000, 0.033));
      wallLast = now;
      simT += dt;
      frame++;

      const e = eased();
      const slowF = sim.uniforms.slow.value;
      sim.uniforms.dt.value = dt;
      sim.uniforms.t.value = simT;
      sim.uniforms.blend.value = e;
      // §2.5 scroll: field firms up as you read deeper (facet states only)
      const scrollTighten = stateId !== "home" && stateId !== "record" ? 1 + 0.35 * scrollP : 1;
      sim.uniforms.k.value = lerp(modeFrom.k, modeTo.k, e) * scrollTighten;
      sim.uniforms.noise.value = lerp(modeFrom.noise, modeTo.noise, e);
      sim.uniforms.damp.value = lerp(modeFrom.damp, modeTo.damp, e);

      yaw += 0.07 * dt * slowF;
      const yawView = yaw + (scrollP * 2 - 1) * 0.1396 * (stateId !== "home" && stateId !== "record" ? 1 : 0); // ±8°
      const pitch = lerp(modeFrom.pitch, modeTo.pitch, e) + 0.05 * Math.sin(simT * 0.11);
      const el = -pitch, D = 2.7;
      camera.position.set(
        D * Math.cos(el) * Math.sin(yawView),
        D * Math.sin(el),
        D * Math.cos(el) * Math.cos(yawView)
      );
      camera.lookAt(0, 0, 0);

      pointer.update(camera, dt);
      sim.uniforms.pointer.value.copy(pointer.state.world);
      sim.uniforms.pointerStrength.value = frozen ? 0 : pointer.state.strength;

      if (!frozen) renderer.compute(sim.kernels.update);
      renderer.render(scene, camera);

      if (!bootMarked) {
        bootMarked = true;
        performance.mark("field-first-frame");
        body.dataset.fieldBootMs = performance.now().toFixed(0);
      }
      sampleFps(now);

      // deterministic test mode: freeze at a fixed sim frame for pixel-stable shots
      if (testMode && !settled && frame >= SETTLE_FRAME) {
        settled = true;
        body.dataset.settled = "1";
        if (!run) { userPaused = true; updatePauseAttr(); }
      }
    }

    // ---------- courtesies (§2.5) ----------
    hiddenPaused = doc.hidden; // page may load while hidden
    const onVis = () => { hiddenPaused = doc.hidden; updatePauseAttr(); };
    doc.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver((entries) => {
      offscreenPaused = entries[0] ? !entries[0].isIntersecting : false;
      updatePauseAttr();
    });
    io.observe(canvas);
    const onResize = () => {
      renderer.setSize(innerWidth, innerHeight, false);
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
    };
    addEventListener("resize", onResize);

    // ---------- public surface ----------
    const api = {
      renderer: backend,
      get tier() { return curTier; },
      get state() { return stateId; },

      /* Router glue: home | facet-id | record, with dossier/domain detail. */
      setState(id, { dossier = false, domain = -1, togglePause = false } = {}) {
        if (togglePause) { api.togglePause(); return; }
        const target = id === "home" || id === "record" ? id : FACET_IDS.includes(id) ? id : "home";
        const changed = target !== stateId;
        stateId = target;
        frozen = target === "record"; // §2.1: record freezes to a faint still
        sim.uniforms.slow.value = dossier && target !== "clusters" ? 0.5 : 1;
        sim.uniforms.focusDomain.value = target === "clusters" ? domain : -1;
        if (changed) {
          const e = eased();
          modeFrom = {
            k: lerp(modeFrom.k, modeTo.k, e),
            noise: lerp(modeFrom.noise, modeTo.noise, e),
            damp: lerp(modeFrom.damp, modeTo.damp, e),
            pitch: lerp(modeFrom.pitch, modeTo.pitch, e),
          };
          modeTo = { ...(MODES[target === "home" ? "home" : target] || MODES.home) };
          dispatchRetarget(stateIndexOf(target === "record" ? "home" : target));
        }
      },

      /* PLAN-named surface (§5.3): arbitrary attractor weights → blended target.
         Normalizes, snapshots the current eased target, morphs to the weighted blend.
         The internal state machine uses the citizenship retarget (§2.3) instead. */
      setWeights(w) {
        const arr = FACET_IDS.map((_, a) => Math.max(0, w?.[a] ?? 0));
        const sum = arr.reduce((s, x) => s + x, 0) || 1;
        sim.prevEased.value = eased();
        arr.forEach((x, a) => { sim.weights[a].value = x / sum; });
        renderer.compute(sim.kernels.blendWeights);
        blendStart = simT;
        blendDur = BLEND_MS / 1000;
      },
      setPointer(x, y) {
        pointer.state.x = x; pointer.state.y = y; pointer.state.active = 1;
      },
      /* §2.5 scroll progress 0→1 within a facet (native scroll; no scroll-jacking). */
      setScroll(p) {
        scrollP = Math.max(0, Math.min(1, p));
        if (testMode) body.dataset.scroll = scrollP.toFixed(2);
      },
      /* Deterministic manual stepping (debug/QA): advance n fixed-dt frames now,
         independent of rAF/visibility. */
      step(n = 1, dt = 1 / 60) {
        for (let i = 0; i < n; i++) stepOnce(performance.now(), dt);
      },
      pause() { userPaused = true; updatePauseAttr(); },
      resume() { userPaused = false; settled && delete body.dataset.settled; settled = false; updatePauseAttr(); },
      togglePause() { userPaused ? api.resume() : api.pause(); },
      dispose() {
        disposed = true; running = false; cancelAnimationFrame(rafId);
        doc.removeEventListener("visibilitychange", onVis);
        removeEventListener("resize", onResize);
        darkMq.removeEventListener("change", applyScheme);
        io.disconnect(); pointer.dispose(); renderer.dispose();
      },
    };

    body.dataset.renderer = backend;
    body.dataset.tier = String(curTier);
    updatePauseAttr(); // starts the loop
    return api;
  },
};
