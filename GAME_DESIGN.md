# GAME_DESIGN.md

This document describes the design of the DDDnD game.

DDDnD is a humorous simulation of software architecture decision-making using concepts from Domain-Driven Design.

The player joins the council as a systems architect and tries to leave a struggling system stronger before the turns run out.

For architecture boundaries and routing, see [AGENT.md](AGENT.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

The live play surface is the **war table** (legal hand, Grimoire, Consult, theater). The slice history and domain bets for that overhaul live in [docs/GAMEPLAY_V2.md](docs/GAMEPLAY_V2.md). This file is the design of the game as it is played now, not the satchel-era catalog.

---

# Player Goal

Leave the system stronger than you found it, and keep the council with you, before the last turn.

The system is six tracked scores (the vials on the weather strip). The council is a separate track: each stakeholder has satisfaction from 0–100. Satisfaction is not a seventh vial.

Campaign scores:

| Score | Short | What it measures |
|---|---|---|
| Domain Clarity | Clarity | How well-bounded and coherent the system is |
| Maintainability | Craft | How easily the codebase can be changed |
| Delivery Confidence | Delivery | Ability to ship reliably |
| Team Morale | Morale | Team confidence and energy |
| User Trust | Trust | End-user confidence in the system |
| Budget | Purse | Runway for architectural investment |

`short_name` is pack data. Play UI uses the short in the moment; the long name teaches on hover or tap.

Every decision is a tradeoff.

---

# The table

The player sits at the scenario’s table. The software system is the scene in the center. Stakeholders sit around it.

- The player holds a **legal hand of six** cards.
- The rest of the pack lives in the **Grimoire**: look and inspect, do not play from the shelves.
- Each turn the player either **plays one card** onto the table or **Consults the Archives** and spends the turn replacing a card.
- Playing a card (or finishing a consult) lands on the table first. Then last turn may catch up as aftershocks. Then a random event may land, and the council may speak.
- The engine still resolves delayed effects before the player action. Theater shows the player’s move first so the table is readable.

---

# Core Mechanics

Cards represent architectural decisions such as:

- defining bounded contexts
- clarifying team ownership
- introducing a shared model

Cards may:

- change scores immediately
- affect stakeholder satisfaction
- schedule delayed consequences (aftershocks)

Some cards have usage limits or cooldowns. Some have score requirements before they are legal.

---

# Architectural Aftershocks

Some decisions echo forward. These are **Architectural Aftershocks**.

Examples:

- a refactor pays off as better domain clarity two turns later
- a rushed shortcut leaves maintainability and morale worse after the deadline

Aftershocks resolve at the start of the turn they are scheduled for, before the player acts. The table pauses and names what arrived.

Every `score_id` on an aftershock must be a score the consuming scenario tracks. A leftover id still writes engine state and can hijack consult pressure; pack validation rejects that.

---

# Stakeholders

Stakeholders represent organizational forces around the table.

Examples:

- CTO
- VP Product
- Lead Developer
- Operations Manager

Each has reaction rules that respond to system conditions. They may change scores, project direction, or stability.

Stakeholder support is tracked on a 0–100 scale, with scenario-defined starting values and labels such as critical, neutral, and supportive.

---

# Events

Random events represent unexpected pressures such as:

- production incidents
- customer demands
- leadership changes

At most one event occurs per turn, after the player action. Plaques say **Reality hits**.

---

# Coupling and collapse

If a core score falls too far, coupling binds the table:

- **Delivery collapse** — gains to domain clarity and maintainability weaken
- **Morale collapse** — maintainability gains shrink
- **Trust collapse** — delivery gains shrink

The chamber storms. Stabilize the collapsed score, or the rest of the work fights a system that will not hold.

Player-facing score bands are system mood: Steady / Strained / Troubled / Critical.

---

# Ending Outcomes

A run ends with a **tier** (how well you did) and an **ending** (what kind of architect the table remembers).

In UI and player-facing surfaces, use `endingType` for the ending. Do not teach a single “archetype unlock.”

Authored tiers in the base pack:

- Collapse
- Struggle
- Survival
- Success
- Triumph

Example endings: The Boundary Builder, The Firefighter, The System Stabilizer.

---

# Scenario Catalog

The base game ships five main adventures. Lobby marks are Easy / Normal / Hard, derived from the same win-rate bands the audit gates on. The fan opens on the gentlest plate.

- **The Monolith of Mild Despair** — stabilize a tangled legacy monolith before delivery confidence collapses
- **Microservice Sprawl** — restore clarity to an over-fragmented service landscape
- **Compliance Gauntlet** — survive regulatory pressure without sacrificing delivery capability
- **Startup Hypergrowth** — scale a product under explosive growth and operational strain
- **The Merger of Minor Chaos** — reconcile duplicate systems, competing domain models, and culture clashes after acquisition

Each adventure defines its own starting scores, stakeholders, card pool, event pool, turn horizon, and outcome pressure.

---

# Player Classes

Players select a `playerClass` before starting a run.

Examples:

- Boundary Mage
- Stakeholder Bard
- Reliability Cleric
- Legacy Ranger
- Delivery Rogue

Classes can include an optional `score_affinity`. They are part of run identity even when a class has no extra authored bonus.

---

# Challenge Modifiers

Runs may include an optional challenge modifier that can:

- adjust starting scores
- override starting stakeholder satisfaction
- change the available turn count

They are selected at run setup and applied before play begins.

---

# User Experience Requirements

The game must include:

- a welcome door that names the quest
- rules accessible at any time
- an about explanation
- a shareable end-of-run result
- a responsive, mobile-friendly table

Players should be able to open rules during a run without losing progress.

The public play URL is `https://dddnd.app`.

---

# Tone

Playful and slightly satirical.

Educational without feeling like a lecture. Humor is encouraged.

---

# Tutorial System

Optional tutorials teach the table.

## Tutorial Quests

1. **Basics Tutorial** — Hand, scores, stakeholders, events, and aftershocks over 3 turns.
2. **Systems Under Pressure** — Coupling, tradeoffs, and collapse over 5 turns.

## Tutorial Content Isolation

All tutorial content lives under `content/tutorial/`. It never mixes into the base pack inventory. The tutorial provider loads from that namespace.

## Guided Hints

Each tutorial scenario references a **tutorial script**. Each step has a trigger, a highlight (hand, weather, seats, coupling), a title, and a message. Hints are authored content, not hard-coded UI.

## Adding a New Tutorial

1. Create content JSON under `content/tutorial/`.
2. Create a tutorial script under `content/tutorial/scripts/`.
3. Set `is_tutorial`, `tutorial_order`, and `tutorial_script_ref` on the scenario.
4. Add the scenario to the tutorial manifest entry points.

---

# Implementation Notes

The simulation engine is TypeScript and UI-agnostic.

Strong typing protects:

- game state structures
- turn resolution records
- stakeholder rule evaluation
- scenario bundle contracts
- run export/import formats

The UI layer may use TypeScript but should stay readable. It presents the table and calls engine verbs. It does not resolve actions, pick events, or apply stakeholder rules.
