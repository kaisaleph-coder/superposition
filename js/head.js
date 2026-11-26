(() => {
  const root = document.documentElement, q = new URLSearchParams(location.search);
  root.classList.add("js");
  if (q.get("local-font-fallback") === "1") root.dataset.localFontFallback = "1";
  // The resonance field is expected here (WebGPU present, motion welcome, no QA parameter),
  // so the page takes its sand form before first paint, on every load, and the legacy page
  // never shows first. js/main.js and the engine drop the class on any failure; the timer
  // is the last resort if neither ever reports. See docs/RESONANCE.md.
  if (!("gpu" in navigator) || q.has("seed") || q.get("force")) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  root.classList.add("sand");root.dataset.fieldStartup="pending";
  setTimeout(() => { if (!document.body?.dataset.engine) {root.dataset.fieldStartup="fallback";root.classList.remove("sand", "sand-pending");} }, 6000);
  // Opening curtain: the first load of a session only.
  let seen = false;
  try { seen = sessionStorage.getItem("sp-sand") === "1"; } catch {}
  if (seen) return;
  root.classList.add("sand-pending");
  setTimeout(() => root.classList.remove("sand-pending"), 3200);
})();
