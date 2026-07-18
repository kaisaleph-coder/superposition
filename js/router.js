/* SUPERPOSITION state machine + hash router (PLAN §2.1, §2.5, §5.6).
   All state is mirrored to <body data-*> — the DOM contract. Deep links:
   #/columns … #/orbit, #/record; home is "" or #/. Back/forward = hashchange. */

import { FACET_ORDER } from "./render-dom.js";

const VIEWS = ["home", ...FACET_ORDER, "record"];

export function createRouter(doc, { onState } = {}) {
  const body = doc.body;
  let current = null;
  let swapTimer = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const idFromHash = () => {
    const h = (location.hash || "").replace(/^#\/?/, "");
    return VIEWS.includes(h) ? h : "home";
  };

  function closeDossiers(view) {
    for (const d of view.querySelectorAll(".dossier[data-open]")) {
      d.removeAttribute("data-open");
      d.querySelector("button").setAttribute("aria-expanded", "false");
    }
  }

  function apply(id, first) {
    if (id === current) return;
    const prev = current;
    current = id;

    // §5.6 DOM contract
    if (id === "home") {
      body.dataset.state = "superposition";
      delete body.dataset.facet;
    } else if (id === "record") {
      body.dataset.state = "record";
      delete body.dataset.facet;
    } else {
      body.dataset.state = "facet";
      body.dataset.facet = id;
    }

    // rail current mark
    for (const a of doc.querySelectorAll("#rail a")) {
      if (a.dataset.facet === id) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    }

    // view swap (240ms crossfade §3.4; instant on reduced motion / first paint)
    const toEl = doc.getElementById(`view-${id}`);
    const fromEl = prev ? doc.getElementById(`view-${prev}`) : null;
    clearTimeout(swapTimer);
    if (fromEl) closeDossiers(fromEl);
    const show = () => {
      for (const v of VIEWS) {
        const el = doc.getElementById(`view-${v}`);
        el.hidden = v !== id;
        el.classList.toggle("on", false);
      }
      requestAnimationFrame(() => requestAnimationFrame(() => toEl.classList.add("on")));
      doc.querySelector("main").scrollTop = 0;
    };
    if (first || reduced || !fromEl) {
      show();
      if (first) toEl.classList.add("on");
    } else {
      fromEl.classList.remove("on");
      swapTimer = setTimeout(show, 160);
    }

    onState && onState(id, { first: !!first });
  }

  function go(id) {
    if (!VIEWS.includes(id)) id = "home";
    const target = id === "home" ? "#/" : `#/${id}`;
    if (location.hash === target || (id === "home" && !location.hash)) apply(id);
    else location.hash = target; // triggers hashchange → apply
  }

  // dossier expanders (event delegation; aria-expanded + data-open + §5.6 dossier state)
  doc.querySelector("main").addEventListener("click", (e) => {
    const btn = e.target.closest(".dossier > button");
    if (!btn) return;
    const dossier = btn.parentElement;
    const view = dossier.closest(".view");
    const wasOpen = dossier.hasAttribute("data-open");
    closeDossiers(view);
    if (!wasOpen) {
      dossier.setAttribute("data-open", "");
      btn.setAttribute("aria-expanded", "true");
    }
    const anyOpen = !!view.querySelector(".dossier[data-open]");
    const facet = body.dataset.facet;
    if (facet) body.dataset.state = anyOpen ? "dossier" : "facet";
    onState && onState(current, {
      dossier: anyOpen,
      domain: facet === "clusters" && anyOpen ? +dossier.dataset.domain : -1,
    });
  });

  // keyboard (§2.5)
  doc.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = doc.activeElement && doc.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key >= "1" && e.key <= String(FACET_ORDER.length)) go(FACET_ORDER[+e.key - 1]);
    else if (e.key === "Escape") go("home");
    else if (e.key === "r") go("record");
    else if (e.key === "p") { e.preventDefault(); window.print(); }
    else if (e.key === ".") onState && onState(current, { togglePause: true });
    else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const i = FACET_ORDER.indexOf(current);
      const start = i === -1 ? (e.key === "ArrowRight" ? -1 : FACET_ORDER.length) : i;
      const next = (start + (e.key === "ArrowRight" ? 1 : -1) + FACET_ORDER.length) % FACET_ORDER.length;
      go(FACET_ORDER[next]);
    }
  });

  addEventListener("hashchange", () => apply(idFromHash()));

  apply(idFromHash(), true);
  return { go, get current() { return current; } };
}
