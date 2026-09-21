#!/usr/bin/env node
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(join(fileURLToPath(import.meta.url), "..", ".."));
const DIST = join(ROOT, ".staging-dist");
const files = ["index.html", "404.html"];
const dirs = ["assets", "content", "css", "js", "vendor"];

const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

for (const file of files) {
  cpSync(join(ROOT, file), join(DIST, file));
}
for (const dir of dirs) {
  cpSync(join(ROOT, dir), join(DIST, dir), { recursive: true });
}

const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
};

const staged = walk(DIST).sort();
let bytes = 0;
for (const stagedPath of staged) {
  const rel = relative(DIST, stagedPath).replaceAll("\\", "/");
  const sourcePath = join(ROOT, rel);
  const sourceHash = sha256(sourcePath);
  const stagedHash = sha256(stagedPath);
  if (sourceHash !== stagedHash) throw new Error(`staging copy mismatch: ${rel}`);
  bytes += statSync(stagedPath).size;
}

const allowedTop = new Set([...files, ...dirs]);
for (const entry of readdirSync(DIST)) {
  if (!allowedTop.has(entry)) throw new Error(`unexpected staged entry: ${entry}`);
}

console.log(JSON.stringify({
  dist: ".staging-dist",
  fileCount: staged.length,
  bytes,
  allowedTop: [...allowedTop],
  sourceParity: true
}, null, 2));
