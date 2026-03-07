# AGENT.md

This document defines the operational rules for humans and AI agents working in this repository.

The goal of these rules is to keep the architecture stable, the simulation deterministic, and the codebase readable.

Agents should read this file before making changes.

---

# Core Philosophy

The project is a simulation-driven web game about software architecture decisions.

The system is intentionally separated into clear domains:

- **content** – authored game data
- **simulation** – deterministic system evolution
- **persistence** – save/load/export
- **reporting** – summaries and shareable results
- **ui** – Vue components and presentation

Simulation logic must remain isolated from UI and browser concerns.

---

# Non-Negotiable Architecture Rules

### Simulation must be UI-agnostic

The simulation domain must **not** import:

- Vue
- Pinia
- browser APIs
- localStorage
- DOM APIs

Simulation must only depend on:

- `scenario_bundle`
- `game_state`
- pure rule logic

---

### UI must not contain gameplay rules

Vue components and stores may:

- call the engine
- display results

They must **not** implement:

- action resolution
- event selection
- stakeholder logic
- outcome classification

All gameplay logic belongs in `domains/simulation`.

---

### Persistence must not modify simulation behavior

Persistence code may serialize and deserialize state but must not influence game rules.

---

# Content Rules

Content lives in the `/content` directory.

Content files must:

- use **snake_case keys**
- be **human readable**
- use versioned filenames

Example:

```
define_bounded_context-v1.json
```

The file must contain matching metadata:

```
"id": "define_bounded_context",
"version": 1
```

Filename and internal version must match.

Content should be understandable to non-programmers.

Avoid cryptic identifiers.

---

# Versioning Rules

Content versions exist to maintain compatibility with old runs.

When content behavior changes, create a new version instead of editing the old one.

Old versions must remain intact.

Detailed rules are in `CONTENT_VERSIONING.md`.

---

# Testing Requirements

Simulation and content systems must be covered by automated tests wherever practical.

Important areas that must have tests:

- deterministic turn resolution
- scenario bundle construction
- stakeholder rule evaluation
- delayed effect scheduling
- export/import round-trip
- run determinism with seed + action sequence

---

# Changing Tests

Do not change tests just to make them pass.

If tests change:

1. Explain what behavior changed
2. Explain why the old expectation was incorrect or obsolete
3. Reference the architectural or gameplay rule supporting the change

Agents should summarize test changes clearly.

---

# Determinism Requirement

The simulation must be deterministic.

Given:

- the same scenario bundle
- the same seed
- the same sequence of actions

The run must produce identical results.

---

# Code Organization

Follow the domain structure:

```
src/domains/content
src/domains/simulation
src/domains/persistence
src/domains/reporting
src/ui
```

Do not collapse domains into shared helper modules.

Avoid generic "utils" for domain logic.

---

## TypeScript Usage Rules

This project uses TypeScript primarily to protect the simulation engine and other contract-heavy parts of the system.

TypeScript should improve **clarity and safety**, not introduce unnecessary abstraction.

### Where TypeScript should be used strongly

Use TypeScript fully in these domains:

- `src/domains/content`
- `src/domains/simulation`
- `src/domains/persistence`
- `src/domains/reporting`
- `src/shared/contracts`
- `src/shared/random`

These layers contain structured domain logic, runtime records, and import/export boundaries where strong typing improves correctness.

### Where TypeScript should be used lightly

The UI layer (`src/ui`) may use TypeScript but should remain simple.

Good uses include:

- typing component props
- typing store state
- typing composable return values
- referencing engine output types

Avoid unnecessary abstraction in UI code.

### Avoid unnecessary TypeScript complexity

Do not introduce advanced type-level programming unless clearly justified.

Avoid:

- complex conditional types
- deeply nested generics
- heavy type inference tricks
- clever utility types that reduce readability

Prefer:

- simple `interface` or `type` definitions
- readable unions
- explicit domain names

TypeScript is a **guardrail**, not a design goal.

### Content Validation Rule

Raw JSON content must not be treated as trusted typed data before validation.

The correct flow is:

1. Load JSON as untrusted input
2. Validate schema and references
3. Convert to typed domain objects
4. Use those typed objects in the simulation

Simulation code must only operate on validated, typed data structures.

---

# Naming Guidelines

Prefer readable names over short names.

Good:

```
resolve_stakeholder_rules
delayed_effected_instance
turn_history_entry
```

Avoid vague names like:

```
processData
handleThing
utils.js
```

---

# Prompting Expectations for AI

When making changes:

- read relevant docs first
- work in one domain at a time
- avoid unrelated refactors
- add or update tests where practical

Agents should explain architectural decisions when modifying system behavior.

---

# Final Principle

Clarity is more important than cleverness.

Readable systems are easier to maintain, extend, and reason about.