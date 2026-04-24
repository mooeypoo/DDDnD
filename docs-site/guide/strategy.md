# Strategy

Winning at DDDnD requires balancing short-term score recovery with long-term system health — and knowing which stakeholders you can afford to disappoint along the way.

## Choose Your Class

Before starting a run, you select a **player class**. Your class represents an architectural archetype and influences your identity throughout the run. Some classes include a `score_affinity` that shapes how you think about your strategy.

| Class | Archetype |
|---|---|
| **Boundary Mage** | Domain clarity and structural coherence |
| **Stakeholder Bard** | Organizational influence and political navigation |
| **Reliability Cleric** | System stability and operational confidence |
| **Legacy Ranger** | Legacy system survival and incremental improvement |
| **Delivery Rogue** | Shipping fast under constraints and chaos |

Choose the class that matches how you like to play — or the one that best fits the scenario you're facing.

## Card Families

Cards are grouped by the type of decision they represent:

| Family | What It Does |
|---|---|
| **Refactoring** | Improve code clarity and reduce technical debt |
| **Infrastructure** | Build or stabilize supporting systems |
| **Team Dynamics** | Manage developer morale and communication |
| **Process** | Establish workflows, governance, and predictability |
| **Fixes** | Address immediate bugs and reliability issues |

Knowing which family a card belongs to helps you anticipate its tradeoffs. A refactoring card might boost domain clarity but temporarily dip developer morale. A process card might help delivery confidence but frustrate your Lead Developer.

## Core Tradeoffs

No card is purely positive. Effective strategy means understanding the cost:

- **Technical vs. Organizational** — Structural improvements often create short-term friction with stakeholders who want visible delivery progress.
- **Short-term vs. Long-term** — Some cards deliver immediate relief at the cost of a future Aftershock. Read card effects carefully before playing.
- **Breadth vs. Depth** — Spreading effort across many scores keeps you stable but may not reach the threshold needed for any single win condition.

## Managing Stakeholders

Stakeholders watch what you do and react. A stakeholder who becomes _Critical_ can actively hurt your scores each turn through their reaction rules.

Tips:

- **Know the reaction rules** — Each stakeholder reacts to specific conditions. A CTO who values domain clarity will punish architectural shortcuts. A VP Product who cares about delivery will punish stagnation.
- **Don't ignore a dissatisfied stakeholder** — Satisfaction below the _Critical_ threshold can trigger punishing reactions repeatedly. One unhappy stakeholder can cascade into a failed run.
- **Some scenarios let you trade one stakeholder for another** — Decide early whose support is essential and whose can be managed down.

## Reading Aftershocks

When you play a card that schedules a delayed effect, you will see it queued for a future turn. Aftershocks can be:

- **Beneficial** — A refactoring investment pays off in domain clarity later
- **Punishing** — A rushed shortcut creates a debt spike after the next delivery milestone

Before playing a card with a significant Aftershock, ask: will my scores survive what's coming?

## Scenario-Specific Tactics

Each scenario has its own pressure profile. General heuristics:

| Scenario | Primary Pressure | Key Focus |
|---|---|---|
| **Monolith of Mild Despair** | Delivery confidence decay | Stabilize incrementally; avoid big-bang rewrites |
| **Microservice Sprawl** | Domain clarity collapse | Prioritize bounded context cards early |
| **Compliance Gauntlet** | Regulatory event pressure | Keep process scores high; events are punishing |
| **Startup Hypergrowth** | Budget and morale drain | Keep morale up; budget loss is fast and irreversible |
| **Merger of Minor Chaos** | Stakeholder conflict | Pick your political side early; don't try to please everyone |

## Challenge Modifiers

Some runs apply an optional **challenge modifier** that adjusts the starting conditions:

- Modified starting scores (higher or lower)
- Overridden stakeholder starting satisfaction
- Changed turn count

Modifiers are selected at run setup. They are designed to increase difficulty or create a specific pressure scenario for experienced players.
