# FUTURE.md — GCT Portfolio v2 Parking Lot

Everything here was explicitly deferred from v1. Do not implement mid-build.
Open a new phase/milestone after v1.0 ships.

## Backend features
- Whispers: real-time messages from other visitors (requires server)
- Leaderboard: driving stats, distance records (requires server)

## Chicken upgrades
- Walk-cycle with IK (use Quaternius Ultimate Animated Animals pack, CC0, rigged)
- Physics tuning for "more chicken-y" feel once puck-slide is validated with users

## World upgrades
- Custom 3D architecture edits in Bruno's Blender world file
- Additional zones if case study count grows past 4

## Audio
- Original music composition (replace Kounine tracks with commissioned GCT music)

## Platform
- Mobile UI redesign (touch controls, responsive HUD)
- Multiplayer features

## Content ops
- CMS integration (Sanity or similar) for case study editing without deploys
- Contact form or email capture in-world

## Distribution
- GEO / SEO structured data and llms.txt
- Analytics integration (Plausible or GA4)
- A/B testing infrastructure
- Custom domain (post-v1 if not configured at launch)

## Skin upgrades
- Commissioned rendered skin preview images (replace v1 placeholder PNGs)

## Repo hygiene
- **Purge Blender backup bloat from git history.** Bruno's upstream commits
  contain multiple 50 MB `resources/folio-2025.blend1` snapshots, triggering
  GitHub's large-file warning (soft; 50 MB is the recommended ceiling, hard
  limit is 100 MB). Push works but every clone pulls ~150 MB of redundant
  blend backups. Fix with `git filter-repo` or BFG Repo-Cleaner:
  ```bash
  brew install git-filter-repo
  cd /Users/jasraajpuri/projects/gct-portfolio
  git filter-repo --path resources/folio-2025.blend1 --invert-paths
  git push --force origin main
  ```
  Trade-off: rewriting history diverges the GCT fork from Bruno's upstream
  hash chain, so `bruno-upstream` remote fetches will show phantom
  divergence and clean rebases against Bruno's future updates become harder.
  Only do this if (a) clone size becomes an actual pain point or (b) you've
  decided you'll never merge Bruno's upstream changes again.
- Add `resources/*.blend1` to `.gitignore` going forward so new Blender
  backups don't re-enter the repo regardless of history decision.
