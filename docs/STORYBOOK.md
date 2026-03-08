# Storybook in DDDnD

Storybook is set up in this repository as a **development/design tool only**.

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

## Runtime separation

Storybook dependencies are in `devDependencies` and Storybook scripts are independent from app runtime scripts (`dev`, `build`, `preview`).
