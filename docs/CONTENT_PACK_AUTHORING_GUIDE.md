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

For hosted packs, set `"base_url": "."`. Content is then read from the folder that holds `manifest.json`, so the same manifest works for every release tag without edits:

- manifest: `https://raw.githubusercontent.com/<owner>/<repo>/<tag>/packs/<pack_id>/manifest.json`
- a scenario: `https://raw.githubusercontent.com/<owner>/<repo>/<tag>/packs/<pack_id>/scenarios/<id>-v<version>.json`

`"./some/folder"` also works when content sits in a subfolder. `..` is never allowed.

The game loads remote packs only from GitHub: `raw.githubusercontent.com` and GitHub Pages sites (`<owner>.github.io`). Share a URL pinned to a tag or commit, not a branch, so a saved game always finds the content it was played with. See [ADR 0003](adr/0003-remote-pack-source-allowlist.md). One repository can hold several packs, one folder each ([mooeypoo/DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs) is the reference layout).

### A pack's identity is where it lives

Your pack's `id` is its name, and other authors can use the same name. The game tells packs apart by **where they are published**: the GitHub owner, repository, and folder (`github:<owner>/<repo>/packs/<pack_id>`). The tag or commit is not part of it, so each new release is recognized as the same pack and replaces the older one for players. Another author's pack with the same `id` is a different pack: players can add both, and the game shows who published each.

This means **moving a pack makes it a new pack** to the game. Renaming the repository, moving the pack's folder, or transferring the repository to another account all do this, and players' saved runs will ask for the old link. Pick a home for your pack and keep it there. A pack loaded from a `.dddnd-pack.json` file is identified by its exact content. See [ADR 0012](adr/0012-pack-identity-from-source.md).

### Naming your content ids

Your content ids (cards, scenarios, events…) belong to your pack: another pack using the same ids doesn't affect yours. They must not reuse an id the packs you build on (`base`, `tutorial`) already use, because your scenarios couldn't tell which one they meant. A short prefix keeps that easy and makes your files easy to recognize. The demo pack uses `ledger_` (`ledger_split_refunds_context`).

Community packs can't add player classes or challenge modifiers yet (they are offered for every scenario in the game), so leave `classes` and `challenge_modifiers` empty.

### Reusing base content

An `extension` pack can reference base cards, events, aftershocks, stakeholders, outcome tiers, and endings by `{ id, version }`, without copying them. Check which stakeholders a reused card or event affects (its `stakeholder_changes`): if your scenario doesn't include that stakeholder, the game currently creates an invisible "phantom" stakeholder that still counts toward end-of-run classification. Either include the stakeholder or pick other content. The validator will reject this in a later version.

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

**A community pack can depend only on packs that ship with DDDnD: `base` and `tutorial`.** A pack's `id` is a name its author chose, and anyone can publish a pack with the same name, so depending on `"some_other_pack"` couldn't guarantee *which* pack you'd get. Packs that ship with the game are the only ones whose ids can't be taken. A pack that depends on anything else is refused when it is loaded, and by the validator. Community packs that build on each other may come back later, naming the pack by where it is published instead of by id. See [ADR 0013](adr/0013-community-packs-depend-only-on-first-party.md).

For the same reason, a community pack can't use the id `base` or `tutorial`.

Best practice: include only files your pack truly owns in `content.*` inventory.

## Single-file packs (`.dddnd-pack.json`)

A pack can also travel as one file, for workshops where hosting isn't practical: a player loads it into the game from their computer. Create one from a pack folder:

```bash
npm run content:bundle -- --content-root ../DDDnD-packs/packs/gilded_ledger
# writes gilded_ledger-v1.0.0.dddnd-pack.json
```

The file holds the manifest and every content file. The game validates it exactly like a hosted pack, and the same content gets the same content hash either way. The game never unzips archives; this is its only file format for packs.

## Continuous validation (GitHub Actions)

Pack repositories on GitHub can run DDDnD's validator and balance audit on every push with DDDnD's reusable workflow. Add `.github/workflows/validate-packs.yml`:

```yaml
name: Validate packs
on: [push, pull_request]
jobs:
  validate:
    uses: mooeypoo/DDDnD/.github/workflows/validate-pack.yml@pack-validator-v1
    with:
      dddnd-ref: pack-validator-v1
      packs: packs/*/
```

Inputs: `packs` (folders with a `manifest.json`; globs allowed), `dependency-roots` (rarely needed: folders that stand in for `base` or `tutorial`, such as a work-in-progress base pack), `audit-runs` (default 50; `0` skips the balance audit), `fail-on-audit-critical` (default `true`). Pin both refs to the same tag. `pack-validator-v1` only moves forward for compatible changes. See [ADR 0011](adr/0011-reusable-pack-validation-workflow.md).

[DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs/blob/main/.github/workflows/validate-packs.yml) uses exactly this setup.

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

For a pack outside this repository, point `--content-root` at the pack folder. The packs it depends on (`base`, `tutorial`) are loaded from this repository, so it is checked exactly as the game will see it. The validator applies the game's identity rules too: a community pack can't use a first-party id or depend on another community pack ([ADR 0013](adr/0013-community-packs-depend-only-on-first-party.md)). `--dependency-root <folder>` can stand in for a first-party pack, for example to check against a work-in-progress base pack:

```bash
npx tsx scripts/validate-content-pack.ts \
  --content-root ../DDDnD-packs/packs/gilded_ledger \
  --audit --runs 50 --fail-on-audit-critical
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