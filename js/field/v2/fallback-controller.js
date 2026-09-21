/* SUPERPOSITION 2.0 static/reduced-motion recipe controller.
   Pure DOM/chromatic state: no three.js, no GPU. It mirrors the same recipe contract
   as FieldEngine so T0 is a designed state rather than an unthemed failure path. */
import { compileRecipe } from './recipe-compiler.js';
import { domainForState } from './state-map.js';
import { resolveSessionSeed } from './seed-manager.js';

function applyTheme(doc, recipe, { preview = false } = {}) {
  const body = doc.body;
  const rootStyle = doc.documentElement.style;
  const c = recipe.chromatic;
  rootStyle.setProperty('--ground', c.ground);
  rootStyle.setProperty('--ground2', c.ground2);
  rootStyle.setProperty('--ink', c.ink);
  rootStyle.setProperty('--muted', c.muted);
  rootStyle.setProperty('--rule', `${c.rule}66`);
  rootStyle.setProperty('--accent', c.accent);
  rootStyle.setProperty('--accent2', c.accent2);
  rootStyle.setProperty('--panel', `${c.ground}e8`);
  body.dataset.renderDomain = recipe.domain;
  body.dataset.recipe = recipe.signature;
  body.dataset.topology = recipe.topology;
  body.dataset.layers = String(recipe.layers.length);
  body.dataset.surfaceLayers = '0';
  body.dataset.cost = String(recipe.cost);
  body.dataset.chromatic = recipe.chromatic.id;
  body.toggleAttribute('data-preview', preview);
  window.dispatchEvent(new CustomEvent('superposition:recipe', { detail: { recipe, preview, fallback: true } }));
}

export function createFallbackRecipeController(doc, { seed = null } = {}) {
  const body = doc.body;
  let seedBase = resolveSessionSeed(seed);
  let stateId = 'home';
  let recipeIndex = 0;
  let committed = compileRecipe('home', recipeIndex, seedBase);
  let active = committed;
  let paused = true;

  function commit(id) {
    stateId = id || 'home';
    recipeIndex = 0;
    committed = compileRecipe(domainForState(stateId), recipeIndex, seedBase);
    active = committed;
    applyTheme(doc, committed);
  }

  const api = {
    renderer: 'static', tier: 0,
    get state() { return stateId; },
    setState(id, { togglePause = false } = {}) {
      if (togglePause) { api.togglePause(); return; }
      if (id !== stateId || body.hasAttribute('data-preview')) commit(id);
      else applyTheme(doc, committed);
    },
    previewState(id) {
      active = compileRecipe(domainForState(id), 0, seedBase);
      applyTheme(doc, active, { preview: true });
      return active;
    },
    clearPreview() { active = committed; applyTheme(doc, committed); },
    nextRecipe() {
      recipeIndex += 1;
      committed = compileRecipe(domainForState(stateId), recipeIndex, seedBase);
      active = committed;
      applyTheme(doc, committed);
      return committed;
    },
    setRecipeSeed(nextSeed) {
      seedBase = Number(nextSeed) >>> 0 || seedBase;
      recipeIndex = 0;
      committed = compileRecipe(domainForState(stateId), recipeIndex, seedBase);
      active = committed;
      applyTheme(doc, committed);
    },
    togglePause() {
      paused = true;
      body.dataset.paused = 'true';
      return paused;
    },
    getDebugState() {
      return {
        state: stateId, backend: 'static', tier: 0, seed: seedBase, recipeIndex,
        recipe: active.signature, topology: active.topology, law: active.law,
        layers: active.layers.length, surfaceLayers: 0, cost: active.cost,
        chromatic: active.chromatic.id, primitives: 0,
      };
    },
  };

  body.dataset.paused = 'true';
  applyTheme(doc, committed);
  return api;
}
