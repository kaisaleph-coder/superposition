const CANONICAL_HOST = "kaisabuhussein.com";
const WWW_HOST = "www.kaisabuhussein.com";

const SECURITY_HEADERS = Object.freeze({
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; script-src-attr 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; frame-ancestors 'none'; form-action 'none'; worker-src 'none'; media-src 'none'; manifest-src 'self'; upgrade-insecure-requests",
  "Permissions-Policy": "accelerometer=(self), camera=(), geolocation=(), gyroscope=(self), magnetometer=(), microphone=(), payment=(), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
});

function isPreviewHost(hostname) {
  return hostname.endsWith(".workers.dev");
}

function canonicalRedirect(request, url) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const insecure = url.protocol !== "https:" || (forwardedProto && forwardedProto !== "https");
  if (url.hostname === WWW_HOST || (url.hostname === CANONICAL_HOST && insecure)) {
    url.protocol = "https:";
    url.hostname = CANONICAL_HOST;
    url.port = "";
    return Response.redirect(url.toString(), 308);
  }
  return null;
}

function withSecurityHeaders(response, { preview = false } = {}) {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) headers.set(name, value);

  // The site intentionally has zero analytics and zero third-party runtime requests.
  // Cloudflare Web Analytics automatic setup modifies valid HTML unless the response
  // is marked no-transform. Preserve any existing cache directives and add only the
  // transformation prohibition for HTML documents.
  const contentType = headers.get("content-type") || "";
  if (/^text\/html\b/i.test(contentType)) {
    const cacheControl = headers.get("cache-control") || "public, max-age=0, must-revalidate";
    if (!/(?:^|,)\s*no-transform\s*(?:,|$)/i.test(cacheControl)) {
      headers.set("Cache-Control", `${cacheControl}, no-transform`);
    }
  }

  if (preview) headers.set("X-Robots-Tag", "noindex");
  else headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const preview = isPreviewHost(url.hostname);

    if (!preview) {
      const redirect = canonicalRedirect(request, url);
      if (redirect) return withSecurityHeaders(redirect);
    }

    const assetResponse = await env.ASSETS.fetch(request);
    return withSecurityHeaders(assetResponse, { preview });
  },
};

export { CANONICAL_HOST, WWW_HOST, SECURITY_HEADERS, isPreviewHost, canonicalRedirect, withSecurityHeaders };
