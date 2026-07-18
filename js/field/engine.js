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
// SETTLE_FRAME: deterministic test-mode freeze point. 420 frames = 7 sim-seconds —
// boot/retarget flight (≤2 s) + full spring equilibrium (pos error ≈ noise/k) so
// fixed-seed screenshots capture settled structure, not flight blur.
const BLEND_MS = 1150, BOOT_MS = 2000, SETTLE_FRAME = 420;

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

    // Eight static per-state target sets (ADR-005: no uploads or dynamic reads on the
    // WebGL backend — everything the GPU will ever target is baked at boot):
    // 0–6 attractors (dom id in w for CLUSTERS), 7 = citizenship home (§2.3).
    const F = FACET_IDS.length, HOME = F; // state indices: 0..F-1 facets, F = home
    const CLUSTERS_IDX = FACET_IDS.indexOf("clusters");
    const stateTargets = [];
    for (let s = 0; s <= F; s++) {
      const arr = new Float32Array(N * 4);
      for (let i = 0; i < N; i++) {
        const a = s === HOME ? citData[i] : s;
        const j = (a * N + i) * 3;
        arr[i * 4] = targetsData[j];
        arr[i * 4 + 1] = targetsData[j + 1];
        arr[i * 4 + 2] = targetsData[j + 2];
        arr[i * 4 + 3] = a === CLUSTERS_IDX ? domData[i] : -1;
      }
      stateTargets.push(arr);
    }

    // I4: pale per-domain palette — one hue per home domain, applied per particle.
    // Order matches FACET_IDS: columns, frame, tables, lattice, surface, clusters, vector, orbit.
    const PALETTE = ["#9FBBE0", "#ADB6CE", "#DCC49A", "#B5A6E0", "#93C6C2", "#A8CBA0", "#8FB0EE", "#D3A9C5"]
      .map((h) => new THREE.Color(h));
    const colorsData = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const c = PALETTE[citData[i] % PALETTE.length];
      colorsData[i * 3] = c.r; colorsData[i * 3 + 1] = c.g; colorsData[i * 3 + 2] = c.b;
    }

    const sim = createSim(N, {
      stateTargets,
      stateIds: [...FACET_IDS, "home"],
      colorsData,
      seed: seedNum,
      webgpu: backend === "webgpu",
    });
    const { mesh, uniforms: rUniforms } = createRenderMesh(N, sim, { mobile });
    scene.add(mesh);

    // dark scheme: brighten the pastel palette slightly (§3.1: Klein charge unchanged)
    const darkMq = matchMedia("(prefers-color-scheme: dark)");
    const applyScheme = () => { rUniforms.uTone.value = darkMq.matches ? 1.18 : 1.0; };
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
    const par = { x: 0, y: 0, tx: 0, ty: 0, gyro: false }; // I5 parallax state
    const finePointer = matchMedia("(pointer: fine)").matches;
    let castTarget = 0; // I4 domain-cast blend target

    const doc = canvas.ownerDocument;
    const pointer = createPointer(canvas);

    const repeatVisit = (() => {
      try { return sessionStorage.getItem("sp-boot") === "1"; } catch { return false; }
    })();

    const eased = () => easeInOut(Math.min(1, (simT - blendStart) / blendDur));

    // Retarget = CPU-side kernel switch (ADR-005: no inter-kernel GPU data flow).
    let activeState = HOME, weightsMode = false;
    function dispatchRetarget(newStateIdx) {
      activeState = newStateIdx;
      weightsMode = false;
      blendStart = simT;          // paces the CPU mode-parameter easing; the morph
      blendDur = BLEND_MS / 1000; // itself is the spring flight (§5.3, ADR-005)
    }

    function stateIndexOf(id) {
      const i = FACET_IDS.indexOf(id);
      return i === -1 ? HOME : i; // HOME = citizenship blend (record keeps home targets)
    }

    // boot: seeded noise → superposition (§3.4); the 2 s assembly is the spring flight
    renderer.compute(sim.kernels.initScatter);
    if (repeatVisit || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      blendStart = -10; blendDur = 0.001; // mode params settle instantly
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
      // §2.5 scroll: field firms up as you read deeper (facet states only)
      const scrollTighten = stateId !== "home" && stateId !== "record" ? 1 + 0.35 * scrollP : 1;
      sim.uniforms.k.value = lerp(modeFrom.k, modeTo.k, e) * scrollTighten;
      sim.uniforms.noise.value = lerp(modeFrom.noise, modeTo.noise, e);
      sim.uniforms.damp.value = lerp(modeFrom.damp, modeTo.damp, e);

      yaw += 0.07 * dt * slowF;
      // I5 parallax: mouse (fine pointers) or gyro (setParallax) eases the camera a few degrees
      if (finePointer && !par.gyro) { par.tx = pointer.state.x; par.ty = pointer.state.y; }
      par.x += (par.tx - par.x) * Math.min(1, dt * 2.5);
      par.y += (par.ty - par.y) * Math.min(1, dt * 2.5);
      const yawView = yaw + par.x * 0.06 + (scrollP * 2 - 1) * 0.1396 * (stateId !== "home" && stateId !== "record" ? 1 : 0); // ±8°
      const pitch = lerp(modeFrom.pitch, modeTo.pitch, e) + 0.05 * Math.sin(simT * 0.11) + par.y * 0.045;
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
      rUniforms.uCast.value += (castTarget - rUniforms.uCast.value) * Math.min(1, dt * 2);

      if (!frozen) {
        renderer.compute(
          weightsMode && sim.kernels.updateBlend
            ? sim.kernels.updateBlend
            : sim.kernels.updateFor[activeState]
        );
      }
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
      _debug: { sim, renderer, mesh }, // internal — not part of the §5.3 contract
      renderer: backend,
      get tier() { return curTier; },
      get state() { return stateId; },

      /* Router glue: home | facet-id | record, with dossier/domain detail. */
      setState(id, { dossier = false, domain = -1, togglePause = false } = {}) {
        if (togglePause) { api.togglePause(); return; }
        const target = id === "home" || id === "record" ? id : FACET_IDS.includes(id) ? id : "home";
        const changed = target !== stateId;
        stateId = target;
        // I5: record no longer freezes — it drifts faintly; dossier slows less harshly
        frozen = false;
        sim.uniforms.slow.value =
          target === "record" ? 0.3 : dossier && target !== "clusters" ? 0.6 : 1;
        // I4: collapsed views cast the field toward the domain hue
        const fi = FACET_IDS.indexOf(target);
        castTarget = fi === -1 ? 0 : 0.65;
        if (fi !== -1) rUniforms.uStateColor.value.copy(PALETTE[fi]);
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
         Normalizes, snapshots the current eased target, morphs to the weighted blend
         (CPU-built per ADR-005). The state machine uses the citizenship retarget (§2.3). */
      setWeights(w) {
        const ws = FACET_IDS.map((_, a) => Math.max(0, w?.[a] ?? 0));
        const sum = ws.reduce((s, x) => s + x, 0) || 1;
        if (sim.kernels.updateBlend) {
          sim.weights.forEach((wu, s) => { wu.value = (ws[s] ?? 0) / sum; });
          weightsMode = true;
        } else {
          // WebGL backend: the blend kernel exceeds its buffer budget (ADR-005) —
          // documented approximation: morph to the dominant-weight state
          const dom = ws.indexOf(Math.max(...ws));
          activeState = dom === -1 ? 7 : dom;
          weightsMode = false;
        }
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
      /* I5: gyro/mouse parallax target, both ∈ [-1, 1]. Gyro takes priority once seen. */
      setParallax(x, y) {
        par.gyro = true;
        par.tx = Math.max(-1, Math.min(1, x));
        par.ty = Math.max(-1, Math.min(1, y));
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
