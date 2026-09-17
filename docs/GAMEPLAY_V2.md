# Gameplay v2

Status: Active plan on branch `gameplay-v2`  
Audience: future-us, other agents, and later writing (blog posts, talks)  
Related: [AGENT.md](../AGENT.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [GAME_DESIGN.md](../GAME_DESIGN.md), [CONTENT_VERSIONING.md](../CONTENT_VERSIONING.md), [docs/CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md](CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md)

This is the canonical document for the play overhaul. If a conversation starts cold, read this after the base AGENT.md set.

---

## 1. What we are doing, in one page

DDDnD is already a complete game in the engine. You pick a scenario from a content pack, play one architecture card per turn, and the simulation resolves aftershocks, the card, one event, stakeholder reactions, and wrap-up. Same seed + same pack + same action sequence always produces the same run.

The live UI does not feel like that game. It feels like a catalog. About 21–26 cards are offered at once, six numeric scores sit in a HUD, and the five-phase turn is dumped as a log after you click Play. There is a scene postcard with stakeholder sprites, but the cards live in a drawer underneath it. Mobile is admitted as second-class.

Gameplay v2 rebuilds **how a run is seen and played**, not the product underneath it.

The player-facing fantasy is a **war table**: you sit at the scenario’s table. The software system is a diorama in the center. Stakeholders sit around it. You hold a **legal hand of six** cards. You may inspect the rest of the deck in a **Grimoire** (look, don’t play). You may **Consult the Archives** and spend the turn replacing a card you do not want, while the system keeps moving. Playing a card is placing it on the table. The turn plays out as beats, not as a spreadsheet.

We can do this without a rewrite of “the game” because the game was never the Vue tree. The game is a deterministic engine plus versioned content packs. That was a deliberate architectural bet. This overhaul is the payoff.

---

## 2. Why the original boundaries make this cheaper than it looks

A lot of game rewrites fail because presentation, rules, and data grew up in the same files. Change the camera, and you discover victory conditions were hiding in a CSS class. Change the card layout, and you discover the AI opponent was reading the DOM.

DDDnD split those concerns early:

| Domain | Owns | Must not own |
|---|---|---|
| **content** | Human-readable JSON packs, manifests, `{ id, version }` refs, scenario bundles | How a card is rendered, who looks like a wizard |
| **simulation** | Rules, turn pipeline, seeded randomness, outcomes | Vue, the DOM, Three.js, localStorage |
| **persistence** | Save/load/export of simulation state | Changing what a card does |
| **reporting** | Summaries and share cards | Gameplay behavior |
| **ui** | Scene, `avatarRole`, `endingType`, tutorial chrome, the feel of play | Action resolution, event picks, stakeholder rules |

The engine API is small on purpose: `create_run`, `get_turn_briefing`, `play_turn`, `get_run_outcome`. The UI already calls those and is forbidden from inventing rules. Scene art and stakeholder portraits are presentation assignments, not domain entities. Content packs already load, merge, and override.

So “make it feel like a game” is mostly a new play shell on top of a stable contract. The one place we *do* touch the engine is the place where a skin would lie: **which cards are legal this turn**.

That is the lecture version of the bet: if you keep the rules UI-agnostic, you can throw away the interface without throwing away the game. If you keep content in packs, you can change how cards are *offered* without asking authors to ship meshes. If you keep tests on the engine, you can prove the new offer model is the same game the audits think it is.

---

## 3. What stays, what changes

### Stays (this is the product)

- Cards as architectural decisions, with immediate effects and delayed **Architectural Aftershocks**.
- Stakeholders as organizational forces on a 0–100 satisfaction scale, with authored reaction rules.
- One system event per turn, after the player acts.
- Determinism. Seeded randomness only.
- Content packs as the way scenarios, cards, classes, modifiers, and tutorials exist.
- Future authors building or editing packs without learning the renderer.
- Tutorial content isolated under `content/tutorial/`, processed by the same engine.
- Tone: playful, slightly satirical, educational without feeling like a lecture.

### Changes (this is the overhaul)

- **Legal hand of 6**, not a catalog of 21–26 playable buttons.
- **Inspect-only Grimoire** for the remaining deck. Seeing the pack is still part of teaching. Playing from it is not.
- **Consult the Archives**: spend the turn to discard 1 card from hand and draw a replacement. Aftershocks, event, and stakeholders still resolve. Searching for a better option is delay. That is the architecture joke.
- **Turn theater**: `play_turn` stays atomic in the engine. The UI later *replays* the phase records as beats.
- **War table presentation**: portrait-first, scene-as-place, compact “weather” instead of an observability HUD.
- **Modest extra turn budget** on main scenarios (about +2), as a new content version, after we have an audit baseline under the new hand rules. Not a doubled clock. Tutorials stay small.

### Explicitly not this project

- A second game at the repo root (`game-v2/` as a domain).
- A walkable Three.js dungeon as the application.
- Asking pack authors to ship 3D scenes.
- A free once-per-turn swap that lets a player cycle to the optimal card. That recreates full-pool fairness with extra taps.
- Changing card math, stakeholder rules, or event weights just to make the new UI look busy.

Three.js, if it appears at all, is a later optional diorama *island* with a 2.5D fallback. Vue still owns copy, accessibility, tutorial highlights, and pack UI.

---

## 4. The play model, with the engineering underneath

### Hand, deck, pool

Think of three piles, all simulation-owned:

1. **Pool** — `action_state.available_action_refs`. The scenario’s authored card list. Unchanged. This is what content packs define.
2. **Hand** — up to six currently playable cards the player may commit this turn.
3. **Deck** — the other currently playable cards. Visible in the Grimoire. Not legal to play.

Cards that are on cooldown, exhausted, or failing requirements sit in none of the last two. When they become playable again, they return to the deck, then can be drawn.

`hand_size = min(6, playable_count)`. Tutorial basics has 4 cards; the pressure tutorial has 6. Those runs *are* the whole pool in hand. `required_card_id` in tutorial scripts keeps working. Consult hides when the deck is empty. The engine does not special-case tutorials.

### Opening deal

Seeded. Not `Math.random()`. Two cards biased toward current pressure (lowest scores), the rest shuffled from the remainder. A fully weighted deal plays the game for you. A fully random deal bricks too often.

### Playing a card

`play_turn(action_id)` still exists. It now **rejects** a card that is not in hand. After a legal play, the card leaves the hand. The briefing is read-only, so the engine refills the hand at the end of the turn — after the turn counter advances — putting newly playable cards back through the deck. That is how a zero-cooldown card can be played again on the next turn without sitting in a hidden pile.

### Consulting the archives

This is an **engine verb**, not a fake content card. Pack authors should not have to remember to include a “search” card. The engine grows a sibling API:

- `play_turn(action_id)` — play a card from hand
- `consult_archives(discard_ids)` — spend the turn, replace 1 card, no card effects, full pipeline otherwise

History records a `player_intent` so exact-run replay knows whether the turn was a card or a consult, and which card was discarded. Exact-run format v2 stores `turn_intents` for that sequence. Saves restore `hand_state`.

### Why a legal hand is not a skin

The current fairness runner picks a random playable card from the **entire** pool. If the UI hid 20 cards but `play_turn` still accepted them, a clever player (or a test) would still be playing the catalog. If the UI hid 20 cards and `play_turn` rejected them, but the audit still picked from 26, we would bless scenarios that are only fair with a catalog.

AGENT.md is blunt: UI must not implement gameplay rules. A legal hand is a rule. It lives in simulation. The UI only renders the hand it was given.

### Fairness after this

Two layers, both in simulation, both later than slice 1:

- **Player-true (pass gate).** Bots get the same hand, may consult under the same cost, and may only play from hand.
- **Oracle (report).** Full-pool bot. If the oracle recovers and the hand bot cannot, the pack has a catalog-only rescue. That is an author signal, not a reason to reopen the satchel.

Do not change `max_turns` until that player-true baseline exists. Aftershocks in content mostly resolve in 2–3 turns; main scenarios are 9–12 turns today; Speed Run already subtracts 2. Expect about +2 productive turns so one or two consults do not empty the clock, then retune. That bump is a **new scenario version** per [CONTENT_VERSIONING.md](../CONTENT_VERSIONING.md).

---

## 5. Content packs remain the point

A content pack is a versioned pile of JSON plus a manifest: scenarios, cards, stakeholders, events, delayed effects, classes, modifiers, outcomes. Later packs can extend or override matching `{ id, version }` refs. The engine never sees raw JSON; it sees a validated `scenario_bundle`.

Gameplay v2 does **not** replace that with “levels in the renderer.”

Authors still write a **pool**. The deal is a play policy over that pool. A pack with 4 cards is a 4-card hand. A pack with 26 cards is a 6-card hand plus a deck. The war table does not need new art fields on cards to function. Scene and `avatarRole` stay UI assignments.

That is how we keep the near-future promise: people can build or edit packs and play them. They should not need Three.js, and they should not need to encode a hand in every scenario file (we can add an optional authored `hand_size` later if packs need it; v1 is the engine default of 6).

Tutorial packs stay namespaced. Same engine, smaller pools, same hand rules.

---

## 6. Where the code lives

Do not add a parallel product tree.

| Place | Role |
|---|---|
| `src/domains/simulation/` | Hand, deck, deal, consult, briefing fields, tests |
| `src/domains/content/` | Unchanged in slice 1. Scenario `max_turns` v2 files only when we retune |
| `src/domains/persistence/` | Slice 3: exact-run intents, save restore of `hand_state` |
| `src/ui/play/` | Slice 6: war table shell, session director, hand dock. `/game` defaults here. |
| `src/ui/views/game_view.vue` | Slice 6 switcher: war table by default, satchel stage if `?stage=legacy` |
| `src/ui/views/legacy_game_view.vue` | Slice 4 satchel stage, kept as the flagged fallback |
| `src/ui/config/` + presentation composables | Existing scene/avatar registries. Keep using them |

`docs/CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md` used to say “UI-only redesign.” That is no longer true. The hand is simulation. The war table is UI. Do not mix them in the same slice.

---

## 7. Tests: what has to change, and why we are not “changing tests to make them pass”

The rule in AGENT.md still holds: do not edit tests only to force a green bar. Do edit tests when the **rule under test** changed, and say so.

### Engine tests that should keep passing as-is

Small pools (1–5 cards) fit in a hand of 6. `tests/simulation/engine_shell.test.ts`, `turn_pipeline.test.ts`, and `card_availability.test.ts` use tiny bundles. They still play named cards that are in hand. Off-hand / exhausted cards should still surface the existing availability errors (usage limit, cooldown) so those tests keep their meaning.

### Tests that assumed the catalog was legal

`tests/simulation/stakeholder_state_diagnosis.test.ts` loads the real monolith scenario (~26 cards) and repeatedly plays `define_bounded_context`. Under a legal hand that card may be in the deck. Those tests are about stakeholder reactions, not about that one card being globally legal. They should play a **card from the current hand** (still a real engine action). That is a rule-aligned update, not a cosmetic patch.

### Audit / runner

`simulation_runner.ts` currently picks a random playable card from the full briefing list. As soon as `play_turn` rejects off-hand cards, a full-pool pick will throw. Slice 1 includes a **minimal** runner change: pick from the hand. Slice 2 adds the consult policy and the oracle report.

### New tests that must exist

`tests/simulation/hand_state.test.ts` (name may vary) should lock:

- Same seed ⇒ same opening hand
- `play_turn` of a deck card throws
- Playing a card leaves the hand and draws a refill when the deck has cards
- Pools smaller than 6 deal the whole playable set
- Consult discards, draws, advances the turn, fires the pipeline, does not apply card score changes
- Consult with an empty deck throws
- Unplayable held cards leave the hand
- Determinism: same seed + same intent sequence (cards and consults) ⇒ same result

If those fail, the war table cannot be honest later.

### UI tests

Leave them until slice 4. Do not teach `game_view` to lie about the hand in slice 1.

---

## 8. Implementation slices (the plan to resume from)

Work one domain at a time. Mergeable slices, in this order.

### Slice 1 — Hand engine (done)

Simulation only.

- Add `hand_state` (`hand_refs`, `deck_refs`) on `game_state`.
- Deal on `create_run`.
- Briefing exposes hand, inspectable deck, and whether consult is legal.
- `play_turn` rejects off-hand cards; refill after play.
- `consult_archives` runs the pipeline without card effects.
- Record `player_intent` on the turn records.
- New hand tests; minimal runner pick-from-hand; fix catalog-assuming simulation tests.
- Update this file and [ARCHITECTURE.md](../ARCHITECTURE.md) as the API lands.

Not in slice 1: Vue, scenario JSON, Three.js, war table, `max_turns` bumps.

### Slice 2 — Player-true audit (done)

Runner bots may consult under the same cost. Oracle full-pool report exists and is not the pass gate. Catalog-only recovery becomes a diagnostic.

- Default `simulate_runs` policy is `player_true`: play from the legal hand; consult when the hand cannot address current pressure and the deck still might.
- `full_pool_oracle` deals the entire playable pool (`legal_hand_size` override stored on `hand_state` so replenish does not shrink it).
- `buildContentAuditReport` still gates on the player-true report. An optional oracle report can emit an **info** `catalog_only_recovery` finding. Info does not fail `audit:gate`.
- Audit scripts (`audit-gate`, `generate-audit-report`, `validate-content-pack`, `run-simulation --audit`) run both policies.

### Slice 3 — Persistence (done)

Saves restore hand and deck. Exact-run replay includes consult intents. Bump exact-run format version if the action sequence shape changes.

- Save files still wrap `game_state`. Missing `hand_state` migrates to the full available pool (the old catalog) with legal hand size 6. Missing `legal_hand_size` defaults to 6.
- Exact-run format is **v2**: `turn_intents` is the replay sequence. `action_sequence` is only cards actually played. Consults are not rewritten as plays of the discarded card.
- Exact-run **v1** still deserializes: each action_sequence ref becomes a `play_card` intent, and the payload is upgraded to v2.

### Slice 4 — Current UI, new contract (done)

`game_view` (now `legacy_game_view.vue`) plays only the hand. Grimoire inspects the deck. Consult control exists. The old stage is still the old stage. The mechanic is live and testable by a human.

- Satchel lists `hand_action_summaries` only.
- Deck cards render in an inspect-only Grimoire section. Details modal play is hidden for those cards.
- Consult the Archives is an engine call (`consult_archives`), not a fake content card. The player picks one hand card to set aside.

### Slice 5 — Turn budget (deferred until human play)

Main scenario **v2** files, about +2 `max_turns`, after a baseline audit. Tutorials unchanged unless a tutorial script needs a consult beat (it probably does not).

**v1 player-true baseline (2026-09-17, 25 runs, seed `audit-gate`):**

| Scenario | Clock | Player-true win | Oracle win | Avg consults |
|---|---|---|---|---|
| monolith_of_mild_despair | 10 | 64% | 52% | 0.68 |
| microservice_sprawl | 9 | 76% (above 25–50% band) | 68% | 0.20 |
| compliance_gauntlet | 12 | 68% | 72% | 0.76 |
| startup_hypergrowth | 10 | 72% (above 35–60% band) | 76% | 0.00 |
| merger_of_minor_chaos | 11 | 80% (top of 50–80% band) | 80% | 0.16 |

The hand bot almost never consults, and two scenarios are already too easy on the current clock. A blanket +2 would likely push them further. Humans will consult more than this bot; retune after visual play, not before.

### Slice 6 — War table shell

`src/ui/play/`: session director that replays `turn_resolution_context` phases, portrait table, hand dock, compact meters, existing scene/avatar registries. Route `/game` defaults to the table; `?stage=legacy` restores the satchel stage. Tutorial highlight `satchel` maps to `hand` in UI (alias, not a content rewrite). CSS/2.5D first.

Landed: `/game` is a candlelit council table. Scores are weather vials. The legal hand sits on the near rim. Consult and Grimoire are table tools. After `play_turn` / `consult_archives`, the UI replays aftershocks → commitment → event → stakeholder voices. The engine APIs are unchanged.

### Slice 7 — War table playability (in progress)

Human-play polish on the slice 6 shell. Still no Three.js and no `max_turns` bump.

- Hide the site-credit footer on `/game` so the table is the whole field.
- Card details stack above the Grimoire instead of under it.
- Tutorial popups wait until turn theater finishes. `satchel` / `scores` / `stakeholders` / `aftershocks` highlights map onto the hand, weather strip, and seats.

---

## 9. How to talk about this later (notes for writing)

A few sentences that are true and useful:

- We did not “add a game to a simulation.” We finally presented the simulation as a game.
- The hard part was not 3D. The hard part was **not lying** about which decisions were available, while keeping packs authorable.
- A catalog of architecture patterns teaches vocabulary. A hand of six under time pressure teaches tradeoffs. Both use the same cards.
- Consult is the fairness valve that is also the lesson: waiting for a better option is a decision the system will charge you for.
- Domain-driven design here is not ceremony. It is why the engine tests still mean something after the interface changes.
- Content packs are the expansion model. The war table is a client of packs, not a replacement for them.

When a slice lands, add a short dated note under [Changelog for writers](#changelog-for-writers) so the story stays in sync with the code.

---

## 10. Working agreements for agents and humans

1. Read this file before changing play, hand, consult, or the war table.
2. Simulation still must not import Vue, Pinia, DOM, or browser storage.
3. UI still must not resolve actions, pick events, or apply stakeholder rules.
4. Do not implement a legal hand only in Vue.
5. Do not add a fake `consult_archives` content card to packs.
6. Do not bump scenario `max_turns` in the same slice as the engine hand unless audit evidence is already in.
7. Prefer one domain per slice. Update this plan when a slice finishes or when a decision changes.
8. Terminology: `playerClass`, `endingType`, `avatarRole`. Do not expand `archetype` in new UI work.

---

## Changelog for writers

- **2026-09-17** — Plan locked: war table, legal hand of 6, inspect-only Grimoire, turn-costing consult, player-true audit later, CSS/2.5D first.
- **2026-09-17** — Slice 1 engine landed on `gameplay-v2`: `hand_state`, seeded deal, `play_turn` rejects off-hand cards, `consult_archives` is an engine verb, briefing exposes hand/deck, runner picks from the hand. Catalog-assuming tests now play from the hand. Vue play shell is still the old satchel (slice 4).
- **2026-09-17** — Slice 2 audit landed: player-true bots may consult; full-pool oracle is a diagnostic report; catalog-only recovery is an info finding and not the pass gate.
- **2026-09-17** — Slice 3 persistence landed: saves restore hand/deck; exact-run v2 records `turn_intents` so consults replay as consults.
- **2026-09-17** — Slice 4 wired the current satchel: play from the legal hand, inspect-only Grimoire, Consult the Archives spends the turn. War table is still slice 6.
- **2026-09-17** — Slice 5 deferred: v1 player-true baseline is not clock-starved (bots consult <1 time per run; sprawl and hypergrowth already sit above their win-rate bands). Retune `max_turns` after human play.
- **2026-09-17** — Slice 6 war table landed: `/game` is a CSS/2.5D council table with a fanned hand, weather vials, Grimoire, Consult, and turn-beat replay. `?stage=legacy` keeps the satchel stage. Tutorial `satchel` highlights alias to `hand`.
- **2026-09-17** — Slice 7 started: hide credits on `/game`, Grimoire under details, hold tutorial popups during theater, highlight weather/seats.
