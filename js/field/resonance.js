/* RESONANCE: the field as a resonating plate. Sand gathers on the nodal lines of the
   current mode, fills the heading's glyphs and leaves the copy clear. Raw WebGPU.
   Read docs/RESONANCE.md before changing anything here. */

const STATE_ID = { home: 0, record: 0, columns: 1, tables: 2, frame: 3, surface: 4, vector: 5, lattice: 6, clusters: 7, orbit: 8 };
const REPEL = ".view.on .positioning,.view.on .manifest,.view.on .dossiers,.view.on .facet-kicker,.view.on .record-list,.site-head,.domain-strip";
// A press that starts on copy belongs to the reader: it may select text, and it never strikes the plate.
const COPY = ".positioning,.manifest,.dossiers,.record-list,.index-overlay,.system-panel";
const DRIFT = 0.012, KICK = 0.02, FLOOR = 0.0011, GAIN = 0.06, TRAIL = 0.11, MARK_LIFE = 30, EXPOSURE = 1.5;

const COMMON = /* wgsl */ `
struct U { a: vec4f, b: vec4f, c: vec4f, d: vec4f, e: vec4f, f: vec4f, g: vec4f, h: vec4f, i: vec4f }
fn hash(n: u32) -> u32 { var x = n; x = x ^ (x >> 16u); x = x * 0x7feb352du; x = x ^ (x >> 15u); x = x * 0x846ca68bu; x = x ^ (x >> 16u); return x; }
`;

const SIM = COMMON + /* wgsl */ `
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read_write> P: array<vec4f>;
@group(0) @binding(2) var maskT: texture_2d<f32>;
@group(0) @binding(3) var maskS: sampler;
@group(0) @binding(4) var markT: texture_2d<f32>;
const PI: f32 = 3.14159265;
fn rnd(n: u32) -> f32 { return f32(hash(n) >> 8u) / 16777216.0; }
fn fld(id: i32, p: vec2f) -> f32 {
let t = u.b.x;
let c = p - vec2f(0.30 * u.a.z, 0.0);
let r = length(c);
let th = atan2(c.y, c.x);
var v = 0.0;
switch id {
case 1 { v = cos(9.0 * PI * p.x + 0.22 * sin(2.0 * PI * p.y + t * 0.07)); }
case 2 { v = cos(5.0 * PI * p.x) * cos(5.0 * PI * p.y) - 0.30; }
case 3 { v = cos(6.0 * PI * p.x) * cos(6.0 * PI * p.y); }
case 4 { v = sin(8.0 * PI * p.y + 1.5 * sin(2.2 * PI * p.x + 0.6 + t * 0.05) + 0.6 * sin(5.3 * PI * p.x - t * 0.04)); }
case 5 { v = sin(11.0 * PI * r - 3.0 * th + t * 0.10); }
case 6 { let k = 7.0 * PI; v = (cos(k * p.x) + cos(k * (0.5 * p.x + 0.8660254 * p.y)) + cos(k * (0.5 * p.x - 0.8660254 * p.y))) / 3.0 + 0.18; }
case 7 { v = 0.62 * cos(8.0 * PI * r) + 0.38 * cos(5.0 * th + 2.0 * PI * r); }
case 8 { v = cos(12.0 * PI * length(c * vec2f(1.0, 1.7)) - t * 0.08); }
default {
let a = u.e.w;
let m1 = cos(3.0 * PI * c.x) * cos(7.0 * PI * c.y) - cos(7.0 * PI * c.x) * cos(3.0 * PI * c.y);
let m2 = cos(2.0 * PI * c.x) * cos(5.0 * PI * c.y) + cos(5.0 * PI * c.x) * cos(2.0 * PI * c.y);
v = 0.5 * (cos(a) * m1 + sin(a) * m2);
}
}
return v;
}
fn uvOf(p: vec2f) -> vec2f { return p / (2.0 * u.a.zw) + vec2f(0.5); }
fn page(p: vec2f) -> vec4f { return textureSampleLevel(maskT, maskS, uvOf(p), 0.0); }
fn mark(p: vec2f) -> f32 { return textureSampleLevel(markT, maskS, uvOf(p), 0.0).r; }
fn plate(q: vec2f) -> f32 {
let c0 = vec2f(0.30 * u.a.z, 0.0);
let p = c0 + (q - c0) * u.i.x;
let k = u.c.z;
var f = 0.0;
if (k <= 0.001) { f = fld(i32(u.c.x), p); }
else if (k >= 0.999) { f = fld(i32(u.c.y), p); }
else { f = mix(fld(i32(u.c.x), p), fld(i32(u.c.y), p), k); }
if (u.h.x > 0.01) {
f = mix(f, fld(i32(u.c.y), c0 + (p - c0) * 1.9), u.h.x);
}
return f;
}
fn ampm(p: vec2f, m: vec4f, k: f32) -> f32 {
return plate(p) * (1.0 - m.r) * (1.0 - m.g) * (1.0 - 0.93 * k) + 1.4 * m.g * (1.0 - m.r) * (1.0 - 0.8 * m.b);
}
@compute @workgroup_size(256)
fn sim(@builtin(global_invocation_id) gid: vec3u) {
let i = gid.x;
if (i >= u32(u.b.w)) { return; }
let q = P[i];
var p = q.xy;
let fr = u32(u.b.z);
let dt = u.b.y;
let lim = u.a.zw;
let eps = 2.0 / u.f.w;
let dx = vec2f(eps, 0.0);
let dy = vec2f(0.0, eps);
let m = page(p);
let mE = page(p + dx);
let mW = page(p - dx);
let mS = page(p + dy);
let mN = page(p - dy);
let a0 = ampm(p, m, mark(p));
let ex = ampm(p + dx, mE, mark(p + dx));
let wx = ampm(p - dx, mW, mark(p - dx));
let ey = ampm(p + dy, mS, mark(p + dy));
let wy = ampm(p - dy, mN, mark(p - dy));
var v = -vec2f(ex * ex - wx * wx, ey * ey - wy * wy) / (2.0 * eps) * u.f.x;
let sp = length(v);
if (sp > 2.5) { v = v * (2.5 / sp); }
v = v + vec2f(mE.b - mW.b, mS.b - mN.b) / (2.0 * eps) * 0.012 * (1.0 - m.r);
let free = 1.0 - m.r;
let dp = p - u.d.xy;
v = v + u.d.zw * exp(-dot(dp, dp) / 0.0016) * 0.9 * free;
v = v + u.h.yz * 0.6 * free;
var ring = 0.0;
var push = vec2f(0.0);
if (u.e.z < u.h.w) {
let fall = pow(1.0 - u.e.z / u.h.w, 2.0) * u.g.w;
for (var k = 0; k < 5; k++) {
var s = u.e.xy;
var w = 0.55;
if (k == 0) { w = 1.0; }
if (k == 1) { s.x = 2.0 * lim.x - s.x; }
if (k == 2) { s.x = -2.0 * lim.x - s.x; }
if (k == 3) { s.y = 2.0 * lim.y - s.y; }
if (k == 4) { s.y = -2.0 * lim.y - s.y; }
let sd = p - s;
let sr = length(sd);
let rg = exp(-pow((sr - u.e.z * 1.7) / 0.05, 2.0)) * fall * w;
ring = ring + rg;
push = push + (sd / (sr + 0.0001)) * rg;
}
}
v = v + push * 1.6 * free;
let sig = (u.f.y * abs(a0) + u.f.z + (u.c.w * 0.03 + ring * 0.012) * free) * sqrt(dt * 60.0);
let ang = 6.2831853 * rnd(i * 2u + fr * 7919u);
let rad = sqrt(rnd(i * 2u + 1u + fr * 104729u));
let step = v * dt + vec2f(cos(ang), sin(ang)) * rad * sig;
p = p + step;
if (p.x > lim.x) { p.x = 2.0 * lim.x - p.x; }
if (p.x < -lim.x) { p.x = -2.0 * lim.x - p.x; }
if (p.y > lim.y) { p.y = 2.0 * lim.y - p.y; }
if (p.y < -lim.y) { p.y = -2.0 * lim.y - p.y; }
p = clamp(p, -lim, lim);
var h = max(q.z * 0.88, min(1.0, length(step) * 60.0));
if (m.g > 0.72 && m.r < 0.1 && m.b < 0.03) {
p = vec2f((rnd(i * 2u + fr * 31337u) * 2.0 - 1.0) * lim.x, (rnd(i * 2u + 1u + fr * 49157u) * 2.0 - 1.0) * lim.y);
h = 1.0;
}
if (dot(u.h.yz, u.h.yz) > 0.0025 && (abs(p.x) > lim.x - 0.012 || abs(p.y) > lim.y - 0.012) && rnd(i * 2u + fr * 15485863u) < 0.25) {
p = vec2f((rnd(i * 2u + fr * 32452843u) * 2.0 - 1.0) * lim.x, (rnd(i * 2u + 1u + fr * 86028121u) * 2.0 - 1.0) * lim.y);
h = 1.0;
}
P[i] = vec4f(p, h, m.r);
}
`;

const DRAW = COMMON + /* wgsl */ `
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> P: array<vec4f>;
@group(0) @binding(2) var<uniform> pal: array<vec4f, 10>;
@group(0) @binding(3) var maskT: texture_2d<f32>;
@group(0) @binding(4) var maskS: sampler;
struct VO { @builtin(position) pos: vec4f, @location(0) uv: vec2f, @location(1) col: vec3f }
@vertex
fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VO {
var corners = array<vec2f, 6>(vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0), vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0));
let q = P[ii];
let h = q.z;
let grow = 1.0 + 2.6 * h;
var px = q.xy * u.f.w;
px.y = px.y - h * pal[9].z;
let z = h * pal[9].z * 4.0;
let ct = cos(u.g.x);
let st = sin(u.g.x);
let y1 = px.y * ct - z * st;
let z1 = px.y * st + z * ct;
let sc = u.g.z / max(u.g.z - z1, 0.2 * u.g.z);
let rad = pal[9].x * grow * sc;
let c = corners[vi];
var o: VO;
o.pos = vec4f((px.x * sc + c.x * rad) / (0.5 * u.a.x), -(y1 * sc + c.y * rad) / (0.5 * u.a.y), 0.0, 1.0);
o.uv = c;
let m = textureSampleLevel(maskT, maskS, q.xy / (2.0 * u.a.zw) + vec2f(0.5), 0.0);
let vis = 1.0 - m.g * (1.0 - m.r);
let f = fract(0.5 + 0.22 * q.x / u.a.z + 0.13 * q.y / u.a.w + (f32(hash(ii) & 255u) / 255.0 - 0.5) * 0.12) * 8.0;
let i0 = u32(f);
let tint = mix(pal[i0].rgb, pal[i0 + 1u].rgb, fract(f));
let inLetter = q.w;
let lit = mix(tint, vec3f(1.0, 0.97, 0.92), min(1.0, h * 0.28 + inLetter * 0.45));
o.col = lit * (vis * pal[9].y * (1.0 + 1.6 * h + u.g.y * inLetter) / (grow * grow));
return o;
}
@fragment
fn fs(i: VO) -> @location(0) vec4f {
let d = dot(i.uv, i.uv);
if (d > 1.0) { discard; }
let a = 1.0 - d;
return vec4f(i.col * a * a, 1.0);
}
`;

const TRI = /* wgsl */ `
@vertex
fn vs(@builtin(vertex_index) vi: u32) -> @builtin(position) vec4f {
var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
return vec4f(p[vi], 0.0, 1.0);
}
`;

const FADE = TRI + /* wgsl */ `
@fragment
fn fs() -> @location(0) vec4f { return vec4f(0.0); }
`;

const SHOW = TRI + /* wgsl */ `
struct V { g: vec4f, s: vec4f }
@group(0) @binding(0) var<uniform> v: V;
@group(0) @binding(1) var accT: texture_2d<f32>;
@group(0) @binding(2) var accS: sampler;
fn lum(uv: vec2f) -> f32 { return dot(textureSampleLevel(accT, accS, uv, 0.0).rgb, vec3f(0.3333)); }
@fragment
fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
let px = v.s.xy;
let uv = fc.xy * px;
var col = textureSampleLevel(accT, accS, uv, 0.0).rgb;
if (v.g.w > 0.0) {
let h0 = dot(col, vec3f(0.3333));
let e = px * 2.0;
let hx = lum(uv + vec2f(e.x, 0.0)) - lum(uv - vec2f(e.x, 0.0));
let hy = lum(uv + vec2f(0.0, e.y)) - lum(uv - vec2f(0.0, e.y));
let lit = (hx * 0.78 + hy * 0.62) * v.g.w;
var sh = 0.0;
for (var k = 1; k <= 4; k++) {
let hh = lum(uv - vec2f(0.78, 0.62) * px * (f32(k) * 3.0));
sh = max(sh, hh - h0 - f32(k) * 0.05);
}
col = col * (1.0 + clamp(lit * 2.0, -0.7, 1.5)) * (1.0 - clamp(sh * v.s.w, 0.0, 0.8));
col = col + vec3f(1.0, 0.96, 0.9) * pow(clamp(lit * 1.5, 0.0, 1.0), 3.0) * 0.45;
}
return vec4f(v.g.rgb + (vec3f(1.0) - exp(-col * v.s.z)), 1.0);
}
`;

const hex = (h) => { const n = parseInt(String(h).replace("#", "").slice(0, 6), 16) || 0; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export const Resonance = {
  async init(doc, { theme, mobile = false, state = "home", onFail } = {}) {
    const win = doc.defaultView, body = doc.body, root = doc.documentElement;
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error("no WebGPU adapter");
    const info = adapter.info || {};
    if (adapter.isFallbackAdapter || /swiftshader|software|llvmpipe|lavapipe/i.test(`${info.vendor} ${info.architecture} ${info.description}`)) throw new Error("software WebGPU adapter");
    const device = await adapter.requestDevice();

    const MAX = mobile ? 360000 : 1400000, MIN = mobile ? 90000 : 220000;
    let count = MAX;

    const canvas = doc.createElement("canvas");
    canvas.id = "sand";
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("webgpu");
    const format = navigator.gpu.getPreferredCanvasFormat();
    ctx.configure({ device, format, alphaMode: "opaque" });

    let W = 2, H = 2, S = 1, ax = 1, ay = 1, dpr = 1, cssW = 2, cssH = 2;
    function size() {
      cssW = win.innerWidth || root.clientWidth || 1280;
      cssH = win.innerHeight || root.clientHeight || 800;
      dpr = Math.min(win.devicePixelRatio || 1, 2);
      W = Math.max(2, Math.round(cssW * dpr));
      H = Math.max(2, Math.round(cssH * dpr));
      canvas.width = W; canvas.height = H;
      S = Math.max(W, H) / 2; ax = W / (2 * S); ay = H / (2 * S);
    }
    size();

    // deterministic start: the same sand falls the same way on every load
    const pBuf = device.createBuffer({ size: MAX * 16, usage: GPUBufferUsage.STORAGE, mappedAtCreation: true });
    {
      const a = new Float32Array(pBuf.getMappedRange());
      let s = 0x9e3779b9;
      const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (let i = 0; i < MAX; i++) { a[i * 4] = (rnd() * 2 - 1) * ax; a[i * 4 + 1] = (rnd() * 2 - 1) * ay; a[i * 4 + 2] = 1; a[i * 4 + 3] = 0; }
    }
    pBuf.unmap();

    const U = new Float32Array(36), PAL = new Float32Array(40), V = new Float32Array(8);
    const ubo = (a) => device.createBuffer({ size: a.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const uBuf = ubo(U), palBuf = ubo(PAL), glowBuf = ubo(PAL), vBuf = ubo(V);
    const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

    // Light is gathered in a float texture that fades between frames (long exposure),
    // then shown through a pass that lights the sand as relief and maps it to the screen.
    const ACC = "rgba16float";
    const add = { srcFactor: "one", dstFactor: "one", operation: "add" };
    const keep = { srcFactor: "zero", dstFactor: "constant", operation: "add" };
    const mod = (code) => device.createShaderModule({ code });
    device.pushErrorScope("validation");
    const simPipe = device.createComputePipeline({ layout: "auto", compute: { module: mod(SIM), entryPoint: "sim" } });
    const dm = mod(DRAW), fm = mod(FADE), sm = mod(SHOW);
    const drawPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: dm, entryPoint: "vs" }, fragment: { module: dm, entryPoint: "fs", targets: [{ format: ACC, blend: { color: add, alpha: add } }] }, primitive: { topology: "triangle-list" } });
    const fadePipe = device.createRenderPipeline({ layout: "auto", vertex: { module: fm, entryPoint: "vs" }, fragment: { module: fm, entryPoint: "fs", targets: [{ format: ACC, blend: { color: keep, alpha: keep } }] }, primitive: { topology: "triangle-list" } });
    const showPipe = device.createRenderPipeline({ layout: "auto", vertex: { module: sm, entryPoint: "vs" }, fragment: { module: sm, entryPoint: "fs", targets: [{ format }] }, primitive: { topology: "triangle-list" } });
    const bad = await device.popErrorScope();
    if (bad) { device.destroy(); throw new Error("pipeline: " + bad.message); }

    let acc = null, accView = null, showBG = null, accW = 0, accH = 0, fresh = true;
    function makeAcc() {
      acc?.destroy();
      acc = device.createTexture({ size: [W, H], format: ACC, usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING });
      accView = acc.createView(); accW = W; accH = H; fresh = true;
      showBG = device.createBindGroup({ layout: showPipe.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: vBuf } }, { binding: 1, resource: accView }, { binding: 2, resource: sampler }] });
    }

    // ---- the page as a mask (red: heading glyphs, green: copy, blue: pull toward glyphs)
    // ---- and the visitor's marks, which the plate remembers for MARK_LIFE seconds
    const K = 0.5;
    const mc = doc.createElement("canvas"), m2 = mc.getContext("2d");
    const kc = doc.createElement("canvas"), k2 = kc.getContext("2d");
    let maskTex = null, markTex = null, simBG = null, drawBG = null, glowBG = null, mw = 2, mh = 2, dirty = true, lastMask = -1e9;
    let marks = [], markDirty = true, lastMark = -1e9;
    function makeMaskTextures() {
      mw = Math.max(2, Math.ceil(cssW * K)); mh = Math.max(2, Math.ceil(cssH * K));
      mc.width = kc.width = mw; mc.height = kc.height = mh;
      maskTex?.destroy(); markTex?.destroy();
      const usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT;
      maskTex = device.createTexture({ size: [mw, mh], format: "rgba8unorm", usage });
      markTex = device.createTexture({ size: [mw, mh], format: "rgba8unorm", usage });
      const mv = maskTex.createView();
      simBG = device.createBindGroup({ layout: simPipe.getBindGroupLayout(0), entries: [
        { binding: 0, resource: { buffer: uBuf } }, { binding: 1, resource: { buffer: pBuf } },
        { binding: 2, resource: mv }, { binding: 3, resource: sampler }, { binding: 4, resource: markTex.createView() },
      ] });
      const draw = (buffer) => device.createBindGroup({ layout: drawPipe.getBindGroupLayout(0), entries: [
        { binding: 0, resource: { buffer: uBuf } }, { binding: 1, resource: { buffer: pBuf } }, { binding: 2, resource: { buffer } },
        { binding: 3, resource: mv }, { binding: 4, resource: sampler },
      ] });
      drawBG = draw(palBuf); glowBG = draw(glowBuf);
      markDirty = true;
    }
    function buildMask() {
      if (!maskTex || mw !== Math.max(2, Math.ceil(cssW * K)) || mh !== Math.max(2, Math.ceil(cssH * K))) makeMaskTextures();
      m2.setTransform(K, 0, 0, K, 0, 0);
      m2.globalCompositeOperation = "source-over";
      m2.filter = "none";
      m2.fillStyle = "#000";
      m2.fillRect(0, 0, cssW, cssH);
      m2.globalCompositeOperation = "lighter";
      m2.filter = "blur(7px)";
      m2.fillStyle = "#00ff00";
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const el of doc.querySelectorAll(REPEL)) {
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > cssH) continue;
        if (el.closest(".view") && !el.classList.contains("facet-kicker")) { x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
        else m2.fillRect(r.left - 14, r.top - 10, r.width + 28, r.height + 20);
      }
      if (x1 > x0) m2.fillRect(x0 - 16, y0 - 12, x1 - x0 + 32, Math.min(y1, cssH) - y0 + 24);
      const h = doc.querySelector(".view.on h1, .view.on h2");
      if (h) {
        const cs = win.getComputedStyle(h), hr = h.getBoundingClientRect();
        if (hr.width > 2 && hr.bottom > 0 && hr.top < cssH) m2.fillRect(hr.left - 12, hr.top - 8, hr.width + 24, hr.height + 16);
        m2.filter = "blur(0.8px)";
        m2.fillStyle = "#ff0000";
        m2.textBaseline = "alphabetic";
        m2.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        const fmx = m2.measureText("Hg"), asc = fmx.fontBoundingBoxAscent || 1, desc = fmx.fontBoundingBoxDescent || 0;
        const range = doc.createRange(), walker = doc.createTreeWalker(h, NodeFilter.SHOW_TEXT), glyphs = [];
        for (let node; (node = walker.nextNode());) {
          const text = node.nodeValue;
          for (let i = 0; i < text.length; i++) {
            if (!text[i].trim()) continue;
            range.setStart(node, i); range.setEnd(node, i + 1);
            const r = range.getBoundingClientRect();
            if (r.width) glyphs.push([text[i], r.left, r.top + r.height * asc / (asc + desc)]);
          }
        }
        for (const [ch, x, y] of glyphs) m2.fillText(ch, x, y);
        m2.filter = "blur(9px)";
        m2.fillStyle = "#0000ff";
        for (const [ch, x, y] of glyphs) m2.fillText(ch, x, y);
      }
      m2.filter = "none";
      device.queue.copyExternalImageToTexture({ source: mc }, { texture: maskTex }, [mw, mh]);
    }
    const queueMask = () => { dirty = true; for (const ms of [220, 520, 900]) win.setTimeout(() => { dirty = true; }, ms); };

    // ---- theme: colours come from the site's own recipe system
    const palT = new Float32Array(27).fill(0.7), palC = new Float32Array(27).fill(0.7);
    let groundT = [0.035, 0.043, 0.063], groundC = [0.035, 0.043, 0.063], themed = false;
    function onRecipe(e) {
      const c = e.detail?.recipe?.chromatic;
      if (!c) return;
      (c.colors || []).slice(0, 9).forEach((x, i) => {
        const [r, g, b] = x.rgb.map((v) => v / 255), l = 0.3 * r + 0.59 * g + 0.11 * b;
        palT[i * 3] = clamp(l + (r - l) * 1.5, 0, 1);
        palT[i * 3 + 1] = clamp(l + (g - l) * 1.5, 0, 1);
        palT[i * 3 + 2] = clamp(l + (b - l) * 1.5, 0, 1);
      });
      groundT = hex(c.ground);
      if (!themed) { themed = true; palC.set(palT); groundC = groundT.slice(); }
    }
    win.addEventListener("superposition:recipe", onRecipe);

    // ---- state
    let stateId = state, idA = STATE_ID[state] ?? 0, idB = idA, shakeT = 0, shakeAmp = 1, previewing = false;
    let mixV = 1, mixT = 1, hovering = false;
    const intro = root.classList.contains("sand-pending");
    let revealed = !intro;
    let t = 0, fr = 0, last = 0, raf = 0, running = false, userPaused = false, dead = false;
    let ptrX = 9, ptrY = 9, prevX = 9, prevY = 9, pvx = 0, pvy = 0, moved = 0;
    let strikeX = 0, strikeY = 0, strikeAge = 9, strikePow = 0, strikeLife = 1, over = 0, joltT = 9, joltAmp = 0;
    let down = false, touch = false, downT = 0, travel = 0, lastX = 0, lastY = 0, gx = 0, gy = 0, gxs = 0, gys = 0;
    let rx = 0, ry = 0, nx = 0, ny = 0, tilted = false;
    let pitch = 1, pitchS = 1;
    let frames = 0, clock = 0, low = 0, born = 0;
    const retarget = (id, amp) => { idA = mixV > 0.5 ? idB : idA; idB = id; mixV = 0; mixT = 1; shakeT = 0; shakeAmp = amp; };
    // Live superposition: pointing at another domain blends its mode half-way into the current one.
    const hoverOn = (id) => {
      const cur = STATE_ID[stateId] ?? 0;
      if (id === cur) return;
      idA = cur; idB = id; mixV = Math.min(mixV, 0.5) * (hovering ? 1 : 0); mixT = 0.5; shakeT = 0; shakeAmp = 0.2; hovering = true;
    };
    const hoverOff = () => { if (hovering) { hovering = false; mixT = 0; shakeT = 0; shakeAmp = 0.12; } };
    const toPlate = (x, y) => [(x - cssW / 2) * dpr / S, (y - cssH / 2) * dpr / S];

    // The boom. A tap strikes lightly; a held press charges it. A hard strike rings an
    // overtone, rocks the plate and wipes the visitor's marks.
    function strike(cx, cy, power) {
      [strikeX, strikeY] = toPlate(cx, cy);
      strikeAge = 0; strikePow = power; strikeLife = 0.8 + 0.9 * power; joltT = 0; joltAmp = power;
      if (power > 0.55) over = Math.max(over, power * 0.85);
      if (power > 0.9) { for (const s of marks) s.t = Math.min(s.t, t - MARK_LIFE + 0.4); markDirty = true; }
    }
    const onMove = (e) => {
      [ptrX, ptrY] = toPlate(e.clientX, e.clientY); moved = 0;
      if (!down) return;
      travel += Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (!touch && travel > 6) {
        marks.push({ x0: lastX, y0: lastY, x1: e.clientX, y1: e.clientY, w: 7 + 20 * Math.min(1, (t - downT) / 0.9), t });
        if (marks.length > 500) marks.shift();
        markDirty = true;
      }
      lastX = e.clientX; lastY = e.clientY;
    };
    const onDown = (e) => {
      if (e.button > 0 || e.target.closest?.(COPY + ",#sand-dial")) return;
      down = true; touch = e.pointerType === "touch"; downT = t; travel = 0; lastX = e.clientX; lastY = e.clientY;
      [ptrX, ptrY] = toPlate(e.clientX, e.clientY);
    };
    const onUp = (e) => {
      if (!down) return;
      down = false; markDirty = true;
      if (travel < 14) strike(e.clientX, e.clientY, Math.min(1, 0.35 + 0.65 * Math.min(1, (t - downT) / 1.1)));
    };
    const onCancel = () => { down = false; markDirty = true; };
    // A press on the plate never starts a text selection. A press on copy still does.
    const noSelect = (e) => { if (!e.target.closest?.(COPY + ",a,button,input,textarea,select")) e.preventDefault(); };
    const onResize = () => { size(); dirty = true; };

    function drawMarks() {
      k2.setTransform(K, 0, 0, K, 0, 0);
      k2.globalCompositeOperation = "source-over";
      k2.fillStyle = "#000";
      k2.fillRect(0, 0, cssW, cssH);
      k2.globalCompositeOperation = "lighter";
      k2.lineCap = "round";
      marks = marks.filter((s) => t - s.t < MARK_LIFE);
      for (const s of marks) {
        const a = Math.min(1, (MARK_LIFE - (t - s.t)) / 8);
        for (const [w, al] of [[s.w + 16, 0.35 * a], [s.w, a]]) {
          k2.strokeStyle = `rgba(255,255,255,${al.toFixed(3)})`;
          k2.lineWidth = w;
          k2.beginPath(); k2.moveTo(s.x0, s.y0); k2.lineTo(s.x1, s.y1); k2.stroke();
        }
      }
      // a held press stills the plate under the pointer: the sand gathers there
      const held = t - downT;
      if (down && !touch && held > 0.18) {
        const r = 8 + 26 * Math.min(1, held);
        for (const [rr, al] of [[r + 10, 0.35], [r, 1]]) { k2.fillStyle = `rgba(255,255,255,${al})`; k2.beginPath(); k2.arc(lastX, lastY, rr, 0, 6.2832); k2.fill(); }
      }
      device.queue.copyExternalImageToTexture({ source: kc }, { texture: markTex }, [mw, mh]);
    }

    function frame(now) {
      if (!running) return;
      raf = win.requestAnimationFrame(frame);
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.033);
      last = now; t += dt; fr++; shakeT += dt; strikeAge += dt; joltT += dt; moved += dt;
      if (dirty && now - lastMask > 90) { dirty = false; lastMask = now; buildMask(); }
      if (!simBG) return;
      if ((markDirty || marks.length || down) && now - lastMark > 66) { markDirty = false; lastMark = now; drawMarks(); }
      if (!acc || accW !== W || accH !== H) makeAcc();

      mixV += (mixT - mixV) * Math.min(1, dt * 6.5);
      const held = down && travel < 14 ? Math.min(1, (t - downT) / 1.1) : 0;
      const shake = (shakeT < 0.05 ? shakeT / 0.05 : shakeT < 0.3 ? 1 : Math.max(0, 1 - (shakeT - 0.3) / 0.18)) * shakeAmp + 0.1 * held;
      if (dt > 0 && moved < 0.08 && prevX < 8) { pvx += ((ptrX - prevX) / dt - pvx) * 0.35; pvy += ((ptrY - prevY) / dt - pvy) * 0.35; } else { pvx *= 0.8; pvy *= 0.8; }
      prevX = ptrX; prevY = ptrY;
      over *= Math.exp(-dt / 0.45);
      pitchS += (pitch - pitchS) * Math.min(1, dt * 5);
      if (tilted) {
        nx += (rx - nx) * Math.min(1, dt / 6); ny += (ry - ny) * Math.min(1, dt / 6);
        const dz = (a) => (Math.abs(a) < 0.12 ? 0 : a - Math.sign(a) * 0.12);
        gx = clamp(dz(rx - nx) * 0.9, -1, 1); gy = clamp(dz(ry - ny) * 0.9, -1, 1);
      }
      gxs += (gx - gxs) * Math.min(1, dt * 6); gys += (gy - gys) * Math.min(1, dt * 6);

      // opening: the plate starts tipped back like a landscape and swings up to face the
      // reader. A page change and a strike both rock it briefly.
      const tilt = (intro ? 1.02 * Math.pow(1 - Math.min(1, t / 1.8), 3) : 0)
        + 0.09 * shakeAmp * Math.sin(Math.PI * Math.min(1, shakeT / 0.55))
        + 0.08 * joltAmp * Math.sin(Math.PI * Math.min(1, joltT / 0.5));
      if (!revealed && t > 1.0) { revealed = true; root.classList.remove("sand-pending"); }
      U.set([W, H, ax, ay, t, dt, fr, count, idA, idB, mixV, shake, ptrX, ptrY, pvx, pvy, strikeX, strikeY, strikeAge, t * 0.045,
        DRIFT, KICK, FLOOR, S, tilt, mobile ? 1.2 : 3.0, 2.4 * S, strikePow, over < 0.01 ? 0 : over, gxs, gys, strikeLife, pitchS, 0, 0, 0]);
      device.queue.writeBuffer(uBuf, 0, U);

      const k = Math.min(1, dt * 3.2), decay = Math.exp(-Math.max(dt, 1 / 240) / TRAIL);
      for (let i = 0; i < 27; i++) palC[i] += (palT[i] - palC[i]) * k;
      for (let i = 0; i < 3; i++) groundC[i] += (groundT[i] - groundC[i]) * k;
      for (let i = 0; i < 9; i++) { PAL[i * 4] = palC[i * 3]; PAL[i * 4 + 1] = palC[i * 3 + 1]; PAL[i * 4 + 2] = palC[i * 3 + 2]; PAL[i * 4 + 3] = 1; }
      PAL[36] = 1.15 * dpr; PAL[37] = Math.min(GAIN * (W * H) / count, 0.12) * (1 - decay); PAL[38] = 12 * dpr; PAL[39] = 0;
      device.queue.writeBuffer(palBuf, 0, PAL);
      PAL[36] *= mobile ? 3.5 : 7; PAL[37] *= mobile ? 0.04 : 0.085;
      device.queue.writeBuffer(glowBuf, 0, PAL);
      // a load without the opening sequence raises the light over 0.6 s, so the sand never pops in
      V.set([groundC[0], groundC[1], groundC[2], mobile ? 0 : 1, 1 / W, 1 / H, EXPOSURE * (intro ? 1 : Math.min(1, t / 0.6)), mobile ? 0 : 1.4]);
      device.queue.writeBuffer(vBuf, 0, V);

      const enc = device.createCommandEncoder();
      const cp = enc.beginComputePass();
      cp.setPipeline(simPipe); cp.setBindGroup(0, simBG); cp.dispatchWorkgroups(Math.ceil(count / 256)); cp.end();
      const ap = enc.beginRenderPass({ colorAttachments: [{ view: accView, clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: fresh ? "clear" : "load", storeOp: "store" }] });
      fresh = false;
      ap.setBlendConstant({ r: decay, g: decay, b: decay, a: decay });
      ap.setPipeline(fadePipe); ap.draw(3);
      ap.setPipeline(drawPipe); ap.setBindGroup(0, drawBG); ap.draw(6, count);
      ap.setBindGroup(0, glowBG); ap.draw(6, Math.floor(count / 12)); ap.end();
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(showPipe); rp.setBindGroup(0, showBG); rp.draw(3); rp.end();
      device.queue.submit([enc.finish()]);

      // governor: shed grains before frames, and leave for the static ground if that fails
      frames++;
      if (now - clock >= 1000) {
        const fps = frames * 1000 / (now - clock);
        frames = 0; clock = now;
        body.dataset.fps = fps.toFixed(0);
        if (tilted) body.dataset.tilt = gx.toFixed(2) + " " + gy.toFixed(2);
        if (now - born > 3000) {
          low = fps < 44 ? low + 1 : 0;
          if (low >= 2 && count > MIN) { count = Math.max(MIN, Math.floor(count * 0.62)); low = 0; body.dataset.particles = String(count); }
          else if (low >= 4 && count <= MIN && fps < 22) fail("resonance too slow on this device");
        }
      }
    }

    function sync() {
      const paused = userPaused || doc.hidden;
      body.toggleAttribute("data-paused", paused);
      if (!paused && !running && !dead) { running = true; last = win.performance.now(); clock = last; frames = 0; raf = win.requestAnimationFrame(frame); }
      if (paused && running) { running = false; win.cancelAnimationFrame(raf); }
    }
    function dispose() {
      if (dead) return;
      dead = true; running = false; win.cancelAnimationFrame(raf);
      win.removeEventListener("superposition:recipe", onRecipe);
      win.removeEventListener("pointermove", onMove); win.removeEventListener("pointerdown", onDown);
      win.removeEventListener("pointerup", onUp); win.removeEventListener("pointercancel", onCancel);
      doc.removeEventListener("mousedown", noSelect);
      win.removeEventListener("resize", onResize); doc.removeEventListener("visibilitychange", sync);
      root.classList.remove("sand", "sand-pending"); canvas.remove(); doc.getElementById("sand-dial")?.remove();
      try { device.destroy(); } catch {}
    }
    function fail(reason) { if (dead) return; dispose(); onFail?.(reason); }
    device.lost.then((x) => { if (!dead) fail("device lost: " + (x?.message || "")); });
    device.addEventListener("uncapturederror", (e) => { win.console.warn("resonance: " + (e.error?.message || e)); fail("gpu error"); });

    const api = {
      renderer: "webgpu", tier: mobile ? 2 : 1,
      get state() { return stateId; },
      setState(id, { togglePause = false } = {}) {
        if (togglePause) { api.togglePause(); return; }
        const changed = id !== stateId;
        theme?.setState?.(id);
        if (changed) {
          const nid = STATE_ID[id] ?? 0;
          stateId = id; previewing = false;
          if (hovering && nid === idB) { mixT = 1; shakeT = 0; shakeAmp = 1; } else retarget(nid, 1);
          hovering = false;
        }
        queueMask();
      },
      previewState(id) { theme?.previewState?.(id); previewing = true; hoverOn(STATE_ID[id] ?? 0); },
      clearPreview() { theme?.clearPreview?.(); if (previewing) { previewing = false; hoverOff(); } },
      nextRecipe() { const r = theme?.nextRecipe?.(); strike(cssW * 0.65, cssH * 0.5, 0.6); return r; },
      setRecipeSeed(n) { theme?.setRecipeSeed?.(n); },
      getDebugState() {
        return { ...(theme?.getDebugState?.() || {}), state: stateId, backend: "webgpu", tier: api.tier, topology: "resonance", law: "superposition", layers: 1, surfaceLayers: 0, cost: count, primitives: count };
      },
      setScroll() { dirty = true; },
      // phones: js/main.js feeds device tilt here. The sand pours toward the low side.
      // The pose the phone is first held in counts as level, and level follows the hand
      // slowly, so a new way of holding it lets the figure form again.
      setParallax(x, y) { rx = x; ry = y; if (!tilted) { tilted = true; nx = x; ny = y; } },
      togglePause() { userPaused = !userPaused; sync(); },
      dispose,
    };

    // The dial tunes the plate: a higher pitch draws a finer figure. Drag it, scroll over
    // it, or use the arrow keys; Home or a double click returns it to the domain's pitch.
    const dial = doc.createElement("div");
    dial.id = "sand-dial";
    dial.tabIndex = 0;
    dial.setAttribute("role", "slider");
    dial.setAttribute("aria-label", "Pitch of the plate");
    dial.setAttribute("aria-orientation", "vertical");
    dial.setAttribute("aria-valuemin", "0");
    dial.setAttribute("aria-valuemax", "100");
    dial.appendChild(doc.createElement("i"));
    const REST = Math.log(1 / 0.55) / Math.log(4);
    let dialV = REST;
    const setDial = (v) => {
      dialV = clamp(v, 0, 1);
      pitch = 0.55 * Math.pow(4, dialV);
      dial.style.setProperty("--v", ((1 - dialV) * 100).toFixed(1) + "%");
      dial.setAttribute("aria-valuenow", String(Math.round(dialV * 100)));
    };
    const dialAt = (e) => { const r = dial.getBoundingClientRect(); setDial(1 - (e.clientY - r.top) / r.height); };
    dial.addEventListener("pointerdown", (e) => { dial.setPointerCapture(e.pointerId); dialAt(e); });
    dial.addEventListener("pointermove", (e) => { if (dial.hasPointerCapture(e.pointerId)) dialAt(e); });
    dial.addEventListener("dblclick", () => setDial(REST));
    dial.addEventListener("wheel", (e) => { e.preventDefault(); setDial(dialV - Math.sign(e.deltaY) * 0.03); }, { passive: false });
    dial.addEventListener("keydown", (e) => {
      const step = { ArrowUp: 0.03, ArrowDown: -0.03, PageUp: 0.12, PageDown: -0.12 }[e.key];
      if (step) { e.preventDefault(); e.stopPropagation(); setDial(dialV + step); }
      else if (e.key === "Home") { e.preventDefault(); setDial(REST); }
    });
    setDial(REST);
    doc.body.appendChild(dial);

    doc.getElementById("field").before(canvas);
    root.classList.add("sand");
    body.dataset.particles = String(count);
    theme?.setState?.(state);
    win.addEventListener("pointermove", onMove, { passive: true });
    win.addEventListener("pointerdown", onDown, { passive: true });
    win.addEventListener("pointerup", onUp, { passive: true });
    win.addEventListener("pointercancel", onCancel, { passive: true });
    doc.addEventListener("mousedown", noSelect);
    win.addEventListener("resize", onResize);
    doc.addEventListener("visibilitychange", sync);
    doc.querySelector("main")?.addEventListener("click", queueMask);
    for (const a of doc.querySelectorAll(".domain-strip a")) {
      a.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") hoverOn(STATE_ID[a.dataset.facet] ?? 0); });
      a.addEventListener("pointerleave", hoverOff);
    }
    doc.fonts?.ready?.then(() => { dirty = true; });
    try { win.sessionStorage.setItem("sp-sand", "1"); } catch {}
    born = win.performance.now();
    sync();
    return api;
  },
};
