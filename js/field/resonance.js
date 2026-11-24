/* RESONANCE: the field as a resonating plate. Sand gathers on the nodal lines of the
   current mode, fills the heading's glyphs and leaves the copy clear. Raw WebGPU.
   Read docs/RESONANCE.md before changing anything here. */

const STATE_ID = { home: 0, record: 0, columns: 1, tables: 2, frame: 3, surface: 4, vector: 5, lattice: 6, clusters: 7, orbit: 8 };
const REPEL = ".view.on .positioning,.view.on .manifest,.view.on .dossiers,.view.on .facet-kicker,.view.on .record-list,.site-head,.domain-strip";
const DRIFT = 0.012, KICK = 0.02, FLOOR = 0.0011, GAIN = 0.05;

const COMMON = /* wgsl */ `
struct U { a: vec4f, b: vec4f, c: vec4f, d: vec4f, e: vec4f, f: vec4f, g: vec4f }
fn hash(n: u32) -> u32 { var x = n; x = x ^ (x >> 16u); x = x * 0x7feb352du; x = x ^ (x >> 15u); x = x * 0x846ca68bu; x = x ^ (x >> 16u); return x; }
`;

const SIM = COMMON + /* wgsl */ `
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read_write> P: array<vec4f>;
@group(0) @binding(2) var maskT: texture_2d<f32>;
@group(0) @binding(3) var maskS: sampler;
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
fn page(p: vec2f) -> vec4f { return textureSampleLevel(maskT, maskS, p / (2.0 * u.a.zw) + vec2f(0.5), 0.0); }
fn plate(p: vec2f) -> f32 {
let k = u.c.z;
if (k <= 0.001) { return fld(i32(u.c.x), p); }
if (k >= 0.999) { return fld(i32(u.c.y), p); }
return mix(fld(i32(u.c.x), p), fld(i32(u.c.y), p), k);
}
fn ampm(p: vec2f, m: vec4f) -> f32 {
return plate(p) * (1.0 - m.r) * (1.0 - m.g) + 1.4 * m.g * (1.0 - m.r) * (1.0 - 0.8 * m.b);
}
@compute @workgroup_size(256)
fn sim(@builtin(global_invocation_id) gid: vec3u) {
let i = gid.x;
if (i >= u32(u.b.w)) { return; }
let q = P[i];
var p = q.xy;
let fr = u32(u.b.z);
let dt = u.b.y;
let eps = 2.0 / u.f.w;
let m = page(p);
let mE = page(p + vec2f(eps, 0.0));
let mW = page(p - vec2f(eps, 0.0));
let mS = page(p + vec2f(0.0, eps));
let mN = page(p - vec2f(0.0, eps));
let a0 = ampm(p, m);
let ex = ampm(p + vec2f(eps, 0.0), mE);
let wx = ampm(p - vec2f(eps, 0.0), mW);
let ey = ampm(p + vec2f(0.0, eps), mS);
let wy = ampm(p - vec2f(0.0, eps), mN);
var v = -vec2f(ex * ex - wx * wx, ey * ey - wy * wy) / (2.0 * eps) * u.f.x;
let sp = length(v);
if (sp > 2.5) { v = v * (2.5 / sp); }
v = v + vec2f(mE.b - mW.b, mS.b - mN.b) / (2.0 * eps) * 0.012 * (1.0 - m.r);
let dp = p - u.d.xy;
v = v + u.d.zw * exp(-dot(dp, dp) / 0.0016) * 0.9;
let sd = p - u.e.xy;
let sr = length(sd);
let ring = exp(-pow((sr - u.e.z * 1.7) / 0.05, 2.0)) * max(0.0, 1.0 - u.e.z / 0.85);
v = v + (sd / (sr + 0.0001)) * ring * 1.6;
let sig = (u.f.y * abs(a0) + u.f.z + (u.c.w * 0.03 + ring * 0.012) * (1.0 - m.r)) * sqrt(dt * 60.0);
let ang = 6.2831853 * rnd(i * 2u + fr * 7919u);
let rad = sqrt(rnd(i * 2u + 1u + fr * 104729u));
let step = v * dt + vec2f(cos(ang), sin(ang)) * rad * sig;
p = p + step;
let lim = u.a.zw;
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
P[i] = vec4f(p, h, m.r);
}
`;

const DRAW = COMMON + /* wgsl */ `
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> P: array<vec4f>;
@group(0) @binding(2) var<uniform> pal: array<vec4f, 10>;
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
let f = fract(0.5 + 0.22 * q.x / u.a.z + 0.13 * q.y / u.a.w + (f32(hash(ii) & 255u) / 255.0 - 0.5) * 0.12) * 8.0;
let i0 = u32(f);
let tint = mix(pal[i0].rgb, pal[i0 + 1u].rgb, fract(f));
let inLetter = q.w;
let lit = mix(tint, vec3f(1.0, 0.97, 0.92), min(1.0, h * 0.28 + inLetter * 0.45));
o.col = lit * (pal[9].y * (1.0 + 1.6 * h + u.g.y * inLetter) / (grow * grow));
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

const hex = (h) => { const n = parseInt(String(h).replace("#", "").slice(0, 6), 16) || 0; return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

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

    const pBuf = device.createBuffer({ size: MAX * 16, usage: GPUBufferUsage.STORAGE, mappedAtCreation: true });
    {
      const a = new Float32Array(pBuf.getMappedRange());
      let s = 0x9e3779b9;
      const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      for (let i = 0; i < MAX; i++) { a[i * 4] = (rnd() * 2 - 1) * ax; a[i * 4 + 1] = (rnd() * 2 - 1) * ay; a[i * 4 + 2] = 1; a[i * 4 + 3] = 0; }
    }
    pBuf.unmap();

    const U = new Float32Array(28), PAL = new Float32Array(40);
    const uBuf = device.createBuffer({ size: U.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const palBuf = device.createBuffer({ size: PAL.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const glowBuf = device.createBuffer({ size: PAL.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

    device.pushErrorScope("validation");
    const simPipe = device.createComputePipeline({ layout: "auto", compute: { module: device.createShaderModule({ code: SIM }), entryPoint: "sim" } });
    const dm = device.createShaderModule({ code: DRAW });
    const add = { srcFactor: "one", dstFactor: "one", operation: "add" };
    const drawPipe = device.createRenderPipeline({
      layout: "auto",
      vertex: { module: dm, entryPoint: "vs" },
      fragment: { module: dm, entryPoint: "fs", targets: [{ format, blend: { color: add, alpha: add } }] },
      primitive: { topology: "triangle-list" },
    });
    const bad = await device.popErrorScope();
    if (bad) { device.destroy(); throw new Error("pipeline: " + bad.message); }
    const drawBG = device.createBindGroup({ layout: drawPipe.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: uBuf } }, { binding: 1, resource: { buffer: pBuf } }, { binding: 2, resource: { buffer: palBuf } },
    ] });
    const glowBG = device.createBindGroup({ layout: drawPipe.getBindGroupLayout(0), entries: [
      { binding: 0, resource: { buffer: uBuf } }, { binding: 1, resource: { buffer: pBuf } }, { binding: 2, resource: { buffer: glowBuf } },
    ] });

    const mc = doc.createElement("canvas"), m2 = mc.getContext("2d");
    let maskTex = null, simBG = null, dirty = true, lastMask = -1e9;
    function buildMask() {
      const k = 0.5, mw = Math.max(2, Math.ceil(cssW * k)), mh = Math.max(2, Math.ceil(cssH * k));
      if (!maskTex || mc.width !== mw || mc.height !== mh) {
        mc.width = mw; mc.height = mh;
        maskTex?.destroy();
        maskTex = device.createTexture({ size: [mw, mh], format: "rgba8unorm", usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
        simBG = device.createBindGroup({ layout: simPipe.getBindGroupLayout(0), entries: [
          { binding: 0, resource: { buffer: uBuf } }, { binding: 1, resource: { buffer: pBuf } },
          { binding: 2, resource: maskTex.createView() }, { binding: 3, resource: sampler },
        ] });
      }
      m2.setTransform(k, 0, 0, k, 0, 0);
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
        const fm = m2.measureText("Hg"), asc = fm.fontBoundingBoxAscent || 1, desc = fm.fontBoundingBoxDescent || 0;
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

    const palT = new Float32Array(27).fill(0.7), palC = new Float32Array(27).fill(0.7);
    let groundT = [0.035, 0.043, 0.063], groundC = [0.035, 0.043, 0.063], themed = false;
    function onRecipe(e) {
      const c = e.detail?.recipe?.chromatic;
      if (!c) return;
      (c.colors || []).slice(0, 9).forEach((x, i) => {
        const [r, g, b] = x.rgb.map((v) => v / 255), l = 0.3 * r + 0.59 * g + 0.11 * b;
        palT[i * 3] = Math.min(1, Math.max(0, l + (r - l) * 1.5));
        palT[i * 3 + 1] = Math.min(1, Math.max(0, l + (g - l) * 1.5));
        palT[i * 3 + 2] = Math.min(1, Math.max(0, l + (b - l) * 1.5));
      });
      groundT = hex(c.ground);
      if (!themed) { themed = true; palC.set(palT); groundC = groundT.slice(); }
    }
    win.addEventListener("superposition:recipe", onRecipe);

    let stateId = state, idA = STATE_ID[state] ?? 0, idB = idA, shakeT = 0, shakeAmp = 1, previewing = false;
    let mixV = 1, mixT = 1, hovering = false;
    const intro = root.classList.contains("sand-pending");
    let revealed = !intro;
    let t = 0, fr = 0, last = 0, raf = 0, running = false, userPaused = false, dead = false;
    let ptrX = 9, ptrY = 9, prevX = 9, prevY = 9, pvx = 0, pvy = 0, moved = 0, strikeX = 0, strikeY = 0, strikeAge = 9;
    let frames = 0, clock = 0, low = 0, born = 0;
    const retarget = (id, amp) => { idA = mixV > 0.5 ? idB : idA; idB = id; mixV = 0; mixT = 1; shakeT = 0; shakeAmp = amp; };
    const hoverOn = (id) => {
      const cur = STATE_ID[stateId] ?? 0;
      if (id === cur) return;
      idA = cur; idB = id; mixV = Math.min(mixV, 0.5) * (hovering ? 1 : 0); mixT = 0.5; shakeT = 0; shakeAmp = 0.2; hovering = true;
    };
    const hoverOff = () => { if (hovering) { hovering = false; mixT = 0; shakeT = 0; shakeAmp = 0.12; } };
    const toPlate = (e) => [(e.clientX - cssW / 2) * dpr / S, (e.clientY - cssH / 2) * dpr / S];
    const onMove = (e) => { [ptrX, ptrY] = toPlate(e); moved = 0; };
    const onDown = (e) => { [strikeX, strikeY] = toPlate(e); strikeAge = 0; };
    const onResize = () => { size(); dirty = true; };

    function frame(now) {
      if (!running) return;
      raf = win.requestAnimationFrame(frame);
      const dt = Math.min(Math.max((now - last) / 1000, 0), 0.033);
      last = now; t += dt; fr++; shakeT += dt; strikeAge += dt; moved += dt;
      if (dirty && now - lastMask > 90) { dirty = false; lastMask = now; buildMask(); }
      if (!simBG) return;

      mixV += (mixT - mixV) * Math.min(1, dt * 6.5);
      const blend = mixV;
      const shake = (shakeT < 0.05 ? shakeT / 0.05 : shakeT < 0.3 ? 1 : Math.max(0, 1 - (shakeT - 0.3) / 0.18)) * shakeAmp;
      if (dt > 0 && moved < 0.08 && prevX < 8) { pvx += ((ptrX - prevX) / dt - pvx) * 0.35; pvy += ((ptrY - prevY) / dt - pvy) * 0.35; } else { pvx *= 0.8; pvy *= 0.8; }
      prevX = ptrX; prevY = ptrY;

      const tilt = (intro ? 1.02 * Math.pow(1 - Math.min(1, t / 1.8), 3) : 0) + 0.09 * shakeAmp * Math.sin(Math.PI * Math.min(1, shakeT / 0.55));
      if (!revealed && t > 1.0) { revealed = true; root.classList.remove("sand-pending"); }
      U.set([W, H, ax, ay, t, dt, fr, count, idA, idB, blend, shake, ptrX, ptrY, pvx, pvy, strikeX, strikeY, strikeAge, t * 0.045, DRIFT, KICK, FLOOR, S, tilt, mobile ? 1.2 : 3.0, 2.4 * S, 0]);
      device.queue.writeBuffer(uBuf, 0, U);
      const k = Math.min(1, dt * 3.2);
      for (let i = 0; i < 27; i++) palC[i] += (palT[i] - palC[i]) * k;
      for (let i = 0; i < 3; i++) groundC[i] += (groundT[i] - groundC[i]) * k;
      for (let i = 0; i < 9; i++) { PAL[i * 4] = palC[i * 3]; PAL[i * 4 + 1] = palC[i * 3 + 1]; PAL[i * 4 + 2] = palC[i * 3 + 2]; PAL[i * 4 + 3] = 1; }
      PAL[36] = 1.15 * dpr; PAL[37] = Math.min(GAIN * (W * H) / count, 0.1); PAL[38] = 12 * dpr; PAL[39] = 0;
      device.queue.writeBuffer(palBuf, 0, PAL);
      PAL[36] *= mobile ? 3.5 : 7; PAL[37] *= mobile ? 0.04 : 0.085;
      device.queue.writeBuffer(glowBuf, 0, PAL);

      const enc = device.createCommandEncoder();
      const cp = enc.beginComputePass();
      cp.setPipeline(simPipe); cp.setBindGroup(0, simBG); cp.dispatchWorkgroups(Math.ceil(count / 256)); cp.end();
      const rp = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: groundC[0], g: groundC[1], b: groundC[2], a: 1 }, loadOp: "clear", storeOp: "store" }] });
      rp.setPipeline(drawPipe); rp.setBindGroup(0, drawBG); rp.draw(6, count);
      rp.setBindGroup(0, glowBG); rp.draw(6, Math.floor(count / 12)); rp.end();
      device.queue.submit([enc.finish()]);

      frames++;
      if (now - clock >= 1000) {
        const fps = frames * 1000 / (now - clock);
        frames = 0; clock = now;
        body.dataset.fps = fps.toFixed(0);
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
      win.removeEventListener("resize", onResize); doc.removeEventListener("visibilitychange", sync);
      root.classList.remove("sand", "sand-pending"); canvas.remove();
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
      nextRecipe() { const r = theme?.nextRecipe?.(); strikeX = 0.3 * ax; strikeY = 0; strikeAge = 0; return r; },
      setRecipeSeed(n) { theme?.setRecipeSeed?.(n); },
      getDebugState() {
        return { ...(theme?.getDebugState?.() || {}), state: stateId, backend: "webgpu", tier: api.tier, topology: "resonance", law: "superposition", layers: 1, surfaceLayers: 0, cost: count, primitives: count };
      },
      setScroll() { dirty = true; }, setParallax() {}, setPointer() {}, setWeights() {},
      pause() { userPaused = true; sync(); }, resume() { userPaused = false; sync(); },
      togglePause() { userPaused = !userPaused; sync(); },
      dispose,
    };

    doc.getElementById("field").before(canvas);
    root.classList.add("sand");
    body.dataset.particles = String(count);
    theme?.setState?.(state);
    win.addEventListener("pointermove", onMove, { passive: true });
    win.addEventListener("pointerdown", onDown, { passive: true });
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
