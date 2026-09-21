// SUPERPOSITION 2.0 public facet ids -> procedural domain grammar ids.
// Public/owner-facing order differs from the GPU attractor buffer order on purpose.
export const FACET_TO_DOMAIN = Object.freeze({
  columns: 'finance',
  tables: 'restaurant',
  frame: 'construction',
  surface: 'investor',
  vector: 'entrepreneur',
  lattice: 'ai',
  clusters: 'skills',
  orbit: 'hobbies',
});

export const DOMAIN_TO_FACET = Object.freeze(
  Object.fromEntries(Object.entries(FACET_TO_DOMAIN).map(([facet, domain]) => [domain, facet]))
);

export const OWNER_FACET_ORDER = Object.freeze([
  'columns', 'tables', 'frame', 'surface', 'vector', 'lattice', 'clusters', 'orbit',
]);

export function domainForState(id) {
  if (id === 'home' || id === 'record') return 'home';
  return FACET_TO_DOMAIN[id] || 'home';
}
