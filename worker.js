const CANONICAL_HOST = "kaisabuhussein.com";
const WWW_HOST = "www.kaisabuhussein.com";

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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const preview = isPreviewHost(url.hostname);

    if (!preview) {
      const redirect = canonicalRedirect(request, url);
      if (redirect) return redirect;
    }

    const assetResponse = await env.ASSETS.fetch(request);

    if (!preview) return assetResponse;

    const headers = new Headers(assetResponse.headers);
    headers.set("X-Robots-Tag", "noindex");
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};

export { CANONICAL_HOST, WWW_HOST, isPreviewHost, canonicalRedirect };
