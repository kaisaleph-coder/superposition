/* Seven attractor target generators (PLAN §2.2) — pure (i, N) → [x,y,z].
   Ported from the owner-approved preview prototype; deterministic (hash-based,
   no PRNG state). CLUSTERS is data-driven: domain counts come from resume data
   (§2.4 field-as-dataset); placeholder counts pre-authorized until owner data. */

export const FACET_IDS = ["columns", "frame", "tables", "lattice", "surface", "clusters", "vector", "orbit"];

const fract = (x) => x - Math.floor(x);
export const hash = (n) => fract(Math.sin(n * 127.1) * 43758.5453);

export function buildAttractors(N, data) {
  const gens = {};

  gens.columns = (i) => {
    const G = 9, col = i % (G * G), cx = col % G, cz = (col / G) | 0;
    const h = 0.28 + 0.72 * hash(col * 3.7 + 1.1);
    return [
      -0.9 + (1.8 * cx) / (G - 1) + (hash(i * 1.3) - 0.5) * 0.05,
      -0.85 + 1.65 * h * hash(i * 2.1 + 0.7),
      -0.9 + (1.8 * cz) / (G - 1) + (hash(i * 1.9) - 0.5) * 0.05,
    ];
  };

  gens.frame = (i) => {
    const GX = 4, GZ = 3, F = 4, r = hash(i * 0.41 + 3.3);
    if (r < 0.42) {
      const p = i % (GX * GZ);
      return [
        -0.8 + (1.6 * (p % GX)) / (GX - 1) + (hash(i * 1.2) - 0.5) * 0.02,
        -0.85 + 1.62 * hash(i * 2.6 + 0.4),
        -0.55 + (1.1 * ((p / GX) | 0)) / (GZ - 1) + (hash(i * 1.8) - 0.5) * 0.02,
      ];
    } else if (r < 0.74) {
      const f = i % F, zr = (i >> 2) % GZ, ext = f === F - 1 ? 0.28 : 1;
      return [
        -0.8 + 1.6 * ext * hash(i * 3.9),
        -0.85 + (1.62 * f) / (F - 1) + (hash(i * 5.2) - 0.5) * 0.02,
        -0.55 + (1.1 * zr) / (GZ - 1) + (hash(i * 2.2) - 0.5) * 0.02,
      ];
    }
    const f = i % F, xr = (i >> 2) % GX, top = f === F - 1;
    return [
      -0.8 + (1.6 * xr) / (GX - 1) + (hash(i * 6.1) - 0.5) * 0.02,
      -0.85 + (1.62 * f) / (F - 1) + (hash(i * 4.4) - 0.5) * 0.02,
      -0.55 + 1.1 * (top ? 0.3 * hash(i * 7.3) : hash(i * 7.3)) + (hash(i * 3.1) - 0.5) * 0.02,
    ];
  };

  // TABLES — dining floor (I2): round table-discs on a floor grid, aisle through the
  // middle, a thin service stream along the aisle. Distinct silhouette: uniform flat
  // discs in a regular plan vs CLUSTERS' random spheres.
  gens.tables = (i) => {
    const r = hash(i * 0.67 + 4.1);
    if (r < 0.12) {
      // service stream down the aisle
      return [
        (hash(i * 5.9) - 0.5) * 0.16,
        -0.52 + hash(i * 8.3) * 0.1,
        -0.85 + 1.7 * hash(i * 3.9),
      ];
    }
    const COLS = [-0.82, -0.44, 0.44, 0.82], ROWS = [-0.72, -0.36, 0, 0.36, 0.72];
    const t = i % (COLS.length * ROWS.length);
    const cx = COLS[t % COLS.length], cz = ROWS[(t / COLS.length) | 0];
    const th = hash(i * 2.3) * Math.PI * 2;
    const isTop = hash(i * 9.7) < 0.88;
    const rad = (isTop ? 0.15 : 0.03) * Math.sqrt(hash(i * 6.1)); // disc top vs slim pedestal
    return [
      cx + Math.cos(th) * rad,
      isTop ? -0.42 + hash(i * 7.7) * 0.045 : -0.61 + hash(i * 7.7) * 0.16,
      cz + Math.sin(th) * rad,
    ];
  };

  {
    const M = 42, nodes = [];
    for (let k = 0; k < M; k++) {
      const y = 1 - (2 * (k + 0.5)) / M, r = Math.sqrt(Math.max(0, 1 - y * y)), th = k * 2.399963;
      nodes.push([Math.cos(th) * r * 0.88, y * 0.88, Math.sin(th) * r * 0.88]);
    }
    const near = nodes.map((p) =>
      nodes
        .map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2])
        .sort((u, v) => u[1] - v[1])
        .slice(1, 4)
        .map((u) => u[0])
    );
    gens.lattice = (i) => {
      const k = i % M, r = hash(i * 0.73 + 2.2);
      if (r < 0.6) {
        return [
          nodes[k][0] + (hash(i * 3.1) - 0.5) * 0.11,
          nodes[k][1] + (hash(i * 4.3) - 0.5) * 0.11,
          nodes[k][2] + (hash(i * 5.7) - 0.5) * 0.11,
        ];
      }
      const b = near[k][i % 3], t = hash(i * 1.7 + 0.3);
      return [
        nodes[k][0] + (nodes[b][0] - nodes[k][0]) * t + (hash(i * 6.1) - 0.5) * 0.03,
        nodes[k][1] + (nodes[b][1] - nodes[k][1]) * t + (hash(i * 7.9) - 0.5) * 0.03,
        nodes[k][2] + (nodes[b][2] - nodes[k][2]) * t + (hash(i * 8.3) - 0.5) * 0.03,
      ];
    };
  }

  {
    const W = Math.ceil(Math.sqrt(N));
    gens.surface = (i) => {
      const u = (i % W) / (W - 1), v = (((i / W) | 0) % W) / (W - 1);
      const x = -1.08 + 2.16 * u, z = -0.85 + 1.7 * fract(v + hash(i) * 0.002);
      const y = 0.3 * Math.sin(2.6 * x + 1.6 * z) + 0.2 * Math.sin(4.6 * z - 2.1 * x) + 0.08 * Math.sin(7 * x * z);
      return [x, y * 0.9, z];
    };
  }

  // CLUSTERS — data-driven domain masses (§2.4). domainOf(i) exported for sub-collapse.
  const clustersFacet = data?.facets?.find((f) => f.id === "clusters");
  const CNT = (clustersFacet?.domains || []).map(
    (d) => (d.tiers?.core?.length || 0) + (d.tiers?.working?.length || 0) + (d.tiers?.familiar?.length || 0)
  );
  if (!CNT.length) CNT.push(1);
  const D = CNT.length, tot = CNT.reduce((s, c) => s + c, 0), maxC = Math.max(...CNT);
  const cum = []; { let acc = 0; for (const c of CNT) { acc += c / tot; cum.push(acc); } }
  const ctr = [];
  for (let d = 0; d < D; d++) {
    const y = 1 - (2 * (d + 0.5)) / D, rr = Math.sqrt(Math.max(0, 1 - y * y)), th = d * 2.399963;
    const R = 0.58 + (hash(d * 9.7) - 0.5) * 0.22;
    ctr.push([Math.cos(th) * rr * R, y * 0.62, Math.sin(th) * rr * R]);
  }
  const domainOf = (i) => {
    const u = hash(i * 0.531 + 7.7);
    let d = 0;
    while (d < D - 1 && u > cum[d]) d++;
    return d;
  };
  gens.clusters = (i) => {
    const d = domainOf(i), c = ctr[d];
    if (hash(i * 7.9) < 0.07 && D > 1) {
      const b = ctr[(d + Math.max(1, 3 % D)) % D], t = hash(i * 2.9);
      return [c[0] + (b[0] - c[0]) * t, c[1] + (b[1] - c[1]) * t, c[2] + (b[2] - c[2]) * t];
    }
    let dx = hash(i * 3.7) - 0.5, dy = hash(i * 5.3) - 0.5, dz = hash(i * 8.9) - 0.5;
    const L = Math.hypot(dx, dy, dz) + 1e-5;
    const R = 0.34 * Math.sqrt(CNT[d] / maxC) * Math.cbrt(hash(i * 6.7));
    return [c[0] + (dx / L) * R, c[1] + (dy / L) * R, c[2] + (dz / L) * R];
  };

  gens.vector = (i) => {
    const t = i / N, th = t * 44 + hash(i) * 0.2;
    const spread = 0.025 + 0.16 * (1 - t);
    const r = 0.86 * (1 - 0.62 * t) + (hash(i * 2.7) - 0.5) * spread * 2;
    return [
      Math.cos(th) * r + (hash(i * 3.3) - 0.5) * spread,
      -0.92 + 1.84 * Math.pow(t, 0.85),
      Math.sin(th) * r + (hash(i * 4.9) - 0.5) * spread,
    ];
  };

  gens.orbit = (i) => {
    const R = [
      [3, 2, 5, 0.88, 0.5, 0.7, 0],
      [5, 4, 3, 0.62, 0.8, 0.55, 1.3],
      [2, 3, 4, 0.75, 0.62, 0.85, 2.5],
      [4, 5, 2, 0.55, 0.72, 0.62, 4.1],
    ];
    const g = R[i % 4], t = i * 0.618033 * 2 * Math.PI;
    return [
      g[3] * Math.sin(g[0] * t + g[6]) + (hash(i * 1.1) - 0.5) * 0.03,
      g[4] * Math.sin(g[1] * t + g[6] * 0.5) * 0.9 + (hash(i * 2.3) - 0.5) * 0.03,
      g[5] * Math.cos(g[2] * t) + (hash(i * 3.7) - 0.5) * 0.03,
    ];
  };

  return { gens, domainOf, domainCount: D };
}

/* Citizenship (§2.3): every particle permanently belongs to one facet, allocation
   proportional to facet content mass — the superposition is a weighted self-portrait. */
export function buildCitizenship(N, data) {
  const masses = FACET_IDS.map((id) => {
    const f = data?.facets?.find((x) => x.id === id);
    return f ? Math.max(60, JSON.stringify(f).length) : 60;
  });
  const tot = masses.reduce((s, m) => s + m, 0);
  const cum = []; { let acc = 0; for (const m of masses) { acc += m / tot; cum.push(acc); } }
  const cit = new Uint32Array(N);
  for (let i = 0; i < N; i++) {
    const u = hash(i * 0.917 + 11.3);
    let c = 0;
    while (c < FACET_IDS.length - 1 && u > cum[c]) c++;
    cit[i] = c;
  }
  return cit;
}

/* Pack all 7 attractor target sets into one interleaved buffer: index = a*N + i. */
export function packTargets(N, gens) {
  const buf = new Float32Array(N * FACET_IDS.length * 3);
  FACET_IDS.forEach((id, a) => {
    const g = gens[id];
    for (let i = 0; i < N; i++) {
      const [x, y, z] = g(i);
      const j = (a * N + i) * 3;
      buf[j] = x; buf[j + 1] = y; buf[j + 2] = z;
    }
  });
  return buf;
}
