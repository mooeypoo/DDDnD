# Content Authoring

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

## The Manifest

The `manifest.json` is the entry point for your pack.

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
| `id` | Non-empty string, unique pack identifier |
| `version` | Semver string, e.g. `1.0.0` |
| `name`, `description` | Non-empty strings |
| `depends_on` | Array of `{ pack_id, version }` |
| `base_url` | Directory path prefix for content fetches |
| `license` | Valid SPDX expression |
| `authors` | Non-empty array; each entry requires a non-empty `name` |
| `content` | Object with all inventory arrays present (may be empty) |

## Extending the Base Pack

If your pack adds scenarios that reference base content (shared scores, outcome tiers, archetypes, existing cards), declare the dependency:

```json
"depends_on": [
  { "pack_id": "base", "version": "1.0.0" }
]
```

Include only files your pack **truly owns** in the `content.*` inventory. Reference base content via `{ id, version }` refs — don't copy it.

## Hosting External Packs

For remote hosting, `base_url` should point to the directory containing your content subfolders.

Examples:
- GitHub raw: `https://raw.githubusercontent.com/<owner>/<repo>/<branch>/content`
- CDN mirror: `https://cdn.example.com/dddnd/my-pack/content`

A scenario fetch resolves to: `${base_url}/scenarios/<id>-v<version>.json`

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
- Ensure `scenarios`, `classes`, `tutorials` entry points are intentional
- Include every owned file in `manifest.content.*`
- Use a valid SPDX license expression
- Include author credit in `authors`

## Common Pitfalls

- **Filename/version mismatch** — `foo-v1.json` contains `"version": 2`
- **Missing inventory entry** — new file not listed in manifest `content.*`
- **Unresolved reference** — scenario references content not present in any registered pack
- **Invalid SPDX license** — pack fails validation on load
- **Plain ids vs. refs** — use `{ id, version }` objects where required, not bare id strings

## Base Pack Reference Files

Use these as working examples:

- Base manifest: `content/manifest.json`
- Scenario: `content/scenarios/monolith_of_mild_despair-v1.json`
- Card: `content/cards/define_bounded_context-v1.json`
- Stakeholder: `content/stakeholders/cto-v1.json`
- Reaction rule: `content/stakeholder-reaction-rules/cto_wants_clarity-v1.json`

## Related Docs

- `CONTENT_SCHEMA.md` — full JSON schema reference
- `CONTENT_VERSIONING.md` — versioning rules and upgrade policy
- `ARCHITECTURE.md` — domain boundaries and pack loading model
