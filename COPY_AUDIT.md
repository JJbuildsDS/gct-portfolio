# COPY_AUDIT.md — Bruno-reference replacement audit

This file lists every Bruno-identity reference found in the codebase and shows what was swapped vs. what still needs input from Jasraaj.

**Scope rule (per feedback 2026-04-20):** Project zone content (case studies, Three.js Journey listing, etc.) is OUT of scope for v1. Only chrome and identity references are swapped. See [PRD.md §8](./PRD.md).

---

## ✅ Swapped in Phase 4 (skin gradients)

Skin colors now map to spice-themed GCT palette. **Internal keys unchanged** to preserve the 3-layer coupling (HTML `data-name` ↔ `paints.choices` key ↔ `localStorage['achievementsReward']`).

| Internal key | Display name | Gradient A → B | File |
|--------------|--------------|----------------|------|
| `red`        | Tandoori     | `#E63946 → #7A1F1F` | `sources/Game/Materials.js:33` |
| `orange`     | Masala       | `#F4A13C → #7A3A10` | `sources/Game/World/VisualVehicle.js:139` |
| `white`      | Butter       | `#FAF1D4 → #C9A96A` | `sources/Game/World/VisualVehicle.js:140` |
| `black`      | Kadai        | `#4A2817 → #1A0D08` | `sources/Game/World/VisualVehicle.js:141` |
| `flames`     | Flaming      | TSL shader unchanged (inherits base from `redGradient`) | `sources/Game/World/VisualVehicle.js:142-185` |
| `abyssal`    | Abyssal      | TSL shader unchanged | `sources/Game/World/VisualVehicle.js:187-223` |

**TODO for Jasraaj (post-launch):**
- The achievements panel swatch images (`static/ui/achievements/rewards/*.webp`) are static PNGs from Bruno's build and still show the old red→purple etc. thumbnails. Re-render or regenerate them to match the new spice palette so the UI preview matches the on-chicken paint.
- The skin tooltip in the HTML currently reads "Unlock at {threshold}" (it's gated by play time, not a name). If you want the spice name visible, add a display label next to the swatch in `sources/index.html:521-562`.

---

## ✅ Swapped in Phase 2

| File | Line | Before | After |
|------|------|--------|-------|
| `sources/index.html` | 6 | `<title>Bruno's</title>` | `<title>GCT — Garlic Chicken Tikka</title>` |
| `sources/index.html` | 8 | `Bruno Simon's creative portfolio` | GCT tagline/description |
| `sources/index.html` | 10-12 | itemprop name/description/image | GCT equivalents |
| `sources/index.html` | 15-17 | twitter:* | GCT equivalents |
| `sources/index.html` | 19-24 | og:* | GCT equivalents |
| `sources/index.html` | 36 | apple-mobile-web-app-title "Bruno's" | "GCT" |
| `sources/index.html` | 227-231 | Landing modal "Bruno's Home" copy | GCT welcome copy |
| `sources/index.html` | 685-688 | Behind the Scene intro | GCT fork intro + Bruno credit |
| `sources/index.html` | 728 | `— Bruno` signoff | `— GCT, reskin by Jasraaj Puri` + chicken credit |
| `package.json` | 2, 12-14 | Bruno package metadata | GCT metadata |

---

## ⚠️ Still referencing Bruno — intentional (credit preserved)

These are credit/attribution references and MUST stay per PRD §2 (preserve Bruno's MIT license and credit):

| File | Line | Reference |
|------|------|-----------|
| `sources/index.html` | 687 | `<a href="https://bruno-simon.com">Bruno Simon</a>` in Behind the Scene intro |
| `sources/index.html` | 709 | Link to `github.com/brunosimon/folio-2025` in Source code section |
| `sources/index.html` | 717 | Link to `github.com/brunosimon/folio-2025/...musics` |

---

## ⏭️ Still referencing Bruno — Jasraaj to fill before launch

These are identity data files Jasraaj needs to replace with GCT handles. Left untouched because GCT's handles weren't provided in Phase 0.

### `sources/data/social.js` — all 9 lines

Current values point to Bruno's accounts:
- `x.com/bruno_simon`
- `bsky.app/profile/bruno-simon.bsky.social`
- `youtube.com/@BrunoSimon`
- `mailto:simon.bruno.77@gmail.com`
- `twitch.tv/bruno_simon_dev`
- `github.com/brunosimon`
- `linkedin.com/in/simonbruno77`
- Discord modal

**Action needed:** replace each `url` with GCT's actual social handle, or remove the entry if GCT doesn't have that platform. The Discord entry points at a modal hard-coded in `sources/index.html` — if keeping, update the modal contents; if removing, delete this entry.

### `sources/data/consoleLog.js` — ASCII art easter egg (lines 26-58)

Prints Bruno's socials to the browser devtools console on load. Same action as social.js — swap URLs for GCT's, or strip entries not applicable. Keep the ASCII art format.

### Bruno's Three.js Journey listings and devlog links

Found at `sources/index.html:697-710` (Three.js Journey course promo) and `sources/index.html:704` (devlog YouTube playlist). These sit inside Bruno's Behind the Scene content — they're part of his tutorial credentials, not GCT's. Since Behind the Scene now OPENS with a clear "this is a fork of Bruno's work" credit, leaving Bruno's tutorials in context makes the attribution honest. **Recommend leaving as-is.** If Jasraaj wants them out, strip lines 696-705 and 713-718 post-launch.

---

## 🚫 Not touched — out of v1 scope (deferred)

Per the case-study-deferral decision, these data files stay UNTOUCHED in v1:

- `sources/data/projects.js` — Three.js Journey + other Bruno projects
- `sources/data/lab.js` — Bruno's Lab area content
- Project images in `static/projects/`, `static/lab/`

Jasraaj will swap these to GCT case studies post-launch. See [PRD.md §8](./PRD.md).

---

## How to finish this audit

1. Collect GCT's real social handles (X, Instagram, LinkedIn, YouTube, email, etc.).
2. Edit `sources/data/social.js` — replace Bruno's URLs with GCT's. Remove entries for platforms GCT doesn't use.
3. Edit `sources/data/consoleLog.js` lines 26-58 — same swap.
4. Verify: grep `-ri "bruno"` over `sources/` and `static/ui/` — only Behind the Scene credits should remain.
