# Content authoring

::: info For authors
This is the authoring half of Player help’s sidebar. Generated catalogs and audit numbers live under [Game design](/dashboard/).
:::

Want to create new scenarios, cards, or stakeholders for DDDnD? This guide covers the content pack format, manifest structure, validation workflow, and common pitfalls.

## What Is a Content Pack?

A content pack is a versioned collection of JSON content files plus a `manifest.json` that describes:

- Pack metadata (id, version, license, author credit)
- Entry points (which scenarios, classes, and tutorials to expose)
- Full inventory (every JSON file the pack owns)
- Pack dependencies (which other packs it extends)

DDDnD builds scenario bundles from references in content files. A pack does not embed all data in one file — each scenario references cards, events, stakeholders, and outcome definitions by `{ id, version }`.

## Directory Layout

Your pack content root should mirror the domain directories:

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

All files are versioned: `<id>-v<version>.json`. A file's internal `id` and `version` fields must match its filename.

## Score Files

Score JSON under `scores/` defines a tracked metric for scenarios (the weather-strip vials).

Required fields:

| Field | Description |
|---|---|
| `id`, `version` | Must match the filename `<id>-v<version>.json` |
| `name` | Full player-facing name (weather-strip hover/tap) |
| `short_name` | Compact label used in play UI (strip, card deltas, aftershocks, theater) |
| `description` | Non-empty string |
| `default_value` | Number |

Optional: `min_value`, `max_value`.

`short_name` is **mandatory**. The UI does not invent compact titles from score ids — packs that omit it fail to load. Prefer a short word players can scan on a phone (e.g. `Craft` for Maintainability, `Purse` for Budget).

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

Adding or changing `short_name` alone is cosmetic — keep the same file version when gameplay values are unchanged (see `CONTENT_VERSIONING.md`).

## The Manifest

The `manifest.json` is the entry point for your pack.

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
  "scenarios": [
    { "id": "ops_nightmare", "version": 1 }
  ],
  "classes": [],
  "challenge_modifiers": [],
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
    "challenge_modifiers": []
  }
}
```

### Required Fields

| Field | Description |
|---|---|
| `schema_version` | Pack format version. Use `1`. |
| `kind` | `standalone` (complete world, no dependencies) or `extension` (builds on a pack in `depends_on`) |
| `id` | Lowercase snake_case, 1–64 characters, unique pack identifier |
| `version` | Semver string, e.g. `1.0.0` |
| `name`, `description` | Non-blank text |
| `depends_on` | Array of `{ pack_id, version }` |
| `base_url` | Root-relative path (`/content`) or `https://` URL for content fetches |
| `license` | Valid SPDX expression. Packs that depend on `base` must use `GPL-3.0-only` or `GPL-3.0-or-later`. |
| `authors` | 1–20 entries; each requires a non-blank `name`. Optional `url` must be `https://`. |
| `content` | Object with all inventory arrays present (may be empty). Every entry point must be listed here. |

Unknown fields are rejected, so typos are reported instead of silently ignored.

## Extending the Base Pack

If your pack adds scenarios that reference base content (shared scores, outcome tiers, archetypes, existing cards), declare the dependency:

```json
"depends_on": [
  { "pack_id": "base", "version": "1.0.0" }
]
```

Include only files your pack **truly owns** in the `content.*` inventory. Reference base content via `{ id, version }` refs — don't copy it.

## Hosting External Packs

For hosted packs, set `"base_url": "."`. Content is then read from the folder that holds `manifest.json`, so the same manifest works for every release tag without edits:

- manifest: `https://raw.githubusercontent.com/<owner>/<repo>/<tag>/packs/<pack_id>/manifest.json`
- a scenario: `https://raw.githubusercontent.com/<owner>/<repo>/<tag>/packs/<pack_id>/scenarios/<id>-v<version>.json`

`"./some/folder"` also works when content sits in a subfolder. `..` is never allowed.

The game loads remote packs only from GitHub: `raw.githubusercontent.com` and GitHub Pages sites (`<owner>.github.io`). Share a URL pinned to a tag or commit, not a branch, so a saved game always finds the content it was played with. See [ADR 0003](https://github.com/mooeypoo/DDDnD/blob/main/docs/adr/0003-remote-pack-source-allowlist.md). One repository can hold several packs, one folder each ([mooeypoo/DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs) is the reference layout).

## How players find your pack

Players import packs in the game's **Community Bazaar**, where every pack gets a stall and its own table. Your pack is never mixed in with DDDnD's own adventures. Your stall shows your pack's name, version, description, how many adventures and tutorials it has, and **who published it**: the GitHub account and repository it was loaded from, or "unknown" for a file.

- **Share a link to your `manifest.json`,** pinned to a release tag. You can also share `https://dddnd.app/community?pack=<that link>`, which opens the import screen with the link filled in. Players still review the pack and confirm before anything is imported.
- **One pack, many scenarios.** Everything in `scenarios` and `tutorials` appears together on your pack's table, with tutorials in their own tab. A pack with one scenario still has its own table.
- **Players keep packs in their browser only.** There are no accounts, so encourage players to keep your link.
- **Runs are marked as yours.** The results screen and the share card say "Community pack · your pack's name · publisher · not a DDDnD scenario".

See [ADR 0015](https://github.com/mooeypoo/DDDnD/blob/main/docs/adr/0015-community-packs-in-their-own-place.md).

## A pack's identity is where it lives

Your pack's `id` is its name, and other authors can use the same name. The game tells packs apart by **where they are published**: the GitHub owner, repository, and folder (`github:<owner>/<repo>/packs/<pack_id>`). The tag or commit is not part of it, so each new release is recognized as the same pack and replaces the older one for players. Another author's pack with the same `id` is a different pack: players can import both, and the game shows who published each.

This means **moving a pack makes it a new pack** to the game. Renaming the repository, moving the pack's folder, or transferring the repository to another account all do this, and players' saved runs will ask for the old link. Pick a home for your pack and keep it there. A pack loaded from a `.dddnd-pack.json` file is identified by its exact content. See [ADR 0012](https://github.com/mooeypoo/DDDnD/blob/main/docs/adr/0012-pack-identity-from-source.md).

## Naming your content ids

Your content ids (cards, scenarios, events…) belong to your pack: another pack using the same ids doesn't affect yours. They must not reuse an id the packs you build on (`base`, `tutorial`) already use, because your scenarios couldn't tell which one they meant. A short prefix keeps that easy and makes your files easy to recognize. The demo pack uses `ledger_` (`ledger_split_refunds_context`).

Community packs can't add player classes or challenge modifiers yet, so leave `classes` and `challenge_modifiers` empty. Your pack's table offers DDDnD's classes. Classes and modifiers of your own, offered only on your pack's table, are planned ([ADR 0015](https://github.com/mooeypoo/DDDnD/blob/main/docs/adr/0015-community-packs-in-their-own-place.md)).

## Reusing base content

An `extension` pack can reference base cards, events, aftershocks, stakeholders, outcome tiers, and endings by `{ id, version }`, without copying them. Check which stakeholders a reused card or event affects (its `stakeholder_changes`): if your scenario doesn't include that stakeholder, the game currently creates an invisible "phantom" stakeholder that still counts toward end-of-run classification. Either include the stakeholder or pick other content. The validator will reject this in a later version.

### Dependencies

**A community pack can depend only on packs that ship with DDDnD: `base` and `tutorial`.** A pack's `id` is a name its author chose, and anyone can publish a pack with the same name, so depending on `"some_other_pack"` couldn't guarantee *which* pack you'd get. Packs that ship with the game are the only ones whose ids can't be taken. A pack that depends on anything else is refused when it is loaded, and by the validator. Community packs that build on each other may come back later, naming the pack by where it is published instead of by id. See [ADR 0013](https://github.com/mooeypoo/DDDnD/blob/main/docs/adr/0013-community-packs-depend-only-on-first-party.md).

For the same reason, a community pack can't use the id `base` or `tutorial`.

## Coupling: when one score drags others down

A **coupling rule** makes a collapsing score hurt others: "while delivery confidence is below 25, gains to domain clarity and maintainability shrink to 70%". The engine has no coupling of its own; a scenario lists the rules that apply in `coupling_rule_refs`:

```json
"coupling_rule_refs": [
  { "id": "delivery_collapse", "version": 1 }
]
```

A rule file (`coupling-rules/<id>-v<version>.json`, listed under `content.coupling_rules` in the manifest) has:

- `trigger_score_id` and `threshold`: the rule is active while that score is strictly below the threshold;
- `affected_score_ids`: the scores whose gains shrink;
- `gain_multiplier`: between 0.1 and 1, applied to gains only, never to losses;
- `name` and `description`: the warning players see while it is active.

All the scores a rule names must be in the scenario's `score_refs`. An extension pack can reuse the base game's rules (`delivery_collapse`, `morale_collapse`, `trust_collapse`). A pack with its own scores writes its own. See [CONTENT_SCHEMA.md](https://github.com/mooeypoo/DDDnD/blob/main/CONTENT_SCHEMA.md#coupling-rules).

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

Inputs: `packs` (folders with a `manifest.json`; globs allowed), `dependency-roots` (rarely needed: folders that stand in for `base` or `tutorial`, such as a work-in-progress base pack), `audit-runs` (default 50; `0` skips the balance audit), `fail-on-audit-critical` (default `true`). Pin both refs to the same tag. `pack-validator-v1` only moves forward for compatible changes. See [ADR 0011](https://github.com/mooeypoo/DDDnD/blob/main/docs/adr/0011-reusable-pack-validation-workflow.md).

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

## Validation Workflow

### 1. Schema sanity

Ensure every content file follows:
- snake_case keys
- versioned filename format (`<id>-v<version>.json`)
- matching `id` and `version` in the file body

### 2. Pack validation script

```bash
npx tsx scripts/validate-content-pack.ts \
  --content-root ./content \
  --manifest ./content/manifest.json \
  --runs 50
```

Useful flags:
- `--audit` — include simulation audit output
- `--fail-on-audit-critical` — non-zero exit on critical audit findings
- `--include-test-scenarios` — include scenarios starting with `test_`

### 3. Build and tests

```bash
npm test -- --run
npm run build
```

## Authoring Checklist

- Create all referenced entities before wiring scenario refs
- Keep gameplay changes versioned by file (`-v2`, `-v3`, ...)
- Ensure every score file includes both `name` and `short_name`
- Ensure every `score_id` reachable from a scenario (cards, events, delayed effects, reaction rules, requirements, failure conditions) is in that scenario’s `score_refs`
- give every reaction rule a structured `condition`, and every event with `trigger_condition_description` a structured `trigger_condition` (the text is for people; the engine only reads the structured field). Conditions may only check scores the scenario tracks and stakeholders in the scenario.
- Ensure `scenarios`, `classes`, `tutorials` entry points are intentional
- Include every owned file in `manifest.content.*`
- Use a valid SPDX license expression
- Include author credit in `authors`

## Common Pitfalls

- **Filename/version mismatch** — `foo-v1.json` contains `"version": 2`
- **Missing inventory entry** — new file not listed in manifest `content.*`
- **Unresolved reference** — scenario references content not present in any registered pack
- **Score missing `short_name`** — load fails; the UI will not invent a compact label
- **Untracked score** — a card, event, aftershock, or rule changes a score the scenario does not list in `score_refs`. Bundle validation fails. Ghost keys also hijack consult pressure.
- **Invalid SPDX license** — pack fails validation on load
- **Plain ids vs. refs** — use `{ id, version }` objects where required, not bare id strings

## Base Pack Reference Files

Use these as working examples:

- Base manifest: `content/manifest.json`
- Playable scenario: `content/scenarios/monolith_of_mild_despair-v2.json`
- Card: `content/cards/define_bounded_context-v1.json`
- Score: `content/scores/maintainability-v1.json`
- Stakeholder: `content/stakeholders/cto-v1.json`
- Reaction rule: `content/stakeholder-reaction-rules/cto_wants_clarity-v1.json`

## Related Docs

- `CONTENT_SCHEMA.md` — full JSON schema reference
- `CONTENT_VERSIONING.md` — versioning rules and upgrade policy
- `ARCHITECTURE.md` — domain boundaries and pack loading model
