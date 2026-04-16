# DDDnD - Domain-Driven Design & Dragons

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=flat&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/mooeypoo)
[![CI](https://github.com/mooeypoo/DDDnD/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mooeypoo/DDDnD/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/a40f2bc1-e69f-4833-b140-10ce0858b6fd/deploy-status)](https://app.netlify.com/sites/dddnd/deploys)

**Play now:** [dddnd.app](https://dddnd.app)

A humorous simulation game about software architecture decision making using concepts from Domain-Driven Design.

Players act as a systems architect trying to improve a struggling software system, balancing architecture quality, developer morale, stakeholder satisfaction, delivery confidence, user trust, and budget — every decision involves tradeoffs.

## Project Status

🚧 **Pre-release** — Core engine, content system, simulation runner, and UI are functional. Gameplay balancing is in progress.

### What's Implemented

- Deterministic simulation engine with full turn resolution pipeline
- 4 playable scenarios with differentiated card/event pools
- 29 architecture cards with usage limits, cooldowns, and delayed effects
- 7 stakeholders with 20 reaction rules (including escalation triggers)
- 12 events including conditional triggers
- 13 delayed effects (architectural aftershocks)
- System coupling rules (collapse mechanics that penalize neglected dimensions)
- Outcome classification (tiers and legacy archetype criteria, presented as ending types in UI)
- Automated simulation runner with telemetry and strategy-fingerprint analysis
- Save/load/export system
- Storybook component library
- Shareable end-of-run results

## Getting Started

### Prerequisites

- Node.js (see `engines` in `package.json` for the target version)
- npm

### Installation

```bash
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Build for production
npm run build

# Start Storybook
npm run storybook

# Build Storybook
npm run build-storybook
```

### External Content Packs

The game always loads the built-in base and tutorial manifests:

- `/content/manifest.json`
- `/content/tutorial/manifest.json`

Additional manifests are planned to be configured from the UI. The store already supports this flow via `set_external_manifest_urls(urls)`.

Later packs are registered after earlier ones, so they can extend content and override matching `{ id, version }` refs, including challenge modifiers.

## Scenarios

| Scenario | Description |
|---|---|
| `monolith_of_mild_despair` | A legacy monolith suffering from unclear domain boundaries |
| `microservice_sprawl` | Too many services, not enough coordination |
| `compliance_gauntlet` | Regulatory pressure meets technical debt |
| `startup_hypergrowth` | Move fast, break things, then fix them under pressure |

## Project Structure

```
content/                    # Authored game content (versioned JSON files)
├── scenarios/
├── scores/
├── stakeholders/
├── stakeholder-reaction-rules/
├── cards/
├── events/
├── delayed-effects/
├── classes/
├── outcome-tiers/
└── outcome-archetypes/

scripts/                    # CLI tooling
├── run-simulation.ts       # Simulation runner CLI
├── copy-content-to-dist.mjs
└── generate-og-image.mjs

src/
├── app/                    # Application bootstrap and routing
│   ├── bootstrap/
│   ├── router/
│   └── providers/
├── domains/                # Core domain logic (UI-agnostic)
│   ├── content/           # Content loading and validation
│   │   ├── model/
│   │   ├── services/
│   │   └── validation/
│   ├── simulation/        # Game engine (deterministic, pure)
│   │   ├── model/
│   │   ├── services/       # Includes simulation_runner.ts
│   │   └── rules/
│   ├── persistence/       # Save/load/export
│   │   ├── services/
│   │   └── adapters/
│   └── reporting/         # Summaries and shareable results
│       ├── services/
│       └── formatters/
├── ui/                     # Vue components and presentation
│   ├── components/
│   │   ├── common/
│   │   ├── cards/
│   │   ├── stakeholders/
│   │   ├── scores/
│   │   └── turn/
│   ├── views/
│   ├── layouts/
│   ├── composables/
│   ├── stores/
│   └── styles/
├── shared/                 # Shared utilities and contracts
│   ├── contracts/
│   ├── utils/
│   ├── errors/
│   └── random/
├── App.vue
└── main.ts

tests/                      # Test files mirroring src structure
├── content/
├── simulation/
├── persistence/
├── reporting/
├── shared/
└── ui/
```

## Architecture Principles

### Domain Separation

The codebase is organized into clear domains:

- **content** — Authored game data and validation
- **simulation** — Deterministic game engine (UI-agnostic)
- **persistence** — Save/load/export functionality
- **reporting** — Summaries and shareable results
- **ui** — Vue components and presentation

### Simulation Purity

The simulation domain is **pure and deterministic**:

- ✅ Depends only on scenario bundles and game state
- ✅ Uses seeded random for reproducibility
- ❌ No Vue imports
- ❌ No Pinia imports
- ❌ No browser APIs
- ❌ No localStorage

### UI Boundaries

UI components may:
- ✅ Call simulation engine services
- ✅ Display results
- ❌ Implement gameplay rules
- ❌ Modify simulation behavior

All gameplay logic belongs in `src/domains/simulation`.

## TypeScript Philosophy

TypeScript is used to improve clarity and safety:

- **Strong typing** in simulation, content, persistence, reporting, and shared contracts
- **Light typing** in UI layer
- **Readable** code over clever type gymnastics
- **Explicit** named exports

Avoid advanced type-level programming and unnecessary abstraction.

## Content Philosophy

Content files are:

- **Human readable** — Non-programmers should understand them
- **Versioned** — Use `<id>-v<version>.json` format
- **Explicit** — Use snake_case keys, avoid cryptic identifiers
- **Deterministic** — Same content = same behavior

See [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) and [CONTENT_VERSIONING.md](./CONTENT_VERSIONING.md) for details.

## Testing

The project uses [Vitest](https://vitest.dev/) for testing.

```bash
# Run all tests
npm test

# Run tests once (no watch)
npm test -- --run

# Run tests with browser UI
npm run test:ui
```

Critical areas covered by tests:

- Deterministic turn resolution
- Scenario bundle construction and validation
- Stakeholder rule evaluation
- Delayed effect scheduling and resolution
- Card cooldown and usage limit enforcement
- System coupling rules
- Export/import round-trip
- Run determinism (same seed + actions = same result)
- Strategy-fingerprint telemetry correctness
- Content expansion packs (Pass A and Pass B)

### Simulation Runner

The project includes a CLI simulation runner for automated gameplay telemetry. It runs many games with random card selection using a seeded PRNG, and produces aggregate statistics useful for balance tuning.

```bash
# List available scenarios
npm run simulate -- --list

# Run 50 simulations (default) with formatted output
npm run simulate -- --scenario monolith_of_mild_despair

# Custom run count and seed
npm run simulate -- --scenario startup_hypergrowth --runs 300 --seed my-seed

# JSON output (aggregate only)
npm run simulate -- --scenario compliance_gauntlet --runs 100 --seed abc --json

# JSON output with per-run detail
npm run simulate -- --scenario microservice_sprawl --runs 10 --seed xyz --json --per-run

# Run all scenarios and save reports
for s in monolith_of_mild_despair microservice_sprawl compliance_gauntlet startup_hypergrowth; do
  npm run simulate -- --scenario "$s" --runs 300 --seed balance-pass > "./temp/sim-${s}.md"
done
```

The telemetry report includes:

- **Outcomes** — Win rate, outcome tier distribution, legacy archetype criteria distribution (can be presented as ending types in UI)
- **Scores** — Average final values for each score
- **Stakeholders** — Average final satisfaction per stakeholder
- **Card usage** — How often each card was played across all runs
- **Event frequency** — How often each event triggered
- **Reaction frequency** — How often each stakeholder reaction fired
- **Opening card frequency** — How often each card appears in the first 3 plays
- **Opening sequence frequency** — Most common exact opening card sequences
- **Average score by turn** — Per-score average trajectory across all runs
- **Winning card pairs** — Most common card co-occurrences in successful runs
- **Successful low-score rates** — Fraction of wins with critically low scores (identifies non-binding constraints)

Simulations are deterministic: the same seed produces identical results.

### How This Relates To Content Validation And Audit

The Simulation Runner and the content validation/audit workflows are related, but they serve different purposes.

| Tooling Surface | Primary Purpose | Typical Use | Pass/Fail Gate? |
|---|---|---|---|
| `npm run simulate` | Explore behavior and telemetry for one scenario | Design tuning, diagnosis, trend analysis | No |
| `npm run content:validate` | Verify structural correctness of content references and bundle construction | Fast pre-check while authoring content | Yes (fails on invalid structure) |
| `npm run content:validate:audit` | Run structural validation plus simulation-backed audit findings | Pre-PR quality check for content changes | Yes (fails when critical audit findings exist) |
| `npm run audit:gate` | CI-aligned fairness/balance gate across production scenarios | Merge safety and regression prevention | Yes (fails when critical findings exist) |

In short:

- Use `simulate` to understand what is happening.
- Use `content:validate` to confirm content is structurally valid.
- Use `content:validate:audit` and `audit:gate` to enforce quality thresholds before merge.

## Content Validation And Audit Workflow

Use this workflow before opening a content PR and during balance passes. It builds on the same simulation foundation used by `npm run simulate`, but adds structural validation and severity-based quality gates.

### 1) Structural Content Validation (fast)

Validates references and bundle buildability across scenarios.

```bash
npm run content:validate
```

Useful flags:

```bash
# Validate an alternate content root
npm run content:validate -- --content-root ./path/to/content

# Include test_ scenarios
npm run content:validate -- --include-test-scenarios
```

### 2) Validation + Audit (single command)

Runs structural validation, then simulation-backed audit checks.

```bash
# Default audit pass (50 runs/scenario) and fail on critical findings
npm run content:validate:audit

# Deeper local audit pass
npm run content:validate -- --audit --runs 200 --fail-on-audit-critical
```

### 3) Audit Gate (CI-aligned)

Runs the content fairness/balance audit against production scenarios and exits non-zero on critical findings.

```bash
npm run audit:gate

# Stronger confidence pass
npm run audit:gate -- --runs 200
```

### 4) Scenario-Level Diagnosis

Use the simulation runner for deeper per-scenario telemetry while tuning.

```bash
npm run simulate -- --scenario monolith_of_mild_despair --runs 300 --seed balance-pass
```

### 5) Interpreting Results

- Critical findings block merge and must be fixed.
- Warnings should be triaged and tracked; they may be acceptable only with explicit rationale.
- Prefer content fixes first (cards/events/stakeholder reaction rules/threshold tuning) before changing engine semantics.
- Keep simulation deterministic and domain-owned. UI should only present outputs.

## Robust Content Audit/Fix Plan

This is the recommended operating plan for a stronger balance and fairness pass.

### Phase A - Baseline Snapshot

1. Run and capture baseline reports:

```bash
npm run content:validate:audit
npm run audit:gate -- --runs 200 > ./temp/audit-gate-baseline.md
```

2. Generate scenario telemetry snapshots:

```bash
for s in monolith_of_mild_despair microservice_sprawl compliance_gauntlet startup_hypergrowth; do
  npm run simulate -- --scenario "$s" --runs 300 --seed robust-pass > "./temp/sim-${s}-baseline.md"
done
```

### Phase B - Triage Findings

1. Prioritize all critical findings first, then warnings.
2. Classify each issue into one of:
  - score balance drift
  - stakeholder recovery gap
  - event fairness/volatility
  - card ecosystem problems (trap/dominant/dead cards)
3. Identify smallest content surface to change first (score tuning vs adding cards/events/reactions).

### Phase C - Implement Content Fixes

1. Apply targeted content changes:
  - rebalance score deltas/threshold pressure
  - add or tune recovery-oriented stakeholder reactions
  - add or tune events for better agency and variance control
  - add or tune cards to reduce dominant lines and dead picks
2. Follow content versioning rules:
  - behavior-changing content should be version-bumped
  - preserve old versions for compatibility

### Phase D - Re-Audit Until Stable

1. Re-run:

```bash
npm run content:validate:audit
npm run audit:gate -- --runs 200
```

2. For changed scenarios, re-run deeper telemetry:

```bash
npm run simulate -- --scenario <scenario_id> --runs 500 --seed robust-pass-verify
```

### Phase E - Merge Readiness Criteria

- 0 critical findings in `npm run content:validate:audit`
- 0 critical findings in `npm run audit:gate -- --runs 200`
- No single score or stakeholder is persistently non-recoverable without intentional scenario design rationale
- No obvious dominant opening sequence across baseline scenarios without explicit design intent

## Key Documents

- [AGENT.md](./AGENT.md) — Rules for humans and AI agents
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Technical architecture
- [GAME_DESIGN.md](./GAME_DESIGN.md) — Game design and mechanics
- [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) — Content file structure
- [CONTENT_VERSIONING.md](./CONTENT_VERSIONING.md) — Versioning rules
- [docs/SCENE_VISUAL_DIRECTION.md](./docs/SCENE_VISUAL_DIRECTION.md) — Canonical scene/avatar art direction
- [docs/MVP_ASSET_PLAN.md](./docs/MVP_ASSET_PLAN.md) — Canonical redesign asset strategy
- [docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](./docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md) — Coding-agent implementation constraints
- [docs/STORYBOOK.md](./docs/STORYBOOK.md) — Storybook workflow boundaries

## Tech Stack

- **Vue 3** — UI framework
- **TypeScript** — Type safety
- **Vite** — Build tool
- **Vue Router** — Routing
- **Pinia** — State management
- **Vitest** — Testing
- **Storybook** — Component development and documentation
- **tsx** — TypeScript script execution (CLI tools)

## License

GPL-3.0-only
