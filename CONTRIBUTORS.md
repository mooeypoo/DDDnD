# CONTRIBUTORS

This document collects contributor-facing setup, commands, workflow notes, and project conventions. The README stays product-facing; operational and development details live here.

## Local Setup

### Prerequisites

- Node.js 24.x
- npm

### Install

```bash
npm install
```

### Main Local Commands

```bash
# App
npm run dev
npm run build
npm run preview

# Tests
npm test
npm test -- --run
npm run test:ui

# Storybook
npm run storybook
npm run build-storybook

# Diagnostics
npm run simulate -- --list
npm run simulate -- --scenario monolith_of_mild_despair --runs 50

# Assets
npm run generate-og
```

## Content Validation And Audit

Validation and audit flows are exposed through `package.json` shortcuts and can also be run directly with `tsx` when you need custom paths or flags.

### Structural Validation

```bash
npm run content:validate
```

### Validation Plus Audit

```bash
npm run content:validate:audit
```

### Audit Gate

```bash
npm run audit:gate
```

### Custom Validation Runs

```bash
npx tsx scripts/validate-content-pack.ts \
  --content-root ./content \
  --manifest ./content/manifest.json \
  --audit \
  --runs 200 \
  --fail-on-audit-critical

npx tsx scripts/audit-gate.ts --runs 200
```

### Simulation Telemetry

```bash
# List scenarios
npm run simulate -- --list

# Single-scenario analysis
npm run simulate -- --scenario startup_hypergrowth --runs 300 --seed balance-pass

# JSON output
npm run simulate -- --scenario compliance_gauntlet --runs 100 --seed audit --json
```

## Contributor Workflow

### Template Selection

Use the closest GitHub template when opening issues and pull requests:

- PRs: choose `feature`, `bugfix`, or `docs` under `.github/PULL_REQUEST_TEMPLATE/`
- Issues: choose `Bug report`, `Feature request`, or `Documentation improvement` under `.github/ISSUE_TEMPLATE/`
- If none fit cleanly, use the default PR template or a blank issue with clear context

Keep submissions concise and reproducible. Include scenario IDs, seeds, and affected files when relevant.

### Where To Work

- `src/domains/` for gameplay, content loading, persistence, reporting, and simulation behavior
- `src/ui/` for Vue presentation, flow, and player interaction
- `content/` for authored scenarios, cards, stakeholders, events, delayed effects, classes, challenge modifiers, and manifests
- `stories/` for Storybook-only visual work
- `tests/` for automated coverage

### Boundary Rules

- Keep gameplay rules in `src/domains/simulation`.
- Do not implement game rules in Vue components, stores, or Storybook stories.
- Keep simulation deterministic and free of browser-specific behavior.
- Keep content human-readable, versioned, and explicit.
- Keep tutorial content isolated under `content/tutorial/`.

### Terminology

Prefer the current player-facing terms used by the UI and docs:

- `playerClass`
- `endingType`
- `avatarRole`

### Content Authoring Rules

- Version gameplay content files as `<id>-v<version>.json`.
- Keep each file's internal `id` and `version` aligned with its filename.
- Update manifest inventory lists when adding or removing content owned by a pack.
- Use version refs consistently when wiring scenarios to cards, events, stakeholders, and outcomes.
- Keep tutorial entry points in `content/tutorial/manifest.json` and main scenario entry points in `content/manifest.json`.

## Reference Docs

- [AGENT.md](./AGENT.md) - working rules for humans and coding agents
- [ARCHITECTURE.md](./ARCHITECTURE.md) - technical boundaries and architecture rules
- [GAME_DESIGN.md](./GAME_DESIGN.md) - design intent and gameplay model
- [CONTENT_SCHEMA.md](./CONTENT_SCHEMA.md) - content structure reference
- [CONTENT_VERSIONING.md](./CONTENT_VERSIONING.md) - content evolution rules
- [docs/CONTENT_PACK_AUTHORING_GUIDE.md](./docs/CONTENT_PACK_AUTHORING_GUIDE.md) - external pack authoring
- [docs/CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md](./docs/CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md) - audit and balance philosophy
- [docs/STORYBOOK.md](./docs/STORYBOOK.md) - Storybook boundaries

## Documentation Hygiene

- Keep the README focused on what the game is, how it plays, and where to find major docs.
- Keep contributor workflow and local tooling here.
- Prefer stable descriptions over fragile implementation counts when updating docs.
- If CI depends on an npm script alias, keep `package.json` and workflow files aligned.
- When adding scenarios, tutorials, classes, or modifiers, update manifests first and docs second.