# Gameplay

DDDnD is a humorous simulation of software architecture decision-making using concepts from Domain-Driven Design. You play as a systems architect trying to improve a struggling system before time — and stakeholder patience — runs out.

## Your Goal

Improve the system before the turn limit expires. Every decision is a tradeoff between competing concerns:

| Score | What It Measures |
|---|---|
| Domain Clarity | How well-bounded and coherent the system is |
| Maintainability | How easily the codebase can be changed |
| Developer Morale | Team confidence and energy |
| Stakeholder Satisfaction | Organizational support for your work |
| Delivery Confidence | Ability to ship reliably |
| User Trust | End-user perception of system quality |
| Budget | Remaining runway for architectural investment |

## Core Loop

Each turn follows this sequence:

1. **Resolve Aftershocks** — Any delayed effects from previous decisions trigger first.
2. **Play a Card** — Choose an architecture card from your hand. Each card represents a real architectural decision (defining bounded contexts, introducing a shared model, clarifying team ownership, etc.).
3. **Resolve Card Effects** — Scores shift immediately. Some cards schedule delayed consequences.
4. **Stakeholder Reactions** — Each stakeholder checks their reaction rules against current system conditions and may change their satisfaction level.
5. **Random Event** — One event may fire. Events represent unexpected pressures like production incidents or leadership changes.

## Architecture Cards

Cards are the main player action. A card may:

- Adjust scores immediately (positive or negative)
- Change one or more stakeholders' satisfaction
- Schedule an **Architectural Aftershock** — a delayed effect that resolves in a future turn

Cards are drawn from the scenario's card pool. Not all cards are available every turn — some have prerequisite conditions.

## Architectural Aftershocks

Some decisions have delayed consequences, good or bad. Examples:

- A refactoring pass improves domain clarity two turns later
- A rushed shortcut accumulates technical debt that surfaces after a deadline

Aftershocks resolve at the **start** of the turn they are scheduled for, before you play your next card. Plan accordingly.

## Stakeholders

Stakeholders represent organizational forces that react to how the system is evolving. Each has:

- A **satisfaction level** tracked on a 0–100 scale
- Scenario-defined starting satisfaction
- **Reaction rules** that trigger on specific score thresholds or game conditions
- Labels like _Critical_, _Neutral_, and _Supportive_ at defined thresholds

Examples of stakeholders you might face: CTO, VP Product, Lead Developer, Operations Manager.

Stakeholders can help or hinder your progress. Keeping them satisfied — or knowing whose support you can afford to lose — is a key strategic consideration.

## Random Events

Each turn, one event may occur after your card play. Events are drawn from the scenario's event pool and represent external pressures:

- Production incidents
- Customer demands
- Leadership changes

Only one event fires per turn. Events can shift scores, alter stakeholder satisfaction, or create new constraints.

## Win Conditions

Runs end with a scored outcome depending on your final state:

- **Success** — Core objectives met, system health above threshold
- **Partial Success** — Some objectives met, moderate system health
- **Failure** — Core objectives not met or system health collapsed

Your ending unlocks an **outcome archetype** — a flavor title for your run, such as _The Boundary Builder_, _The Firefighter_, or _The System Stabilizer_ — which can be shared as a result card.

## Scenarios

DDDnD ships with five main scenarios, each with its own starting scores, stakeholder roster, card pool, event pool, and turn horizon:

| Scenario | Premise |
|---|---|
| **The Monolith of Mild Despair** | Stabilize a tangled legacy monolith before delivery confidence collapses |
| **Microservice Sprawl** | Restore clarity to an over-fragmented service landscape |
| **Compliance Gauntlet** | Survive regulatory pressure without sacrificing delivery capability |
| **Startup Hypergrowth** | Scale a product under explosive growth and operational strain |
| **The Merger of Minor Chaos** | Reconcile duplicate systems and competing domain models after an acquisition |
