#!/usr/bin/env node
/* SUPERPOSITION budget gate (PLAN §6) — gzip-aware byte report per site file.
   Caps (gzip): total ≤ 900 KB (hard fail 1.2 MB) · vendor ≤ 340 KB ·
   fonts ≤ 105 KB · HTML+CSS+app-JS ≤ 60 KB.
   Exit 1 on any breach. Run from repo root: node tools/budget.mjs */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { gzipSync } from "node:zlib";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const KB = 1024;
const CAPS = {
  total: 900 * KB, totalHard: 1200 * KB,
  vendor: 340 * KB, fonts: 105 * KB, app: 60 * KB,
};

// Site = what a cold load could transfer. Dev-only trees excluded.
const INCLUDE_DIRS = ["css", "js", "vendor", "content", "assets"];
const INCLUDE_FILES = ["index.html", "404.html"];

const rows = [];
function add(path) {
  const raw = readFileSync(path);
  const gz = gzipSync(raw, { level: 9 }).length;
  rows.push({ rel: relative(ROOT, path).replace(/\\/g, "/"), raw: raw.length, gz });
}
function walk(dir) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    statSync(p).isDirectory() ? walk(p) : add(p);
  }
}
for (const f of INCLUDE_FILES) existsSync(join(ROOT, f)) && add(join(ROOT, f));
for (const d of INCLUDE_DIRS) existsSync(join(ROOT, d)) && walk(join(ROOT, d));

const inCat = {
  vendor: (r) => r.rel.startsWith("vendor/"),
  fonts: (r) => r.rel.startsWith("assets/fonts/"),
  app: (r) =>
    r.rel.endsWith(".html") || r.rel.startsWith("css/") ||
    (r.rel.startsWith("js/") && [".js", ".mjs"].includes(extname(r.rel))),
};
const sum = (rs) => rs.reduce((s, r) => s + r.gz, 0);
const total = sum(rows);
const cat = Object.fromEntries(Object.entries(inCat).map(([k, f]) => [k, sum(rows.filter(f))]));

const fmt = (b) => (b / KB).toFixed(1).padStart(8) + " KB";
rows.sort((a, b) => b.gz - a.gz);
console.log("file".padEnd(44) + "raw".padStart(11) + "gzip".padStart(11));
for (const r of rows) console.log(r.rel.padEnd(44) + fmt(r.raw) + fmt(r.gz));
console.log("-".repeat(66));

let fail = false;
function judge(label, val, cap, hard) {
  const over = val > cap;
  const hardOver = hard !== undefined && val > hard;
  if (over) fail = fail || hard === undefined || hardOver;
  console.log(
    `${label.padEnd(30)}${fmt(val)}  cap ${(cap / KB).toFixed(0)} KB  ${
      hardOver ? "HARD FAIL" : over ? (hard !== undefined ? "over soft cap" : "FAIL") : "ok"}`
  );
  return over;
}
const totalOver = judge("TOTAL (gzip, cold load)", total, CAPS.total, CAPS.totalHard);
judge("vendor three.js", cat.vendor, CAPS.vendor);
judge("fonts", cat.fonts, CAPS.fonts);
judge("HTML + CSS + app JS", cat.app, CAPS.app);
if (totalOver && total <= CAPS.totalHard)
  console.log("note: total over 900 KB soft cap (hard fail at 1200 KB)"), (fail = true);
process.exit(fail ? 1 : 0);
