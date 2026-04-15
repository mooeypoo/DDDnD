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
# CONTENT_SCHEMA.md

This document defines how authored game content is structured.

Content files live in the `/content` directory.

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
<id>-v<version>.json
```

Example:
```
define_bounded_context-v1.json
```

The file must include matching metadata:
```
"id": "define_boundedd_context"
"version": 1
```

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

Cards must remain understandable to readers.

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

# Event Structure

Events represent unexpected system pressures.

Events may:

- change scores
- change stakeholder satisfaction
- schedule delayed effects

Only one event may occur per turn.

---

# Delayed Effects

Delayed effects represent future consequences.

Each delayed effect specifies:

- number of turns until resolution
- score or stakeholder changes
- flavor text explaining the effect

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

Some supported content fields may be omitted in MVP authored content.

Examples include:

- card requirements
- direct stakeholder_changes on cards/events/effects
- score min/max values
- scenario failure conditions

When omitted, the engine applies sensible defaults or treats the field as absent behavior rather than invalid content.

Optional support in the engine does not require immediate use in every authored file.