import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

const [root = process.cwd(), expected = 'pass'] = process.argv.slice(2);
const rows = [];
const check = (name, pass, observed) => rows.push({ name, pass, observed });
const read = path => readFileSync(join(root, path), 'utf8');
const ids = ['columns', 'tables', 'frame', 'surface', 'vector', 'lattice', 'clusters', 'orbit'];

function routerHarness() {
  const events = {}, raf = [], timers = new Map(), elements = new Map();
  let timerId = 0;
  const calls = { assigned: [], printed: 0 };
  for (const id of ['home', ...ids, 'record']) {
    const classes = new Set();
    elements.set('view-' + id, { id, classes, removeAttribute() {}, querySelectorAll: () => [], classList: {
      add: key => classes.add(key), remove: key => classes.delete(key),
      toggle: (key, on) => on ? classes.add(key) : classes.delete(key),
    }});
  }
  const main = { scrollTop: 0, addEventListener() {} };
  const doc = { body: { dataset: {} }, activeElement: { tagName: 'BODY', closest: () => null },
    querySelectorAll: () => [], getElementById: id => elements.get(id),
    querySelector: () => main, addEventListener: (name, fn) => { events[name] = fn; } };
  const location = { hash: '', assign: url => calls.assigned.push(url), replace: url => calls.assigned.push(url) };
  const context = { FACET_ORDER: ids, FACET_META: {}, document: doc, location,
    matchMedia: () => ({ matches: false }), window: { print: () => calls.printed++ },
    addEventListener: (name, fn) => { events[name] = fn; }, requestAnimationFrame: fn => raf.push(fn),
    setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) };
  const source = read('js/router.js').replace(/^import[^\n]+\r?\n/m, '').replace('export function createRouter', 'function createRouter');
  vm.runInNewContext(source + '\nglobalThis.factory = createRouter;', context);
  const api = context.factory(doc);
  return { doc, location, calls, events, api, elements,
    flushTimers: () => { const batch = [...timers.values()]; timers.clear(); batch.forEach(fn => fn()); },
    flushFrames: () => { let rounds = 0; while (raf.length) { if (++rounds > 10) throw new Error('Unbounded RAF fixture'); const batch = raf.splice(0); batch.forEach(fn => fn()); } },
  };
}

for (const key of ['ArrowRight', '1', 'r', 'p']) {
  const h = routerHarness();
  h.doc.activeElement = { tagName: 'SELECT', closest: () => null };
  h.events.keydown({ key, preventDefault() {} });
  check('focused selector ignores page shortcut ' + key, h.location.hash === '' && !h.calls.assigned.length && !h.calls.printed, { hash: h.location.hash, ...h.calls });
}
{
  const h = routerHarness();
  h.events.keydown({ key: 'ArrowRight', preventDefault() {} });
  check('page keyboard navigation remains available', h.location.hash === '#view-columns', h.location.hash);
}
{
  const h = routerHarness();
  h.api.go('columns'); h.events.hashchange(); h.flushTimers();
  h.api.go('home'); h.events.hashchange(); h.flushTimers(); h.flushFrames();
  const active = [...h.elements.entries()].filter(([,e]) => e.classes.has('on')).map(([id]) => id);
  check('stale frame callbacks leave only the latest page visible', active.length === 1 && active[0] === 'view-home', active);
}

function arrowFunction(source, name) {
  const marker = `const ${name} = (e) => {`;
  if (source.split(marker).length !== 2) throw new Error('Expected one handler ' + name);
  const start = source.indexOf(marker);
  let at = source.indexOf('{', start), depth = 0;
  do { if (source[at] === '{') depth++; if (source[at] === '}') depth--; at++; } while (depth && at < source.length);
  if (depth) throw new Error('Unclosed handler');
  return source.slice(start, at) + ';';
}
function strikeHarness() {
  const source = read('js/field/resonance.js');
  const strikes = [];
  const context = { down: false, touch: false, t: 1, downT: 0, travel: 0, lastX: 0, lastY: 0, ptrX: 0, ptrY: 0, markDirty: false,
    COPY: 'copy', toPlate: (x,y) => [x,y], strike: (...args) => strikes.push(args) };
  vm.runInNewContext(arrowFunction(source, 'onDown') + '\n' + arrowFunction(source, 'onUp') + '\nglobalThis.handlers = {onDown,onUp};', context);
  const event = type => ({ pointerType: type, button: 0, clientX: 10, clientY: 20, target: { closest: () => null } });
  return { strikes, down: type => context.handlers.onDown(event(type)), up: type => context.handlers.onUp(event(type)) };
}
{
  const h = strikeHarness(); h.down('touch'); h.up('touch');
  check('ordinary touch does not strike the sand', h.strikes.length === 0, h.strikes.length);
}
{
  const h = strikeHarness(); h.down('mouse'); h.down('touch'); h.up('touch');
  check('touch release cannot finish a mouse strike', h.strikes.length === 0, h.strikes.length);
}
{
  const h = strikeHarness(); h.down('mouse'); h.up('mouse');
  check('deliberate mouse strike remains available', h.strikes.length === 1, h.strikes.length);
}

const failures = rows.filter(row => !row.pass);
console.log(JSON.stringify({ root, passed: rows.length - failures.length, failed: failures.length, cases: rows }, null, 2));
if (expected === 'fail') {
  if (!failures.length) throw new Error('Wrong-subject check failed to detect the broken behavior');
  console.log('Broken preview rejected for the named interaction failures');
} else if (failures.length) process.exitCode = 1;
