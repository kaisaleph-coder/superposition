/* TSL compute kernels (PLAN §5.3) — single codebase, both backends (ADR-001).
   force = k1·(target − pos)      attractor spring (morphs ARE the spring flight)
         + k2·curl(pos, t)        life — analytic curl of the preview's sin potential
                                  (divergence-free; same visual field as the prototype)
         + k3·pointerRepulse      interaction
   vel = (vel + force·dt)·damp^(dt·60) ; pos += vel·dt   (semi-implicit Euler, dt-normalized)

   WebGL-backend constraints (ADR-005, all empirically root-caused at the P3 gate):
   1. ≥5 distinct storage buffers in one kernel → silent no-op.
   2. Compute-stage storage reads are attribute-backed — buffer[instanceIndex] only.
   3. `needsUpdate` re-uploads are ignored — buffer contents immutable after creation.
   4. Same-task chained reads of freshly TF-written buffers are unreliable.
   5. Compute-written buffers read by OTHER kernels interleave stale ping-pong halves.
   Design under those constraints: EIGHT static per-state target buffers (7 attractors +
   citizenship home §2.3, CLUSTERS domain id in w) baked at boot, and EIGHT update
   kernels, each hard-bound to its state's static buffer. Retargeting = the CPU picks
   which update kernel runs — zero inter-kernel GPU data flow; the only RMW is pos/vel
   within one kernel (empirically solid). Morph timing comes from the spring itself plus
   the CPU-eased mode parameters — flight, not tween (§5.3). setWeights: true blend
   kernel on WebGPU; documented dominant-state approximation on WebGL. */

import {
  Fn, If, instancedArray, uniform, instanceIndex,
  float, vec3, vec4, cos, sqrt, abs,
} from "three/tsl";

export function createSim(N, { stateTargets, seed, webgpu }) {
  const positions = instancedArray(N, "vec4"); // xyz pos, w render charge (§2.4)
  const velocities = instancedArray(N, "vec3");
  // 8 static state buffers: xyz target, w domain id (−1 outside CLUSTERS)
  const T = stateTargets.map((arr) => instancedArray(arr, "vec4"));

  const u = {
    dt: uniform(1 / 60),
    t: uniform(0),
    k: uniform(1.35),
    noise: uniform(0.46),
    damp: uniform(0.935),
    focusDomain: uniform(-1.0),   // §2.4 sub-collapse; -1 outside CLUSTERS
    pointer: uniform(vec3(0, 0, 0)),
    pointerStrength: uniform(0),
    seed: uniform(seed),
    slow: uniform(1),             // dossier-open courtesy (0.5) §2.1
  };
  const w = Array.from({ length: 8 }, () => uniform(0)); // setWeights surface (float — ADR-005)

  // hash matching attractors.js: fract(sin(n·127.1)·43758.5453)
  const gpuHash = (n) => n.mul(127.1).sin().mul(43758.5453).fract();

  // boot: seeded noise scatter — pure writes
  const initScatter = Fn(() => {
    const i = instanceIndex.toFloat();
    const p = vec3(
      gpuHash(i.mul(0.9).add(u.seed)).sub(0.5).mul(3.2),
      gpuHash(i.mul(1.7).add(u.seed).add(31.7)).sub(0.5).mul(3.2),
      gpuHash(i.mul(2.3).add(u.seed).add(77.1)).sub(0.5).mul(3.2)
    );
    positions.element(instanceIndex).assign(vec4(p, 0));
    velocities.element(instanceIndex).assign(vec3(0));
  })().compute(N);

  const el = (b) => b.element(instanceIndex);

  // shared integration body; targetNode supplies this kernel's per-particle vec4 target
  const integrate = (targetNode) => () => {
    const pc = positions.element(instanceIndex);
    const v = velocities.element(instanceIndex);
    const p = pc.xyz.toVar();
    const t4 = targetNode();

    // spring (+ sub-collapse ×1.9 and charge for the focused domain §2.4)
    const kk = float(u.k).toVar();
    const chg = float(0).toVar();
    If(u.focusDomain.greaterThanEqual(0).and(abs(t4.w.sub(u.focusDomain)).lessThan(0.5)), () => {
      kk.assign(kk.mul(1.9));
      chg.assign(0.42);
    });
    const force = t4.xyz.sub(p).mul(kk).toVar();

    // curl of ψ = (sin(3.1y+.9t), sin(2.7z+1.23t), sin(3.4x+.77t)) — scaled to preview feel
    const n = u.noise.mul(u.slow);
    force.addAssign(
      vec3(
        cos(p.z.mul(2.7).add(u.t.mul(1.23))).mul(-0.9),
        cos(p.x.mul(3.4).add(u.t.mul(0.77))).mul(-1.13),
        cos(p.y.mul(3.1).add(u.t.mul(0.9))).mul(-1.03)
      ).mul(n)
    );

    // pointer repulsor (radius .48 world ≈120px §2.5); heals behind the cursor
    const PR = float(0.48);
    const d = p.sub(u.pointer);
    const d2 = d.dot(d);
    If(u.pointerStrength.greaterThan(0.01).and(d2.lessThan(PR.mul(PR))), () => {
      const dist = sqrt(d2).add(1e-4);
      const rf = u.pointerStrength.mul(float(1).sub(dist.div(PR))).div(dist).mul(3.4);
      force.addAssign(d.mul(rf));
    });

    const damp = u.damp.pow(u.dt.mul(60));
    v.assign(v.add(force.mul(u.dt)).mul(damp));
    pc.assign(vec4(p.add(v.mul(u.dt)), chg));
  };

  // eight per-state update kernels, each hard-bound to its static target buffer
  // (static read + pos/vel RMW = 3 buffers; retarget = CPU-side kernel switch)
  const updateFor = T.map((t) => Fn(integrate(() => el(t)))().compute(N));

  // §5.3 setWeights (WebGPU only): Σ w[s]·T[s] in-kernel — 10 buffers, fine there;
  // the engine approximates with the dominant state on WebGL (ADR-005).
  const updateBlend = webgpu
    ? Fn(integrate(() => {
        const acc = vec4(0).toVar();
        for (let s = 0; s < 8; s++) acc.addAssign(el(T[s]).mul(w[s]));
        return vec4(acc.xyz, -1);
      }))().compute(N)
    : null;

  return {
    positions, velocities,
    uniforms: u, weights: w,
    kernels: { initScatter, updateFor, updateBlend },
  };
}

/* Per-state field parameters — ported verbatim from the approved preview MODES. */
export const MODES = {
  home:     { k: 1.35, noise: 0.46, damp: 0.935, pitch: -0.32 },
  columns:  { k: 5.0,  noise: 0.13, damp: 0.885, pitch: -0.20 },
  frame:    { k: 5.0,  noise: 0.13, damp: 0.885, pitch: -0.24 },
  lattice:  { k: 5.0,  noise: 0.15, damp: 0.885, pitch: -0.34 },
  surface:  { k: 5.0,  noise: 0.12, damp: 0.885, pitch: -0.58 },
  clusters: { k: 4.6,  noise: 0.17, damp: 0.895, pitch: -0.34 },
  vector:   { k: 5.0,  noise: 0.14, damp: 0.885, pitch: -0.26 },
  orbit:    { k: 4.4,  noise: 0.18, damp: 0.895, pitch: -0.38 },
  record:   { k: 1.35, noise: 0.05, damp: 0.95,  pitch: -0.32 },
};
