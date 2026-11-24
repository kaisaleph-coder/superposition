# RESONANCE — the field as a resonating plate

`js/field/resonance.js` is the default field wherever a hardware WebGPU adapter exists.
It is raw WebGPU (no three.js). Everything else falls through to the legacy field
(`js/field/engine.js`) or the static ground, exactly as before.

The shader text inside `resonance.js` is kept flush-left and uncommented so the shipped
app code stays inside the 60 KB budget. This file is its documentation.

## The idea

Up to 1.4 million grains of sand ride a vibrating plate. Sand cannot rest where the plate
moves, so it gathers on the nodal lines of the current vibration mode and draws one
figure. Superposition is literal: two modes blended are a single new figure, never two
figures overlaid.

The page is part of the plate. A mask rendered from the live DOM tells the simulation:

| Channel | Source | Meaning for the plate |
|---|---|---|
| red | the active heading's glyphs, drawn at their measured positions | the plate is still: sand that arrives stays, so the letters fill |
| green | the copy block, the header, the domain strip, and the heading's box | the plate shakes hard: sand cannot rest, and deep inside it is thrown clear |
| blue | the glyphs again, blurred wide | a slope that leads nearby sand into the letters |

So the sand writes the heading and leaves the copy clear by physics, not by layout.

## Uniforms (`struct U`, seven `vec4f`)

| Field | Contents |
|---|---|
| `a` | canvas width, height (device px); plate half extent x, y |
| `b` | time, dt, frame number, grain count |
| `c` | mode from, mode to, blend 0..1, shake 0..1 |
| `d` | pointer xy (plate units), pointer velocity xy |
| `e` | strike xy, strike age (s), home phase |
| `f` | drift gain, kick gain, noise floor, device px per plate unit |
| `g` | plate tilt (rad), letter brightness boost, camera distance (px) |

Plate units: the long side of the viewport spans -1..1, y points down like the screen.

## Simulation (compute, one invocation per grain)

A grain is `vec4f(x, y, height, inLetter)`. No velocity is stored: the motion is overdamped.

1. `fld(id, p)` is the vibration amplitude of mode `id` at `p`. One mode per domain:
   0 home (two classic Chladni modes, slowly rotating into each other), 1 columns
   (stripes), 2 tables (rounded cells), 3 frame (grid), 4 surface (wave strata),
   5 vector (spiral), 6 lattice (honeycomb), 7 clusters (rings and petals), 8 orbit
   (ellipses). `plate(p)` blends the from and to modes.
2. `ampm(p, m)` applies the page mask to that amplitude.
3. Drift: down the gradient of amplitude squared, by central differences two pixels apart.
   Speed is clamped. Near a nodal line this is a spring toward the line.
4. Letter pull: up the gradient of the blue channel, switched off inside the glyphs.
5. Pointer: a moving pointer adds its own velocity to nearby grains, so it drags sand.
   The plate then heals the trail. There is no effect at rest.
6. Strike: a click sends one ring outward that kicks grains radially.
7. Kick: a random step whose size grows with the local amplitude, plus a small floor so a
   line keeps a granular width, plus the transition shake (not inside glyphs).
8. Grains reflect at the plate edge. A grain deep inside a green zone and away from the
   glyphs is respawned at a hashed position, airborne.
9. Height is 1 for a grain that just moved and decays otherwise.

Randomness is a hash of grain index and frame number. Start positions come from a fixed
seed, so every load plays the same way.

## Drawing

One instanced quad per grain, additive blending on an opaque canvas cleared to the
theme's ground colour. Airborne grains are larger and fainter (defocus). Grains inside
glyphs are brighter and whiter. A second pass redraws one grain in twelve, seven times
wider and far fainter, as glow.

The plate is a real plane seen through a lens. At rest the tilt is zero and a grain lands
on its own pixel, which is what lets the sand register with the page's type. The opening
sequence starts the plate tipped back by about 58 degrees and swings it up in 2.1 s.

## Page integration

- `js/head.js` sets `html.sand-pending` before first paint on the first load of a session
  (WebGPU present, motion welcome, no QA parameter). The page's chrome waits behind that
  curtain. The engine lifts it 1.25 s after it starts; `js/main.js` lifts it on any
  failure; a 3.2 s timer in `head.js` lifts it if nothing else does.
- `html.sand` is set while the engine runs. `css/sand.css` turns headings into outlines,
  hides the legacy overlays and stops the view from sliding (the engine reads layout).
- Theme colours come from the existing recipe system through the `superposition:recipe`
  event. The fallback recipe controller remains the single owner of the CSS theme.
- Pointing at another domain in the strip or the index blends its mode half-way in.
- A governor sheds grains when the frame rate drops below 44 for two seconds, and hands
  over to the static ground if the minimum count still cannot hold 22.

## Not covered

`?seed=`, `?force=webgl` and `?force=static` never load this engine, so the repo's
existing browser tests exercise the legacy paths only. Nothing in CI renders this engine:
CI has no GPU.
