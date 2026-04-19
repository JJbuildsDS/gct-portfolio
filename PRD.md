# GCT Portfolio — Claude Code PRD v1.0 (Final)

**Project:** Fork and reskin of `brunosimon/folio-2025` into Garlic Chicken Tikka's interactive 3D portfolio
**Author:** Jasraaj Puri
**Target launch:** 2-4 weeks from kickoff
**Stack:** Three.js + Rapier + Vite (inherited from Bruno Simon's folio-2025)
**Hosting:** Vercel
**Repo:** `JJbuildsDS/gct-portfolio` (fork of brunosimon/folio-2025)

---

## 0. What this project IS and ISN'T

**IS:** A fork of Bruno Simon's open-source `folio-2025` repo (MIT license), with the car swapped for a chicken, car physics preserved, portfolio content reskinned to GCT's brand and case studies.

**IS NOT:** A from-scratch rebuild. Do not re-architect. Do not migrate to Next.js or React. Do not refactor the game loop, physics, or rendering. Do not remove systems that already work (weather, day/night, foliage, whispers, circuit, achievements, WebGL + WebGPU dual rendering).

Goal: preserve 90% of Bruno's engineering, customize the 10% that matters (vehicle, content, brand).

---

## 1. About GCT

**Name:** Garlic Chicken Tikka (GCT)
**Tagline:** The masala your brand needs
**What GCT does:** Garlic Chicken Tikka is a creative agency that works with brands on content strategy, social media, and email marketing.
**Mascot:** A chicken. The chicken is the vehicle users drive around the 3D portfolio world.

---

## 2. Non-negotiables (read these first, every session)

1. This is a fork. Bruno's MIT license stays. Bruno gets credit in the Behind the Scene section. Add GCT copyright alongside his.
2. Jeremy (chicken model author, Poly Pizza) gets CC-BY credit in Behind the Scene.
3. Kounine's music stays (CC0) with credit intact.
4. No em dashes in any copy. Use commas, periods, colons, or semicolons.
5. Brand palette is locked: red, white, beige. Exact hex codes in Section 4. Do not introduce additional brand colors without asking Jasraaj.
6. Chicken movement = hybrid puck-slide. Uses Bruno's existing vehicle physics body unchanged. Head-bob and wing-flap are COSMETIC animations applied in code, driven by velocity. Do not attempt walk cycles, IK, or skeletal animation. Static mesh, procedural animation.
7. Preserve the WebGL + WebGPU dual rendering path.
8. Preserve all existing systems (whispers, circuit, achievements, weather, day/night). V1 ships with server-dependent features showing Bruno's existing "server offline" UI.
9. When in doubt, STOP and ASK. Do not guess coordinates, copy, colors, or which case studies go where.
10. No React. No Next.js. Stylus stays. Class-based modules stay. Lowercase folders stay.

---

## 3. Tech stack (inherited, do not change)

- Three.js with TSL (Three Shading Language) for WebGL + WebGPU
- Rapier for physics
- Howler.js for audio
- Vite for bundling and dev server
- Stylus for CSS
- Node.js 18+ runtime
- Blender 4.x for asset edits (one pass for chicken export + submesh naming)

---

## 4. Brand assets

### 4.1 Palette

| Name | Hex | Usage |
|------|-----|-------|
| GCT Red | `[TBD — Jasraaj to provide]` | Primary accents, logo, achievement highlights, Tandoori skin |
| GCT White | `[TBD — suggest #FAF7F2 warm white, or #FFFFFF pure]` | Backgrounds, text on dark, UI panels |
| GCT Beige | `[TBD — Jasraaj to provide]` | Secondary surfaces, billboards, terrain tint |

All colors exported from `/lib/brand.js`. No raw hex codes in component code.

### 4.2 Typography
Keep Bruno's pairing: **Amatic SC** (display) + **Nunito** (body). Both Google Fonts, already loaded.

### 4.3 Copy

- **Site title:** GCT — Garlic Chicken Tikka
- **Tagline:** The masala your brand needs
- **Welcome zone copy (replaces Bruno's "My name is Bruno Simon..."):**
  > Welcome to GCT.
  > Garlic Chicken Tikka is a creative agency working with brands on content strategy, social media, and email marketing. We are the masala your brand needs.
  > Drive the chicken around to explore our work.

- **Behind the Scene credits:** see Section 9.

### 4.4 Logo
Jasraaj to provide GCT logo as SVG before Phase 2.

---

## 5. Chicken model

- **Source:** https://poly.pizza/m/1YE8U35HXsI
- **Author:** jeremy
- **License:** Creative Commons Attribution (CC-BY 4.0)
- **Format:** OBJ / GLTF (static mesh, no animations)
- **Credit required:** YES, in Behind the Scene section
- **Target path:** `/static/models/chicken.glb`

**Blender pre-work (Jasraaj, before Phase 3):**
1. Download OBJ/GLTF from Poly Pizza
2. Open in Blender, check scale (chicken should be roughly 1 unit tall, matching car height)
3. Rename submeshes: `head`, `wing_l`, `wing_r`, `body`
4. Export as GLB to `/static/models/chicken.glb`

---

## 6. Chicken behavior specification

### 6.1 Physics body
Chicken uses the EXACT SAME Rapier rigid body, colliders, wheel joints, and tuning values as Bruno's car. Zero changes to `PhysicalVehicle`. Chicken IS the car at the physics layer. Wheel collider meshes remain but are HIDDEN.

### 6.2 Visual binding
`VisualVehicle` is where 99% of the work happens. Replace car GLB load with `chicken.glb`. Rebind transform to physics body root.

### 6.3 Procedural animations (driven by physics state, not skeletal)

**Head bob:**
- Rotate `head` submesh on X-axis based on acceleration magnitude
- Forward accel: head tilts back. Braking: head tilts forward.
- Idle: low-amplitude slow sinusoidal bob when speed near zero

**Wing flap:**
- Rotate `wing_l` and `wing_r` on Z-axis
- Trigger when jumping, airborne, or speed above threshold
- Sinusoidal rotation, amplitude scales with velocity

### 6.4 Camera
Keep Bruno's chase camera logic. Adjust target offset for chicken height (shorter than car). Verify framing on desktop and mobile.

### 6.5 What NOT to do
- No IK
- No walk cycles
- No physics value changes trying to "make it feel chicken-y"
- No extra colliders for wings or head

---

## 7. The 6 skin variants (spice-themed, confirmed)

| Slot | Skin | Visual treatment | Unlocks at (inherited from Bruno) |
|------|------|------------------|-----------------------------------|
| 1 | Tandoori | Deep red-orange, earthy | Bruno's slot 1 condition |
| 2 | Masala | Warm rust with spice-dust particles | Bruno's slot 2 condition |
| 3 | Butter | Pale cream, slightly golden | Bruno's slot 3 condition |
| 4 | Kadai | Darker brown-red, smoky | Bruno's slot 4 condition |
| 5 | Flaming | White base + fire particles on head feathers (reuse Bruno's particle system) | Bruno's slot 5 condition |
| 6 | Abyssal | Dark purple-black with glowing eyes (reuse lantern glow shader) | Bruno's slot 6 condition |

Implementation: material color overrides on the single `chicken.glb`. Spice-dust and fire particles reuse existing systems. 6 placeholder preview PNGs (colored chicken silhouettes) for achievements UI. Do not touch unlock logic.

---

## 8. Case studies (4 zones)

| Slot | Project | Description | Assets |
|------|---------|-------------|--------|
| 1 | Pepper Pods Instagram | `[TBD — Jasraaj to provide: 1-sentence description, 2-3 images, optional stat or quote]` | `[TBD]` |
| 2 | Avantus | `[TBD — Jasraaj to provide: 1-sentence description, 2-3 images, optional stat or quote]` | `[TBD]` |
| 3 | `[TBD — Jasraaj to fill]` | `[TBD]` | `[TBD]` |
| 4 | `[TBD — Jasraaj to fill]` | `[TBD]` | `[TBD]` |

For each zone, content structure:
- Headline (5-8 words)
- Summary (2-3 sentences)
- 2-3 images at 1200x800 or similar
- Optional: 1-line stat or quote
- Optional: outbound link to live project

Case study zones replace Bruno's portfolio zones 1:1. Zone assignments proposed by Claude Code in Phase 5 for Jasraaj approval.

---

## 9. Audio

- **Music:** Bruno's Kounine tracks, CC0, unchanged. Credit preserved.
- **Honk → Cluck:** Replace honk sound with chicken cluck. Source from freesound.org filtered by CC0. Store at `/static/sounds/chicken/cluck-01.mp3` and `cluck-02.mp3` (random selection on honk trigger).
- **Engine sound:** Soft "chicken kukdu ku" loop. Source CC0 rooster/chicken clucks from freesound.org. Store at `/static/sounds/chicken/kukdu-ku-loop.mp3`. Mix at low volume so it sits under the music.

**Behind the Scene credits (full block):**
> ### Credits
> This portfolio is a fork of Bruno Simon's open-source folio-2025 (MIT license). Enormous thanks to Bruno for sharing the codebase and making it possible for us to build on his work.
>
> - **Original codebase and 3D world:** Bruno Simon ([bruno-simon.com](https://bruno-simon.com), [GitHub](https://github.com/brunosimon/folio-2025))
> - **Music:** Kounine, CC0 ([Linktree](https://linktr.ee/Kounine))
> - **Chicken model:** jeremy on Poly Pizza, CC-BY 4.0 ([source](https://poly.pizza/m/1YE8U35HXsI))
> - **Three.js:** mr.doob and contributors ([threejs.org](https://threejs.org))
>
> GCT reskin by Jasraaj Puri.

---

## 10. Scope

### 10.1 In scope for v1
- Fork setup and local dev environment
- Chicken model integration with puck-slide physics and procedural animation
- 6 spice-themed chicken skin variants
- Brand palette + typography theming
- UI copy audit and replacement
- 4 case study zones
- Behind the Scene rewrite with credits
- Cluck + kukdu ku audio
- Vercel deployment as static site
- Graceful degradation of server-dependent features

### 10.2 Out of scope for v1 (defer to v2, document in `FUTURE.md`)
- Backend for whispers and leaderboards
- Custom 3D architecture edits in Bruno's Blender file
- Original music composition
- Walk-cycle chicken with IK
- Mobile UI redesign
- GEO / SEO structured data
- Analytics
- Contact form
- Multiplayer features

---

## 11. Build phases

### Phase 0: Manual setup (Jasraaj)

```bash
cd ~/projects
git clone https://github.com/brunosimon/folio-2025.git gct-portfolio
cd gct-portfolio
git remote rename origin bruno-upstream
git remote add origin https://github.com/JJbuildsDS/gct-portfolio.git
git branch -M main
git push -u origin main
nvm use 20
npm install --force
cp .env.example .env
npm run dev
```

Confirm Bruno's car works at localhost:1234. Then place this PRD as `PRD.md` at repo root, create `CLAUDE.md` (Section 15), commit, start Phase 1.

### Phase 1: Codebase reconnaissance (read-only session)

```
Read CLAUDE.md and PRD.md first.

Task: Produce ARCHITECTURE.md at the repo root mapping:
1. Where the car model is loaded (file paths, module names)
2. Where the car mesh is bound to physics (VisualVehicle + PhysicalVehicle link)
3. Where the 6 reward skins are defined
4. Where the 3D world's zones are defined (portfolio zones that trigger content)
5. Where UI copy strings live
6. Where the color palette and material definitions live
7. Where audio files and music are referenced
8. Where whispers, circuit, achievements systems live (file paths only)
9. Where Bruno's particle system lives (for flaming skin reuse)
10. Where Bruno's lantern glow shader lives (for abyssal skin reuse)

Read-only session. Do not modify any files. ARCHITECTURE.md is the map for every future session.
```

### Phase 2: Brand palette + UI copy swap

**Before session:** Jasraaj confirms final hex codes for red, white, beige.

```
Read CLAUDE.md, PRD.md, and ARCHITECTURE.md first.

Task A: Create /lib/brand.js exporting:
- Colors: red, white, beige (use hex codes from PRD §4.1)
- Site title: "GCT — Garlic Chicken Tikka"
- Tagline: "The masala your brand needs"
- About blurb: from PRD §4.3
- Credits block: from PRD §9

Task B: Audit every UI string referring to "Bruno", "Bruno's Home", "Bruno Simon", "my portfolio", "I'm a creative developer". Produce a table: file, line, current text, proposed GCT replacement. DO NOT change them yet. Wait for Jasraaj review.

Task C: Propose a color replacement map. List every place in the current codebase using a non-neutral color (car paint, UI accents, billboards, lighting tints). Show what each becomes under red/white/beige palette. Flag any places where the car's red color is load-bearing for UX clarity (e.g. map marker) so we preserve legibility.

Do not execute the replacements in this session. Output only.
```

### Phase 3: Chicken model integration (biggest phase, 2-3 days)

**Before session:** Jasraaj completes Blender pre-work per §5.

```
Read CLAUDE.md, PRD.md §5 and §6, and ARCHITECTURE.md first.

Task: Replace car visual mesh with chicken, hybrid puck-slide approach per PRD §6.

Steps:
1. Confirm VisualVehicle location and current car mesh loading mechanism
2. Load /static/models/chicken.glb instead of car GLB
3. PhysicalVehicle stays IDENTICAL. Chicken slides like a puck using same rigid body.
4. Procedural animations per PRD §6.3:
   a. Head bob: rotate `head` submesh on X-axis based on acceleration + idle sine
   b. Wing flap: rotate `wing_l` and `wing_r` when jumping, airborne, or speed > threshold
5. Hide wheel visual meshes (keep physics colliders)
6. Adjust camera target offset for chicken height
7. Run npm run dev and report observations in plain language

DO NOT:
- Tune physics values
- Remove wheel colliders
- Add skeletal animation or IK
- Load animations from the GLB (there are none; procedural only)

If submesh names don't match (`head`, `wing_l`, `wing_r`, `body`), propose fix and ASK before implementing. Do not rename inside code; flag it for Jasraaj to fix in Blender.

Chicken material should match Bruno's vehicle material setup (likely TSL-based). Do not use generic MeshStandardMaterial if his car uses TSL. Match shader family for visual consistency in WebGPU path.
```

### Phase 4: Reward skins swap

```
Read CLAUDE.md, PRD.md §7, and ARCHITECTURE.md first.

Task:
1. Locate skin definition logic from ARCHITECTURE.md
2. Implement 6 chicken skin variants per PRD §7 as material color overrides on single chicken.glb:
   - Tandoori: deep red-orange
   - Masala: warm rust + spice-dust particles (reuse Bruno's particle system)
   - Butter: pale cream, slight gold
   - Kadai: darker brown-red, smoky
   - Flaming: white base + fire particles on head feathers (reuse particle system)
   - Abyssal: dark purple-black + glowing eyes (reuse lantern glow shader)
3. Generate 6 placeholder preview PNGs (colored chicken silhouettes) for achievements UI. Jasraaj will replace with real renders post-launch.
4. Preserve Bruno's unlock conditions exactly. Do not modify achievement unlock logic.

Do not create 6 separate GLB files. Do not modify achievement unlock logic.
```

### Phase 5: Case study zones (3-4 days)

**Before session:** Jasraaj provides all 4 case studies with headline + summary + images. Session will not start without content.

```
Read CLAUDE.md, PRD.md §8, and ARCHITECTURE.md first.

Task:
1. Audit current portfolio zones and their trigger positions
2. For each of 4 GCT case studies (Pepper Pods Instagram, Avantus, slots 3 and 4), propose:
   a. Which existing Bruno zone it replaces (based on prominence and traffic flow in the world)
   b. What 3D signage/billboard text changes (text only, don't redesign meshes)
   c. What HTML panel content appears (headline, summary, images, optional stat)
3. Produce content template I can fill per case study, then insert Jasraaj's provided copy
4. Do NOT write case study copy yourself. Use Jasraaj's content only.

Also: find "Bruno's Home" welcome zone and replace copy per PRD §4.3.

If any case study lacks images or copy at session start, flag it and skip that zone.
```

### Phase 6: Audio

```
Read CLAUDE.md, PRD.md §9.

Task:
1. Find where honk is triggered. Swap for random selection between cluck-01.mp3 and cluck-02.mp3 from /static/sounds/chicken/.
2. Replace engine rumble with soft kukdu-ku-loop.mp3 mixed at low volume (sits under music).
3. Update Behind the Scene credits with full block from PRD §9.
4. Keep music auto-play gated on user interaction (iOS requirement).
5. Confirm all audio files Jasraaj sourced are CC0 from freesound.org. If any are CC-BY, add to credits.
```

### Phase 7: Vercel deploy

```
Read CLAUDE.md.

Task: Deploy this Vite project to Vercel as a static site.
1. Confirm vite.config.js outputs to /dist
2. Add vercel.json if needed with build command and output directory
3. List env vars from .env.example that matter for production. Confirm what breaks without the server URL vars (whispers, leaderboards). Confirm graceful degradation works.
4. Give me exact Vercel CLI commands to deploy from this directory
5. Warn about asset size issues (100MB Vercel deployment limit). Suggest compression if close.
6. Produce DEPLOY.md at repo root with the deploy steps documented.

I will run the deploy myself. Do not run it for me.
```

### Phase 8: QA pass (read-only session)

```
Read CLAUDE.md and PRD.md.

Task: Full QA pass against production build.
1. Test every system: driving, jumping, zones, achievements, whispers UI (with server offline), circuit, day/night, weather, foliage, audio, all 6 skins, all 4 case study zones.
2. Test on: desktop Chrome, desktop Safari, iOS Safari (Jasraaj to provide physical device access), Android Chrome.
3. Produce QA_REPORT.md:
   a. Bugs found (severity high/med/low, file, reproduction steps)
   b. Copy errors (typos, Bruno references we missed, em dashes)
   c. Visual inconsistencies
   d. Performance issues on lower-end devices
4. DO NOT fix anything in this session. Report only.
```

### Phase 9: Fix pass

```
Read CLAUDE.md, PRD.md, and QA_REPORT.md.

Task: Fix all HIGH severity bugs. Propose fixes for MED severity and wait for Jasraaj approval. Ignore LOW for v1 (log in FUTURE.md).

After fixes, rebuild and ask Jasraaj to re-verify before v1.0 tag.
```

---

## 12. Risk register

| Risk | Mitigation |
|------|-----------|
| Chicken scale/orientation mismatch | Budget half a day in Blender for Phase 3 pre-work |
| Static mesh instead of rigged | Confirmed acceptable for puck-slide. If Jasraaj later wants walking chicken, switch to Quaternius Ultimate Animated Animals pack (CC0, rigged) |
| WebGPU shader breakage on chicken | Match chicken material to Bruno's vehicle material setup. Don't use standalone MeshStandardMaterial if he uses TSL. |
| iOS audio autoplay | Keep user-interaction intro screen intact |
| Dist folder size near 100MB Vercel limit | Run `npm run compress` after every asset addition |
| Server-dependent features break | Bruno already has graceful "server offline" UI. Verify it still renders correctly post-rebrand. |
| Case studies block Phase 5 | Phase 5 does not start without all 4 case studies ready. Blocker is on Jasraaj. |
| Bruno updates his repo upstream | We have `bruno-upstream` remote. Merge selectively if he ships bug fixes worth picking up. |

---

## 13. What's explicitly OUT of scope for v1

No matter how tempting mid-build, defer these to v2:
- Backend for whispers and leaderboards
- Custom 3D architecture changes in Bruno's Blender world file
- Original music composition
- Walk-cycle chicken with IK
- Multiplayer features
- Mobile UI redesign
- GEO / SEO structured data and llms.txt
- Contact form or email capture
- Analytics integration
- A/B testing infrastructure
- Any real CMS (Sanity, Contentful, etc.)

If any of these come up mid-build, add to `FUTURE.md` and move on.

---

## 14. Deliverables checklist (v1.0 ship criteria)

- [ ] Forked repo at `JJbuildsDS/gct-portfolio` with `bruno-upstream` remote
- [ ] CLAUDE.md and PRD.md at repo root
- [ ] ARCHITECTURE.md at repo root (from Phase 1)
- [ ] Chicken drives around the world with head-bob + wing-flap
- [ ] All 6 spice skins functional and unlocking via Bruno's achievement conditions
- [ ] 4 GCT case study zones live with real content
- [ ] All "Bruno" copy replaced with GCT copy (zero misses)
- [ ] Behind the Scene section has all 4 credit blocks (Bruno, Kounine, jeremy, Jasraaj)
- [ ] Audio swapped: cluck honk, kukdu ku engine
- [ ] Brand palette applied everywhere color appears
- [ ] Deployed to Vercel (subdomain `gct.vercel.app` minimum, custom domain if Jasraaj has one)
- [ ] QA passed on desktop Chrome, desktop Safari, iOS Safari, Android Chrome
- [ ] FUTURE.md documenting v2 scope
- [ ] Tag release as `v1.0.0` in git

---

## 15. CLAUDE.md

See `/CLAUDE.md` at repo root for the project rules Claude Code reads at every session start.

---

## 16. Still need from Jasraaj before any session runs

1. **Hex codes for red, white, beige** (e.g. `#C8252C`, `#FAF7F2`, `#E8D9B8`). Without these, Phase 2 can't run.
2. **GCT logo as SVG file**
3. **Pepper Pods Instagram case study:** 1-2 sentence description, 2-3 images, optional stat
4. **Avantus case study:** 1-2 sentence description, 2-3 images, optional stat
5. **Case study slots 3 and 4:** project names, descriptions, images
6. **Domain decision:** use `gct.vercel.app` for v1, or custom domain at launch?
7. **iOS device for QA in Phase 8** (iPhone or iPad)
8. **Blender 4.x installed?** Needed for chicken pre-work in Phase 3.

---

**End of PRD v1.0**
