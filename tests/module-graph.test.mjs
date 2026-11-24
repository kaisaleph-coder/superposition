/* Module-graph gate. The page ships no import map (the CSP forbids inline scripts), so
   every specifier a browser will see must be a relative or absolute path that exists.
   Earned 2026-11-24: vendor/three.tsl.min.js still imported the bare name
   "three/webgpu" after the import map was removed on 2026-09-22. The engine import
   rejected, js/main.js swallowed it, and the live field sat on the static tier for two
   months. CI has no GPU, so no browser test could see it; this one needs no browser.
   SP_ROOT overrides the tree under test (used to prove this gate can fail). */
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(process.env.SP_ROOT || join(dirname(fileURLToPath(import.meta.url)), ".."));
const DIRS = ["js", "vendor", "content"];
const STATIC = /(?:^|[;}\s])(?:import|export)\s*(?:[^'"()]*?\bfrom\s*)?(['"])([^'"\n]+)\1/g;
const DYNAMIC = /\bimport\(\s*(['"])([^'"\n]+)\1\s*\)/g;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.m?js$/.test(name)) out.push(p);
  }
  return out;
}

function specifiers(file) {
  // Only the import/export statements at the head of a minified bundle matter, and
  // scanning megabytes of minified code for the word "from" would only add noise.
  const text = readFileSync(file, "utf8");
  const head = text.length > 200_000 ? text.slice(0, 4000) + text.slice(-4000) : text;
  const found = [];
  for (const re of [STATIC, DYNAMIC]) {
    re.lastIndex = 0;
    for (let m; (m = re.exec(head));) found.push(m[2]);
  }
  return found;
}

const files = DIRS.filter((d) => existsSync(join(ROOT, d))).flatMap((d) => walk(join(ROOT, d)));

test("the tree under test contains modules", () => {
  assert.ok(files.length > 0, `no .js files found under ${ROOT}`);
});

test("no module uses a bare specifier (the page has no import map)", () => {
  const bare = [];
  for (const file of files) {
    for (const spec of specifiers(file)) {
      if (!/^(\.{1,2}\/|\/)/.test(spec)) bare.push(`${relative(ROOT, file).replace(/\\/g, "/")} imports "${spec}"`);
    }
  }
  assert.deepEqual(bare, [], "bare module specifiers cannot resolve in the browser");
});

test("every relative specifier points at a file that exists", () => {
  const missing = [];
  let checked = 0;
  for (const file of files) {
    for (const spec of specifiers(file)) {
      if (!/^\.{1,2}\//.test(spec)) continue;
      checked++;
      const target = resolve(dirname(file), spec.split(/[?#]/)[0]);
      if (!existsSync(target)) missing.push(`${relative(ROOT, file).replace(/\\/g, "/")} imports "${spec}"`);
    }
  }
  assert.deepEqual(missing, [], "imports of files that are not in the tree");
  // SP_ROOT may point at a deliberately tiny tree, so the floor applies to the repo only
  if (!process.env.SP_ROOT) assert.ok(checked >= 20, `only ${checked} relative imports were checked; the scanner has gone blind`);
});
