# How to play

::: tip Player help
Player rules for the live table. For packs, audits, or JSON wiring, see [Game design](/dashboard/).
:::

**Domain-Driven Design n' Dragons** is a tabletop adventure of software architecture. The dungeon is a living system. You join the council as the systems architect. Play free at [dddnd.app](https://dddnd.app).

## Your quest

Leave the system stronger than you found it, and keep the council with you, before the turns run out.

Each turn you play **one card** — a real architectural decision — or you spend the turn searching. Then the world may interrupt, and the council answers. Every choice trades something away.

## The table

You sit at the scenario’s table. The software system is the scene in the center. Stakeholders sit around it.

- **Legal hand** — usually six cards. Play from the hand in front of you.
- **Grimoire** — the rest of the pack. Look. Inspect. Do not play from the shelves.
- **Consult the Archives** — spend the turn to replace a card you do not want. Searching is delay.
- **Vials** — the system’s mood along the table, not a spreadsheet.
- **The council** — people in seats, each with their own agenda.

## Your move

Each turn you either play one card onto the table, or Consult and replace a card. If the deck is empty, Consult stays hidden: there is nothing left to draw.

Playing a card (or finishing a consult) lands on the table first. Then last turn may catch up as aftershocks. Then a random event may land — **Reality hits** — and the council may speak.

The engine still resolves delayed effects before your action. The table shows *your* move first so you can see what you just did. Press **Continue** through each beat. Skip remaining if you want speed.

Annals is a look at what already happened. The Grimoire shows what remains. Neither lets you play around the hand.

## The system (six vials)

These are the campaign scores. Up is good. The short name is what you read in the moment; the long name teaches on hover or tap.

| Score | Short | What it measures |
|---|---|---|
| Domain Clarity | Clarity | How well-bounded and coherent the system is |
| Maintainability | Craft | How easily the codebase can be changed |
| Delivery Confidence | Delivery | Ability to ship reliably |
| Team Morale | Morale | Team confidence and energy |
| User Trust | Trust | End-user confidence in the system |
| Budget | Purse | Runway for architectural investment |

Council **satisfaction** (0–100) lives on the seats, not as a seventh vial.

Mood bands on a vial: Steady / Strained / Troubled / Critical.

## Aftershocks

Some cards echo forward. A refactor may slow delivery now and raise clarity later. A quick fix may buy today and spawn tomorrow’s crisis. Aftershock marks on a card warn you. When one lands, the table pauses, shakes, and names what arrived.

## Consult the Archives

Open Consult, mark a hand card, choose a remaining page (or take a random legal one), and approve both names — “X replaced by Y.” Aftershocks, events, and the council still resolve. The turn was spent searching.

## Collapse

When a core score falls too far, coupling binds the table:

- **Delivery collapse** — gains to domain clarity and maintainability weaken
- **Morale collapse** — maintainability gains shrink
- **Trust collapse** — delivery gains shrink

Card glances show the reduced values. Stabilize the collapsed score first.

## A worthy ending

Your outcome is a **tier** (how well you did) and an **ending** (what kind of architect the table remembers). There is no single path.

Tiers in the base pack: Collapse, Struggle, Survival, Success, Triumph.

## Adventures

The lobby marks each plate Easy / Normal / Hard from the same win-rate bands the audit gates on. The fan opens on the gentlest plate.

| Adventure | Premise |
|---|---|
| **The Merger of Minor Chaos** | Reconcile duplicate systems after an acquisition |
| **The Monolith of Mild Despair** | Stabilize a tangled legacy monolith |
| **Compliance Gauntlet** | Survive regulatory pressure without losing delivery |
| **Startup Hypergrowth** | Scale under explosive growth |
| **Microservice Sprawl** | Restore clarity to an over-fragmented landscape |

Two tutorials teach the table first: **First Steps** and **Systems Under Pressure**. They use their own scores and never mix into the main pack.

## Classes

Before you sit, you pick a class. It is run identity. Some classes carry a score affinity.

| Class | Inclination |
|---|---|
| Boundary Mage | Domain clarity and structure |
| Stakeholder Bard | The council and the politics |
| Reliability Cleric | Stability and operations |
| Legacy Ranger | Incremental survival |
| Delivery Rogue | Shipping under chaos |
