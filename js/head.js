(() => {
  const root = document.documentElement, q = new URLSearchParams(location.search);
  root.classList.add("js");
  if (q.get("local-font-fallback") === "1") root.dataset.localFontFallback = "1";
  // Opening curtain of the resonance field, decided before first paint: first load of a
  // session, WebGPU present, motion welcome, no QA parameter. See docs/RESONANCE.md.
  if (!("gpu" in navigator) || q.has("seed") || q.get("force")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let seen = false;
  try { seen = sessionStorage.getItem("sp-sand") === "1"; } catch {}
  if (seen) return;
  root.classList.add("sand-pending");
  setTimeout(() => root.classList.remove("sand-pending"), 3200);
})();
