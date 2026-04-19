# ARCHITECTURE.md — folio-2025 code map for GCT fork

**Purpose:** Single source of truth for *where things live* in Bruno's codebase. Every Claude Code session for this fork reads PRD.md + CLAUDE.md + this file before touching code. Updated only when the code moves, not when we add content.

**Scope:** Identifies the 10 systems we'll customize and the systems we must leave alone. File paths are relative to repo root. Line numbers are correct as of the initial fork from brunosimon/folio-2025 (commit untouched) and may drift as we modify files.

---

## Navigation notes

### Top-level layout

```
/resources/       Bruno's Blender source files (.blend, source art) — DO NOT DELETE
/scripts/         Build scripts (compress.js for asset compression)
/sources/         ALL source code lives here (JS, CSS, HTML)
/static/          Runtime assets: models (.glb), textures (.ktx/.webp), audio, UI images
/vite.config.js   Vite bundler config
/.env.example     Env template (VITE_SERVER_URL, VITE_MUSIC, etc.)
```

### `/sources/` layout

```
index.html                 Single-page shell with ALL HTML modals/navigation/content
index.js                   Entry point: new Game() + game.start()
threejs-override.js        Monkey-patches for Three.js WebGPU path
style/                     Stylus CSS
data/                      Content data (projects, lab, achievements, social, countries, console log)
Game/                      Core engine code
  Game.js                  Top-level orchestrator (singleton, accessed via Game.getInstance())
  Player.js                Input → vehicle control, honk/engine sound triggers
  Audio.js                 Howler.js wrapper (register, play, stop, volume)
  Server.js                WebSocket client, gated on VITE_SERVER_URL
  Achievements.js          Unlock logic + skin reward binding
  Materials.js             Central materials registry (gradients, palette texture)
  Materials/               Custom material classes (MeshDefaultMaterial, MeshGridMaterial)
  Physics/                 Rapier integration (Physics.js, PhysicsVehicle.js, PhysicsWireframe.js)
  World/                   Scene objects (VisualVehicle.js, Lanterns.js, Whispers.js, Trees.js, etc.)
  World/Areas/             Interactive zones (ProjectsArea, CircuitArea, LabArea, LandingArea, ...)
  Cycles/                  Day/night, year cycles
  Passes/                  Post-process passes (cheapDOF.js)
  Inputs/                  Keyboard/gamepad/touch input
  Geometries/              Custom geometries
  utilities/               Math helpers, etc.
```

### Entry point + game loop

- `sources/index.js` → `new Game()` + `game.start()`.
- `sources/Game/Game.js` is a **singleton** (`Game.getInstance()`). Every module reaches into it to get resources/ticker/audio/inputs.
- **Frame tick:** `sources/Game/Ticker.js` (not yet inspected, but referenced as `this.game.ticker.events.on('tick', callback, PHASE)`).
- **Phase 8** is the visual-from-physics sync phase (see `VisualVehicle.js:34`). Do not reorder phases.

### Key conventions

- Lowercase folder names except `Game/` and `World/Areas/` (PascalCase).
- Class-based modules, ES modules, no React, no TypeScript.
- Rendering: `three/webgpu` (WebGPU-first with WebGL fallback). TSL (Three Shading Language) imports from `three/tsl`.
- Debug: `this.game.debug.active` gates tweakpane panels; ignore when writing production paths.

---

## 1. Car model loading

**Asset path:** `static/vehicle/default.glb` (plus `static/vehicle/defaultCompressed.glb` for prod).

**Registered at:** `sources/Game/Game.js:136`:

```js
[ 'vehicle', `vehicle/default${compressedModelSuffix}.glb${cb}`, 'gltf' ],
```

Registered inside `ResourcesLoader.load([...])` call starting around line 132.

**Consumed at:** `sources/Game/World/World.js` — look for `new VisualVehicle(resources.vehicle.scene)` or similar (line ~56 per initial recon, verify before editing).

**Path to chicken swap (Phase 3):** Change the asset path at `Game.js:136` from `vehicle/default...` to `models/chicken.glb`, then update `VisualVehicle.setParts()` to look for chicken submesh names instead of car names.

---

## 2. Visual ↔ physics binding

**Visual class:** `sources/Game/World/VisualVehicle.js` (546 lines).
**Physics class:** `sources/Game/Physics/PhysicsVehicle.js` (590 lines). **DO NOT MODIFY per PRD §6.1.**

**Binding point — the lines that drive visual from physics every frame:**

```js
// sources/Game/World/VisualVehicle.js:423-424
this.parts.chassis.position.copy(physicalVehicle.position)
this.parts.chassis.quaternion.copy(physicalVehicle.quaternion)
```

This is THE line our chicken integration hinges on. The chicken's root group replaces `this.parts.chassis` and the exact same copy logic holds.

**Frame tick registration:** `VisualVehicle.js:30-34`:

```js
this.tickCallback = () => { this.update() }
this.game.ticker.events.on('tick', this.tickCallback, 8)  // phase 8
```

**GLB submesh discovery:** `VisualVehicle.js:61-95` (`setParts()`) walks the loaded scene looking for named nodes:

```js
const searchList = [
    'bodyPainted', 'chassis', 'blinkerLeft', 'blinkerRight',
    'stopLights', 'backLights', 'wheelContainer', 'antenna',
    'cell1', 'cell2', 'cell3', 'energy',
]
```

**⚠️ For the chicken GLB** (Phase 3), this search list must change to match the new submesh names from PRD §5: `head`, `wing_l`, `wing_r`, `body`. If submeshes don't match, nothing attaches. The chicken mesh will need to be positioned so that its `body` group is at the origin (where `chassis` would be) so the physics-sync still reads correct.

**Wheel sync:** `VisualVehicle.js:436-471` syncs each wheel's position/rotation from `physicalVehicle.wheels[i]`. Per PRD §6.1 we hide wheel visuals but keep physics wheels. Easiest: set the wheel container's `visible = false` after `setWheels()` runs.

---

## 3. 6 reward skins

**Defined at:** `sources/Game/World/VisualVehicle.js:131-222` inside `setPaints()`.

**The 6 skins and how they're built:**

| Slot | `data-name` | Definition line | Technique |
|------|-------------|-----------------|-----------|
| 1 | `red` | `VisualVehicle.js:134` | `materials.getFromName('redGradient')` — uses baked palette texture |
| 2 | `orange` | `VisualVehicle.js:135` | `materials.createGradient('orangeGradient', '#ff940d', '#af0071', ...)` |
| 3 | `white` | `VisualVehicle.js:136` | `materials.createGradient('whiteGradient', '#ffffff', '#b5b5b5', ...)` |
| 4 | `black` | `VisualVehicle.js:137` | `materials.createGradient('blackGradient', '#626262', '#262526', ...)` |
| 5 | `flames` | `VisualVehicle.js:141-183` | Custom TSL shader with emissive noise + fire gradient |
| 6 | `abyssal` | `VisualVehicle.js:186-222` | Custom TSL shader with fresnel (`#6053ff`) + screen-space stars texture |

**Skin switcher:** `VisualVehicle.js:224-241`:

```js
this.paints.changeTo = (name = 'red') => {
    const material = this.paints.choices[name]
    if(!material) return false
    this.parts.bodyPainted.material = material
    ...
}
this.paints.changeTo(this.game.achievements.rewards.current.name)
```

**Achievement binding:** `VisualVehicle.js:245` — listens for new reward events and calls `changeTo(reward.name)`.

**Unlock logic:** `sources/Game/Achievements.js:171-220` (`setRewards()`):
- Queries `.js-reward` elements from the DOM (`sources/index.html:521-556`).
- Assigns threshold per reward at line 184: `item.threshold = Math.round(i / (count - 1) * totalCount)`.
- Active reward change triggers `this.rewards.set(item.name)` (line 192).
- Current reward persisted to localStorage (line 212).

**HTML buttons:** `sources/index.html:521-556`:

```html
<button class="js-reward reward has-tooltip" data-name="red" data-default>
<button class="js-reward reward has-tooltip is-locked" data-name="orange">
<button class="js-reward reward has-tooltip is-locked" data-name="white">
<button class="js-reward reward has-tooltip is-locked" data-name="black">
<button class="js-reward reward has-tooltip is-locked" data-name="flames">
<button class="js-reward reward has-tooltip is-locked" data-name="abyssal">
```

Each button has `<img>` children pointing at preview PNGs (likely `static/achievements/` or `ui/rewards/` — verify in Phase 4).

**⚠️ Phase 4 gotcha:** Skin name must match in THREE places: HTML `data-name` (index.html), `this.paints.choices[name]` key (VisualVehicle.js), AND localStorage key (Achievements.js:212-216). Renaming `red → tandoori` means touching all three. Cleaner: keep internal keys (`red`, `orange`, etc.) and only change DISPLAY labels + material colors. Either is fine, but be consistent.

**⚠️ Abyssal skin has a dependency:** `VisualVehicle.js:196` references `this.game.resources.behindTheSceneStarsTexture` — registered in Game.js resources. Keep that resource alive.

---

## 4. Portfolio zones (case study triggers)

**Base class:** `sources/Game/World/Areas/Area.js`.
**Registry:** `sources/Game/World/Areas/Areas.js` (instantiates all area subclasses and registers them).

**Area classes (15 total):**

```
AchievementsArea.js    CareerArea.js         LabArea.js
AltarArea.js           CircuitArea.js        LandingArea.js
BehindTheSceneArea.js  CookieArea.js         ProjectsArea.js
BowlingArea.js         EasterArea.js         SocialArea.js
                       TimeMachineArea.js    ToiletArea.js
```

**The 4 GCT case study zones will replace 4 of these.** Candidates (by prominence + traffic flow, verify in Phase 5):
- `ProjectsArea` (highest-traffic, currently shows Three.js Journey + others) — strongest candidate for case study slot 1
- `CareerArea`, `LabArea`, `SocialArea` — other candidates

**`ProjectsArea.js` specifically (the one most similar to our GCT zones):**
- File: `sources/Game/World/Areas/ProjectsArea.js` (length TBD, inspected first 40 lines).
- Imports content from `sources/data/projects.js`.
- Uses `InteractivePoints` (`sources/Game/InteractivePoints.js`) for in-world markers.
- States: `STATE_OPEN`, `STATE_OPENING`, `STATE_CLOSED`, `STATE_CLOSING` — opens modal when player interacts with point.
- Has its own TSL shader for the area floor/backdrop.

**Content data:**
- `sources/data/projects.js` (161 lines) — array of `{ title, titleSmall, url, attributes, distinctions, images }`. Example:
  ```js
  {
      title: 'Three.js Journey',
      titleSmall: [ 'Three.js', 'Journey' ],
      url: 'https://threejs-journey.com',
      attributes: { role: [...], with: [...] },
      distinctions: [ 'fwa' ],
      images: [ 'threejs-journey-1.ktx', ... ]
  }
  ```
- `sources/data/lab.js` — experiments shown in LabArea.
- `sources/data/social.js` (9 lines) — social links shown in SocialArea.
- `sources/data/countries.js` — visitor country data.

**Project images:** stored in `static/` under a subfolder named per project (e.g. `static/projects/threejs-journey/`, verify). Compressed as `.ktx` (KTX2 texture format).

**⚠️ Zone geometry is baked in the Areas GLB.** The 3D shape of each area (e.g. the Projects "stage" ring) is in `static/areas/areas.glb` or similar, NOT procedural. Moving an area means either editing Bruno's Blender file (out of scope v1, per PRD §10.2) or accepting the physical layout as fixed and only swapping content/labels.

---

## 5. UI copy strings

**Primary location:** `sources/index.html` (~970 lines). This is the single HTML shell that contains every modal, menu, tooltip, and content panel. Everything else gets injected via JS.

**Bruno references in `sources/index.html` — exact lines to audit for Phase 2 (this list is authoritative, confirmed via grep):**

| Line | Current text | Section |
|------|--------------|---------|
| 6 | `<title>Bruno's</title>` | `<head>` |
| 8 | `<meta name="description" content="Bruno Simon's creative portfolio">` | `<head>` |
| 10 | `<meta itemprop="name" content="Bruno Simon">` | `<head>` |
| 11 | `<meta itemprop="description" content="Bruno Simon's creative portfolio">` | `<head>` |
| 15 | `<meta name="twitter:title" content="Bruno Simon">` | `<head>` |
| 16 | `<meta name="twitter:description" content="Bruno Simon's creative portfolio">` | `<head>` |
| 22 | `<meta property="og:title" content="Bruno Simon">` | `<head>` |
| 23 | `<meta property="og:description" content="Bruno Simon's creative portfolio">` | `<head>` |
| 36 | `<meta name="apple-mobile-web-app-title" content="Bruno's" />` | `<head>` |
| 227 | `<div class="title">Bruno's Home</div>` | Landing modal |
| 229 | `<p class="text">My name is <strong>Bruno Simon</strong>, and I'm a <strong>creative developer</strong> (mostly for the web).</p>` | Landing modal |
| 728 | `— Bruno` (signoff) | Likely Behind the Scene |

**Other copy locations:**
- `sources/data/projects.js` — project titles, roles, collaborators.
- `sources/data/consoleLog.js` — ASCII art / easter egg printed to devtools console.
- `sources/data/social.js` — social links + labels.
- `sources/data/achievements.js` — achievement names and descriptions.
- `sources/data/lab.js` — lab experiment titles.
- `sources/style/*.styl` — no copy, but inspect for any hardcoded content-reveal strings.

**⚠️ Phase 2 rule:** Do NOT change these in Phase 2. Produce the replacement table first, get Jasraaj review, then execute in one pass.

---

## 6. Color palette + material definitions

**No `/lib/brand.js` exists yet.** Phase 2 creates it.

**Central materials registry:** `sources/Game/Materials.js` (366 lines).
- Exposes `getFromName(name)` for palette-based gradient materials.
- `createGradient(name, colorA, colorB, debugPanel)` builds a new gradient on demand.
- Builds a runtime palette texture (likely from `static/palette.png` / `static/palette.ktx`).

**Custom material classes:** `sources/Game/Materials/`
- `MeshDefaultMaterial.js` — Bruno's standard WebGPU material (TSL-based). **Used everywhere in the world.** Has utilities like `revealDiscardNodeBuilder` (see `VisualVehicle.js:204`).
- `MeshGridMaterial.js` — the grid-underlay material.

**⚠️ MATCH THIS FAMILY FOR CHICKEN (PRD §6.2):** The chicken's body material MUST use `MeshDefaultMaterial` or a TSL-built material, NOT a vanilla `MeshStandardMaterial`. Mixing shader families breaks the WebGPU render path.

**Hardcoded colors to audit in Phase 2 (non-exhaustive):**
- `VisualVehicle.js:135-222` — skin colors (orange, white, black, flames, abyssal fresnel).
- `sources/style/*.styl` — UI colors.
- `static/palette.png` — the baked gradient palette (grep for it; moving beyond red/white/beige will require either editing this PNG or adding new gradients via `createGradient`).

**Car "red" as brand marker:** The default red car color is semantically load-bearing — the map marker, tooltip indicators, and "you are here" UX assume red. Phase 2 will flag whether the chicken needs to stay red (brand default) or switch to GCT Red (likely same hex if Jasraaj's red is car-red-ish).

---

## 7. Audio files + triggers

**Howler wrapper:** `sources/Game/Audio.js`.

**Audio folders under `static/sounds/vehicle/`:**
```
energy/      engine/      floor/       honk/
paint/       spin/        springs/     suspensions/
```

**Music assets:** `static/jukebox/` — Bruno's Kounine tracks (CC0, preserve per PRD §2).

**Honk trigger (PRD §9 swap target → cluck):**
- `sources/Game/Player.js:70` registers the sound:
  ```js
  this.sounds.honk = this.game.audio.register({ path: 'sounds/vehicle/honk/Car Horn Long 4.mp3', ... })
  ```
- `Player.js:79` — honk is a LOOPING sound with volume modulated by input state. When inactive, volume = 0. It's always playing; the volume gate makes it audible on press.
- `Player.js:238` — 'honk' action keybind (`Keyboard.KeyH`, `Gamepad.l3`).
- `Player.js:254` — input listener that calls `this.honk()`.
- `Player.js:503` — `honk()` method body (calls `this.game.achievements.addProgress('honk')` at line 519 — an achievement tracker).

**⚠️ Honk gotcha:** Because it's a LOOP with volume gating (not a one-shot), swapping to `cluck-01.mp3`/`cluck-02.mp3` with random selection (PRD §9) requires either:
- Rewriting to one-shot playback on press, OR
- Using two looping tracks and crossfading, OR
- Simpler: make the cluck a short sample and play it one-shot via `audio.play()` on input edge.

Recommend the third approach in Phase 6.

**Engine trigger (PRD §9 swap target → kukdu ku loop):**
- `Player.js:156` registers engine loop: `path: 'sounds/vehicle/engine/muscle car engine loop idle.mp3'`.
- Target file: `static/sounds/chicken/kukdu-ku-loop.mp3` (new folder — create in Phase 6).

**Credits already in `sources/index.html:728` context** (the "Behind the Scene" modal) — Phase 6 replaces this with the four-credit block per PRD §9.

---

## 8. Server-dependent systems

**Server client:** `sources/Game/Server.js` (132 lines).
- Line 13: generates or loads `uuid` from localStorage.
- Line 23: `document.documentElement.classList.add('is-server-offline')` — this class is the CSS hook for "server offline" UI state. Bruno's existing UI responds to it.
- Line 28: `if(import.meta.env.VITE_SERVER_URL)` — entire WebSocket logic gated on the env var. With `VITE_SERVER_URL=""` (our v1 default), the server never connects.
- Line 50: `classList.remove('is-server-offline')` — only fires on successful connection.

**V1 degradation path:** Leave `VITE_SERVER_URL` empty in production. The `is-server-offline` CSS class stays applied, and Bruno's existing offline UI renders.

**Files that reference `VITE_SERVER_URL` or `Server.js`:**
```
sources/Game/World/Whispers.js              ← ghost messages from other visitors
sources/Game/World/Areas/CircuitArea.js     ← lap time leaderboard
sources/Game/World/Areas/AltarArea.js       ← server-side achievement sync
sources/Game/World/Areas/CookieArea.js      ← cookie counter
sources/Game/Tornado.js                     ← server-broadcast event
sources/Game/Reveal.js                      ← reveal animation (check if server-gated)
sources/Game/Options.js                     ← options panel (server flag)
sources/Game/Easter.js                      ← easter egg
```

**Achievements system:** `sources/Game/Achievements.js` (630 lines). Uses server for global progress sync, falls back to localStorage. Skin unlocks work offline (threshold is local count).

**⚠️ Phase 8 QA step:** Verify `is-server-offline` CSS produces correct UI state — "server offline" hint text should be visible in whispers panel, circuit leaderboard, etc.

---

## 9. Particle system (for flaming + masala skin reuse)

**Particle-like systems Bruno has (catalog for reuse):**

| File | What it does | Reuse potential |
|------|--------------|-----------------|
| `sources/Game/Explosions.js` (81 lines) | Explosion bursts (for ExplosiveCrates, Fireballs) | Medium — adapt for brief "dust puff" effects |
| `sources/Game/World/Fireballs.js` | Flame/fire projectiles | **HIGH — closest to flaming-skin head feather fire** |
| `sources/Game/World/Whispers.js` (528 lines) | Floating whispers using InstancedMesh + TSL | Medium — pattern reference for persistent ambient particles |
| `sources/Game/World/Confetti.js` | Confetti pop (probably for achievements) | Low |
| `sources/Game/World/Leaves.js` | Falling leaves | Medium — could adapt for spice-dust fall |
| `sources/Game/World/RainLines.js` | Rain streaks | Low |
| `sources/Game/World/Snow.js` | Snow flakes | Medium |
| `sources/Game/World/WindLines.js` | Wind streak lines | Low |
| `sources/Game/World/Lightnings.js` | Lightning bolts | Low |

**Phase 4 strategy:**
- **Flaming skin fire particles:** adapt `Fireballs.js` to emit from the chicken's head position. Small scale, upward velocity, short lifetime.
- **Masala spice-dust particles:** adapt `Leaves.js` or `Snow.js` pattern for a slow orange/red dust fall clinging to the chicken silhouette. Or: use `Explosions.js` in a very-low-intensity continuous trigger.

**⚠️ No generic "particle engine" exists.** Each particle effect is its own class. Reuse means copying + specializing, not calling a shared emitter API.

---

## 10. Lantern glow shader (for abyssal skin reuse)

**`sources/Game/World/Lanterns.js` (69 lines)** — short file, handles lantern mesh placement. Probably does NOT contain the glow shader itself (too short).

**`sources/Game/World/PoleLights.js`** — pole lights (likely shares glow pattern).

**⚠️ The "lantern glow" named in the PRD is a misnomer.** The actual glow effect our PRD references is the **abyssal skin shader itself**, which is self-contained inside `VisualVehicle.js:186-222`. It's a custom TSL shader combining:
- Fresnel-based rim glow (`fresnelColor = '#6053ff'`, `fresnelIntensity = 30`).
- Screen-space stars texture sampled from `resources.behindTheSceneStarsTexture`.
- Discard node (`MeshDefaultMaterial.revealDiscardNodeBuilder`) for the reveal animation.

**Implications for Phase 4 "abyssal chicken with glowing eyes":**
- If we want glowing EYES (not whole-body glow), the abyssal shader isn't directly reusable — it applies to the `bodyPainted` mesh. For eye glow, simpler approach: use a `MeshBasicMaterial` with an emissive color on a small "eye" submesh (requires Blender to add eye submeshes).
- If we want the whole-chicken abyssal effect (rim + stars), reuse the existing abyssal TSL shader and just swap which mesh receives it.

**Recommend for Phase 4:** Use the existing abyssal shader as-is on the whole chicken body. If Jasraaj wants eye-only glow, treat it as a stretch goal and flag for v2.

---

## Game loop phases (ordered, DO NOT REORDER)

The ticker fires callbacks registered at numbered phases. Registration pattern:

```js
this.game.ticker.events.on('tick', callback, PHASE_NUMBER)
```

**Known phases (from grep of `ticker.events.on`):**

| Phase | Purpose (inferred) | Registered by |
|-------|-------------------|---------------|
| 8 | Visual vehicle sync (copy transforms from physics) | `VisualVehicle.js:34` |

(Remaining phases to be documented when/if they become relevant to a specific task. Full audit would require grepping all 9 Areas + World files and is out of scope for this read-only recon.)

**PRD §2 rule:** 14 ordered phases; we do not reorder.

---

## ⚠️ Surprises and non-obvious coupling

1. **Honk is a loop with volume gating, not a one-shot.** Phase 6 must re-architect it for cluck playback (see §7 above).

2. **Skin names are shared across 3 layers.** HTML `data-name` ↔ `paints.choices[name]` ↔ localStorage. Rename in one, break the other two.

3. **`bodyPainted` is the paint-receiving mesh, not `chassis`.** `chassis` receives transform sync; `bodyPainted` receives material swaps. The chicken's "body" submesh needs to serve BOTH roles (or split into `body_paint` + `body_root`). Recommend keeping it single — just apply material to `body` and sync its root group to physics.

4. **`three/webgpu` + TSL is the default, not `three`.** Imports from `three` (not `three/webgpu`) will quietly create material-family mismatches. Match Bruno's imports exactly in new code.

5. **Resource compression suffix changes paths at runtime.** `compressedModelSuffix` toggles between `""` and `"Compressed"` (or `"Draco"`). The chicken GLB must either ship in both forms OR override the suffix logic for its specific load.

6. **The `static/palette.png`/`.ktx` baked gradient atlas is referenced by the materials system.** Adding new skin colors via `createGradient` doesn't require editing this atlas. Trying to add new materials that look up from the atlas DOES.

7. **Camera target offset is tuned for car height.** `VisualVehicle.js` references `camera.setTarget` indirectly via `game.camera`. The chicken is shorter; Phase 3 must adjust the target offset to avoid framing the chicken at the top of the screen.

8. **`VITE_SERVER_URL` is the master kill switch.** Empty value = all server-dependent features gracefully degrade via the `is-server-offline` CSS class. Do not try to stub out individual features; leave the env var empty and trust Bruno's offline UI.

9. **`index.js` is 12 lines.** Everything else is in `Game.js`. Don't expect logic in the entry file.

10. **Debug panels only mount when `game.debug.active` is true.** Tweakpane folders (`addFolder`) inside conditional blocks — you won't see them in production, but they're registered at many material-creation sites. Don't delete the `debugPanel?.addFolder(...)` calls.

11. **GLB mesh names are load-bearing.** Area geometry and car parts are discovered by traversing loaded GLBs for named nodes. Blender exports must preserve exact node names. Rename in Blender = break code.

12. **TSL shaders use node-based composition, not GLSL strings.** `Fn(() => { ... return vec4(...) })()` is the TSL idiom (see `VisualVehicle.js:193-207`). New shaders in Phase 3/4 must follow this pattern; pasting GLSL will silently not compile.

---

## Sibling docs

- [PRD.md](./PRD.md) — Product spec, phase definitions, non-negotiables.
- [CLAUDE.md](./CLAUDE.md) — Rules Claude Code reads at every session start.
- [FUTURE.md](./FUTURE.md) — v2 parking lot.

**This file updates only when code moves.** Content changes (new case studies, new skin colors) do not belong here.

---

**End of ARCHITECTURE.md**
