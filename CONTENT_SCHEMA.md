# CONTENT_SCHEMA.md

This document defines how authored game content is structured.

Content files live in the `/content` directory.

For domain boundaries and validation ownership, see [ARCHITECTURE.md](ARCHITECTURE.md) and [AGENT.md](AGENT.md).

For UI presentation terminology (`playerClass`, `endingType`, `avatarRole`), see [AGENT.md](AGENT.md). This schema document remains source-of-truth for JSON structure.

---

# Content Philosophy

Content must be:

- human readable
- versioned
- deterministic
- explicit

Architects and designers should be able to read content files easily.

Avoid cryptic identifiers or abbreviated keys.

---

# Key Formatting

All keys must use **snake_case**.

Example:
```
reaction_rules
score_changes
delayed_effect_ids
```

---

# File Naming

Content files use versioned filenames (see [CONTENT_VERSIONING.md](CONTENT_VERSIONING.md)).

Example:
```
<id>-v<version>.json
```

Example:
```
define_bounded_context-v1.json
```

The file must include matching metadata:
```
"id": "define_bounded_context"
"version": 1
```

---

# Validation and Limits

Every content file is untrusted until it passes a field-level schema, whether it ships with the game or comes from a community pack ([ADR 0001](docs/adr/0001-community-content-packs.md)). The schemas live in `src/domains/content/validation/`. The browser loader, the CLI scripts, and (later) Pack Studio all use the same `parseContentEntity` function.

Rules that apply to every file:

- **Unknown fields are errors.** A typo such as `stakehoder_changes` fails validation instead of being silently ignored.
- **Ids** (`id`, `score_id`, `stakeholder_id`, `target_id`, `score_affinity`, and keys of `starting_scores` / `score_adjustments`) must match `^[a-z0-9_]{1,64}$`. `__proto__`, `prototype`, and `constructor` are reserved.
- **Numbers** must be finite whole numbers within the ranges below.
- **Text** must not be blank, must stay under its length limit, and must not contain control characters (other than tab and newline) or Unicode bidirectional-override characters. Emoji and all writing systems are fine.
- **Files** must be at most 64 KB.

Limits (source of truth: `src/domains/content/validation/content_limits.ts`):

| Field | Limit | Base pack today |
|---|---|---|
| `name` | 120 characters | — |
| `short_name` (scores) | 32 characters | — |
| `description` | 600 characters | 174 |
| `short_description` | 240 characters | 95 |
| `flavor_text` | 400 characters | 93 |
| `condition_description`, `trigger_condition_description` | 240 characters | — |
| `style_tags` | 8 tags, 40 characters each | 3 |
| Score values (`default_value`, `min_value`, `max_value`, `starting_scores`) | -1000 to 1000 | 0–100 |
| Any `delta` | -100 to 100 | -20 to 30 |
| `max_turns` | 1–50 | 3–12 |
| `turns_until_resolution` | 1–20 | 1–3 |
| `cooldown_turns` | 0–20 | 1–3 |
| `usage_limit` | 1–50 or `null` | 1–3 |
| `occurrence_weight` | 1–1000 | 1–6 |
| `priority` | 0–1000 | 1–50 |
| `score_variance` | 0–50 | 5 |
| Scores per scenario | 12 | 6 |
| Stakeholders per scenario | 8 | 5 |
| Cards / events per scenario | 100 each | 26 / 17 |
| Score or stakeholder changes per entity | 16 | 6 |

Changing a limit is a schema decision. Record it in [docs/CONTENT_PACKS.md](docs/CONTENT_PACKS.md) and update this table.

---

# Scenario Structure

A scenario defines:

- scenario metadata
- compact summary (`short_description`, optional)
- starting score values
- stakeholder ids
- available cards
- possible events
- maximum turns
- outcome definitions
- coupling rules (`coupling_rule_refs`, optional; see below)

---

# Card Structure

Cards represent architectural decisions.

Cards may include:

- immediate score changes
- stakeholder changes
- delayed effects
- usage limits (`usage_limit`)
- cooldown windows (`cooldown_turns`)
- descriptive flavor text

Every `score_id` on a card, event, delayed effect, reaction rule, card requirement, or scenario failure condition must be listed in the consuming scenario’s `score_refs`. Packs that touch a score the scenario does not track fail bundle validation.

Cards must remain understandable to readers.

---

# Score Structure

Scores are tracked metrics for a scenario (the vials on the weather strip).

Required fields:

- `id`, `version` (must match `<id>-v<version>.json`)
- `name` — full player-facing name (hover/tap teaching on the weather strip)
- `short_name` — compact label used throughout play UI (strip, card deltas, aftershocks, theater, charge line)
- `description`
- `default_value`

Optional:

- `min_value`, `max_value`

`short_name` is mandatory. The UI does not invent compact titles from score ids; packs that omit it fail to load.

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

Adding or changing `short_name` alone is a cosmetic presentation change — see [CONTENT_VERSIONING.md](CONTENT_VERSIONING.md); no new score file version is required when gameplay numbers stay the same.

---

# Stakeholder Structure

Stakeholders include:

- name
- description
- reaction rule ids
- satisfaction thresholds

Reaction rules belong to stakeholders.

Scenarios reference stakeholders, not rules directly.

The `short_description` field is intended for compact UI surfaces such as banners and selection summaries.
When omitted, UI may fall back to other descriptive fields.

---

# Conditions

Anything that depends on the current state uses one structured condition shape:

```json
{ "target_type": "score", "target_id": "domain_clarity", "operator": "<", "value": 35 }
```

- `target_type`: `"score"` or `"stakeholder"` (stakeholder satisfaction, 0–100)
- `target_id`: a score id in the scenario's `score_refs`, or a stakeholder id in the scenario. Bundle validation rejects anything else, because a missing score would silently read as 0.
- `operator`: `<`, `<=`, `>`, `>=`, `=` or `==`
- `value`: whole number

Used by card `requirements`, scenario `failure_conditions`, reaction rule `condition`, and event `trigger_condition`.

---

# Reaction Rule Structure

A reaction rule is how a stakeholder responds to the state of the system. Each turn, every rule whose `condition` holds applies its changes, in `priority` order.

Required: `id`, `version`, `name`, `description`, `condition_description`, `condition`, `score_changes`. Optional: `stakeholder_changes`, `priority`.

```json
{
  "id": "cto_wants_clarity",
  "version": 1,
  "name": "CTO Wants Clarity",
  "description": "CTO pushes for better domain understanding when clarity is low",
  "condition_description": "Domain clarity < 35",
  "condition": { "target_type": "score", "target_id": "domain_clarity", "operator": "<", "value": 35 },
  "score_changes": [{ "score_id": "budget", "delta": -3 }],
  "stakeholder_changes": [{ "stakeholder_id": "cto", "delta": -5 }]
}
```

`condition` is what the engine evaluates. `condition_description` is the same rule written for people (shown in explainers and, later, Pack Studio). The engine never parses it. Before M1.4 (see [docs/CONTENT_PACKS.md](docs/CONTENT_PACKS.md)) the engine parsed this text at runtime, and a description it could not parse made the rule silently never fire.

---

# Event Structure

Events represent unexpected system pressures.

Events may:

- change scores
- change stakeholder satisfaction
- schedule delayed effects

Only one event may occur per turn.

An event can be limited to certain states with `trigger_condition` (a structured condition, see Conditions above). The event is only eligible while the condition holds. `trigger_condition_description` is the human-readable version, and an event that has the description must also have `trigger_condition`.

---

# Delayed Effects

Delayed effects represent future consequences.

Each delayed effect specifies:

- number of turns until resolution
- score or stakeholder changes
- flavor text explaining the effect

Score changes on delayed effects are subject to the same `score_refs` rule as cards and events.

---

# Coupling Rules

A coupling rule (`coupling-rules/<id>-v<version>.json`) says that while one score sits **below** a threshold, gains to other scores shrink. A collapsing system drags the rest down.

```json
{
  "id": "delivery_collapse",
  "version": 1,
  "name": "Delivery Collapse",
  "description": "Architecture improvements are less effective.",
  "trigger_score_id": "delivery_confidence",
  "threshold": 25,
  "affected_score_ids": ["domain_clarity", "maintainability"],
  "gain_multiplier": 0.7
}
```

- A rule applies only to scenarios that list it in `coupling_rule_refs`. The engine has no built-in coupling.
- **When it is active:** while the trigger score is strictly below `threshold`.
- **What it does:** positive changes to each affected score are multiplied by `gain_multiplier` (0.1–1) and rounded. Losses are never changed. When several active rules affect the same score, their multipliers stack (0.7 × 0.75 = 0.525).
- **What players see:** `name` and `description` are shown as the collapse warning while the rule is active, and in the rules screen during that adventure.
- **Validation:** the trigger and every affected score must be in the scenario's `score_refs`.
- A pack can reference a rule from a pack it depends on. The demo pack uses the base game's three rules.

---

# Outcome Definitions

Outcome definitions include:

- success tiers
- legacy archetype criteria (used by current content definitions)

Outcomes are determined based on final state and run analytics.

Presentation naming in UI may map these outcomes to `endingType` labels without changing content schema structure.

---

# Schema Stability

Content schema should evolve carefully.

If schema changes break compatibility, content versioning must be used to preserve older content definitions.

---

# TypeScript and Content

Content files are authored as JSON and should remain readable and simple.

TypeScript types exist in the codebase to represent **validated content objects**, not the raw JSON itself.

The intended flow is:

1. JSON files are loaded as untyped input
2. Schema validation ensures correctness
3. Validated objects are converted to typed domain structures
4. Simulation code operates on these typed structures

TypeScript definitions must not replace schema validation.

Validation is required even if TypeScript types exist.

---

## Optional Content Fields

Some supported content fields are optional in authored content.

Examples include:

- card requirements
- direct stakeholder_changes on cards/events/effects
- score min/max values
- scenario failure conditions

When omitted, the engine applies sensible defaults or treats the field as absent behavior rather than invalid content.

Optional support in the engine does not require immediate use in every authored file.