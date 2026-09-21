# Gameplay v2

Status: Landed in production. This file remains the journal for play-surface decisions.  
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
- **Consult the Archives**: spend the turn to set aside 1 hand card and draw a replacement from the remaining deck. The player may name a remaining deck card, or take the next legal page. Aftershocks, event, and stakeholders still resolve. Searching for a better option is delay. That is the architecture joke.
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

`hand_size = min(6, playable_count)`. Tutorial basics has 4 cards, so the whole pool is the hand and Consult hides. The pressure tutorial authors 8 cards plus `opening_hand_card_ids`: the opening fan is scripted, Rest the Team sits in the Grimoire, and Consult is legal. `required_card_id` / `required_verb` in tutorial scripts keep working. The engine does not special-case tutorials.

### Opening deal

Seeded. Not `Math.random()`. Two cards biased toward current pressure (lowest scores), the rest shuffled from the remainder. A fully weighted deal plays the game for you. A fully random deal bricks too often.

Scenarios may set `opening_hand_card_ids` to pin the opening fan in order; remaining playable cards stay in the deck in `card_refs` order. That is how a tutorial can name both the hand and the Grimoire without a Vue deal.

### Playing a card

`play_turn(action_id)` still exists. It now **rejects** a card that is not in hand. After a legal play, the card leaves the hand. The briefing is read-only, so the engine refills the hand at the end of the turn — after the turn counter advances — putting newly playable cards back through the deck. That is how a zero-cooldown card can be played again on the next turn without sitting in a hidden pile.

### Consulting the archives

This is an **engine verb**, not a fake content card. Pack authors should not have to remember to include a “search” card. The engine grows a sibling API:

- `play_turn(action_id)` — play a card from hand
- `consult_archives(discard_ids, draw_id?)` — spend the turn, replace 1 card, no card effects, full pipeline otherwise. `draw_id` names a remaining deck card; omit it to draw the next legal page.

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
- Consult the Archives is an engine call (`consult_archives`), not a fake content card. The player marks one hand card to set aside and may name a remaining deck card to pull. Omitting `draw_id` still draws FIFO. This is not a free catalog: it costs the turn.

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

> **Correction (2026-09-18, slice 13).** Do not cite the win rates in that table. They were measured at 25 runs through a harness whose batches carried roughly a fifteenth of their nominal sample, so the "above band" readings were noise: re-measured after the seed fix, sprawl is 49% and hypergrowth sits inside its band. The deferral itself still stands — the consult counts are the real signal, and the clock should be retuned from human play — but it was decided on a broken instrument, which is worth saying out loud. See [Decisions from checking the instruments](#decisions-from-checking-the-instruments-2026-09-18).

### Slice 6 — War table shell

`src/ui/play/`: session director that replays `turn_resolution_context` phases, portrait table, hand dock, compact meters, existing scene/avatar registries. Route `/game` defaults to the table; `?stage=legacy` restores the satchel stage. Tutorial highlight `satchel` maps to `hand` in UI (alias, not a content rewrite). CSS/2.5D first.

Landed: `/game` is a candlelit council table. Scores are weather vials. The legal hand sits on the near rim. Consult and Grimoire are table tools. After `play_turn` / `consult_archives`, the UI replays the player's move, then aftershocks, then event and stakeholder voices. `consult_archives` may name a remaining deck card. The engine still computes aftershocks first.

### Slice 7 — War table finish

Human-play polish on the slice 6 shell. Still no Three.js and no `max_turns` bump.

- Hide the site-credit footer on `/game` so the table is the whole field.
- Card details stack above the Grimoire instead of under it.
- Tutorial popups wait until turn theater finishes. `satchel` / `scores` / `stakeholders` / `aftershocks` highlights map onto the hand, weather strip, and seats.
- The player sits at the near rim with their `playerClass` portrait. The scenario name is engraved on the table.
- Coupling is a table-wide storm from `getCollapseWarnings` (engine thresholds): a torn banner naming the collapse and what withers, fire on the triggering vial, ember on the table rim. Not a HUD popup.
- Adjourn is a table moment after theater. Portrait layout tightens the chamber.

### Slice 8 — Player-paced theater, Annals, and Consult as a turn

Human-play corrections on the finished table. Still no Three.js and no `max_turns` bump.

- Turn theater waits for **Continue**. Skip remaining stays for people who want speed, set apart from Continue so a Continue tap cannot take the rest of the replay. The engine turn is still atomic.
- **Annals** is an inspect-only panel over `gameState.history`, opened from a look plaque next to Grimoire.
- **Consult the Archives** opens the Grimoire in replace mode: mark a hand card, choose a remaining page (score glance and inspect stay available), or take a random legal page. An approval names both cards — “X replaced by Y” — and only then does `consult_archives(discard_ids, draw_id)` spend the turn. Cancel returns to the Grimoire. Forced unplayable refills still have no cancel.

### Slice 9 — Table moments: card flight, beat interludes, remaining-turn clock

Immersion pass on the finished table. Still no Three.js and no `max_turns` bump. The engine turn is still atomic.

- Playing a card (or finishing a consult swap) lands on the table first. Aftershocks follow as last turn catching up. The engine still computes aftershocks first; only the replay order changed so the move the player just made is visible before the storm. Consult is a Grimoire search: mark, choose or randomize, approve both names, then the engine spends the turn.
- Each beat opens with a short, kind-specific interlude. Aftershocks pause, shake the table hard, and drop a visible lightning bolt plus a crack across the inlay. The aftershock note is a broken-tablet plaque with a large **Aftershock** stamp and an outer glow tinted by engine deltas (boon / blow). The plaque names the card (or event) that queued it and how many turns ago, from `source_id` / `source_turn` on the resolved record — not from a Vue walk of history. Random events arrive from the rafters as **Reality hits**: a shaft of cold light, a hanging seal, a ribbon — no shake, no crack (those belong to last turn catching up). Less than an aftershock, more than the old 22% blue flash. "The system" stays the living scores, not chance. The speaking stakeholder stays enlarged and gold-lit while their reaction plaque is up, and only returns to seat size on Continue. Reduced motion skips the flourishes and still waits for Continue.
- Theater plaques (`You play`, aftershocks, adjourn) teleport to the viewport. They cannot live inside `.war-table`: the table `isolation` + `overflow: hidden` contains the 3D board, and the hand dock is a later sibling that paints over anything still leaking. Continue must never sit under the cards, especially on a phone.
- The weather strip clock counts **turns left**, not only "Turn N of M", and stays a full-width chip on mobile.
- Engine collapses (morale, delivery, trust, tutorial capacity/health) take over the chamber: a torn storm banner names the bound system and what withers, the triggering vial burns, and the table rim smolders until the trigger score recovers. Thresholds stay in the engine.
- Cards that the engine drops as unplayable after a turn are thrown back to the shelves with the same replace overlay. The player cannot cancel that refill; the hand stays at legal size.

### Slice 10 — Antechamber: sit down at the table

The start flow was still a website: marketing landing, settings form, spreadsheet briefing. Presentation-only. Still no Three.js and no `max_turns` bump.

- `/` is a chamber door, not a landing essay. It still names the game for a cold landing (quest, architect, tradeoffs) without restoring the old marketing page. About / How to play / Dungeon Master are table plaques: legal hand, Grimoire look, Consult costs a turn.
- `/play` is a council lobby in the same candlelit room. The fan comes first: choose the adventure, then the table lights that scene and you join the council (`resolveGameplaySceneId` is UI-only). Clicking a plate selects it; Join this adventure calls `start_new_run`. Door links `?tutorial=basics|advanced` still auto-launch.
- `playerClass` packs are unchanged. The lobby shows portraits on the near rim and the engine affinity (`+1` on `play_turn` to `score_affinity`). Name is optional under the seat. Challenge modifiers tuck behind Raise the stakes (hidden for tutorials). The lobby only calls `load_available_*` and `start_new_run`.
- The opening welcome is a **table moment** over the real war table after the engine has created the run. Weather vials and seats *are* the inherited state. The plaque names the scenario, flavor, turns, and (if any) modifier from content. It does not re-ledger scores.

### Slice 11 — Tutorial audit (plan)

The table, hand, Consult, and theater landed. The two tutorial packs and their scripts still describe the satchel stage. Presentation and content — not new engine rules. Still no Three.js and no `max_turns` bump.

**What is already true in the engine**

- Tutorials use the same run verbs (`start_new_run`, `play_turn`, `consult_archives`).
- Basics has 4 cards, so the whole pool is the hand. Consult hides. Pressure authors 8 cards and `opening_hand_card_ids`, so the opening fan is scripted and Rest the Team sits in the Grimoire.
- `required_card_id` still locks other cards in the UI until that card is played. `required_verb: "consult"` plus `required_draw_id` teaches Consult without inventing a content card.
- Authored highlight `satchel` aliases to `hand` in `useTutorialState`. Highlight `consult` points at Consult the Archives. Popups wait until theater finishes.

**What currently lies (content and UI, not simulation)**

| Authored thing | What the table does | Audit note |
|---|---|---|
| Script copy: “Action Satchel”, “scrolls”, “score bars” | Hand dock, weather vials, seats | Pressure script now speaks the table (hand, vials, Grimoire, Consult). Basics still needs the same pass. |
| Highlight `satchel` | Aliased to `hand` | Prefer authoring `hand` going forward. Keep the alias. |
| Highlight `scores` | Weather strip | Copy should say vials / weather. |
| Highlight `stakeholders` | Seats | Copy should say the council / seats. |
| Highlight `aftershocks` | Weather strip aftershock glow; theater beats | Teach Continue + the aftershock plaque, not “the alert below.” |
| Highlight `coupling` | Collapse weather plaque | Pressure `coupling_warning` points at the coupling weather, with the weather strip as fallback. |
| `TutorialPointerArrow` | Follows the highlighted card (or weather / seats / coupling / aftershocks) via `getBoundingClientRect` | Confirm after dismissing the hint that “Cast your first scroll” sits on Plan Ahead, not the left edge. |
| No Consult / Grimoire steps | Consult is a real verb; basics cannot consult | Basics: mention the Grimoire as look-only. Pressure: turn 2 is an honest Consult beat (set aside Deep Refactor, draw Rest the Team). |
| Collapse hand feels unwinnable | Pressure used to deal the whole 6-card pool, with no Grimoire and weak post-collapse math | Opening hand keeps Rally / Stabilize; Call In Help refills after Push Through; Rest waits in the Grimoire. Random tutorial events are omitted so the scripted recovery is deterministic. |
| `run_start` welcome vs intro splash | Table-moment splash already opens | Two welcomes stack. Decide which plaque speaks first. |
| `turn_end` hints vs player-first theater | Engine still aftershock-first; replay is player-first | Aftershock lessons must not fire until the player has seen the storm beat. |
| Complete splash + `run_end` script | Both exist | One ending, not two speeches. |
| Pointer / inline hint / popup chrome | Chamber vs site toast | Restyle to plaques once copy is true. |

**How to audit (human + tests, in this order)**

1. Play basics end to end on `/` → Basics tutorial. Write down every sentence that names a UI that is not on the table.
2. Play pressure the same way. Note collapse weather, coupling highlight miss, and whether Consult appears unexplained.
3. Check `required_card_id` still glows the named hand card and locks the others.
4. Confirm tutorial popups do not cover Continue, Grimoire, or Consult.
5. Only then rewrite `content/tutorial/scripts/*.json` (and, if needed, scenario flavor). Bump script `version` if the content schema requires it.
6. Update highlight mapping if `coupling` stays a target. Do not add Vue rules.
7. Tests: script strings that must not regress (`satchel`, `score bars`); highlight alias; popup held during theater.

Not in this slice: changing tutorial `max_turns`, merging tutorial scores into the main pack, teaching Consult as a free catalog, or Three.js.

### Slice 12 — First contact: say what the game is

A playtester reached the table, played a card, and could not say what they had been choosing between or what winning looked like. The tutorials are not the problem; nothing routes a cold player to them, and **no surface in a normal run ever states the objective**. Presentation and copy only. No engine change, no content schema change, no `max_turns` bump, still no Three.js.

**What a cold player is actually told today**

| Surface | What it says | What is missing |
|---|---|---|
| `/` door | "choose a quest, join the council, and play cards to shape a living system before time runs out" | No win condition. No turn shape. Tutorial links are footnote-weight text between the CTA and the lore plaques. |
| `/play` lobby | Quest plates (`N turns · council of M`), class seats, Raise the stakes | Nothing says what the numbers on the briefing plaque are *for*. Tutorials is a tab label, not a recommendation. |
| `RunIntroSplash` | "N turns remain. The vials and the council already show what you inherit." | Points at the vials and the council as if the player already knows what they are. Zero instruction at the one moment the player is definitely reading. |
| Weather strip | Six vials, value at `--text-sm` | Smaller than the turn clock beside it (1.55rem), so the clock outranks the thing being optimised. No delta, so nothing teaches that up is good. Mobile hides the label entirely: emoji plus a number. |
| Tutorial completion | `dddnd.tutorialsComplete` appears in docs and tests | Nothing in `src/` reads or writes it. "Recommend the tutorial to first-timers" currently has no signal behind it. |

**Design rules for this slice**

Borrowed from board-game teaching practice and the Crusader Kings III tutorial rework, and consistent with the tone rules in [GAME_DESIGN.md](../GAME_DESIGN.md):

1. **Objective before rules.** One sentence on what you are trying to do, before any vocabulary. A player who cannot answer "what am I trying to do on my first turn?" has not been taught.
2. **The goal stays visible.** A legible scoreboard outperforms a modal that explains the scoreboard. Score prominence is an onboarding fix, not a separate cosmetic ask.
3. **One welcome.** Slice 11 already flagged that `run_start` script steps and the intro splash stack. Do not add a fourth greeting. The briefing is the teach; the door is the invitation.
4. **Everything is skippable and stays reachable.** How to play is already a permanent plaque. New copy is dismissible, and dismissal persists.
5. **No jargon in the first sixty seconds.** "Bounded context" is the reward for playing, not the price of entry.

**Layer A — the door states the quest (`/`, `welcome_view.vue`)**

Copy and layout only. Name the win condition in plain words before the flavour hook, and promote the tutorial from a rope link to a real affordance for players who have never finished one. No popup over the door: the door *is* the welcome screen, and stacking a modal on it repeats the slice 11 mistake.

**Layer B — the run briefing is the teach (`run_intro_splash.vue`)**

Upgrade the existing table moment rather than adding a surface. Fixed, scannable shape, in this order:

- scenario name and authored `flavor_text` (unchanged, content-owned)
- **Your charge** — the objective, naming the two weakest starting scores and the clock
- **A turn** — play one card; aftershocks land, a random event may land, the council answers
- **The catch** — every card trades something away
- existing `Raised stakes` line when a modifier is active
- footer: Join the adventure, a `Don't show this again` checkbox, and a Basics tutorial link shown **only** when no tutorial has been completed

Needs `max-height` and scroll on the plaque. The current 720px rule centres it with no overflow guard, and this copy is longer than what it holds today.

**Layer C — the scoreboard reads as a scoreboard (`weather_strip.vue`)**

- Vial value up to roughly `--text-xl` with tabular figures; label demoted to a kicker but **kept at every breakpoint**.
- A per-vial delta chip from the last turn, read from `gameState.history.at(-1).total_score_changes`. That is presentation of an engine record, the same boundary the Annals panel already sits behind. Direction teaches itself; no copy needed.
- Three breakpoints instead of one. See the responsive contract below.

**Derived charge, not an authored objective field**

The charge line is computed in the UI from the run's starting `ScoreSnapshot` — lowest scores by value, named with pack `short_name` via `score_labels`. Reasons:

- No content schema change and no version bump across five scenarios.
- Every future pack gets an objective line for free, including packs whose authors never heard of this slice.
- It stays honest: the charge names the pressure the engine actually dealt, including after a challenge modifier adjusted the start.

This is view-model logic over engine output, in the same category as `weather_band.ts`. It must not move into content or simulation. If packs later want authored prose, add it as an optional override, not a replacement.

**Player preferences**

"Never show this again" and "have they finished a tutorial" both need somewhere to live. Today there are four storage keys in three naming conventions (`dddnd.mvp.save_file`, `dddnd:play-stage`, `dddnd_mobile_notice_dismissed`, `dddnd:game-hud-collapsed`), and `dddnd.tutorialsComplete` is referenced but never written.

Add one small UI-owned module for player preferences on the `dddnd:` namespace, guarded for absent or throwing storage the way `use_war_table_flag.ts` already guards `window`. Preferences are presentation state: they must not reach simulation, and they must never change what a run does.

**Responsive contract**

The play surface has exactly one breakpoint today (720px), so tablet portrait runs the desktop layout untuned.

| Width | Weather strip | Briefing plaque |
|---|---|---|
| ≥ 1025px | Single row: clock plus six vials, labels inline | Centred plaque, current placement |
| 721–1024px | Clock on its own line, vials as a 3×2 grid with labels | Centred, constrained height |
| ≤ 720px | Full-width clock chip, vials as a 3×2 grid, abbreviated labels **kept** | Centred, `max-height` with scroll |

Verify all three. Per [CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md](CODING_AGENT_IMPLEMENTATION_CONSTRAINTS.md) §5a, do not point the IDE browser at localhost.

**Tests**

- Briefing renders a charge line naming the weakest starting scores, and the line changes when starting scores change.
- The tutorial recommendation appears only when no tutorial has been completed.
- `Don't show this again` persists, and a later run with the flag set does not open the splash.
- Preference reads survive storage being unavailable or throwing.
- Weather strip renders the label at every breakpoint and shows a delta only when history has a prior turn.
- Existing `run_intro_splash`, `council_lobby`, `lore_plaques`, and `welcome_view` suites keep their meaning; update expectations only where the copy under test deliberately changed, and say which.

**Not in this slice**

A lobby popup, a multi-step intro carousel, changes to the tutorial scripts (slice 11 owns those), new authored content fields, `max_turns`, or Three.js.

**Landed.** The door names the objective in plain words and promotes the Basics tutorial until one is finished. `RunIntroSplash` now carries Your charge / How a turn goes / The catch, with a derived charge line from `run_briefing.ts`, a mute checkbox, and a first-timer tutorial link. The weather strip is a scoreboard: values at `--text-xl`, labels kept at every breakpoint, and `+N` / `−N` movement read from the last history entry. `player_preferences.ts` owns the two flags on the `dddnd:` namespace.

One correction from measuring the real layout: giving the strip `flex-direction: column` on tablet stretched the vial grid rows to ~153px each, because the base `flex: 1` on `.weather-vials` grows along the main axis once that axis is vertical. The strip stays row-wrap; the clock takes its own line with `flex: 0 0 100%` instead. On mobile the label spans the full cell (`'label label' / 'icon readout'`) so score names are not truncated by the icon column.

---

### Slice 13 — Pick with knowledge, and an audit that can be trusted

**The ask.** The lobby offered five plates with a name, a turn count and a council size, and no way to tell which one a newcomer should open. Say what varies between adventures, mark how hard each one is, make the chosen class obviously chosen — and confirm the fairness harness still measures the v2 game before leaning on its numbers for any of it.

**Difficulty is derived from the band, not authored.** Same bet as the charge line in slice 12. `SCENARIO_BALANCE_TARGETS` already states, per scenario, the win-rate envelope the audit gates on: sprawl is meant to be won 25–50% of the time, merger 50–80%. That *is* intended difficulty, written down, checked in, and enforced in CI. `quest_difficulty.ts` reads the band midpoint and returns Easy / Normal / Hard. No new content field, no second source of truth to drift, and any retune of a band moves the badge with it. A test pins the label for all five shipped scenarios so a band change that flips what a newcomer is told fails loudly rather than silently.

Measured win rates are the wrong input here even though they sound more honest: the generated report is gitignored, regenerated per build, and not available to the client at all.

**A badge the player has to hunt for is not a recommendation.** Pack order put Monolith first and Merger — the only Easy plate — last. A newcomer who does not yet know the marks will click the first card. Once the marks exist, leaving that order in place is the interface saying the wrong quest is the one to start. `sortQuestsByDifficulty` orders on the same expected win rate the badges threshold, so the fan is Easy, then Normal, then Hard, and a plate cannot sit left of one the pack considers gentler. The lobby opens on the first of that list. Returning from the tutorial tab does the same, rather than restoring pack-first. Tutorials are not graded and keep teaching order. No `sort_order` field: a second number would drift from the band the way an authored `difficulty` field would.

The store sorts on load so every consumer sees gentlest first. The lobby sorts again so the fan cannot regress if a caller forgets. Default selection is `sortQuestsByDifficulty(quests)[0]`, not `quests[0]` of whatever arrived. Tests pin both: shuffled input still fans Merger → Monolith → Compliance → Hypergrowth → Sprawl, and a setup mock that lists Hard first still opens on Easy.

**The harness was already v2-correct.** Worth stating plainly because it was the thing to verify: `player_true` builds its choice from `TurnBriefing.hand_action_summaries` — the legal hand of six — and consults the archives when the hand cannot reach the scores under pressure. `full_pool_oracle` is the catalog diagnostic and is not the gate. Slice 2 did that work and it held.

**The harness could not answer the question it was asked.** Running the gate at 100 runs passed with warnings. Running it again under a different base seed moved `microservice_sprawl` from 56.5% to 31.5%. At n=200 a win rate has a binomial standard error of 3.5%, so a 32-point spread across eight seeds is not sampling noise — and the same spread appeared *within* one seed's own stream, across its own consecutive run indices: 31.5, 63.5, 59.0, 48.0, 33.0, 40.5, 53.5, 62.0. Variance inflation over independent sampling: **13×**. A 200-run batch was carrying about 15 runs of information.

**Root cause was one missing line in the seed hash.** `createSeededRandom` folded the seed string with `state = state * 31 + charCode` and handed the result straight to an LCG. Seeds differing only in a trailing character therefore started the generator a few steps apart, and an LCG started a few steps apart stays a few steps apart forever. Batch seeds are exactly that shape — `pooled__run_1`, `pooled__run_2` — so neighbouring runs were near-replays of each other. Adding a MurmurHash3 finalizer between the fold and the LCG took inflation from 13× to 1.09× (95% CI 0.61–1.58 over 40 batches of 200), matching an independently SHA-256-seeded control.

**And the fairness answer.** With sampling fixed, all five scenarios sit inside their authored bands except `microservice_sprawl`, which reads 52.0% at 400 runs against a 50% ceiling and 49.0% over 8,000. It is at the top of its envelope, not out of it — and the earlier "76% above band" baseline recorded in slice 5, plus the monolith `vp_product` satisfaction warning, were both artefacts of correlated sampling rather than content problems. **No content was retuned.** CI moved from 50 runs to 400: at 50 the 95% margin on a win rate is ±14 points, wider than the bands being checked, and 400 costs about ten seconds.

**Landed.** A sentence under Choose your adventure naming what differs (starting health, council, surprises, clock). An Easy / Normal / Hard chip on each plate, tutorials excluded. The fan is gentlest first — Easy, then Normal, then Hard — and the lobby opens on the Easy plate, so a newcomer is not staring at Hard by default. A "Choose your class" heading over the seat row, the unselected seats dimmed harder, the chosen portrait 18% larger under a gold ring with a gold-filled nameplate. On phones the seat row drops out of the board overlay into normal flow, because a 200px board has no room for a heading without landing it on the quest brief, and the row switches to `flex-start` since centring a row that always overflows puts its first seat out of reach.

---

## 9. How to talk about this later (notes for writing)

A few sentences that are true and useful:

- We did not “add a game to a simulation.” We finally presented the simulation as a game.
- The hard part was not 3D. The hard part was **not lying** about which decisions were available, while keeping packs authorable.
- A catalog of architecture patterns teaches vocabulary. A hand of six under time pressure teaches tradeoffs. Both use the same cards.
- Consult is the fairness valve that is also the lesson: waiting for a better option is a decision the system will charge you for.
- Domain-driven design here is not ceremony. It is why the engine tests still mean something after the interface changes.
- Content packs are the expansion model. The war table is a client of packs, not a replacement for them.
- Honesty about **rules** is not the same as honesty about **attention**. The engine may resolve last turn first. The player still needs to see the move they just made land before the world answers.
- Continue under the cards is a stacking-context bug, not a missing tutorial. A layer that clips the 3D board will clip the beat plaque too; teleport it to the viewport.
- We built a game that was honest about its rules and legible to us, and still failed to tell a stranger what winning meant. Comprehension is a third axis, separate from correctness and from feel.
- Every surface in the run had *atmosphere*. None had an *objective*. Flavour is not orientation, and a game can have a great deal of the first while having none of the second.
- The clearest onboarding fix was not a tutorial. It was making the score numbers bigger. If the thing the player optimises is smaller than the clock beside it, the interface is telling them the wrong thing matters.
- A one-time modal that explains the scoreboard is weaker than a scoreboard the player can read. Persistent legibility beats an explanation they have to remember.
- The objective line is *derived* from the engine's starting scores, not authored per scenario. That is the pack architecture paying out again: every future pack gets an objective sentence without its author writing one.
- A difficulty badge the player has to hunt for is not a recommendation. Once you mark Easy / Normal / Hard, the first plate has to *be* Easy, already selected. Pack order is not a difficulty order.

When a slice lands, add a short dated note under [Changelog for writers](#changelog-for-writers) so the story stays in sync with the code.

### Decisions from sitting at the table (2026-09-17)

These are the reversals and refinements that happened after a human sat at `/game`. Useful for a talk because they show the architecture surviving contact with play, not a design doc surviving contact with a whiteboard.

**The table has to wait.** First theater autoplayed every phase. Aftershocks, the card, the event, and stakeholder voices stacked faster than anyone could read. **Continue** is the smallest honest pacing: the engine turn stays atomic; the replay is player-paced. Skip remaining stays for people who want speed.

**History is a look, not a HUD.** Annals reads `gameState.history`. Same boundary as the Grimoire: inspect, do not invent.

**Consult looked broken because the ceremony lied.** The engine already FIFO-drew a replacement, but the table spent the turn on tap and never showed the incoming page. First repair: spread the hand, confirm, reveal the engine draw. That still failed — spreading hid the score-impact glance, the Grimoire never opened, and the player could not aim at what should enter. Second repair: **Consult opens the Grimoire**. Mark a hand card, choose a remaining page (or take a random legal one), inspect if needed, then approve **“X replaced by Y.”** Only that approval calls `consult_archives`. Cancel returns to the picker.

**A chosen replacement cannot be a Vue lie.** Letting the UI swap in a deck card the engine did not draw would recreate the catalog. The engine grew an optional `draw_id`. Omit it and consult is still FIFO (bots keep that). Name it and that page is pulled to the front of the remaining deck. If aftershocks make it unplayable, replenish skips it and draws the next legal page. Random peeks the current briefing deck so the approval can name both cards before the turn is spent. Forced unplayable refill has **no cancel**: legal hand size is a rule, not a preference.

**Aftershock-first was true and still felt wrong.** The engine resolves last turn’s delayed effects before this turn’s card. We presented that order, and held a clone of the played card so you would not forget what you had chosen while the table shook. After more play — especially on consult swaps — it felt disjointed: you committed, then lightning, then your card. Replay now shows the **player’s move first**, then aftershocks. The math did not change. The talk beat is attention, not pipeline: last turn can still catch up, but not in front of the decision the player just made.

**Collapse was a side chip.** Morale Collapse (and the other engine couplings) wither the whole system. A compact HUD chip failed that story. The chamber becomes weather: a torn banner naming the bound system, fire on the triggering vial, ember on the table rim. Thresholds stay in `getCollapseWarnings`.

**Stakeholders pulsed and shrank.** A voice belongs to a person at the table. The seat stays enlarged and gold-lit until Continue dismisses their plaque. The speech bubble floats above the portrait (absolute), grows from the feet, and only auto-opens while that seat is voicing — after the beat, hover or tap recalls it. Persistent in-flow bubbles used to shove seats under the hand.

**Aftershocks needed a different shape.** The same callout box as other beats made them feel like UI chrome. The table now pauses, shakes, cracks a broken-line bolt (not a strobe), and drops a tablet plaque with a large **Aftershock** stamp whose glow follows engine deltas. The plaque also says which card (or event) queued it and how many turns ago. The engine already stored `source_id` and `source_turn` on the delayed instance; the resolved record now keeps `source_turn` so the UI does not reconstruct origin from history.

**Score glance during replace.** Bigger laid-out hand cards hid the compact `+N / −N` deltas. Replace lives in the Grimoire so glance, inspect, and decide share one place.

**The start was still a website.** Welcome, setup, and briefing were three site pages in front of the table. Setup is now walking into the chamber: the door, the lobby (choose your adventure, join the council), then a table moment over the real weather and council. `start_new_run` is still the only verb. Classes and modifiers stay packs.

**Continue was under the cards.** The `You play` plaque lived inside `.war-table`. That node `isolation: isolate`s and `overflow: hidden`s so the 3D board stays contained, and the hand dock is a later sibling in the chamber, so it paints over anything that still leaks. A phone made it worse: Continue sat in the hand. Theater plaques now teleport to a fixed viewport layer. The table still shakes; the plaque is no longer part of the table's stacking context. Presentation only — beat order and engine turns did not change.

**Reality hit and nobody saw it.** Aftershocks slam lightning into the table. The player's card flies. Council seats grow. The event beat was a 22% blue wash and a 28px bolt inside the inlay — a flash you could miss while looking at the hand. Random events are the world acting *on* you, not the score-vials answering, so they arrive from the rafters: a shaft of cold light, a hanging seal, a ribbon, teleported to the viewport so the table's overflow clip cannot swallow them. No shake and no crack; those are last turn catching up. Less than an aftershock, more than a blink. The plaque stamp is **Reality hits**, not "the system moves" — "the system" already means the living scores.

### Decisions from watching someone else play (2026-09-18)

Every prior correction in this document came from **us** sitting at the table. This set came from a stranger sitting at it, and it found a different class of problem. That contrast is the story: the builder tests whether the game is right, and a newcomer tests whether the game is *legible*. Slices 7 through 11 were all feel. Slice 12 was comprehension, and none of our own play sessions had surfaced it, because we already knew what the numbers were for.

**The feedback, in one sentence.** They did not understand what they were choosing, and after choosing, they did not understand what the cards were for or what the goal was.

**We had tutorials. That was not the problem.** Two guided quests exist and both work. Nothing routed a cold player to them — the door's tutorial links were footnote-weight text between the main call to action and the lore plaques — and, more importantly, a player who *skipped* them then met a run that never stated its objective anywhere. Onboarding is not a mode you can opt into. It is a property of the normal path.

**The audit that stung.** Reading every onboarding string in the app end to end, the closest thing to a goal statement was the door's "play cards to shape a living system before time runs out." Everything else was atmosphere. The opening table moment — the one screen a player is guaranteed to read — said "the vials and the council already show what you inherit," pointing at two nouns it had never defined. We had written a briefing that assumed the briefing had already happened.

**Objective before vocabulary.** Board-game teaching practice and the Crusader Kings III tutorial rework converge on the same order: say what the player is trying to do, then show a normal turn, then defer everything else until it becomes relevant. The briefing now runs Your charge, How a turn goes, The catch — three short blocks, in that order, with no game jargon in the first one.

**The charge is derived, not authored.** The obvious move was a `player_charge` field in scenario JSON: better prose, full control. We did not take it. A derived line — the objective, the clock, and the two weakest starting scores named from the engine's `ScoreSnapshot` — needs no schema change, no version bump across five scenarios, and stays true after a challenge modifier has adjusted the start. It also means a pack written next year gets an objective sentence for free. Same bet as everything else here: put the logic where the data already is, and the surface generalises.

**Making the numbers bigger *was* the onboarding work.** These arrived as two separate pieces of feedback — "I did not understand the goal" and "the scores feel small" — and they turned out to be one problem. The score value rendered at `--text-sm`, smaller than the turn clock sitting beside it at 1.55rem, so the interface was quietly ranking the countdown above the thing being optimised. Worse, mobile removed the label entirely: an emoji and a number, unnamed. A `+8` / `−3` chip from the last turn now teaches direction with no copy at all. Persistent legibility did more for comprehension than any modal would have.

**One welcome, not four.** The temptation was a lobby popup, plus an intro carousel, plus the scenario briefing, plus the tutorial. Slice 11 had already flagged the two-welcomes-stack defect. The door is the welcome screen, so it states the objective directly rather than hosting a modal on top of itself, and the run briefing does the teaching. Adding surfaces was the wrong instinct; loading the existing ones was the right one.

**The bug that only measurement found.** Making the tablet strip `flex-direction: column` looked obviously correct and was obviously wrong: the base `flex: 1` on the vial list, harmless along a horizontal axis, became a vertical grow the moment the axis flipped, stretching each grid row from 40px to 153px. The scoreboard ate half a phone screen. Reading the CSS did not catch it; driving a headless browser through the real flow at three widths and measuring the boxes did. Worth a slide on its own: responsive claims should be screenshotted, not reasoned about.

**Marking difficulty is not the same as recommending a start.** The Easy / Normal / Hard chips landed, and the first plate a newcomer met was still not Easy — pack order had put Merger last. A badge the player has to hunt for is weaker than putting the recommended quest first and already selected. The fan now reads left to right as Easy, then Normal, then Hard, and the lobby opens on Merger. Same derivation as the chip: the expected win rate from the balance band, not a new authored field. See [Slice 13](#slice-13--pick-with-knowledge-and-an-audit-that-can-be-trusted).

### Decisions from checking the instruments (2026-09-18)

The last two sections came from watching people play. This one came from doubting a number, and it is the best story in the document because the bug had been shipping green CI for months.

**The question was routine.** Gameplay v2 changed what the bot is allowed to play — a hand of six instead of the whole catalog — so before tagging scenarios Easy / Normal / Hard from the audit's bands, the harness needed a look. It turned out to be correct: `player_true` plays the legal hand and consults. The check should have ended there.

**It did not, because the answer moved.** Re-running the same scenario with a different base seed swung its win rate by 25 points. That is the moment worth describing at length: a passing gate and a reproducible number are not the same thing as a *meaningful* number. Determinism had been treated as the quality bar — same seed, same result, replayable, tested — and determinism is orthogonal to whether 200 samples contain 200 samples' worth of information.

**The diagnosis was a variance ratio, not a debugger.** Split 8,000 runs into forty batches of 200, take the standard deviation of the batch win rates, and compare it to the binomial standard error those batches should have. It came out 13× too large. That single number localises the fault to sampling without knowing anything about the game, and it gives a pass/fail criterion for the fix — which is how we knew an early "1.9×, much better" reading was really just eight batches of noise.

**The fix is five lines and the lesson is not.** A string hash without avalanche plus a linear congruential generator means adjacent seed strings produce adjacent random sequences. Nothing in the codebase was *wrong* in an obvious way; `deriveRunSeed` produces distinct seeds, the PRNG is deterministic, the first draws are uniformly distributed, and every existing test passed. The defect only exists in the relationship between *neighbouring* seeds, which is a property no single-seed test can see. The regression test had to be written as a statement about a family of seeds: 256 seeds differing only in a trailing index should have a mean gap between first draws near 1/3, the value independent uniforms give.

**What it cost to have been wrong.** Slice 5 was *deferred* on the strength of a 25-run measurement that said sprawl and hypergrowth were above their bands. That reading was noise. A balance decision had already been made on a broken instrument, and the honest version of this talk says so.

### Decisions from leftover scores (2026-09-21)

The six-score model shipped, but one aftershock still wrote `technical_debt`. The validator only checked that `score_refs` exist as files, so the leftover passed every pack test.

**Playable content is v2.** Manifest entry points for monolith, sprawl, compliance, and merger now load version 2. `startup_hypergrowth` stays on v1; it never queued `improved_clarity`. The v1 scenario files remain for history. We are not supporting exact-run replay of those retired versions.

**The ghost was not cosmetic.** `applyScoreChanges` writes unknown ids into `game_state.scores`. `listPressureScoreIds` ranks every key in that map, so `technical_debt: -10` displaced a real vial on player-true consult. Removing the leftover changes bot pressure even if no other number moved.

**Option B, no retune in this change.** `improved_clarity-v2` is `domain_clarity +7` and `team_morale +5`. Four scenarios gain a delayed clarity payoff they did not have. The 400-run gate on this tip, compared to the slice-13 baseline:

| Scenario | Band | Slice 13 (n=400) | This tip (n=400) |
|---|---|---|---|
| merger_of_minor_chaos | 50–80% | inside | inside |
| startup_hypergrowth | 35–60% | inside | inside |
| monolith_of_mild_despair | 45–70% | inside | 70.5% (warning) |
| compliance_gauntlet | 40–68% | inside | 68.3% (warning) |
| microservice_sprawl | 25–50% | 52.0% | 55.3% (warning) |

Sprawl was already at the ceiling. The ghost consult key is gone and four scenarios gained a delayed clarity payoff; both push win rate up. Follow-up is content vs band. Do not lower the gate.

**The check belongs in the validator.** Untracked scores are bundle errors, not audit findings. The engine still writes unknown ids; the pack is not allowed to ask it to.

### Decisions from the docs site (2026-09-21)

`GAME_DESIGN.md` now describes the live table, not the satchel. Six campaign scores. Council satisfaction is seats, not a vial. Outcomes are tier + ending. The public play URL is `dddnd.app`.

The GitHub Pages site is a **dual site**, labeled as such:

- **How to Play** — player guide. Copy follows the in-game door, About, and How to play plaques, then goes deeper.
- **Designer Desk** — audit and content x-ray. Not a second how-to-play.

Catalog policy is **playable-latest**: one page per id, the version current entry-point scenarios (and tutorials) actually ref. Retired files can sit in a small history fold. Delayed effects are first-class catalog. Tutorials appear next to adventures, marked as tutorials.

Pages audit runs **400**, same as the CI gate. The dashboard must say player-true, n, and scenario version, or it will disagree with CI and look like a docs bug when sprawl warns.

Chamber chrome is welcome if the text stays large and in open measure. Flavor is the table; the site is still a reading surface.

### Challenges worth a slide

- A deterministic PRNG is not an independent one. Adjacent seed strings plus a hash without avalanche gave a 200-run audit batch roughly 15 runs of information, and every test passed.
- Measure a harness before trusting it: batch variance against binomial expectation localises a sampling fault without knowing anything about the domain.
- Size a statistical gate to the thing it checks. 50 runs carries a ±14 point margin on a win rate, which cannot police a 25-point band.
- A score the scenario does not track still writes engine state. Ghost keys hijack consult pressure. `score_refs` is the tracked set; reachable `score_changes` must stay inside it.
- Retiring a playable version is a manifest entry-point bump, not a file delete. Exact-run of the old version is not a support target unless we say so.
- Properties that live *between* inputs need tests written over families of inputs. No single-seed assertion can see seed correlation.
- Derive player-facing difficulty from the balance bands CI already enforces, and pin the resulting labels, or the badge and the design intent drift apart.
- Once the marks exist, sort the fan on the same number and open on the gentlest plate. A badge in the corner of the last card is not a recommendation. Do not add a `sort_order` field to do this.
- Do not implement a legal hand only in Vue. The war table renders the briefing and calls verbs.
- Do not add a fake `consult_archives` content card. Searching is delay, so it has to cost a turn in the engine.
- The engine turn is atomic; theater is a replay. The hand has already mutated when the flight starts, which is why a committed clone exists.
- Humans may name a remaining deck card. Player-true bots still consult FIFO. Fairness audits must not silently become a catalog.
- Aftershocks can invalidate a named page. Fallback is FIFO, not a UI retry that pretends the turn did not happen.
- Do not bump `max_turns` because consult now feels better. Retune from a player-true baseline after more human play.
- CSS/2.5D first. Three.js is still not the application.
- Test comprehension on someone who has never seen the game. Our own play sessions could not find the missing objective, because we already knew it.
- A tutorial does not excuse an unexplained normal path. Assume the player skipped it.
- Derive player-facing objectives from engine state rather than authoring them per scenario, or every new pack re-opens the question.
- Preferences like "never show this again" are presentation state. They persist in UI-owned storage and must never change what a run does.
- Verify responsive work by driving a real browser and measuring, not by reading the stylesheet. A flex property that is inert on one axis is not inert on the other.
- Theater plaques belong on the viewport, not in the table. A stacking context that clips the 3D board will also clip Continue, and the hand paints on top of later siblings.
- Aftershocks slam. Events descend as **Reality hits**. If both are a bolt, or if events say "the system," the player cannot tell the living scores from chance.
- Aftershock origin is engine output. Copy `source_turn` onto the resolved record; do not join history in Vue to guess which card it was.

---

## 10. Working agreements for agents and humans

1. Read this file before changing play, hand, consult, the war table, the start/antechamber flow, or tutorials.
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
- **2026-09-17** — Slice 7 finished the table: player seat, scenario nameplate, coupling weather, adjourn on the table, portrait layout. Corrections from play notes come next.
- **2026-09-17** — Slice 8: beats wait for Continue, Annals opens engine history, Consult sits with the hand as a spent-turn action.
- **2026-09-17** — Slice 9: card-to-table flight, kind-specific beat interludes, remaining-turns countdown on the weather strip.
- **2026-09-17** — Aftershocks pause, shake the table, and crack a lightning line before a glowing inscription tinted by engine score deltas.
- **2026-09-17** — First aftershock pass held a committed card in the hand while last turn landed (engine order: aftershocks, then the player). A visible bolt and a broken-tablet plaque follow.
- **2026-09-17** — Collapse weather: storm banner + vial fire + chamber/table ember from engine coupling, not a side chip. Aftershock stamp is larger.
- **2026-09-17** — Stakeholder seats stay enlarged and lit while their reaction plaque is on the table.
- **2026-09-17** — Consult opens the Grimoire as the replace picker (hand mark + deck choose + random). Approval names both pages, then `consult_archives` may take an optional `draw_id`. Unplayable cards still return to the shelves without cancel.
- **2026-09-17** — After more play, theater shows the player's card or swap first, then aftershocks. Engine pipeline order is unchanged. See [Decisions from sitting at the table](#decisions-from-sitting-at-the-table-2026-09-17).
- **2026-09-17** — Slice 10: the start flow sits in the chamber. `/` is a door, `/play` is a council lobby, the intro is a table moment over engine starting state. Setup still only calls `start_new_run`.
- **2026-09-17** — About / How to play / Dungeon Master plaques speak the table: legal hand, Grimoire look, Consult costs a turn, weather and seats. Winning is tier + ending, not archetype.
- **2026-09-17** — Slice 11 planned: full tutorial audit. Scripts still teach the satchel; `coupling` highlight has no war-table mapping. See [Slice 11](#slice-11--tutorial-audit-plan).
- **2026-09-17** — Tutorial pointer follows the highlighted hand card (and weather / seats / coupling) instead of a leftover satchel slot.
- **2026-09-17** — Pressure tutorial: authored opening hand, recovery pages after collapse, Consult beat to pull Rest the Team, and a Grimoire-to-hand refill flight after a play. Presentation only; `consult_archives` is still the engine verb.
- **2026-09-17** — Lobby copy: choose your adventure, join this adventure / join the council. Tutorial cards carry a larger Tutorial mark. Learn the ropes and Choose your adventure rails are centered. Start verbs no longer say sit at the table.
- **2026-09-17** — Player-facing score bands are system mood (Steady / Strained / Troubled / Critical), not Fair / Overcast / Squall / Tempest. Storm animation stays; lobby briefing says how the system starts.
- **2026-09-18** — Each adventure has its own scene. `resolveGameplaySceneId` is an explicit UI map (not pack JSON, not random). Dungeon, throne, and forge join the hall, war room, and archive. Tutorials use the forge and the dungeon.
- **2026-09-18** — Slice 12 from playtest feedback: a cold player never learned the objective. The door names the quest, the run briefing became the teach (derived charge line, turn shape, tradeoff, mute, first-timer tutorial link), and the weather strip became a readable scoreboard with per-turn deltas at three breakpoints. Copy and presentation only; the charge is view-model logic over the starting scores, not a content field. See [Slice 12](#slice-12--first-contact-say-what-the-game-is).
- **2026-09-18** — Score prominence is an onboarding fix, not a cosmetic one. A modal that explains the numbers is weaker than numbers a player can read; the `+N` / `−N` chip teaches that up is good without a sentence. Mobile used to hide the vial label entirely, so a phone player saw an emoji and a number with no name.
- **2026-09-18** — First correction set that came from a stranger rather than from us. Builder play finds whether the game is right; newcomer play finds whether it is legible. See [Decisions from watching someone else play](#decisions-from-watching-someone-else-play-2026-09-18).
- **2026-09-18** — The door's first fix for "no objective" was more prose, which made it a wall of text. Second pass: three plaques — Your quest / Each turn / The catch — across on desktop and tablet, stacked below 720px. Explaining more and writing more are not the same move; the reader needed structure, not sentences.
- **2026-09-18** — Slice 13: the lobby says what varies between adventures and marks each plate Easy / Normal / Hard. The mark is derived from `SCENARIO_BALANCE_TARGETS`, the same win-rate bands the audit gates on, so the badge cannot drift from design intent. Class picker gets a heading, a harder dim on unchosen seats, and a larger gold-ringed chosen portrait; on phones the seat row leaves the board overlay for normal flow. See [Slice 13](#slice-13--pick-with-knowledge-and-an-audit-that-can-be-trusted).
- **2026-09-18** — A badge the player has to hunt for is not a recommendation. Pack order put the only Easy plate last; a newcomer clicks the first card. The fan now sorts on the same expected win rate as the marks — Easy, then Normal, then Hard — and the lobby opens on that first plate. Returning from tutorials does the same. Tutorials keep teaching order. No `sort_order` field. The store sorts on load; the lobby sorts again so the fan cannot regress if a caller forgets.
- **2026-09-18** — The fairness harness was v2-correct (player-true plays the legal hand of six and consults) but statistically broken. `createSeededRandom` hashed seeds without avalanche, so `..._run_1` and `..._run_2` started an LCG a few steps apart and stayed correlated: a 200-run batch carried ~15 runs of information, 13x variance inflation. A MurmurHash3 finalizer brings it to 1.09x. See [Decisions from checking the instruments](#decisions-from-checking-the-instruments-2026-09-18).
- **2026-09-18** — With sampling fixed, fairness holds under v2: four scenarios inside their bands, `microservice_sprawl` at 52.0% against a 50% ceiling (49.0% over 8,000 runs). No content retuned. The slice 5 note that sprawl and hypergrowth sat "above their bands" was a sampling artefact, and a balance decision had been deferred on it.
- **2026-09-18** — CI audit gate moved from 50 runs to 400. At 50 the 95% margin on a win rate is +/-14 points, wider than the bands it checks; 400 costs about ten seconds.
- **2026-09-18** — Theater plaques (`You play`, aftershocks, adjourn) teleport to a fixed viewport layer. The table clips overflow to contain the 3D board, and the hand dock is a later sibling, so Continue was sitting under the cards — worse on a phone. Presentation only; beat order and engine turns are unchanged.
- **2026-09-18** — System events arrive from the rafters: a shaft of cold light, a hanging seal, a ribbon. The old beat was a 22% blue wash and a 28px inlay bolt. No shake and no crack — those stay aftershock. See [Decisions from sitting at the table](#decisions-from-sitting-at-the-table-2026-09-17).
- **2026-09-18** — Skip remaining sits further from Continue on theater plaques. The two used to share 0.35rem, so a Continue tap could skip the rest of the replay.
- **2026-09-18** — Aftershock plaques name the card (or event) that queued them and how many turns ago. The delayed instance already had `source_id` / `source_turn`; the resolved record now keeps `source_turn`. The UI derives the line. It does not walk history.
- **2026-09-18** — Event plaques say **Reality hits**, not "the system moves." "The system" already means the living scores. Teaching copy (door, briefing, rules, consult) now says a random event may land.
- **2026-09-18** — `/play` holds a chamber veil until lobby scene art and class portraits are preloaded. Content loading already disabled the sit button; the images were still popping in behind it.
- **2026-09-18** — Council speech bubbles float above the seat and only auto-open while that stakeholder is voicing. After the beat, hover or tap recalls the line. In-flow bubbles were shoving seats under the hand.
- **2026-09-18** — Score shorts are pack data (`short_name` on every Score). Play UI uses the short everywhere; the weather strip teaches the long name on hover (desktop) or tap (mobile). No more UI id→Craft maps.
- **2026-09-21** — Playable entry points for monolith, sprawl, compliance, and merger move to v2. `improved_clarity-v2` pays `domain_clarity +7` / `team_morale +5` instead of writing ghost `technical_debt`. v1 files stay on disk; exact-run of those scenario versions is not a support target. See [Decisions from leftover scores](#decisions-from-leftover-scores-2026-09-21).
- **2026-09-21** — Bundle validation now errors on reachable `score_id`s the scenario does not track. The 400-run gate on this tip (no retune): merger and hypergrowth inside band; monolith 70.5% vs 70%; compliance 68.3% vs 68%; sprawl 55.3% vs 50% (slice-13 baseline 52.0%). Follow-up is content vs band. Do not lower the gate.
- **2026-09-21** — `GAME_DESIGN.md` matches the live war table: six scores, legal hand, Consult, Grimoire, coupling, tier + ending. Public URL is `dddnd.app`. See [Decisions from the docs site](#decisions-from-the-docs-site-2026-09-21).
- **2026-09-21** — Docs site is dual: How to Play for players, Designer Desk for audit and catalog. Catalog is playable-latest. Pages audit n=400. Chamber chrome must stay readable.
