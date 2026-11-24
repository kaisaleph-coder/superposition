// Local static server that applies the site's own production security headers
// (read from <root>/worker.js) so a change is tested under the live CSP.
// Usage: node serve.mjs <root> <port>
// Only `upgrade-insecure-requests` is dropped, because localhost is plain http.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(process.argv[2]);
const port = Number(process.argv[3] || 8791);
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml", ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

let headers = {};
try {
  const worker = await import(pathToFileURL(join(root, "worker.js")).href);
  headers = { ...worker.SECURITY_HEADERS };
  headers["Content-Security-Policy"] = headers["Content-Security-Policy"].replace(/;\s*upgrade-insecure-requests/, "");
  console.log("security headers from worker.js: " + Object.keys(headers).join(", "));
} catch (e) {
  console.log("no worker.js headers applied: " + e.message);
}

createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = normalize(join(root, urlPath));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    let s = await stat(file).catch(() => null);
    if (s?.isDirectory()) { file = join(file, "index.html"); s = await stat(file).catch(() => null); }
    let status = 200;
    if (!s) { file = join(root, "404.html"); status = 404; }
    const body = await readFile(file);
    res.writeHead(status, { ...headers, "Content-Type": MIME[extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
    res.end(body);
  } catch (e) {
    res.writeHead(500, { "Content-Type": "text/plain" }).end(String(e.message));
  }
}).listen(port, "127.0.0.1", () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
