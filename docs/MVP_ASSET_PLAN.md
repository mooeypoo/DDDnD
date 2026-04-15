# MVP Asset Plan

Date: 2026-04-01
Status: Canonical current asset strategy for redesign branch

This document defines the production truth for redesign assets and implementation constraints.

## 1. Asset Strategy

Format selection is by purpose:

- Raster (PNG/WebP): scene backgrounds and stakeholder avatarRole mood art.
- SVG: UI chrome, frames, icons, badges, ornaments, and ornamental surfaces.

Hard rule: scene and avatar logic are presentation-only and must remain UI-owned.

## 2. Current Production Art Direction Inputs

Known raster scene backgrounds already available:

- Fortified Monolith Hall
- Strategic War Room
- Archive / Library Chamber

Known raster avatar input already available:

- individual transparent PNG files per avatar role
- mood coverage: happy, neutral, concerned, angry
- mood sheets may exist but are reference-only, not implementation assets

## 3. Registry and Folder Targets

Canonical presentation root:

- src/assets/presentation/

Target subpaths:

- scenes/scenario/ and scenes/events/ for raster scene assets
- avatars/stakeholder-avatar-roles/ for raster avatarRole assets
- ui-surfaces/, action-effect-icons/, and related chrome folders for SVG assets

## 4. Naming and Integration Rules

- Use snake_case file names.
- Keep registry keys extension-agnostic.
- Keep all asset resolution in UI config/composables.
- Do not place asset-path logic in simulation/domain/content modules.

Terminology in docs and new code:

- playerClass
- endingType
- avatarRole

## 5. Explicitly Not In Scope Here

- full redesign implementation
- engine/simulation behavior changes
- domain/content schema rewrites

## 6. Companion Docs

- [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md)
