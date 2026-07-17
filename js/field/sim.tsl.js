/* TSL compute kernels (PLAN §5.3) — single codebase, both backends (ADR-001).
   force = k1·(blendTarget − pos)  attractor spring
         + k2·curl(pos, t)         life — analytic curl of the preview's sin potential
                                   (divergence-free; same visual field as the prototype)
         + k3·pointerRepulse       interaction
   vel = (vel + force·dt)·damp^(dt·60) ; pos += vel·dt   (semi-implicit Euler, dt-normalized) */

import {
  Fn, If, instancedArray, instanceIndex, uniform,
  float, int, uint, vec3, mix, clamp, cos, sqrt,
} from "three/tsl";

export function createSim(N, { targetsData, citData, domData, seed }) {
  const positions = instancedArray(N, "vec3");
  const velocities = instancedArray(N, "vec3");
  const fromT = instancedArray(N, "vec3");
  const toT = instancedArray(N, "vec3");
  const targets = instancedArray(targetsData, "vec3"); // 7·N packed, index a*N+i
  const cit = instancedArray(citData, "uint");
  const dom = instancedArray(domData, "uint");

  const u = {
    dt: uniform(1 / 60),
    t: uniform(0),
    blend: uniform(1),          // eased 0→1 (CPU-eased per frame)
    k: uniform(1.35),
    noise: uniform(0.46),
    damp: uniform(0.935),
    state: uniform(7, "uint"),  // 0–6 facet, 7 = home (citizenship)
    focusDomain: uniform(-1, "int"), // §2.4 sub-collapse
    pointer: uniform(vec3(0, 0, 0)),
    pointerStrength: uniform(0),
    seed: uniform(seed),
    slow: uniform(1),           // dossier-open courtesy (0.5) §2.1
  };

  // hash matching attractors.js: fract(sin(n·127.1)·43758.5453)
  const gpuHash = (n) => n.mul(127.1).sin().mul(43758.5453).fract();

  const targetIndex = Fn(() => {
    const a = uint(u.state).lessThan(uint(7)).select(uint(u.state), cit.element(instanceIndex));
    return a.mul(uint(N)).add(instanceIndex);
  });

  const init = Fn(() => {
    const i = instanceIndex.toFloat();
    const p = positions.element(instanceIndex);
    p.x = gpuHash(i.mul(0.9).add(u.seed)).sub(0.5).mul(3.2);
    p.y = gpuHash(i.mul(1.7).add(u.seed).add(31.7)).sub(0.5).mul(3.2);
    p.z = gpuHash(i.mul(2.3).add(u.seed).add(77.1)).sub(0.5).mul(3.2);
    velocities.element(instanceIndex).assign(vec3(0));
    fromT.element(instanceIndex).assign(p);
    toT.element(instanceIndex).assign(targets.element(targetIndex()));
  })().compute(N);

  // On state change: snapshot current eased target into fromT, point toT at new state.
  // u.state must be set to the NEW state and u.blend to the OLD eased value before dispatch.
  const prevEased = uniform(1);
  const retarget = Fn(() => {
    const f = fromT.element(instanceIndex);
    f.assign(mix(f, toT.element(instanceIndex), prevEased));
    toT.element(instanceIndex).assign(targets.element(targetIndex()));
  })().compute(N);

  // §5.3 setWeights path: toT ← Σ w[a]·attractor_a (normalized on CPU). Unrolled over
  // the 7 attractors; used by the public setWeights API (state machine uses retarget).
  const w = Array.from({ length: 7 }, () => uniform(0));
  const blendWeights = Fn(() => {
    const acc = vec3(0).toVar();
    for (let a = 0; a < 7; a++) {
      acc.addAssign(targets.element(uint(a * N).add(instanceIndex)).mul(w[a]));
    }
    const f = fromT.element(instanceIndex);
    f.assign(mix(f, toT.element(instanceIndex), prevEased));
    toT.element(instanceIndex).assign(acc);
  })().compute(N);

  const update = Fn(() => {
    const p = positions.element(instanceIndex);
    const v = velocities.element(instanceIndex);
    const target = mix(fromT.element(instanceIndex), toT.element(instanceIndex), u.blend);

    // spring (+ sub-collapse ×1.9 for focused domain in CLUSTERS §2.4)
    const kk = float(u.k).toVar();
    If(
      u.focusDomain.greaterThanEqual(int(0))
        .and(dom.element(instanceIndex).equal(uint(u.focusDomain)))
        .and(uint(u.state).equal(uint(4))),
      () => { kk.assign(kk.mul(1.9)); }
    );
    const force = target.sub(p).mul(kk).toVar();

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
      const f = u.pointerStrength.mul(float(1).sub(dist.div(PR))).div(dist).mul(3.4);
      force.addAssign(d.mul(f));
    });

    const damp = u.damp.pow(u.dt.mul(60));
    v.assign(v.add(force.mul(u.dt)).mul(damp));
    p.assign(p.add(v.mul(u.dt)));
  })().compute(N);

  return { positions, velocities, dom, uniforms: u, prevEased, weights: w, kernels: { init, retarget, update, blendWeights } };
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
