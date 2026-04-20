# DEPLOY.md — Vercel deployment runbook for GCT Portfolio

This is the step-by-step for shipping `gct-portfolio` to Vercel. Run-through
assumes you're doing the first-ever deploy; repeat deploys are just a push.

---

## 0. Prereqs

- GitHub account (the repo lives at `github.com/JJbuildsDS/gct-portfolio` per
  Phase 0, but the remote hasn't been pushed yet — see §1).
- Vercel account (free hobby plan is fine for v1).
- Node 20.x or later locally (Vite 7 requires ≥ 18, Vercel's default is 20).

---

## 1. Push the repo to GitHub

The repo is currently only local. Before Vercel can pull it:

```bash
cd /Users/jasraajpuri/projects/gct-portfolio

# Confirm the remote is set (Phase 0 wired this up but never pushed)
git remote -v

# If origin isn't JJbuildsDS/gct-portfolio, fix it:
# git remote set-url origin https://github.com/JJbuildsDS/gct-portfolio.git

# Also make sure your local git identity isn't the placeholder from Phase 0:
git config user.email   # should be jasraajp@gmail.com, NOT "you@example.com"
git config user.name    # should be "Jasraaj Puri"

# If those are wrong:
# git config user.email "jasraajp@gmail.com"
# git config user.name  "Jasraaj Puri"

git push -u origin main
```

If GitHub asks for auth, use a personal access token or install `gh` CLI
(`brew install gh && gh auth login`).

---

## 2. Import the project into Vercel

1. Go to https://vercel.com/new
2. "Import Git Repository" → pick `JJbuildsDS/gct-portfolio`
3. Vercel will auto-detect Vite from `vercel.json`. Confirm these settings:
   - **Framework Preset:** Vite (auto-filled)
   - **Root Directory:** `.` (repo root — NOT `sources/`)
   - **Build Command:** `npm run build` (from vercel.json)
   - **Output Directory:** `dist` (from vercel.json)
   - **Install Command:** `npm install` (from vercel.json)
   - **Node.js Version:** 20.x (Vercel default)
4. **Environment Variables** — add these in the Vercel dashboard BEFORE
   first deploy. They're all optional for gameplay but affect behavior. See
   `.env.example` for the full list; the ones worth thinking about:

   | Var                      | Recommended value | Notes                                                                 |
   |--------------------------|-------------------|-----------------------------------------------------------------------|
   | `VITE_SERVER_URL`        | *(leave empty)*   | Multiplayer websocket. Empty = offline-only. Phase 1 decision: skip.  |
   | `VITE_ANALYTICS_TAG`     | *(leave empty)*   | Plausible / GA tag. Add in v2 once you pick a provider.               |
   | `VITE_GAME_PUBLIC`       | `1`               | Exposes the game to users (if unset, the splash blocks entry).        |
   | `VITE_COMPRESSED`        | `1`               | Serve KTX2-compressed textures. Bruno's defaults assume this is on.   |
   | `VITE_MUSIC`             | `1`               | Background music plays when the user clicks through.                  |
   | `VITE_LOG`               | `0`               | Turn off the ASCII-art devtools easter egg in production.             |
   | `VITE_WHISPERS_COUNT`    | `30`              | Leave at default.                                                     |

   Leave all other `VITE_*` vars unset for launch — they're debug/dev-only.

5. Click **Deploy**.

First build takes ~3–5 min (installing Rapier, GLTF transform, sharp — big
deps). Subsequent deploys are ~1 min from the warm cache.

---

## 3. Custom domain (optional, v2)

Skip for v1 — the `*.vercel.app` URL is fine for launch.

When you do hook up `garlicchickentikka.com` (or whatever the brand domain
becomes):

1. Vercel dashboard → Project → Settings → Domains → Add
2. Add an A record `@` → `76.76.21.21` at your registrar
3. Add a CNAME `www` → `cname.vercel-dns.com`
4. Vercel auto-issues SSL via Let's Encrypt

---

## 4. What Vercel does with the Vite build

`npm run build` runs `vite build --mode production` which:

- Reads `sources/index.html` as entry
- Bundles all JS from `sources/**` (including the Three.js scene,
  physics, audio, input layers)
- Copies `static/**` → `dist/` as-is (this is where `chicken.glb`,
  all textures, audio, fonts, UI images live)
- Outputs the final site to `dist/` at the repo root

The `vercel.json` in this repo tells Vercel:

- Cache all hashed asset files (`/assets/*`), models, sounds, UI PNGs,
  KTX2 textures, and the Rapier `.wasm` file for 1 year with `immutable`.
- Never cache `index.html` — always re-fetch on navigation so a new deploy
  is picked up immediately.
- Set `Content-Type: application/wasm` on the Rapier WASM blob (Vercel does
  this by default but explicit is safer).

---

## 5. Post-deploy smoke test

Hit the live URL and check:

1. Loading screen shows "GCT — Garlic Chicken Tikka" (not "Bruno's").
2. Click-through → intro pedestal renders with the chicken model (not
   Bruno's car).
3. Press WASD / arrows → chicken moves, chassis physics follows.
4. Press H → one-shot cluck (currently Bruno's horn as placeholder — see
   `AUDIO_TODO.md`).
5. DevTools console — no `Audio > Load error`, no Three.js / Rapier
   exceptions, no 404s on `.glb`, `.ktx2`, `.wasm`, or `.mp3` files.
6. Open `view-source:<url>` — `<title>GCT — Garlic Chicken Tikka</title>`
   visible in the raw HTML (important for SEO + social shares).
7. Paste the URL into a Slack/Discord preview → the OG image + description
   should read GCT, not Bruno. OG image is `static/ui/open-graph.jpg`
   which is still Bruno's shot — swap in v2 (see FUTURE.md).

---

## 6. Rollback

Vercel keeps the last N deploys. If a push breaks prod:

- Vercel dashboard → Project → Deployments → find last known-good →
  three-dot menu → "Promote to Production".

Zero-downtime swap.

---

## 7. Known gotchas

- **Big bundle first load.** Rapier WASM is ~1MB, Three.js is ~700KB, plus
  textures. First-load is noticeable on mobile. Vercel serves HTTP/2 with
  gzip+brotli automatically, so gains are already in. Lighthouse TTI
  won't be great — that's the nature of a 3D site. Document in FUTURE.md
  if you want to bite off code-splitting in v2.

- **Sharp dependency can fail on Vercel build.** It's used by the
  `scripts/compress.js` pipeline, NOT by runtime. If the Vercel build
  chokes on `sharp` binaries, you can safely `npm uninstall sharp` — it's
  only needed locally when regenerating compressed textures.

- **`VITE_COMPRESSED=1` requires pre-compressed textures shipped in
  `static/`.** Bruno's repo ships them committed. As long as you haven't
  purged `static/` of `.ktx2` files, you're fine.

- **CORS / WASM MIME.** If Rapier ever throws
  `LinkError: WebAssembly.instantiate(): ...`, check response headers on
  the `.wasm` file. `vercel.json` already forces the MIME — this should
  be a non-issue.
