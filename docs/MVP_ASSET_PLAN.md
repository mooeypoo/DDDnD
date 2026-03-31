# MVP Asset Plan

Date: 2026-03-31
Status: Approved for implementation planning (no asset generation in this document)

This document defines the concrete initial MVP asset batch for the UI presentation redesign under the approved hybrid raster/SVG strategy.
It is scoped to unblock Storybook validation and the first playable vertical slice without overproducing assets.

Canonical companions:

- [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md) — hybrid format policy, naming, placement, registry workflow
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md) — redesign phase coordination
- [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md) — fantasy-tech visual direction and anti-goals
- [docs/MVP_CONCEPT_ART_PACKET.md](MVP_CONCEPT_ART_PACKET.md) — concept gate and posture/expression matrix requirements
- [AGENT.md](../AGENT.md) — routing and architecture boundaries

Implementation prerequisite:

- Complete and approve [docs/MVP_CONCEPT_ART_PACKET.md](MVP_CONCEPT_ART_PACKET.md) before creating final implementation assets.

---

## 1. Scope and MVP Target

### In scope for this plan

- Scene backdrops for scenario and event presentation surfaces.
- Stakeholder `avatarRole` character/state asset set with required mood coverage.
- Shared UI surface assets for the redesigned presentation language.
- Minimal SVG icons/effect markers required to support readability and reactive cues.

### Explicitly out of scope

- `playerClass` portraits (already complete).
- `endingType` visual production pass (scheduled later).
- Gameplay or simulation logic changes.
- Tutorial asset expansion.

### Style direction lock (all categories)

- Fantasy-tech.
- Pixel-adventure-inspired.
- Readable in browser UI at small and medium sizes.
- Scene-based composition, not corporate/dashboard-like diagrams.
- Expressive at small sizes.
- Suitable for dynamic actor placement and overlay-safe UI.
- Clean and reusable for implementation.

---

## 2. Hybrid Format Classification

Use this default format model for MVP unless a specific exception is documented in this file.

### Raster (PNG/WebP; WebP preferred)

- Scenario scene backdrops.
- Event scene backdrops.
- Stakeholder `avatarRole` character/state art.
- Any other illustrative scenic/character artwork added during this MVP pass.

### SVG

- UI surfaces and frames.
- Icons.
- Badges.
- Reusable ornaments.
- Simple effect markers.

No exceptions are defined for the MVP batch in this plan.

---

## 3. Initial Scene Set for MVP

Recommended practical count for MVP: **9 raster scene assets**.

- 5 scenario atmosphere scenes (`800x200`) for run-level backdrops.
- 4 event scenes (`320x180`) for event/card surfaces, including a generic fallback.

### Scenario scene backdrops (raster)

Path: `src/assets/presentation/scenes/scenario/`
Canvas: `800x200`
Format: `.webp` preferred (`.png` fallback acceptable)

| File | Type | Atmosphere tag | Primary use |
|---|---|---|---|
| `default_run_scene.webp` | Scenario fallback | `generic` | Unknown or untagged scenario IDs |
| `legacy_architecture.webp` | Scenario specific | `legacy` | `monolith_of_mild_despair` |
| `distributed_chaos.webp` | Scenario specific | `distributed` | `microservice_sprawl` |
| `hypergrowth_velocity.webp` | Scenario specific | `hypergrowth` | `startup_hypergrowth` |
| `compliance_pressure.webp` | Scenario specific | `compliance` | `compliance_gauntlet` |

### Event scene backdrops (raster)

Path: `src/assets/presentation/scenes/events/`
Canvas: `320x180`
Format: `.webp` preferred (`.png` fallback acceptable)

| File | Type | Event tag | Primary use |
|---|---|---|---|
| `system_incident.webp` | Event specific | `system_incident` | Incident and fault events |
| `audit_pressure.webp` | Event specific | `audit_pressure` | Compliance and audit events |
| `scaling_crisis.webp` | Event specific | `scaling_crisis` | Throughput/load pressure events |
| `generic_disruption.webp` | Event fallback | `generic` | Unknown/custom event tags |

Scene composition requirements:

- Place/stage composition with clear foreground/midground/background.
- Overlay-safe negative space for cards, labels, and meters.
- Readable at 200px height (scenario) and 90px height (event card frame).
- No text-heavy labels that duplicate UI content.

---

## 4. Initial `avatarRole` Set for MVP

Recommended practical count for MVP: **6 `avatarRole` identities**.

Rationale: six roles reduce visible repetition in stakeholder casting and align with the concept packet baseline.

Path: `src/assets/presentation/avatars/stakeholder-avatar-roles/`
Runtime canvas target: `80x80` (source may be authored at higher resolution)
Format: `.webp` preferred (`.png` fallback acceptable)

### Role IDs

- `oracle`
- `chronicler`
- `warden`
- `artificer`
- `chancellor`
- `envoy`

### Required state coverage per `avatarRole`

Every role requires all four states in MVP:

- supportive
- neutral
- concerned
- upset

Filename convention per role:

- neutral: `{role_id}.webp`
- supportive: `{role_id}_supportive.webp`
- concerned: `{role_id}_concerned.webp`
- upset: `{role_id}_upset.webp`

Example set for `oracle`:

- `oracle.webp`
- `oracle_supportive.webp`
- `oracle_concerned.webp`
- `oracle_upset.webp`

Total planned `avatarRole` files for MVP: **24 raster files** (6 roles × 4 states).

Avatar readability and expression requirements:

- Preserve role identity across all states.
- Change posture/expression first; avoid costume replacement.
- Keep silhouettes recognizable at 40x40 circular thumbnail size.
- Maintain clean contrast on `#0b0e1a` background.

---

## 5. Shared UI Surface Assets (SVG)

Recommended practical count for MVP: **4 SVG surface assets**.

Path: `src/assets/presentation/ui-surfaces/`
Format: `.svg`

| File | Purpose | ViewBox |
|---|---|---|
| `card_frame_corner.svg` | Rotatable corner bracket primitive for cards/panels | `0 0 24 24` |
| `panel_divider.svg` | Section separator line with blueprint ticks | `0 0 320 8` |
| `scene_label_plate.svg` | Small frame plate behind short runtime labels/chips | `0 0 120 24` |
| `avatar_state_ring.svg` | Reusable circular ring ornament around avatar thumbnails | `0 0 88 88` |

Surface design constraints:

- Decorative only; never required for gameplay readability.
- Reusable, transform-safe, low visual noise.
- Must remain legible on desktop and mobile.

---

## 6. MVP Icons and Effect Markers (SVG)

Recommended practical count for MVP: **6 SVG micro-assets**.

Path roots:

- `src/assets/presentation/action-effect-icons/icons/`
- `src/assets/presentation/action-effect-icons/effects/`

Format: `.svg`

### Icon set (interface cues)

- `state_supportive.svg`
- `state_neutral.svg`
- `state_concerned.svg`
- `state_upset.svg`

### Effect markers (simple overlay cues)

- `signal_ping.svg`
- `stress_crack.svg`

Usage intent:

- State icons can accompany compact stakeholder indicators.
- Effect markers provide simple, reusable overlays without introducing heavy illustration assets.

---

## 7. Folder Placement and Naming Summary

All filenames are `snake_case`, and registry keys remain extension-agnostic.

### Raster assets

- `src/assets/presentation/scenes/scenario/*.webp`
- `src/assets/presentation/scenes/events/*.webp`
- `src/assets/presentation/avatars/stakeholder-avatar-roles/*.webp`

### SVG assets

- `src/assets/presentation/ui-surfaces/*.svg`
- `src/assets/presentation/action-effect-icons/icons/*.svg`
- `src/assets/presentation/action-effect-icons/effects/*.svg`

State suffix policy for `avatarRole`:

- base: no suffix (`neutral`)
- `_supportive`
- `_concerned`
- `_upset`

---

## 8. Practical MVP Slice Recommendation

To unblock Storybook and the first playable vertical slice without overproduction, implement in this order:

1. **Scene core (9 raster files)**
2. **`avatarRole` core for 6 roles × neutral only (6 raster files)**
3. **Shared UI surface core (4 SVG files)**
4. **State expansion for `avatarRole` (18 raster files: supportive/concerned/upset)**
5. **Icons/effect markers (6 SVG files)**

This sequence enables early UI validation fast, then adds expressive depth.

---

## 9. Registry and Integration Notes (UI-only)

- Keep all mapping and state resolution in UI-layer config/composables.
- Do not add presentation references to simulation/domain/content files.
- Import paths may vary by extension, but registry keys stay stable (`default_run_scene`, `oracle`, etc.).
- For `avatarRole` states, composable logic appends suffixes (`_supportive`, `_concerned`, `_upset`) and falls back to base role file when needed.

No gameplay or simulation behavior changes are authorized by this plan.
