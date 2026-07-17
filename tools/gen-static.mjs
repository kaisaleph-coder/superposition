#!/usr/bin/env node
/* Generate assets/field-static.svg — the prerendered superposition still that grounds
   the T0 static state (PLAN §2.1). Ports the preview prototype's attractor sampling
   (reference/superposition-preview.html) at low amplitude: every dot belongs to one
   of the seven attractors, blended home-state, same camera math. Deterministic. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const N = 2600;
const fract = (x) => x - Math.floor(x);
const hash = (n) => fract(Math.sin(n * 127.1) * 43758.5453);

const A = {
  columns(i) {
    const G = 9, col = i % (G * G), cx = col % G, cz = (col / G) | 0;
    return [
      -0.9 + (1.8 * cx) / (G - 1) + (hash(i * 1.3) - 0.5) * 0.05,
      -0.85 + 1.65 * (0.28 + 0.72 * hash(col * 3.7 + 1.1)) * hash(i * 2.1 + 0.7),
      -0.9 + (1.8 * cz) / (G - 1) + (hash(i * 1.9) - 0.5) * 0.05,
    ];
  },
  frame(i) {
    const GX = 4, GZ = 3, F = 4, r = hash(i * 0.41 + 3.3);
    if (r < 0.42) {
      const p = i % (GX * GZ);
      return [-0.8 + (1.6 * (p % GX)) / (GX - 1), -0.85 + 1.62 * hash(i * 2.6 + 0.4), -0.55 + (1.1 * ((p / GX) | 0)) / (GZ - 1)];
    } else if (r < 0.74) {
      const f = i % F, zr = (i >> 2) % GZ, ext = f === F - 1 ? 0.28 : 1;
      return [-0.8 + 1.6 * ext * hash(i * 3.9), -0.85 + (1.62 * f) / (F - 1), -0.55 + (1.1 * zr) / (GZ - 1)];
    }
    const f = i % F, xr = (i >> 2) % GX, top = f === F - 1;
    return [-0.8 + (1.6 * xr) / (GX - 1), -0.85 + (1.62 * f) / (F - 1), -0.55 + 1.1 * (top ? 0.3 * hash(i * 7.3) : hash(i * 7.3))];
  },
  lattice(i) {
    const M = 42, k = i % M;
    const node = (k2) => {
      const y = 1 - (2 * (k2 + 0.5)) / M, r = Math.sqrt(Math.max(0, 1 - y * y)), th = k2 * 2.399963;
      return [Math.cos(th) * r * 0.88, y * 0.88, Math.sin(th) * r * 0.88];
    };
    const p = node(k);
    if (hash(i * 0.73 + 2.2) < 0.6)
      return [p[0] + (hash(i * 3.1) - 0.5) * 0.11, p[1] + (hash(i * 4.3) - 0.5) * 0.11, p[2] + (hash(i * 5.7) - 0.5) * 0.11];
    const q = node((k + 5) % M), t = hash(i * 1.7 + 0.3);
    return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];
  },
  surface(i) {
    const W = Math.ceil(Math.sqrt(N));
    const u = (i % W) / (W - 1), v = (((i / W) | 0) % W) / (W - 1);
    const x = -1.08 + 2.16 * u, z = -0.85 + 1.7 * v;
    const y = 0.3 * Math.sin(2.6 * x + 1.6 * z) + 0.2 * Math.sin(4.6 * z - 2.1 * x) + 0.08 * Math.sin(7 * x * z);
    return [x, y * 0.9, z];
  },
  clusters(i) {
    const CNT = [34, 52, 28, 19, 41, 23, 15, 30], D = CNT.length;
    const tot = CNT.reduce((s, c) => s + c, 0), maxC = Math.max(...CNT);
    const cum = []; let acc = 0; CNT.forEach((c) => { acc += c / tot; cum.push(acc); });
    const u = hash(i * 0.531 + 7.7); let d = 0; while (d < D - 1 && u > cum[d]) d++;
    const y0 = 1 - (2 * (d + 0.5)) / D, rr = Math.sqrt(Math.max(0, 1 - y0 * y0)), th = d * 2.399963;
    const R0 = 0.58 + (hash(d * 9.7) - 0.5) * 0.22;
    const c = [Math.cos(th) * rr * R0, y0 * 0.62, Math.sin(th) * rr * R0];
    let dx = hash(i * 3.7) - 0.5, dy = hash(i * 5.3) - 0.5, dz = hash(i * 8.9) - 0.5;
    const L = Math.hypot(dx, dy, dz) + 1e-5;
    const R = 0.34 * Math.sqrt(CNT[d] / maxC) * Math.cbrt(hash(i * 6.7));
    return [c[0] + (dx / L) * R, c[1] + (dy / L) * R, c[2] + (dz / L) * R];
  },
  vector(i) {
    const t = i / N, th = t * 44;
    const spread = 0.025 + 0.16 * (1 - t);
    const r = 0.86 * (1 - 0.62 * t) + (hash(i * 2.7) - 0.5) * spread * 2;
    return [Math.cos(th) * r, -0.92 + 1.84 * Math.pow(t, 0.85), Math.sin(th) * r];
  },
  orbit(i) {
    const R = [[3, 2, 5, 0.88, 0.5, 0.7, 0], [5, 4, 3, 0.62, 0.8, 0.55, 1.3], [2, 3, 4, 0.75, 0.62, 0.85, 2.5], [4, 5, 2, 0.55, 0.72, 0.62, 4.1]];
    const g = R[i % 4], t = i * 0.618033 * 2 * Math.PI;
    return [g[3] * Math.sin(g[0] * t + g[6]), g[4] * Math.sin(g[1] * t + g[6] * 0.5) * 0.9, g[5] * Math.cos(g[2] * t)];
  },
};

const IDS = ["columns", "frame", "lattice", "surface", "clusters", "vector", "orbit"];
const W = 1600, H = 1000, FOV = 2.05, CAMD = 2.7;
const yaw = 0.6, pitch = -0.32;
const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
const dots = [];
for (let i = 0; i < N; i++) {
  let [x, y, z] = A[IDS[i % 7]](i);
  // home-state wander: structure without resolution
  x += (hash(i * 9.1) - 0.5) * 0.22; y += (hash(i * 10.3) - 0.5) * 0.22; z += (hash(i * 11.7) - 0.5) * 0.22;
  const rx = x * cy - z * sy, rz0 = x * sy + z * cy;
  const ry = y * cp - rz0 * sp, rz = y * sp + rz0 * cp + CAMD;
  if (rz < 0.35) continue;
  const s = FOV / rz;
  const px = ((rx * s) / (W / H)) * (W / 2) + W / 2;
  const py = -ry * s * (H / 2) + H / 2;
  if (px < -10 || px > W + 10 || py < -10 || py > H + 10) continue;
  const r = 1.05 * s * (0.75 + 0.5 * hash(i * 13.7));
  const o = 0.16 + 0.3 * hash(i * 15.1);
  dots.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r.toFixed(2)}" opacity="${o.toFixed(2)}"/>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<style>circle{fill:#10131A}@media(prefers-color-scheme:dark){circle{fill:#E9ECF2}}</style>
${dots.join("\n")}
</svg>`;
writeFileSync(join(ROOT, "assets/field-static.svg"), svg);
console.log(`field-static.svg: ${dots.length} dots, ${(svg.length / 1024).toFixed(1)} KB raw`);
