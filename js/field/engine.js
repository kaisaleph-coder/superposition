/* FieldEngine (PLAN §5.3) — the ONLY public surface of the field.
   init(canvas, opts) → { setWeights, setState, setPointer, pause, resume,
   togglePause, dispose, state, tier, renderer }. Everything QA-observable is
   mirrored to <body data-*> (§5.6): data-renderer, data-tier, data-paused,
   data-fps (test mode), data-settled (test mode), data-field-boot-ms. */

import * as THREE from "../../vendor/three.webgpu.min.js";
import { TIERS, adaptTier } from "./tier.js";
import { FACET_IDS, buildAttractors, buildCitizenship, packTargets } from "./attractors.js";
import { createSim, MODES } from "./sim.tsl.js";
import { createRenderMesh } from "./render.tsl.js";
import { createPointer } from "./pointer.js";
import { compileRecipe } from "./v2/recipe-compiler.js";
import { domainForState } from "./v2/state-map.js";
import { resolveSessionSeed } from "./v2/seed-manager.js";
import { createSurfaceScene } from "./v2/surface-scene.js";

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const BLEND_MS = 1150, BOOT_MS = 2000, SETTLE_FRAME = 420;

export const FieldEngine = {
  async init(canvas, { tier, seed = null, force = null, data = null, run = false } = {}) {
    const body = canvas.ownerDocument.body;
    const testMode = seed !== null && seed !== undefined && seed !== "";
    let recipeSeedBase = resolveSessionSeed(seed);
    const seedNum = (recipeSeedBase || 1) * 0.01713;

    const renderer = new THREE.WebGPURenderer({
      canvas, antialias: false, alpha: true,
      forceWebGL: force === "webgl",
    });
    await renderer.init();
    const backend = renderer.backend.isWebGPUBackend ? "webgpu" : "webgl";
    if (backend === "webgl" && (tier === 1 || tier === 2)) tier = tier === 1 ? 3 : 4;

    // Software GPU adapters turn the visual enhancement into sustained main-thread
    // blocking work. They are not a useful rendering tier for this site: preserve the
    // semantic/static experience instead and let real hardware keep the live field.
    let portableWebGPU = false;
    if (backend === "webgpu" && navigator.gpu) {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        const info = String(adapter?.info?.architecture || "") + " " + String(adapter?.info?.description || "");
        portableWebGPU = /swiftshader|software|lavapipe|llvmpipe/i.test(info);
      } catch {}
    }
    if (portableWebGPU) {
      body.dataset.performanceFallback = "software-webgpu";
      renderer.dispose();
      throw new Error("software WebGPU adapter: static fallback");
    }
    const N = TIERS[tier].particles;
    const mobile = tier === 2 || tier === 4;
    body.dataset.particles = String(N);
    if (portableWebGPU) body.dataset.gpuProfile = "portable-swiftshader";
    else delete body.dataset.gpuProfile;

    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(innerWidth, innerHeight, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 100);

    const { gens, domainOf } = buildAttractors(N, data);
    const targetsData = packTargets(N, gens);
    const citData = buildCitizenship(N, data);
    const domData = new Uint32Array(N);
    for (let i = 0; i < N; i++) domData[i] = domainOf(i);

    const F = FACET_IDS.length, HOME = F;
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

    let recipeIndex = 0;
    let committedRecipe = compileRecipe("home", recipeIndex, recipeSeedBase);
    let activeRecipe = committedRecipe;
    const homeColors = committedRecipe.chromatic.colors.map((c) => new THREE.Color(c.hex));
    const colorsData = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const c = homeColors[citData[i] % homeColors.length];
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

    const surfaceScene = createSurfaceScene(THREE, { backend, mobile });
    scene.add(surfaceScene.root);

    const rootStyle = canvas.ownerDocument.documentElement.style;
    function applyRecipeTheme(recipe, { preview = false } = {}) {
      activeRecipe = recipe;
      const c = recipe.chromatic;
      rootStyle.setProperty("--ground", c.ground);
      rootStyle.setProperty("--ground2", c.ground2);
      rootStyle.setProperty("--ink", c.ink);
      rootStyle.setProperty("--muted", c.muted);
      rootStyle.setProperty("--rule", `${c.rule}66`);
      rootStyle.setProperty("--accent", c.accent);
      rootStyle.setProperty("--accent2", c.accent2);
      rootStyle.setProperty("--panel", `${c.ground}e8`);
      rUniforms.uTone.value = 1.0;
      rUniforms.uStateColor.value.set(c.accent);
      rUniforms.uLive.value.set(c.accent2);
      const surf = surfaceScene.applyRecipe(recipe);
      body.dataset.renderDomain = recipe.domain;
      body.dataset.recipe = recipe.signature;
      body.dataset.topology = recipe.topology;
      body.dataset.layers = String(recipe.layers.length);
      body.dataset.surfaceLayers = String(surf.layers);
      body.dataset.cost = String(recipe.cost);
      body.dataset.chromatic = recipe.chromatic.id;
      body.toggleAttribute("data-preview", preview);
      window.dispatchEvent(new CustomEvent("superposition:recipe", { detail: { recipe, preview } }));
    }
    applyRecipeTheme(committedRecipe);

    let simT = 0, wallLast = performance.now(), frame = 0;
    let stateId = "home", modeFrom = { ...MODES.home }, modeTo = { ...MODES.home };
    let blendStart = 0, blendDur = BOOT_MS / 1000, yaw = 0.6;
    let userPaused = false, hiddenPaused = false, offscreenPaused = false, frozen = false;
    let rafId = 0, running = false, disposed = false, settled = false, performanceStatic = false;
    let curTier = tier, drawN = N, lowStreak = 0, fpsFrames = 0, fpsClock = performance.now();
    let bootMarked = false, scrollP = 0;
    const par = { x: 0, y: 0, tx: 0, ty: 0, gyro: false };
    const finePointer = matchMedia("(pointer: fine)").matches;
    let castTarget = 0;

    const doc = canvas.ownerDocument;
    const pointer = createPointer(canvas);

    const repeatVisit = (() => {
      try { return sessionStorage.getItem("sp-boot") === "1"; } catch { return false; }
    })();

    const eased = () => easeInOut(Math.min(1, (simT - blendStart) / blendDur));

    let activeState = HOME, weightsMode = false;
    function dispatchRetarget(newStateIdx) {
      activeState = newStateIdx;
      weightsMode = false;
      blendStart = simT;
      blendDur = BLEND_MS / 1000;
    }

    function stateIndexOf(id) {
      const i = FACET_IDS.indexOf(id);
      return i === -1 ? HOME : i;
    }

    renderer.compute(sim.kernels.initScatter);
    if (repeatVisit || matchMedia("(prefers-reduced-motion: reduce)").matches) {
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

    function enterPerformanceStaticFallback(fps) {
      if (performanceStatic) return;
      performanceStatic = true;
      curTier = 0;
      drawN = 0;
      mesh.count = 0;
      body.dataset.tier = "0";
      body.dataset.renderer = "static";
      body.dataset.performanceFallback = "low-fps";
      body.dataset.fps = fps.toFixed(0);
      userPaused = true;
      updatePauseAttr();
    }

    function sampleFps(now) {
      fpsFrames++;
      if (now - fpsClock >= 1000) {
        const fps = (fpsFrames * 1000) / (now - fpsClock);
        fpsFrames = 0; fpsClock = now;
        body.dataset.fps = fps.toFixed(0);
        const decision = adaptTier({ tier: curTier, fps, lowStreak });
        lowStreak = decision.lowStreak;
        if (decision.staticFallback) {
          enterPerformanceStaticFallback(fps);
          return;
        }
        if (decision.tier !== curTier) {
          curTier = decision.tier;
          drawN = Math.min(drawN, TIERS[curTier].particles);
          mesh.count = drawN;
          body.dataset.tier = String(curTier);
        }
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
      const scrollTighten = stateId !== "home" && stateId !== "record" ? 1 + 0.35 * scrollP : 1;
      sim.uniforms.k.value = lerp(modeFrom.k, modeTo.k, e) * scrollTighten;
      sim.uniforms.noise.value = lerp(modeFrom.noise, modeTo.noise, e);
      sim.uniforms.damp.value = lerp(modeFrom.damp, modeTo.damp, e);

      yaw += 0.07 * dt * slowF;
      if (finePointer && !par.gyro) { par.tx = pointer.state.x; par.ty = pointer.state.y; }
      par.x += (par.tx - par.x) * Math.min(1, dt * 2.5);
      par.y += (par.ty - par.y) * Math.min(1, dt * 2.5);
      const yawView = yaw + par.x * 0.06 + (scrollP * 2 - 1) * 0.1396 * (stateId !== "home" && stateId !== "record" ? 1 : 0);
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
      surfaceScene.update(simT, { x: par.x, y: par.y });

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

      if (testMode && !settled && frame >= SETTLE_FRAME) {
        settled = true;
        body.dataset.settled = "1";
        if (!run) { userPaused = true; updatePauseAttr(); }
      }
    }

    hiddenPaused = doc.hidden;
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

    const api = {
      _debug: { sim, renderer, mesh },
      get renderer() { return performanceStatic ? "static" : backend; },
      get tier() { return curTier; },
      get state() { return stateId; },

      setState(id, { dossier = false, domain = -1, togglePause = false } = {}) {
        if (togglePause) { api.togglePause(); return; }
        const target = id === "home" || id === "record" ? id : FACET_IDS.includes(id) ? id : "home";
        const changed = target !== stateId;
        stateId = target;
        if (changed) {
          recipeIndex = 0;
          committedRecipe = compileRecipe(domainForState(target), recipeIndex, recipeSeedBase);
          applyRecipeTheme(committedRecipe);
        } else if (body.hasAttribute("data-preview")) {
          applyRecipeTheme(committedRecipe);
        }
        frozen = false;
        sim.uniforms.slow.value =
          target === "record" ? 0.3 : dossier && target !== "clusters" ? 0.6 : 1;
        const fi = FACET_IDS.indexOf(target);
        castTarget = fi === -1 ? 0 : 0.65;
        if (fi !== -1) rUniforms.uStateColor.value.set(committedRecipe.chromatic.accent);
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

      previewState(id) {
        const recipe = compileRecipe(domainForState(id), 0, recipeSeedBase);
        applyRecipeTheme(recipe, { preview: true });
      },
      clearPreview() { applyRecipeTheme(committedRecipe); },
      setRecipeSeed(nextSeed) {
        recipeSeedBase = Number(nextSeed) >>> 0 || recipeSeedBase;
        recipeIndex = 0;
        committedRecipe = compileRecipe(domainForState(stateId), recipeIndex, recipeSeedBase);
        applyRecipeTheme(committedRecipe);
      },
      nextRecipe() {
        recipeIndex += 1;
        committedRecipe = compileRecipe(domainForState(stateId), recipeIndex, recipeSeedBase);
        applyRecipeTheme(committedRecipe);
        return committedRecipe;
      },
      getDebugState() {
        return {
          state: stateId, backend: performanceStatic ? "static" : backend, tier: curTier, seed: recipeSeedBase, recipeIndex,
          recipe: committedRecipe.signature, topology: committedRecipe.topology,
          law: committedRecipe.law, layers: committedRecipe.layers.length,
          surfaceLayers: surfaceScene.debug.layers, cost: committedRecipe.cost,
          chromatic: committedRecipe.chromatic.id, primitives: surfaceScene.debug.primitiveCount,
        };
      },

      setWeights(w) {
        const ws = FACET_IDS.map((_, a) => Math.max(0, w?.[a] ?? 0));
        const sum = ws.reduce((s, x) => s + x, 0) || 1;
        if (sim.kernels.updateBlend) {
          sim.weights.forEach((wu, s) => { wu.value = (ws[s] ?? 0) / sum; });
          weightsMode = true;
        } else {
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
      setScroll(p) {
        scrollP = Math.max(0, Math.min(1, p));
        if (testMode) body.dataset.scroll = scrollP.toFixed(2);
      },
      setParallax(x, y) {
        par.gyro = true;
        par.tx = Math.max(-1, Math.min(1, x));
        par.ty = Math.max(-1, Math.min(1, y));
      },
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
        io.disconnect(); pointer.dispose(); surfaceScene.dispose(); renderer.dispose();
      },
    };

    body.dataset.renderer = backend;
    body.dataset.tier = String(curTier);
    updatePauseAttr();
    return api;
  },
};
