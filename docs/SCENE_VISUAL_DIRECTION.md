# Scene Visual Direction

Date: 2026-04-01
Status: Canonical art direction for current redesign baseline

## 1. Purpose

Use this document for visual direction of:

- scenario and event scene backgrounds
- stakeholder avatarRole visuals
- scene/avatar composition decisions in gameplay UI

This is presentation-only guidance.
No simulation or domain logic changes are implied.

## 2. Current Art Direction

Direction lock:

- fantasy-tech world framing
- scene-as-place composition, not dashboard composition
- readable at gameplay sizes on desktop and mobile
- expressive silhouette-first avatars with clear mood readability

Required format usage:

- Raster (PNG/WebP): scene backgrounds and avatarRole mood art.
- SVG: UI chrome, frames, icons, badges, ornaments, and effect markers.

## 3. Scene Direction

Every scene should read as a place/stage the run happens in.

Required composition traits:

- clear foreground/midground/background layers
- intentional low-detail overlay-safe zones
- restrained detail density to protect text readability
- visual hierarchy that survives compact card rendering

Known scene backdrop set already available:

- Fortified Monolith Hall
- Strategic War Room
- Archive / Library Chamber

## 4. Avatar Direction

avatarRole visuals are UI-only reusable roles.
They are not domain entities and not literal portraits of named stakeholders.

Required mood set per role:

- happy
- neutral
- concerned
- angry

Implementation asset source is individual transparent PNG mood files.
Mood sheets may exist as references only.

## 5. Explicit Anti-Goals

Do not move back toward the rejected style:

- dashboard-like data graphics
- abstract topology infographic scenes
- observability-console visual language
- text-heavy baked-in labels in scene art

## 6. Companion Docs

- [docs/MVP_ASSET_PLAN.md](MVP_ASSET_PLAN.md)
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md)
