# Storybook in DDDnD

Storybook is set up in this repository as a **development/design tool only**.

Canonical companions:

- [AGENT.md](../AGENT.md) for required reading and task routing
- [ARCHITECTURE.md](../ARCHITECTURE.md) for domain boundaries
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md) for presentation roadmap
- [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md) for SVG/artwork constraints

## Purpose

Use Storybook for:

- isolated UI component exploration
- mock game states and visual iteration
- refining information hierarchy and tabletop/DM-console presentation

Storybook is **not** part of gameplay rules and is **not** part of the deployed runtime bundle.

## Commands

- `npm run storybook` – run Storybook locally
- `npm run build-storybook` – produce a static Storybook build artifact

## Organization

- `.storybook/` – Storybook configuration
- `stories/` – Story files grouped by Foundations/Game/Results/Overlays
- `stories/mocks/` – typed mock state for visual iteration

## Boundaries

- Keep simulation logic in `src/domains/simulation`
- Keep Storybook stories presentational and mock-driven
- Avoid router/store/engine coupling in stories unless explicitly needed
- Keep scene selection, `avatarRole` assignment, and ending presentation labels as UI concerns only
- Use approved presentation terms in new stories/docs: `playerClass`, `endingType`, `avatarRole`
- Avoid introducing new generic `archetype` terminology in Storybook-facing documentation

## Runtime separation

Storybook dependencies are in `devDependencies` and Storybook scripts are independent from app runtime scripts (`dev`, `build`, `preview`).
