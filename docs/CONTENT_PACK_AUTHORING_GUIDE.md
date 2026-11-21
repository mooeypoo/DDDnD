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
- external manifests are planned to be configured via UI (milestone M2 in [CONTENT_PACKS.md](CONTENT_PACKS.md))
- **every content file is owned by exactly one pack.** A pack that lists a file another loaded pack already lists is refused. Packs cannot replace each other's content; give your version a new id instead.
- **a scenario only sees its own pack and the packs in its `depends_on`** (transitively). Referencing content from a pack you did not declare fails with an error that names the owning pack.
- a dependency is satisfied by the same major version, at least as new as declared (`"1.2.0"` accepts `1.2.0` to `1.x.x`)

Error behavior:

- manifest load/validation errors fail fast (no store-level fallback)
- content that no loaded pack lists in its inventory is not found. There is no fallback search across packs, so your inventory must list every file your pack owns.

## Pack manifest schema

Manifest type lives in `src/domains/content/model/content_pack_manifest.ts`.

```json
{
  "schema_version": 1,
  "kind": "extension",
  "id": "my_pack",
  "version": "1.0.0",
  "name": "My Pack",
  "description": "A scenario pack focused on operational chaos.",
  "depends_on": [
    { "pack_id": "base", "version": "1.0.0" }
  ],
  "base_url": "/content/my-pack",
  "license": "GPL-3.0-only",
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

- `schema_version`: pack format version. Use `1`. A game that only understands older formats refuses the pack with a "needs a newer DDDnD" message instead of misreading it.
- `kind`: `"standalone"` (a complete world, no `depends_on`) or `"extension"` (builds on at least one pack listed in `depends_on`). `"overlay"` (text-only packs) is planned for a later format.
- `id`: lowercase snake_case (`a-z`, `0-9`, `_`), 1–64 characters
- `version`: pack semver, for example `1.0.0`
- `name`, `description`: non-blank text
- `depends_on`: array of `{ pack_id, version }`
- `base_url`: a root-relative path such as `/content` (first-party) or an `https://` URL (hosted packs). `..` segments are rejected.
- `license`: valid SPDX expression. **Packs that depend on `base` must use `GPL-3.0-only` or `GPL-3.0-or-later`**, because the base pack is GPL-3.0-only (see [ADR 0004](adr/0004-pack-license-compatibility.md)). Standalone packs may use any SPDX license.
- `authors`: 1–20 entries, each with a non-blank `name`
- `scenarios`, `classes`, `challenge_modifiers`, `tutorials`: arrays of `{ id, version }`. Every entry point must also be listed in the matching `content` inventory section (tutorials in `content.scenarios`).
- `content`: object with all inventory arrays present. Entries must be versioned filenames (`<id>-v<version>.json`). A pack may list at most 2000 files.

Unknown fields are rejected, so a typo is reported instead of ignored. Content files have their own limits; see "Validation and Limits" in [CONTENT_SCHEMA.md](../CONTENT_SCHEMA.md#validation-and-limits).

### Optional fields

- `pack_homepage_url`: `https://` only
- `tutorial_base_url`: same rules as `base_url`
- `authors[].url`: `https://` only

## Base pack examples in this repo

Use these as working references:

- base manifest: `content/manifest.json`
- tutorial manifest: `content/tutorial/manifest.json`
- scenario example: `content/scenarios/monolith_of_mild_despair-v1.json`
- card example: `content/cards/define_bounded_context-v1.json`
- stakeholder example: `content/stakeholders/cto-v1.json`
- score example: `content/scores/maintainability-v1.json`
- reaction rule example: `content/stakeholder-reaction-rules/cto_wants_clarity-v1.json`

Key pattern to follow:

- all files are versioned: `<id>-v<version>.json`
- each file's internal `id` and `version` must match filename
- scenario refs (`score_refs`, `card_refs`, etc.) must resolve to actual files in registered packs

## Score files

Score JSON under `scores/` defines a tracked metric for scenarios.

Required fields:

- `id`, `version` (must match the filename `<id>-v<version>.json`)
- `name`: full player-facing name (shown on weather-strip hover/tap and inspect surfaces)
- `short_name`: compact label used throughout play UI (weather strip, card deltas, aftershocks, theater)
- `description`: non-empty string
- `default_value`: number

Optional: `min_value`, `max_value`.

`short_name` is mandatory. The UI does not invent compact titles from score ids — packs that omit it fail to load.

Example:

```json
{
  "id": "maintainability",
  "version": 1,
  "name": "Maintainability",
  "short_name": "Craft",
  "description": "How easy it is to modify and extend the codebase",
  "default_value": 40
}
```

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
  - packs cannot override each other's content (see "Current loading model" above)

> **In progress:** community pack loading is designed in [docs/CONTENT_PACKS.md](CONTENT_PACKS.md). Schema validation, `schema_version`/`kind`, and pack-scoped resolution are in place. Loading packs from a URL in the game is next: remote packs will load only from GitHub raw and GitHub Pages at first. See [docs/adr/](adr/README.md).

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

## Editor support (JSON Schema)

Every content type has a published JSON Schema generated from the game's own validator:

```text
https://dddnd.app/schema/v1/manifest.schema.json
https://dddnd.app/schema/v1/scenario.schema.json
https://dddnd.app/schema/v1/card.schema.json
https://dddnd.app/schema/v1/event.schema.json
https://dddnd.app/schema/v1/delayed-effect.schema.json
https://dddnd.app/schema/v1/score.schema.json
https://dddnd.app/schema/v1/stakeholder.schema.json
https://dddnd.app/schema/v1/stakeholder-reaction-rule.schema.json
https://dddnd.app/schema/v1/outcome-tier.schema.json
https://dddnd.app/schema/v1/outcome-archetype.schema.json
https://dddnd.app/schema/v1/class.schema.json
https://dddnd.app/schema/v1/challenge-modifier.schema.json
```

Add a `"$schema"` line to any file for autocomplete and inline errors in VS Code and most editors. The game ignores it:

```json
{
  "$schema": "https://dddnd.app/schema/v1/card.schema.json",
  "id": "escalate_incident_command",
  "version": 1
}
```

Or map whole folders once in `.vscode/settings.json`:

```json
{
  "json.schemas": [
    { "fileMatch": ["content/cards/*.json"], "url": "https://dddnd.app/schema/v1/card.schema.json" },
    { "fileMatch": ["content/manifest.json"], "url": "https://dddnd.app/schema/v1/manifest.schema.json" }
  ]
}
```

The schemas catch shapes, types, id formats, and ranges while you type. A few rules can only be checked by the validator (blank text, control characters, license compatibility, entry points listed in the inventory, cross-file references), so always run the validator before publishing.

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
- ensure every score file includes both `name` and `short_name`
- ensure every `score_id` reachable from a scenario (cards, events, delayed effects, reaction rules, requirements, failure conditions) is in that scenario’s `score_refs`
- give every reaction rule a structured `condition`, and every event with `trigger_condition_description` a structured `trigger_condition` (the text is for people; the engine only reads the structured field). Conditions may only check scores the scenario tracks and stakeholders in the scenario.
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
- score file missing mandatory `short_name` (pack fails to load)
- a card, event, delayed effect, or reaction rule that changes a score the scenario does not list in `score_refs` (pack fails bundle validation)
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