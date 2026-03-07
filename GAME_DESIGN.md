# GAME_DESIGN.md

This document describes the design of the DDDnD game.

DDD nD is a humorous simulation of software architecture decision making using concepts from Domain-Driven Design.

Players act as a systems architect trying to improve a struggling system.

---

# Player Goal

The player must improve the system before time runs out.

They must balance:

- architecture quality
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

Outcomes include both **tiers** and **archetypes**.

Examples:

- The Boundary Builder
- The Firefighter
- The System Stabilizer

---

# MVP Scenario

The MVP includes one scenario:

**The Monolith of Mild Despair**

A legacy monolith suffering from unclear domain boundaries.

Players must gradually introduce structure without destroying delivery speed.

---

# Player Classes

Players select a cosmetic architect class.

Examples:

- Boundary Mage
- Stakeholder Bard
- Reliability Cleric
- Legacy Ranger
- Delivery Rogue

Classes may affect gameplay in future versions.

For MVP they are cosmetic.

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

# Implementation Notes

The underlying simulation engine is implemented in TypeScript.

Strong typing helps ensure the deterministic behavior of the simulation, especially for:

- game state structures
- turn resolution records
- stakeholder rule evaluation
- scenario bundle contracts
- run export/import formats

The UI layer may use TypeScript but should remain simple and readable.