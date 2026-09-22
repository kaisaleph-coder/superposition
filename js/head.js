document.documentElement.classList.add("js");
if (new URLSearchParams(location.search).get("local-font-fallback") === "1") {
  document.documentElement.dataset.localFontFallback = "1";
}
