# DDDnD - Domain-Driven Design & Dragons

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mooeypoo)
[![CI](https://github.com/mooeypoo/DDDnD/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mooeypoo/DDDnD/actions/workflows/ci.yml)
[![Documentation Site](https://github.com/mooeypoo/DDDnD/actions/workflows/pages.yml/badge.svg?branch=main)](https://github.com/mooeypoo/DDDnD/actions/workflows/pages.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/a40f2bc1-e69f-4833-b140-10ce0858b6fd/deploy-status)](https://app.netlify.com/sites/dddnd/deploys)
![Copilot Assisted](https://img.shields.io/badge/copilot-assisted-blue?logo=github)

**Play now:** [dddnd.app](https://dddnd.app)

DDDnD is a satirical strategy simulation about software architecture under pressure. You play as an architect trying to keep a troubled system alive while balancing domain clarity, maintainability, delivery confidence, team morale, user trust, budget, and the patience of the people funding and running the organization.

Each run is built around tradeoffs. You choose one architecture card per turn, absorb delayed consequences, react to system events, and navigate stakeholder responses that can either stabilize the program or push it toward collapse.

## How It Plays

- Start a run from a main scenario or guided tutorial.
- Pick a player class and, if you want, an optional challenge modifier.
- Resolve each turn in the same deterministic order: architectural aftershocks, player action, system event, stakeholder resolution, and turn wrap-up.
- Finish with an outcome tier and a player-facing ending type based on how the run evolved.

The simulation is deterministic for a given seed, scenario bundle, and action sequence. That makes balancing, debugging, and simulation telemetry reproducible.

## Current Game Surface

DDDnD ships with two built-in content packs that load automatically at runtime:

- `content/manifest.json` - the base pack with main scenarios, classes, challenge modifiers, and core gameplay content
- `content/tutorial/manifest.json` - the tutorial pack with guided onboarding scenarios and tutorial-only content

### Main Scenarios

| Scenario | Focus |
|---|---|
| `monolith_of_mild_despair` | Stabilize a tangled legacy monolith before delivery confidence collapses. |
| `microservice_sprawl` | Restore clarity to a fragmented service landscape before coordination failure becomes the norm. |
| `compliance_gauntlet` | Survive a regulatory gauntlet without losing delivery capability or stakeholder confidence. |
| `startup_hypergrowth` | Scale a fast-growing product before delivery chaos and user pain spiral out of control. |
| `merger_of_minor_chaos` | Reconcile duplicate systems, competing domain models, and culture clashes after an acquisition. |

### Tutorials

| Tutorial | Focus |
|---|---|
| `tutorial_basics` | Learn the core loop: actions, scores, stakeholders, events, and delayed effects. |
| `tutorial_systems_under_pressure` | Learn how tradeoffs, coupling, and collapse pressure reshape your options. |

### Run Setup Options

- 5 player classes are available from the base content pack.
- 4 challenge modifiers can adjust starting pressure and difficulty.
- Runs support player naming, save/load/export, and shareable end-of-run presentation.

## System Overview

The project is split into clear domains:

- **content** - versioned JSON content, pack manifests, validation, and scenario bundle construction
- **simulation** - deterministic, UI-agnostic game engine and telemetry
- **persistence** - save/load/export behavior
- **reporting** - summaries and shareable results
- **ui** - Vue application, presentation, onboarding, and game flow

Important boundary rules:

- Simulation owns gameplay rules.
- UI presents state and triggers engine actions, but does not implement gameplay logic.
- Authored content remains versioned and human-readable.
- Storybook is a development tool, not part of runtime gameplay.

The content system is pack-based. The runtime already supports ordered pack registration and merged content providers, which allows later packs to extend or override matching `{ id, version }` refs. The built-in base and tutorial packs are loaded by default; external pack registration is supported by the content registry layer and documented for authors.

## Repository Layout

```text
content/        Versioned gameplay content and pack manifests
docs/           Design, authoring, visual direction, and architecture references
public/         Static assets served as-is
scripts/        CLI utilities for simulation, validation, audit, and asset generation
src/            Application source
stories/        Storybook stories and mock states
tests/          Automated tests
```

Inside `src/` the most important boundaries are:

```text
src/domains/    Content, simulation, persistence, and reporting logic
src/ui/         Vue views, components, composables, stores, and presentation config
src/app/        Application bootstrap and shell wiring
src/shared/     Shared contracts and utilities
```

## Documentation Map

- [ARCHITECTURE.md](./ARCHITECTURE.md) - technical boundaries and runtime model
- [GAME_DESIGN.md](./GAME_DESIGN.md) - gameplay concepts and high-level design intent
- [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) - content file structure
- [CONTENT_VERSIONING.md](./CONTENT_VERSIONING.md) - content versioning rules
- [docs/CONTENT_PACK_AUTHORING_GUIDE.md](./docs/CONTENT_PACK_AUTHORING_GUIDE.md) - how to build and host content packs
- [docs/CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md](./docs/CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md) - audit model and balance philosophy
- [docs/STORYBOOK.md](./docs/STORYBOOK.md) - Storybook usage and boundaries
- [CONTRIBUTORS.md](./CONTRIBUTORS.md) - local setup, commands, validation workflow, and contributor guidance

## Contributors

Development setup, testing commands, content validation workflow, and contributor-facing project conventions live in [CONTRIBUTORS.md](./CONTRIBUTORS.md).

## Author

Moriel Schottlender ([GitHub](https://github.com/mooeypoo)) ([Website](https://moriel.tech)) ([Blog](https://blog.moriel.tech))

## License

GPL-3.0-only
