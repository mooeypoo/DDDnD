# Content Pack Authoring Guide

This guide explains how to create a DDDnD content pack that the game can load.

It covers:

- what a content pack is
- how pack manifests work
- examples from the default pack in this repository
- recommended layout for packs in external repositories
- validation and testing workflow
- common pitfalls and best practices

## What is a content pack?

A content pack is a versioned collection of JSON content files plus a `manifest.json` that describes:

- pack metadata (id, version, license, author credit)
- entry points (which scenarios/classes/tutorials to expose)
- full inventory (which JSON files the pack owns)
- pack dependencies (which other packs it extends)

DDDnD builds scenario bundles from references in content files. A pack does not embed all data in one file. Instead, each scenario references cards, events, stakeholders, and outcome definitions by `{ id, version }`.

## Current loading model

Current runtime behavior:

- default base pack is loaded from `/content/manifest.json`
- tutorial pack is loaded from `/content/tutorial/manifest.json`
- external manifests are planned to be configured via UI
- packs are registered in order; later packs can override earlier packs for the same `{ id, version }` content ref

Hybrid error behavior (current):

- manifest load/validation errors fail fast (no store-level fallback)
- content ownership lookup can still fall back across registered packs if inventory mapping is incomplete

This means local default content should always work, and external packs should be strict about manifest validity.

## Pack manifest schema

Manifest type lives in `src/domains/content/model/content_pack_manifest.ts`.

```json
{
  "id": "my_pack",
  "version": "1.0.0",
  "name": "My Pack",
  "description": "A scenario pack focused on operational chaos.",
  "depends_on": [
    { "pack_id": "base", "version": "1.0.0" }
  ],
  "base_url": "/content/my-pack",
  "license": "MIT",
  "authors": [
    { "name": "Example Author", "url": "https://example.com" }
  ],
  "pack_homepage_url": "https://github.com/example/dddnd-my-pack",
  "scenarios": [
    { "id": "ops_nightmare", "version": 1 }
  ],
  "classes": [],
  "challenge_modifiers": [
    { "id": "low_budget_sprint", "version": 1 }
  ],
  "tutorials": [],
  "content": {
    "scenarios": ["ops_nightmare-v1.json"],
    "cards": ["escalate_incident_command-v1.json"],
    "stakeholders": ["head_of_support-v1.json"],
    "stakeholder_reaction_rules": ["support_demands_stability-v1.json"],
    "scores": ["reliability-v1.json"],
    "events": ["global_outage-v1.json"],
    "delayed_effects": ["postmortem_payoff-v1.json"],
    "outcome_tiers": ["success-v1.json"],
    "outcome_archetypes": ["system_stabilizer-v1.json"],
    "classes": [],
    "challenge_modifiers": ["low_budget_sprint-v1.json"]
  }
}
```

### Required fields

- `id`: non-empty string
- `version`: non-empty string (pack semver, ex: `1.0.0`)
- `name`, `description`: non-empty strings
- `depends_on`: array
- `base_url`: non-empty string
- `license`: valid SPDX expression (validated)
- `authors`: non-empty array, each author has non-empty `name`
- `scenarios`, `classes`, `challenge_modifiers`, `tutorials`: arrays of `{ id, version }`
- `content`: object with all inventory arrays present

### Optional fields

- `pack_homepage_url`
- `tutorial_base_url`
- `authors[].url`

## Base pack examples in this repo

Use these as working references:

- base manifest: `content/manifest.json`
- tutorial manifest: `content/tutorial/manifest.json`
- scenario example: `content/scenarios/monolith_of_mild_despair-v1.json`
- card example: `content/cards/define_bounded_context-v1.json`
- stakeholder example: `content/stakeholders/cto-v1.json`
- reaction rule example: `content/stakeholder-reaction-rules/cto_wants_clarity-v1.json`

Key pattern to follow:

- all files are versioned: `<id>-v<version>.json`
- each file's internal `id` and `version` must match filename
- scenario refs (`score_refs`, `card_refs`, etc.) must resolve to actual files in registered packs

## Content directory layout

Your pack content root should mirror the domain directories.

```text
content/
  manifest.json
  scenarios/
  cards/
  stakeholders/
  stakeholder-reaction-rules/
  scores/
  events/
  delayed-effects/
  outcome-tiers/
  outcome-archetypes/
  classes/
  challenge-modifiers/
```

Tutorial packs can use the same structure under another root (as the default tutorial pack does under `content/tutorial`).

## External repository layout

Recommended external repository layout:

```text
dddnd-my-pack/
  README.md
  content/
    manifest.json
    scenarios/
    cards/
    stakeholders/
    stakeholder-reaction-rules/
    scores/
    events/
    delayed-effects/
    outcome-tiers/
    outcome-archetypes/
    classes/
    challenge-modifiers/
```

  ## Registering external packs

  The runtime is prepared for UI-driven external pack registration.

  Notes:

  - default manifests are always loaded first (`/content/manifest.json`, `/content/tutorial/manifest.json`)
  - externally configured manifests are loaded after defaults
  - for duplicate refs, later packs win, which enables controlled overrides

### Hosting guidance

For remote hosting, `base_url` should point to the directory containing your content subfolders.

Examples:

- GitHub raw: `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/content`
- CDN mirror: `https://cdn.example.com/dddnd/my-pack/content`

Then a scenario fetch resolves like:

- `${base_url}/scenarios/<id>-v<version>.json`

## Dependency model

`depends_on` declares pack-level dependencies.

Example:

```json
"depends_on": [
  { "pack_id": "base", "version": "1.0.0" }
]
```

Typical use case:

- your pack adds scenarios/cards
- your scenarios reference shared base content (scores, outcome tiers, archetypes, or existing cards/events/stakeholders)

Best practice: include only files your pack truly owns in `content.*` inventory.

## Validation workflow

### 1) Schema/version sanity

Ensure every content file follows:

- snake_case keys
- versioned filename format
- matching `id`/`version` in file body

### 2) Pack validation script

From this repository:

```bash
npx tsx scripts/validate-content-pack.ts \
  --content-root ./content \
  --manifest ./content/manifest.json \
  --runs 50
```

Useful flags:

- `--audit` include simulation audit output
- `--fail-on-audit-critical` non-zero exit on critical audit findings
- `--include-test-scenarios` include scenarios starting with `test_`

### 3) Build and tests

```bash
npm test -- --run
npm run build
```

## Authoring checklist

- create all referenced entities before wiring scenario refs
- keep gameplay changes versioned by file (`-v2`, `-v3`, ...)
- keep entry points intentional:
  - `scenarios`: playable non-tutorial scenarios
  - `tutorials`: tutorial scenarios
  - `classes`: selectable player classes
- ensure manifest `content.*` includes every file your pack owns
- use a valid SPDX license expression at pack top level
- include author credit in `authors`

## Common pitfalls

- filename/version mismatch (`foo-v1.json` contains `"version": 2`)
- adding a new file but forgetting to list it in manifest inventory
- scenario references content not present in any registered pack
- invalid SPDX license expression
- using plain ids where `{ id, version }` refs are required

## FAQ

### Do I need to copy all base files to create an extension pack?

No. You can reference base content via `{ id, version }` and declare dependency on base.

### Should license be per author or per pack?

Per pack (top-level `license`). Author entries are for credit metadata.

### Are external packs loaded through UI today?

Current implementation is prepared for package-based loading and remote-ready manifest structure. Discovery/import UX for external packs is a follow-up feature.

## Related docs

- `CONTENT_SCHEMA.md`
- `CONTENT_VERSIONING.md`
- `ARCHITECTURE.md`
- `AGENT.md`