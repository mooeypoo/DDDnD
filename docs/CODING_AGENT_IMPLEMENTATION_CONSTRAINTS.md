# Coding-Agent Implementation Constraints (Redesign Branch)

Date: 2026-04-01
Status: Canonical execution constraints for redesign implementation work

This file is the operational contract for coding agents working on the redesign branch.

## 1. Scope Lock

- UI-only redesign work.
- Do not change simulation/engine/domain logic.
- Do not change deterministic gameplay behavior.

## 2. Boundary Rules

- Keep strict separation between UI/presentation and simulation/domain.
- Scene selection and avatarRole assignment are UI-only concerns.
- Do not leak scene/avatar logic into domain models, content schema, or simulation rules.

## 3. Terminology Rules

Use in new work:

- playerClass
- endingType
- avatarRole

Do not introduce archetype as a new generic term.
Legacy references may remain only where already established.

## 4. Asset Rules

- Scene backgrounds and avatar mood art are presentation-only raster assets.
- UI chrome, ornamental frames/surfaces, icons, and badges should be SVG assets.
- Use individual transparent avatar mood files as implementation assets.
- Mood sheets are reference-only.

## 5. Cleanup Rules

- Delete stale docs and stale visual scaffolding tied to the rejected dashboard-like direction.
- Do not archive stale redesign docs; delete or overwrite them.
- Do not implement the full redesign in cleanup tasks.

## 6. Companion Docs

- [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)
- [docs/MVP_ASSET_PLAN.md](MVP_ASSET_PLAN.md)
