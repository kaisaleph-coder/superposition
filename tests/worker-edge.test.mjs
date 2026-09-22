import test from "node:test";
import assert from "node:assert/strict";
import worker, {
  SECURITY_HEADERS,
  canonicalRedirect,
  isPreviewHost,
  withSecurityHeaders,
} from "../worker.js";

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

test("security policy blocks executable inline script and framing", () => {
  const csp = SECURITY_HEADERS["Content-Security-Policy"];
  assert.match(csp, /script-src 'self'/);
  assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
  assert.match(csp, /script-src-attr 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /base-uri 'none'/);
  assert.match(csp, /upgrade-insecure-requests/);
});

test("security headers are attached to redirects", () => {
  const redirect = canonicalRedirect(
    new Request("https://www.kaisabuhussein.com/"),
    new URL("https://www.kaisabuhussein.com/")
  );
  const response = withSecurityHeaders(redirect);
  assert.equal(response.status, 308);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("content-security-policy"), SECURITY_HEADERS["Content-Security-Policy"]);
});

test("worker serves secured indexable assets on canonical apex", async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response("asset", { status: 200, headers: { "content-type": "text/plain" } }),
    },
  };
  const response = await worker.fetch(new Request("https://kaisabuhussein.com/"), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset");
  assert.equal(response.headers.get("x-robots-tag"), null);
  assert.equal(response.headers.get("content-security-policy"), SECURITY_HEADERS["Content-Security-Policy"]);
  assert.equal(response.headers.get("permissions-policy"), SECURITY_HEADERS["Permissions-Policy"]);
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
});

test("worker adds noindex and security headers to preview assets and preview 404s", async () => {
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
  const host = "seo-phase-c-remediation-20260922-superposition-rc1-staging.kais-aleph.workers.dev";
  const root = await worker.fetch(new Request(`https://${host}/`), env);
  assert.equal(root.status, 200);
  assert.equal(root.headers.get("x-robots-tag"), "noindex");
  assert.equal(root.headers.get("x-content-type-options"), "nosniff");
  assert.equal(root.headers.get("strict-transport-security"), null);

  const missing = await worker.fetch(new Request(`https://${host}/missing`), env);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get("x-robots-tag"), "noindex");
  assert.equal(missing.headers.get("x-frame-options"), "DENY");
});
