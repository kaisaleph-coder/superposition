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

The page is part of the plate. A mask rendered from the live DOM marks where the plate
must stay clear: the copy block, the header, the domain strip and the active heading's
box. There the plate shakes hard, so sand cannot rest, and deep inside it is thrown clear.
The mask uses the green channel only.

So the sand leaves the page's text clear by physics, not by layout. Headings are ordinary
solid type. Until 2026-11-25 the heading's glyphs were two more channels of the mask and
the sand filled them; see Round 3.

## Uniforms (`struct U`, seven `vec4f`)

| Field | Contents |
|---|---|
| `a` | canvas width, height (device px); plate half extent x, y |
| `b` | time, dt, frame number, grain count |
| `c` | mode from, mode to, blend 0..1, shake 0..1 |
| `d` | pointer xy (plate units), pointer velocity xy |
| `e` | strike xy, strike age (s), home phase |
| `f` | drift gain, kick gain, noise floor, device px per plate unit |
| `g` | plate tilt (rad), unused (zero), camera distance (px) |

Plate units: the long side of the viewport spans -1..1, y points down like the screen.

## Simulation (compute, one invocation per grain)

A grain is `vec4f(x, y, height, 0)`; the fourth component is unused. No velocity is stored:
the motion is overdamped.

1. `fld(id, p)` is the vibration amplitude of mode `id` at `p`. One mode per domain:
   0 home (two classic Chladni modes, slowly rotating into each other), 1 columns
   (stripes), 2 tables (rounded cells), 3 frame (grid), 4 surface (wave strata),
   5 vector (spiral), 6 lattice (honeycomb), 7 clusters (rings and petals), 8 orbit
   (ellipses). `plate(p)` blends the from and to modes.
2. `ampm(p, g, k)` applies the page mask `g` and the visitor's marks `k` to that amplitude.
3. Drift: down the gradient of amplitude squared, by central differences two pixels apart.
   Speed is clamped. Near a nodal line this is a spring toward the line.
4. (Removed 2026-11-25: the pull that led sand into the heading's letters.)
5. Pointer: a moving pointer adds its own velocity to nearby grains, so it drags sand.
   The plate then heals the trail. There is no effect at rest.
6. Strike: a click sends one ring outward that kicks grains radially.
7. Kick: a random step whose size grows with the local amplitude, plus a small floor so a
   line keeps a granular width, plus the transition shake.
8. Grains reflect at the plate edge. A grain deep inside a clear zone is respawned at a
   hashed position, airborne.
9. Height is 1 for a grain that just moved and decays otherwise.

Randomness is a hash of grain index and frame number. Start positions come from a fixed
seed, so every load plays the same way.

## Drawing

One instanced quad per grain, additive blending on an opaque canvas cleared to the
theme's ground colour. Airborne grains are larger and fainter (defocus). A second pass
redraws one grain in twelve, seven times wider and far fainter, as glow.

The plate is a real plane seen through a lens. At rest the tilt is zero and a grain lands
on its own pixel, which is what keeps the clear zones registered with the page's text. The opening
sequence starts the plate tipped back by about 58 degrees and swings it up in 2.1 s.

## Page integration

- `js/head.js` decides before first paint whether the engine is expected (WebGPU present,
  motion welcome, no QA parameter). If it is, `head.js` sets `html.sand` on every load, so
  the page is in its sand form from the first frame and the legacy page never shows first.
  Before 2026-11-25 a repeat load showed the legacy page for about a second. The class is
  dropped again by `js/main.js` when the load will not start the engine or the engine
  throws, by the engine's own `dispose`, and by a 6 s timer in `head.js` when the engine
  has not reported by then (`body[data-engine]`).
- On the first load of a session `head.js` also sets `html.sand-pending`, the opening
  curtain. The page's chrome waits behind it. The engine lifts it 1.0 s after it starts;
  `js/main.js` lifts it on any failure; a 3.2 s timer in `head.js` lifts it if nothing
  else does.
- Under `html.sand`, `css/sand.css` hides the legacy overlays and the legacy static picture
  of the field, and stops the view from sliding (the engine reads layout). Headings keep
  their ordinary solid type.
- A load without the opening sequence raises the exposure from zero over 0.6 s, so the
  sand does not pop in over a page that is already showing.
- Theme colours come from the existing recipe system through the `superposition:recipe`
  event. The fallback recipe controller remains the single owner of the CSS theme.
- Pointing at another domain in the strip or the index blends its mode half-way in.
- A governor sheds grains when the frame rate drops below 44 for two seconds, and hands
  over to the static ground if the minimum count still cannot hold 22.

## Not covered

`?seed=`, `?force=webgl` and `?force=static` never load this engine, so the repo's
existing browser tests exercise the legacy paths only. Nothing in CI renders this engine:
CI has no GPU.

## Round 2 (2026-11-24): memory, manipulation, the boom, relief

### Restrictions
- Sand resting in the heading's glyphs answers to nothing but the page: the pointer's drag,
  the strike and tilt are all multiplied by `1 - m.r` in the simulation. (Superseded by
  Round 3: no sand rests in the heading any more, and the guard is gone.)
- A press that starts on the plate never starts a text selection (`mousedown` is
  prevented unless the target is copy or a control), and headings are not selectable.
  A press that starts on copy still selects, and never strikes the plate.
- Sand in the air is not drawn over the copy or over the heading's clearing: the draw
  shader samples the page mask at the grain's plate position and multiplies by `1 - g`.

### Memory
- Long exposure. Grains are drawn additively into an `rgba16float` texture that is
  multiplied by `exp(-dt / TRAIL)` each frame (a full-screen pass with a constant blend
  factor), and grain intensity is scaled by one minus that factor, so sand at rest looks
  the same and sand in motion leaves a streak. `TRAIL` is 0.11 s.
- Marks. A press-and-drag records line segments (client px, width, birth time). They are
  drawn to a second 2D canvas and uploaded as `markT`. The simulation multiplies the
  plate's amplitude by `1 - 0.93 * mark`, so the plate is nearly still along a stroke and
  sand collects there. A mark lives `MARK_LIFE` (30 s) and fades over its last 8 s. Marks
  cannot move sand onto copy or into the heading's clearing. Touch input does not draw.

### Manipulation
- Hold to gather. While a press is held still, a disc that grows with the hold is drawn
  into the mark canvas under the pointer, so sand gathers there.
- Tilt (phones). `js/main.js` already forwards device orientation to `setParallax`. The
  pose the phone is first held in counts as level, level follows the hand with a 6 s time
  constant, and a 0.12 dead zone ignores a shaking hand. The result is a velocity added
  to every grain.

### The boom
- A tap strikes at power 0.35. A held press charges to 1.0 over 1.1 s and strikes on
  release. A press that travelled 14 px or more is a drawing and does not strike.
- Echoes. The ring is evaluated for the strike point and for its four mirror images in
  the plate's edges, at 0.55 strength. It does not reflect off text blocks.
- Overtone. A strike above 0.55 blends the current mode with the same mode sampled 1.9
  times finer about the focal point; the blend decays with a 0.45 s time constant.
- A strike above 0.9 fades every mark in 0.4 s. Every strike rocks the plate.

### Relief and light (desktop only)
The show pass reads the accumulated light as a height field. Slope against a light from
the upper left brightens one flank of a ridge and darkens the other, adds a glint on the
lit flank, and a four-step march toward the light darkens what a higher ridge shadows.
Then `1 - exp(-colour * EXPOSURE)` maps it to the screen over the ground colour. On
phones the relief and shadow strengths are zero.

### Uniforms added
`g.w` strike power. `h` = overtone amount, gravity x, gravity y, strike lifetime (s).

- Tilt: sand that reaches the low edge is returned to the plate at a hashed position, in the air, so the plate never empties. Tilt only starts after the first touch, when js/main.js asks for motion permission.

### The dial (added last in round 2)
A slider at the right edge (`#sand-dial`, created by the engine, hidden on phones and in print) tunes the plate. Its value scales the coordinates every mode is sampled at, about the focal point (`u.i.x`, from 0.55 to 2.2, 1.0 at rest), so a higher pitch draws a finer figure. Drag it, scroll over it or use the arrow keys; Home or a double click returns it to rest. The setting persists across page changes. It does not snap to a notch per domain.

## Round 3 (2026-11-25): solid titles

The owner rejected the sand-filled headings ("not professional") and picked solid type in
a quieter setting. What changed:

- `css/sand.css` no longer turns headings into transparent outlines. A heading is ordinary
  text in the ink colour, in every load mode.
- The mask no longer carries the heading's glyphs. `buildMask` draws the heading's box in
  green like any other clear zone. The red and blue channels are gone from the shaders,
  together with the letter pull, the `1 - m.r` guards and the letter brightness. `g.y` is
  now zero and unread, and a grain's fourth component is zero.
- The title's type lives in the base stylesheet (`css/main.1.css` and `css/main.3.css`,
  baked into `index.html`), so the legacy field, the static ground and the no-JS page show
  the same title. The name is one line (`white-space:nowrap`) and is sized in `vw`, so it
  fits its column at every width.
- The title is real text from the first frame. That removes the two costs recorded for the
  boot fix: no empty outline on a repeat load, and none while a hung adapter request runs
  out its 6 s.

The sand-filled heading is in git history up to commit `6f5fd6a`.


## Round 4 (2026-11-26): curated session appearances and staged startup

Owner decisions: remove Ocean depth/Cyanotype and Drum/Moire/Apollonian circles/Conformal grid; fix the sunflower/signal homepage; make other pages stable within a session; allow subtle and dramatic crop/detail changes, constrained on phones. The owner subsequently requested randomization in the main-ready release.

appearance-catalog.js retains 26 candidate IDs and 26 complete authored schemes. appearance.js draws a seed with Web Crypto, keeps the plan in sessionStorage, and builds assignments in canonical domain order. Independent seeded streams select shuffled distinct patterns, palette and composition. Home and printable record keep mode13/signal/neutral framing. Subtle/dramatic weighting starts at70/30. This is local appearance state, not visitor identification. Blocked storage remains usable; an explicit test seed neither reads nor writes appearance storage.

Detail is field coordinate pitch (higher gives finer features); framing is bounded translation/rotation of the sampled field. Neither moves the DOM, text mask, pointer coordinates or marks. Phones tighten pitch/crop/rotation bounds, especially for fine and central figures. Resize adapts the stored recipe without rerolling it. Version1 re-derives canonical assignments from the stored seed and discards corrupt selections; any future catalog-version migration needs explicit preservation tests before changing the catalog.

The initial compute program retains legacy modes0–8 and only the opening candidate. Other candidates compile asynchronously. One compilation runs while only the latest queued request survives. Version/target ownership checks reject stale hover or route requests. Pipeline and current mask/mark bindings activate atomically; resize rebinds current textures. A bounded ready cache avoids unbounded growth.

DOM foreground colors change atomically; solid current-ground backdrops protect copy, and GPU colors/ground snap when light/dark polarity changes. Other sand colors can ease. Opaque text tokens satisfy contrast against their surfaces. Index is an opaque dialog: covered roots are inert/hidden to accessibility, focus stays inside, prior state is restored on close, and late-created controls are included.

assets/patterns contains lightweight, near-zero contours sampled from the actual WGSL at a fixed pose. These are approximations of each field, not screenshots or proof that animation is ready. Readable text shows while GPU work starts; the approximate SVG is hidden for the entire animated startup so it cannot appear as a different opening pattern. The SVG is reserved for the final static path. The watchdog commits to that path and refuses a renderer arriving afterward. Adapter/device/opening preparation have deadlines; init failure destroys its device, and a late device is disposed. Device loss or sustained slow frames returns to the same selected static family. Full legacy seeded/forced renderer QA remains supported.

The startup diagnostics are opt-in through ?timing=1 and mirrored to DOM data-field-* attributes. No review picker or __sandLab global ships. Actual-phone timing and non-Chrome hardware behavior remain separate verification limits.

Phone input: deliberate taps strike; a stationary 350ms hold gathers/charges; moving after that hold draws. Movement before ownership leaves native scrolling and page swipes unclaimed. Drawing ownership suppresses the route swipe through release. A second finger cancels drawing and restores native pinch. Controls, copy selection, mouse ownership, cancellation, visibility loss and disposal clear or reject touch ownership. Native Chrome tests verify completed GPU strike/mark work and actual visualViewport zoom before/after drawing.

Desktop bottom navigation activates only on click/Enter; hover and keyboard focus do not change pattern, palette or framing. Explicit Index previews remain non-committing. Full-site validation and resolved isolated wheel diagnosis: docs/receipts/WEBSITE-VALIDATION-2026-11-26.md.
