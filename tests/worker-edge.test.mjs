import test from "node:test";
import assert from "node:assert/strict";
import worker, { canonicalRedirect, isPreviewHost } from "../worker.js";

test("preview host detection is limited to workers.dev", () => {
  assert.equal(isPreviewHost("abc-superposition.kais-aleph.workers.dev"), true);
  assert.equal(isPreviewHost("kaisabuhussein.com"), false);
  assert.equal(isPreviewHost("www.kaisabuhussein.com"), false);
});

test("canonicalRedirect sends HTTP apex to HTTPS apex", () => {
  const req = new Request("http://kaisabuhussein.com/resume/?x=1", {
    headers: { "x-forwarded-proto": "http" },
  });
  const response = canonicalRedirect(req, new URL(req.url));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://kaisabuhussein.com/resume/?x=1");
});

test("canonicalRedirect sends www to HTTPS apex", () => {
  const req = new Request("https://www.kaisabuhussein.com/path?q=1");
  const response = canonicalRedirect(req, new URL(req.url));
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("location"), "https://kaisabuhussein.com/path?q=1");
});

test("canonical HTTPS apex passes through unchanged", () => {
  const req = new Request("https://kaisabuhussein.com/");
  assert.equal(canonicalRedirect(req, new URL(req.url)), null);
});

test("worker serves assets on canonical apex", async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response("asset", { status: 200, headers: { "content-type": "text/plain" } }),
    },
  };
  const response = await worker.fetch(new Request("https://kaisabuhussein.com/"), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset");
  assert.equal(response.headers.get("x-robots-tag"), null);
});

test("worker adds noindex to preview assets and preview 404s", async () => {
  const env = {
    ASSETS: {
      fetch: async request => {
        const url = new URL(request.url);
        return url.pathname === "/missing"
          ? new Response("missing", { status: 404 })
          : new Response("asset", { status: 200 });
      },
    },
  };
  const host = "prod-p0-20260922-superposition-rc1-staging.kais-aleph.workers.dev";
  const root = await worker.fetch(new Request(`https://${host}/`), env);
  assert.equal(root.status, 200);
  assert.equal(root.headers.get("x-robots-tag"), "noindex");

  const missing = await worker.fetch(new Request(`https://${host}/missing`), env);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("x-robots-tag"), "noindex");
});
