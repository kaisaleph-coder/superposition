#!/usr/bin/env node
import { mkdirSync, rmSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(join(fileURLToPath(import.meta.url), "..", ".."));
const DIST = join(ROOT, ".staging-dist");
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>SUPERPOSITION staging anchor</title></head><body><p>Cloudflare staging anchor only. No application is deployed on this branch.</p></body></html>`;
writeFileSync(join(DIST, "index.html"), html);
writeFileSync(join(DIST, "404.html"), html);

const entries = readdirSync(DIST).sort();
if (entries.join(",") !== "404.html,index.html") throw new Error(`unexpected anchor payload: ${entries.join(",")}`);
let bytes=0;
for(const name of entries) bytes += statSync(join(DIST,name)).size;
console.log(JSON.stringify({dist:".staging-dist",entries,bytes,inert:true},null,2));
