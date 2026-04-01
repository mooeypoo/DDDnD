# AGENT.md

This document is the entry point for routing and operational rules for all human and AI work in this repository.

Use this file to decide what to read first, what boundaries apply, and which canonical docs control each task.

---

# Required Reading Structure

## Required for all work (read first)

1. [AGENT.md](AGENT.md)
2. [ARCHITECTURE.md](ARCHITECTURE.md)
3. [GAME_DESIGN.md](GAME_DESIGN.md)
4. [CONTENT_SCHEMA.md](CONTENT_SCHEMA.md)
5. [CONTENT_VERSIONING.md](CONTENT_VERSIONING.md)

These are the base architecture and behavior documents. If guidance conflicts, architecture boundaries and determinism requirements take priority.

## Task-based additional reading

Read these on top of the base set when applicable.

### UI / presentation work

- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](docs/UI_PRESENTATION_REDESIGN_PLAN.md)
- [docs/SCENE_VISUAL_DIRECTION.md](docs/SCENE_VISUAL_DIRECTION.md) — canonical visual direction for scene composition and stakeholder avatarRole art direction
- [docs/MVP_ASSET_PLAN.md](docs/MVP_ASSET_PLAN.md)
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md)
- [docs/QUEST_SELECTION_IMPLEMENTATION.md](docs/QUEST_SELECTION_IMPLEMENTATION.md)

### Asset / artwork work (hybrid raster + SVG)

- [docs/MVP_ASSET_PLAN.md](docs/MVP_ASSET_PLAN.md) — canonical strategy for raster scene/avatar assets and SVG chrome split
- [docs/SCENE_VISUAL_DIRECTION.md](docs/SCENE_VISUAL_DIRECTION.md) — canonical scene/avatar art direction and anti-goals
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](docs/UI_PRESENTATION_REDESIGN_PLAN.md)
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md)

### Storybook / UI prototyping work

- [docs/STORYBOOK.md](docs/STORYBOOK.md)
- [docs/SCENE_VISUAL_DIRECTION.md](docs/SCENE_VISUAL_DIRECTION.md) (if story visual direction, scene composition, or `avatarRole` presentation is touched)
- [docs/MVP_ASSET_PLAN.md](docs/MVP_ASSET_PLAN.md) (if visuals/artwork are touched)
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](docs/UI_PRESENTATION_REDESIGN_PLAN.md) (if presentation direction is touched)
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md)

### Content / schema work

- [CONTENT_SCHEMA.md](CONTENT_SCHEMA.md)
- [CONTENT_VERSIONING.md](CONTENT_VERSIONING.md)
- [ARCHITECTURE.md](ARCHITECTURE.md) (content validation boundary)

---

# Non-Negotiable Architecture Rules

## Simulation must be UI-agnostic

The simulation domain must not import Vue, Pinia, browser APIs, localStorage, or DOM APIs.

Simulation depends on validated content (`scenario_bundle`), `game_state`, and pure deterministic rule logic.

## UI must not implement gameplay rules

UI code may call the engine and present results.

UI code must not implement action resolution, event selection, stakeholder rule logic, or outcome classification logic.

## Presentation model boundaries are UI-only

Scene selection, avatar role assignment, and presentation concepts are UI-layer concerns only.

They must not leak into simulation/domain logic, content validation logic, or persistence behavior.

Stakeholders remain domain/content entities from JSON; presentation assignment is view-model logic.

## Persistence and reporting are non-authoritative for gameplay

Persistence serializes/deserializes and reporting summarizes outputs.

Neither may change simulation behavior.

---

# Terminology Guidance (Required)

For new work, use:

- `playerClass` for player-selected class at scenario start
- `endingType` for end-of-run outcome classification in presentation/context where this naming applies
- `avatarRole` for UI-only fantasy visual role assigned to stakeholders

Do not use `archetype` generically in new work.

Legacy references may remain where already established, but do not expand that terminology in new implementation.

---

# Asset Format Rules

Asset work must follow [docs/MVP_ASSET_PLAN.md](docs/MVP_ASSET_PLAN.md).

Hybrid strategy for new presentation work:

- Use PNG/WebP for illustrative scene backdrops and stakeholder `avatarRole` character/state art.
- Use SVG for UI surfaces, frames, icons, badges, reusable ornaments, and simple effect markers.
- Choose format by purpose: raster for atmosphere/composition-heavy illustration, SVG for reusable interface/chrome structure.

Required practices:

- Keep asset metadata and references in UI-owned presentation layers.
- Centralize asset references through existing UI mapping/config patterns instead of ad hoc per-component paths.
- Remove or consolidate obsolete assets when safe and when no active references remain.
- Keep simulation/domain/content files free of presentation asset paths.

---

# Content and Versioning Rules

Content JSON must stay human-readable, snake_case, and versioned per [CONTENT_SCHEMA.md](CONTENT_SCHEMA.md) and [CONTENT_VERSIONING.md](CONTENT_VERSIONING.md).

When a change affects gameplay behavior, create a new content version instead of mutating prior released behavior.

Raw JSON is untrusted until validated; simulation must operate on validated typed objects only.

---

# Testing and Change Discipline

- Preserve determinism: same seed + same scenario bundle + same action sequence => same run result.
- Do not change tests only to force passing status.
- If test expectations change, document what changed and which architectural/game rule justifies it.
- Avoid unrelated refactors while addressing a task.

---

# Working Style Expectations

- Read required docs before edits.
- Work in one domain boundary at a time.
- Prefer clarity over clever abstraction.
- Keep this file concise; add detail to canonical docs rather than duplicating rules here.

---

# Final Principle

Clarity and boundary integrity are more important than convenience.