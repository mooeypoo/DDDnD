# UI Presentation Redesign Baseline

Date: 2026-04-01
Status: Active baseline for pre-release UI redesign

This is the canonical screen-composition and scope document for the redesign branch.
It replaces exploratory direction and migration-phase planning docs.

## 1. Scope Lock

In scope:

- UI shell replacement across run setup, gameplay, overlays/modals, and results.
- Presentation asset integration and UI composition updates.
- Desktop and mobile behavior.

Out of scope:

- Simulation/domain rules.
- Content schema/versioning changes.
- Persistence/reporting behavior changes.

## 2. Required Terms

Use these terms in new work:

- playerClass = player-selected class at scenario start.
- endingType = end-of-run outcome classification.
- avatarRole = UI-only fantasy visual role for stakeholders.

Do not use archetype as a new generic term.

## 3. Screen Composition Direction

Gameplay composition direction:

- Scene-first layout, not dashboard/panel-first layout.
- One active backdrop per run context (scenario-level or event-level).
- Overlay-safe regions preserved for gameplay text, cards, meters, and controls.
- Stakeholder avatar presentation is expressive but secondary to gameplay readability.

Information hierarchy direction:

- Primary: decision context and actions.
- Secondary: stakeholder mood/readability and scene atmosphere.
- Tertiary: decorative chrome and ornaments.

## 4. UI Ownership Boundaries

- Scene selection logic is UI-only.
- Stakeholder to avatarRole mapping is UI-only.
- endingType display mapping is UI-only.
- Stakeholder/domain entities remain content-driven and unchanged.

No scene/avatar logic may leak into simulation/domain code.

## 5. Canonical Companion Docs

- [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md)
- [docs/MVP_ASSET_PLAN.md](MVP_ASSET_PLAN.md)
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md)
- [docs/STORYBOOK.md](STORYBOOK.md)
