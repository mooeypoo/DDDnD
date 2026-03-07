# ARCHITECTURE.md

This document describes the technical architecture of the DDDnD game.

The game simulates the evolution of a software system as architectural decisions are made over multiple turns.

---

# High Level Structure

The system is divided into domains:

```
content - authored game data
simulation - deterministic game engine
persistence - save/load/export
reporting - summaries and sharing
ui - Vue interface
```

Simulation must remain independent from UI and browser concerns.

---

# Core Concepts

## Scenario

A scenario defines:

- starting scores
- stakeholders
- available cards
- possible events
- maximum turns
- victory/failure conditions

Scenarios are versioned content files.

---

## Scenario Bundle

Before a run starts, the system builds a **scenario bundle**.

A scenario bundle contains all content needed for the scenario:

- scenario definition
- scores
- stakeholders
- stakeholder reaction rules
- cards
- events
- delayed effects
- outcome definitions

The bundle must be fully validated and contain no missing references.

The simulation engine only depends on the scenario bundle.

---

# Simulation Engine

The simulation engine exposes the following API:

```
create_engine({ scenario_bundle })

engine.create_run(): GameState
engine.get_turn_briefing(): TurnBriefing
engine.play_turn(action_id): TurnResolution
engine.get_turn_outcome(): RunOutcome
```

These APIs should be defined with explicit TypeScript interfaces.

The engine operates entirely on:

- `scenario_bundle`
- `game_state`
- deterministic rule evaluation

---

# Game State

Game state contains the mutable state of a run.

Key elements include:

- current turn
- score values
- stakeholder satisfaction
- queued delayed effects
- turn history
- run analytics

Game state must be serializable.

---

# Turn Resolution Pipeline

Each turn follows this sequence:

1. **Architectural Aftershocks**

   Delayed effects scheduled from earlier turns resolve.

2. **Player Action**

   The selected action card resolves.

3. **System Event**

   One scenario event may trigger.

4. **Stakeholder Resolution**

   Stakeholders react to the current state.

5. **Turn Wrap-Up**

   - score totals updated
   - history entry recorded
   - outcome checks executed

Stakeholder rules run **once per turn** and do not recursively trigger new stakeholder evaluations.

## Canonical Turn Phases

The simulation uses the following canonical turn phases:

- `turn_start`
- `architectural_aftershocks`
- `turn_briefing`
- `action_selection`
- `action_resolution`
- `event_resolution`
- `stakeholder_resolution`
- `turn_wrap_up`
- `run_outcome_check`
- `completed`

For MVP, delayed effects resolve only during `architectural_aftershocks`, even though runtime records may use the broader phase vocabulary for future extensibility.

## Stakeholder Satisfaction Scale

Stakeholder satisfaction is modeled as a numeric value on a 0–100 scale.

- `0` represents complete loss of support
- `50` represents a neutral midpoint
- `100` represents maximum support

Scenarios define starting stakeholder values. Stakeholder content defines threshold ranges such as critical, low, neutral, and supportive.

## Transient vs Persisted Turn Records

`turn_resolution_context` is a transient runtime structure used during turn execution and immediate UI handoff.

It is not the canonical persisted record of a run.

Completed turns are archived as `turn_history_entry` objects in `game_state.history`.

If future versions require mid-turn save/resume, persistence of partial turn context should be introduced explicitly rather than assumed.

---

# Determinism

The simulation must produce identical results given:

- the same seed
- the same scenario bundle
- the same action sequence

All randomness must use a seeded random generator.

---

# Code Structure

```
src/domains/content
src/domains/simulation
src/domains/persistence
src/domains/reporting
src/ui
```

Simulation must not import UI or browser APIs.

---

# TypeScript Policy

The project uses TypeScript to strengthen the correctness of the simulation engine and content contracts.

TypeScript is especially valuable in areas that contain structured data and rule evaluation.

These layers should be strongly typed:

- simulation engine
- scenario bundle structures
- content provider outputs
- persistence/export payloads
- reporting summaries
- shared runtime records

These components form the deterministic core of the system and benefit from explicit type contracts.

---

## UI Layer

The UI layer may use TypeScript but should remain lightweight.

UI components should not introduce complex type abstractions or heavy generic patterns.

The purpose of UI typing is simply to:

- clarify props
- clarify store state
- ensure compatibility with engine outputs

UI code should remain readable and approachable.

---

## Content Validation Boundary

Content files are stored as JSON and are not trusted until validated.

Content loading follows this flow:

1. Load JSON files
2. Validate structure and references
3. Convert validated objects to typed domain structures
4. Build the `scenario_bundle`

The simulation engine operates only on validated, typed content.

This prevents invalid content from corrupting simulation state.

---

# UI Responsibilities

The UI layer:

- displays simulation results
- allows player interaction
- triggers engine actions

The UI must not implement simulation rules.

---

# Persistence Responsibilities

Persistence manages:

- save files
- run exports
- import functionality

Persistence must not change simulation behavior.

---

# Reporting

Reporting produces:

- end-of-run summaries
- shareable results
- run analysis

Reporting reads simulation history but does not modify state.
