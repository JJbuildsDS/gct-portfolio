# GCT Portfolio — Project Rules for Claude Code

## Project Identity
Fork of brunosimon/folio-2025 (MIT licensed), rebranded for Garlic Chicken Tikka.
Creative agency: content strategy, social media, email marketing.
Tagline: "The masala your brand needs"
NOT rebuilding from scratch. Job: swap car for chicken, reskin content, retheme.

## Non-Negotiables
- Preserve Bruno's MIT license. Add GCT copyright alongside.
- Credit Bruno Simon, jeremy (chicken model, CC-BY), Kounine (music, CC0).
- Chicken movement: hybrid puck-slide. Use Bruno's existing vehicle physics body
  unchanged. Procedural head-bob and wing-flap only. No skeletal animation or IK.
  Chicken model is a static mesh with no baked animations.
- No em dashes. Use commas, periods, colons, semicolons.
- Brand palette: red, white, beige only. Source all colors from /lib/brand.js.
- Preserve WebGL + WebGPU dual rendering.
- Preserve all existing systems (weather, day/night, foliage, whispers, circuit,
  achievements). V1 ships with server-offline UI where applicable.

## Architecture Boundaries
- Game loop has 14 ordered phases. Never reorder.
- VisualVehicle is where we modify most. PhysicalVehicle stays untouched.
- Follow Bruno's patterns: lowercase folders, class-based modules, no React, Stylus.
- Chicken material matches Bruno's vehicle material setup (likely TSL-based).

## Style Rules
- No em dashes
- Reference /lib/brand.js for all colors
- Preserve Amatic SC + Nunito fonts

## When in doubt
STOP and ASK. Don't guess coordinates, copy, colors, or case study assignments.
If a value is missing from PRD.md, flag it instead of filling it in.

## Deployment
Vercel. Static export via Vite. No Next.js conversion.

## Never do
- Refactor physics
- Modernize to React or Next.js
- Remove WebGPU path
- Delete Bruno's Blender files in /resources
- Modify whispers or leaderboard server expectations
- Use raw hex codes outside /lib/brand.js
- Add em dashes
- Try to animate the chicken with skeletal animation or IK
