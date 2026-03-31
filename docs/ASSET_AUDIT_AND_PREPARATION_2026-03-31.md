# Asset Audit and Preparation (2026-03-31)

Scope: SVG/artwork assets and their usage for the upcoming scene-based UI presentation model.

Canonical references:

- [AGENT.md](../AGENT.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md)
- [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md)

## Audit Summary

- Existing runtime and Storybook imports were concentrated in legacy paths under `src/assets/artwork/`.
- `src/assets/logo.svg` existed but had no active code import.
- No duplicate binary-identical SVG files existed in the original `src/assets` set.
- New canonical structure has been added under `src/assets/presentation/`.
- A centralized registry now exists at `src/ui/config/presentation_asset_registry.ts`.

## Current Relevant Assets (Source)

Public assets:

- `public/favicon.svg`
- `public/og-image.svg`
- `public/og-image.png`

Legacy presentation assets:

- `src/assets/logo.svg`
- `src/assets/artwork/archetypes/*.svg`
- `src/assets/artwork/classes/*.svg`
- `src/assets/artwork/events/*.svg`
- `src/assets/artwork/cards/*.svg`
- `src/assets/artwork/scenarios/hero.svg`

New canonical presentation assets:

- `src/assets/presentation/branding/logo_mark.svg`
- `src/assets/presentation/ui-surfaces/`
- `src/assets/presentation/scenes/scenario/default_run_scene.svg`
- `src/assets/presentation/scenes/events/*.svg`
- `src/assets/presentation/avatars/player-classes/*.svg`
- `src/assets/presentation/avatars/stakeholder-avatar-roles/`
- `src/assets/presentation/action-effect-icons/cards/*.svg`
- `src/assets/presentation/ending-visuals/*.svg`

## Classification

### Keep as-is

- `public/favicon.svg` (app/site identity)
- `public/og-image.svg` and `public/og-image.png` (sharing and metadata)
- Existing SVG artwork content itself (visual payload is still valid)

### Keep but rename/move

- `src/assets/logo.svg` -> canonical location now `src/assets/presentation/branding/logo_mark.svg`
- `src/assets/artwork/scenarios/hero.svg` -> canonical location now `src/assets/presentation/scenes/scenario/default_run_scene.svg`
- `src/assets/artwork/events/*.svg` -> canonical location now `src/assets/presentation/scenes/events/*.svg`
- `src/assets/artwork/classes/*.svg` -> canonical location now `src/assets/presentation/avatars/player-classes/*.svg`
- `src/assets/artwork/cards/*.svg` -> canonical location now `src/assets/presentation/action-effect-icons/cards/*.svg`
- `src/assets/artwork/archetypes/*.svg` -> canonical location now `src/assets/presentation/ending-visuals/*.svg`

### Obsolete/remove (candidate, deferred)

- Legacy path tree `src/assets/artwork/` after all references are migrated and validated.
- `src/assets/logo.svg` after all branding references are confirmed migrated.

No destructive deletion performed in this pass.

### Duplicate/consolidate

- Temporary duplication now exists by design between old and new roots to support safe migration.
- Consolidation target: keep only `src/assets/presentation/` once legacy references are eliminated.

### Reusable but should be repurposed

- Existing ending visual SVGs are reusable as `endingType` visuals while maintaining legacy key compatibility.
- Existing event SVGs are reusable as scene-tag assets for event-driven scene presentation.
- Existing class portraits are reusable under `playerClass` visuals.
- Existing card SVGs are reusable under action/effect/icon presentation slots.

## Structural Changes Implemented

1. Added canonical scene-based presentation asset root under `src/assets/presentation/`.
2. Seeded canonical folders with current SVG assets (copy, not move) for safe transition.
3. Added centralized registry: `src/ui/config/presentation_asset_registry.ts`.
4. Migrated active references to registry where practical:
   - `src/ui/composables/class_artwork.ts`
   - `stories/game/ActionCard.stories.ts`
   - `stories/game/EventCard.stories.ts`
   - `stories/game/ScenarioBanner.stories.ts`
   - `stories/results/OutcomePanel.stories.ts`
5. Updated canonical artwork doc with new root structure and registry policy.

## Canonical Concern Mapping

- Architecture/domain separation: [ARCHITECTURE.md](../ARCHITECTURE.md)
- UI/presentation rules and terminology: [AGENT.md](../AGENT.md), [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md)
- Storybook workflow boundaries: [docs/STORYBOOK.md](STORYBOOK.md)
- SVG/artwork rules and asset policy: [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md)

## Next Cleanup Phase (Safe Deletion Gate)

Delete legacy files only after these checks pass:

1. No imports remain from `@/assets/artwork/` or `src/assets/logo.svg`.
2. Storybook stories load all artwork through registry references.
3. App runtime rendering for playerClass visuals and related artwork remains intact.
4. Documentation references are updated to canonical `src/assets/presentation/` structure.
