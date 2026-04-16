# GAME_DESIGN.md

This document describes the design of the DDDnD game.

DDDnD is a humorous simulation of software architecture decision making using concepts from Domain-Driven Design.

Players act as a systems architect trying to improve a struggling system under time pressure.

For architecture boundaries and routing, see [AGENT.md](AGENT.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

---

# Player Goal

The player must improve the system before time runs out.

They must balance:

- domain clarity
- maintainability
- developer morale
- stakeholder satisfaction
- delivery confidence
- user trust
- budget

Every decision involves tradeoffs.

---

# Core Mechanics

Players take actions using **architecture cards**.

Cards represent architectural decisions such as:

- defining bounded contexts
- clarifying team ownership
- introducing a shared model

Cards may:

- change scores immediately
- affect stakeholders
- schedule delayed consequences

---

# Architectural Aftershocks

Some decisions have delayed consequences.

These are represented by **Architectural Aftershocks**.

Examples:

- improved domain clarity after refactoring
- technical debt from temporary shortcuts

Aftershocks resolve at the start of later turns.

---

# Stakeholders

Stakeholders represent organizational forces.

Examples:

- CTO
- VP Product
- Lead Developer
- Operations Manager

Each stakeholder has reaction rules that respond to system conditions.

Stakeholders may influence:

- score changes
- project direction
- system stability

Stakeholder support is tracked on a 0–100 scale, with scenario-defined starting values and stakeholder-specific thresholds for labels such as critical, neutral, and supportive.

---

# Events

Random events represent unexpected pressures such as:

- production incidents
- customer demands
- leadership changes

Events occur after player actions.

Only one event may occur per turn.

---

# Ending Outcomes

Runs may end with different outcomes depending on:

- final score levels
- stakeholder states
- system health
- project stability

Outcomes include tier evaluation and legacy archetype criteria in the simulation/content layer.

In UI/player-facing surfaces, use `endingType` as the presentation term.

Examples:

- The Boundary Builder
- The Firefighter
- The System Stabilizer

---

# Scenario Catalog

The base game currently ships with five main scenarios:

- **The Monolith of Mild Despair** - stabilize a tangled legacy monolith before delivery confidence collapses
- **Microservice Sprawl** - restore clarity to an over-fragmented service landscape
- **Compliance Gauntlet** - survive regulatory pressure without sacrificing delivery capability
- **Startup Hypergrowth** - scale a product under explosive growth and operational strain
- **The Merger of Minor Chaos** - reconcile duplicate systems, competing domain models, and culture clashes after acquisition

Each scenario defines its own starting scores, stakeholders, card pool, event pool, turn horizon, and outcome pressure.

---

# Player Classes

Players select a `playerClass` before starting a run.

In UI/presentation work, use the term `playerClass` for this selection.

Examples:

- Boundary Mage
- Stakeholder Bard
- Reliability Cleric
- Legacy Ranger
- Delivery Rogue

Classes can include an optional `score_affinity`, which is recorded on the player profile and can support gameplay-facing bonuses.

They are part of run identity even when a specific class has no additional authored bonus.

---

# Challenge Modifiers

Runs may also include an optional challenge modifier.

Challenge modifiers are difficulty-shaping content that can:

- adjust starting scores
- override starting stakeholder satisfaction
- change the available turn count

They are selected at run setup and applied before play begins.

---

# User Experience Requirements

The game must include:

- a welcome page explaining the concept
- rules accessible at any time
- an "about" explanation
- a shareable end-of-run result
- responsive mobile-friendly UI

Players should be able to open rules or explanations during gameplay without losing progress.

---

# Tone

The tone should be playful and slightly satirical.

The game should feel educational without feeling like a tutorial.

Humor is encouraged.

---

# Tutorial System

The game includes an optional tutorial system that teaches new players the core mechanics.

## Tutorial Quests

Two tutorial quests are provided:

1. **Basics Tutorial** — Introduces scores, action cards, stakeholders, events, and aftershocks over 3 turns.
2. **Systems Under Pressure** — Demonstrates system coupling, trade-offs, and collapse mechanics over 5 turns.

## Tutorial Content Isolation

All tutorial content lives under `content/tutorial/`. Tutorial content never mixes with main gameplay content. The tutorial content provider loads from this separate namespace.

## Guided Hints

Each tutorial scenario references a **tutorial script** — a JSON file defining step-by-step hints. Each step has:

- a **trigger** (`run_start`, `turn_start`, `turn_end`, `run_end`) that determines when it appears
- a **highlight** indicating which UI area to draw attention to
- a **title** and **message** explaining the concept

Hints are driven entirely by content — they are not hard-coded in the UI.

## Adding a New Tutorial

1. Create scenario, cards, scores, events, stakeholders, and other content JSON files under `content/tutorial/`.
2. Create a tutorial script JSON under `content/tutorial/scripts/`.
3. Set `is_tutorial: true`, `tutorial_order`, and `tutorial_script_ref` on the scenario.
4. Add the scenario to the tutorial content manifest so the content registry exposes it as a tutorial entry point.

---

# Implementation Notes

The underlying simulation engine is implemented in TypeScript.

Strong typing helps ensure the deterministic behavior of the simulation, especially for:

- game state structures
- turn resolution records
- stakeholder rule evaluation
- scenario bundle contracts
- run export/import formats

The UI layer may use TypeScript but should remain simple and readable.