# DDDnD Pack Studio ("The Forge"): design brainstorm

Status: **design agreed for M4** (brainstorm 2026-11-24). Q13 is on hold; Q14 is revisited once the Studio works end to end.  
Decided so far: [ADR 0005](adr/0005-pack-studio-as-separate-app.md) (architecture), [ADR 0006](adr/0006-delivery-order-loading-before-studio.md) (loading before the Studio), and the decisions in §2 below.  
Plan and milestones: [CONTENT_PACKS.md §7–8](CONTENT_PACKS.md#7-pack-studio) (M4 Studio MVP, M5 balance lab, M6 explain/graph/playtest).

This document is where the Studio's design is worked out before M4 starts. It will become the Studio's spec, and its reasoning feeds the talk and blog posts, like the content packs journal.

---

## 1. What the Studio is for

DDDnD's content is data. Since M3, a pack can be a retelling of the base game or a different topic altogether, and it needs no code. But a pack today is dozens of versioned JSON files, written by hand against a schema and checked with a CLI. The SRE pack took 81 files.

The Studio lets someone make a pack **without writing JSON, without knowing ids or versions, and without leaving the browser.** It is a separate local-first app (`studio.dddnd.app`) that runs the game's own domain code: the same schemas, validator, engine and audits (ADR 0005).

---

## 2. Decisions so far

| # | Decision | Why |
|---|---|---|
| D1 | **Two kinds of authors, one Studio.** Workshop facilitators come first; people teaching a new topic are fully supported. | Facilitators are the nearest users (the Gilded Ledger's use case). The SRE pack proved new topics work, and they're the bigger idea. See §3. |
| D2 | **A creative studio, not a wizard:** "Create a card", "Create a scenario" and so on, each a focused editor. A **guided tutorial round** teaches it by building a small pack together. | Free creation is what authors do after the first hour. The tutorial is what gets them through the first hour. See §4 and §5. |
| D3 | **Simulated balance waits for M5** (the balance lab). M4 has **balance hints**: arithmetic on the draft compared with the base game ("your cards net +8.2 on average; base cards net +11 to +12"), plus nudges such as "this card only helps". | Simulation in the browser is its own project. The hints are cheap, would have caught the SRE pack's unwinnable first draft, and teach calibration. |
| D4 | **Download only. No GitHub publishing.** Export a `.dddnd-pack.json` file (import it in the bazaar) or a zip in the repository layout (to commit to GitHub yourself). | No backend, no accounts, no OAuth, no server function. This retires the "GitHub publish via OAuth" item in M7. |
| D5 | **No art or other assets from packs.** Packs stay text and numbers only. | A pack's worst case must stay "unwanted text" (ADR 0014). Images, fonts or audio from a remote source would open the asset and tracking surface that rule closes. Pack content keeps using the game's own fallback icons, initials and rooms. |
| D6 | **A minimal playtest in M4:** "Play it" opens the draft in the game, in a sandboxed preview that never touches real saves. The guided round ends by playing your own scenario. | Ending the round with "download a file, then import it in another app" loses people at the finish line. The full handoff design (origin-checked `postMessage`, ADR 0005) moves from M6 to M4; previews, graph and the explainer stay in M6. |
| D7 | **Copy-to-edit base content:** "Make my own version" of a base card or event creates a new card in the pack, prefilled, with a new id. | Facilitators adapt more than they invent. Packs never override each other's content, so a copy is the only safe form. |
| D8 | **Several drafts per browser,** listed on the start screen. | Little extra work with IndexedDB; authors try things. |
| D9 | **The guided round asks about the author's own organization,** with a worked example beside every step. | The author leaves with a pack about their own world, and the example shows what a good answer looks like. |
| D10 | **Desktop-primary.** Laptops and desktops are the target, tablets are supported, and a phone can browse drafts but not edit. The start screen says so. | Editing 20 cards is a desk job, and until there's some form of upload, a phone has nothing to do with the result. |
| D11 | **Name: "DDDnD Pack Studio", subtitled "The Forge".** The full name leads everywhere (title, header, docs); "The Forge" is the flavour line under it. | Clear first: authors search for "pack studio", not "forge". The subtitle keeps the game's voice. |
| D12 | **Look: professional, in DDDnD's style** (§9). | It's a tool people spend hours in, so clarity wins, but it should feel like the same world as the game. |
| D13 | **"Start from a DDDnD scenario":** the start screen lists the base game's scenarios, and "Copy and adapt" starts a retelling with a copy of that scenario, its council, cards and events already attached. Base cards stay references until the author changes one; then "make my own version" (D7) copies it. | Most facilitators want "the Monolith, but ours". Starting from a working, balanced scenario beats starting from nothing, and editing the copy teaches by example. |
| D14 | **Examples come from DDDnD-packs,** the owner's official extension repository, pinned to release tags. A small list in the Studio names which ones are shown, and which one the guided round draws its worked examples from. | One source of truth for examples: the packs already published and validated. Today the round would draw from the Gilded Ledger (a retelling) and the SRE pack (a new topic). |
| D15 | **"Play it" stores nothing** (answers Q9). The Studio opens the game's preview route in a new tab and sends the bundle over `postMessage`. The game checks the sender's exact origin, validates the bundle like any import, and plays it with no-op save and pack-store adapters. Nothing reaches disk or a server, and closing the tab ends it; to play again, press "Play it" again. | The game already writes runs and packs through two adapters (`persistGameState` and the pack store), so a preview mode swaps both. No backend is needed (D4), and a preview can never overwrite a real saved run. |
| D16 | **Accessibility is a requirement, not a polish item,** including **text size** (§10). | The Studio is all forms and reading. People with low vision, keyboard users and people on long sessions are all authors. |
| D17 | **The preview accepts a pack from the Studio only, and from nowhere else unless approved** (§11). The trusted origin is a constant in the game's code. Adding another needs a reviewed code change and an ADR, never a setting or a URL. | An in-memory pack skips the bazaar's review screen, so whoever can send one decides what the player sees. Only DDDnD's own Studio may; a pack from anywhere else still goes through the bazaar and its review. |
| D18 | **A preview run shows the results screen, with no share link** (answers Q12). | The author needs to see which ending and tier their scenario produced. A share link would point at a pack nobody else can load. |
| D19 | **The Forge's mark is the anvil with sparks** (option B on the mockup). | It reads as "forge" rather than just "metal", and still works at header size. |
| D20 | **The guided round has an ember-tinted header** with a "Guided round" pill. | You always know you're in a lesson, and how to leave it ("your work is kept"). |
| D21 | **The base game's council members can't be edited.** Authors take them out, create new members, or copy a base member to a new member and edit the copy (with its reactions). The base game's cards don't affect new members; the author changes how a card treats the council by making their own version of the card (D7). | The game's cards and events refer to council members by id. An edited member in place would have to be a new id, which those cards don't refer to (M3.9), so the Studio says plainly that a copy is a new member. Only the members a scenario seats take part, so leaving one out is harmless. |
| D22 | **The Studio's screens hold no content rules** (M4.5b). A screen shows a draft and turns the author's input into a domain call. Anything that is true about content, wherever it is shown, is answered by the authoring domain: what a reference names, whose it is, what's in the deck, how an optional field is written, and what a check's issue is about. A test enforces it. | The game keeps its rules out of its UI, and the Studio is the same codebase's second client. When a rule lived in a screen it was copied, and the copies drifted: one screen took the draft's own content regardless of version, another required the exact version. |
| D23 | **A full UI/UX audit comes after the Studio's important functionality, before launch.** Until then, slices may add screens without polishing the whole. The audit looks at the start screen, the workspace's layout and the editing flows together. | The owner finds parts confusing now, mainly the start screen and some editing. Fixing those one slice at a time would mean redoing them as features land; one audit over the finished set can make it consistent. |
| D24 | **Exporting is a release. A pack has three kinds of version, and each has one owner.** (1) **The pack's version** (1.0.0, 1.1.0) belongs to the author: the Studio suggests one (a new minor for play, a patch for wording) and only refuses a version that isn't later than the last export. (2) **Each piece of content's version** (`card-v1` → `-v2`) belongs to the Studio: content whose *play* changed since the last export gets the next version, and everything in the pack that points to it follows, up to the scenario. Wording-only changes keep their version. The new pack file holds only the current version of each piece; the earlier file keeps `-v1`. (3) **Which game the pack is for** belongs to the game itself (D25). | CONTENT_VERSIONING.md: "a version never changes meaning". Authors never see ids, and a forgotten bump would quietly change a saved run under a player, so content versions are the model's job, decided from a short list of wording fields; unknown fields count as play (the safe default). Old versions stay out of the new file because the game resumes a saved run only with the exact content it was played with (journal M2.6), so shipping them would help no player. Two files with the same pack id and version would mean different things to different players, so the pack version only moves forward. |
| D25 | **The Studio exports for the game in the same repository, and CI keeps them in step.** A pack declares the pack format (`schema_version`) and the base pack version it was checked against (`depends_on`), both read from the game's own code and content, never a copy. The game accepts it on any later base of the same major version. In return the base pack keeps a promise within a major version: what it has shipped stays shipped and plays the same, and new content comes with a later base version. `scripts/base-content-lock.json` records that promise. A pre-commit hook records it when base content is committed, and CI checks it (`content:lock:check`). | The game, its content and the Studio live in one monorepo and deploy from the same commit, so the rule can be a check rather than a habit. The Studio had declared a fixed base 1.0.0: right today, but a pack using content added in 1.1.0 would have claimed to work on 1.0.0. A pack names base content by exact version, so a base that changed or dropped `card-v1` within 1.x would break packs already out there. |
| D26 | **An import is lossless or refused.** A pack file or zip becomes a draft only if the draft can hold all of it, so its next export is the same pack with the author's changes. The Studio refuses, saying why: standalone packs, packs that build on anything but the base game, tutorials, an id the Studio couldn't keep, two versions of one id, and scenarios (or classes, modifiers) not all offered to players. It keeps the license and homepage, and counts the imported content as the last export. | A quietly smaller pack is worse than a refusal: the author would publish it as the next version and players would lose content. The refusals are all rare (both real packs import), and each can be lifted later by teaching the draft the missing piece. |
| D27 | **DDDnD and new Studio packs are `GPL-3.0-or-later`** ([ADR 0017](adr/0017-gpl-3-or-later.md)). Imported packs keep their license (D26); a pack may still be `GPL-3.0-only` (ADR 0004). | A pack ecosystem on "only" could never move to a later GPL together: every author would have to relicense. The owner is the game's only author, so the game could switch at once. |
| D28 | **The workspace is an editor, not a set of pages** (the UI/UX audit, owner's choice of Direction A on the [canvas](https://claude.ai/artifact/Hs3Wu7gs5VqccQCpXuu4VQ)): a fixed toolbar, a sidebar with everything in the pack (grouped, collapsible, filterable, the author's own items first), one editor, and the checks as a toolbar button. A summary view of the pack comes next; a map of cards and their impact may follow. | The sidebar shows where the pack stands without switching tabs (the owner's reason for A over a board). The checks rail disappeared below 1100 px, and a page that scrolled as one hid the editor and the checks behind a long contents list. |
| D29 | **Effects are written generically:** each name with its signed change, then the council's satisfaction ("Domain Clarity +6, Budget −5; Head of Payments +2 satisfaction"). | Packs name their own scores, so a verb guessed from a score's name ("raises", "makes happier") can be wrong for a score like "Nerdiness" (the owner's rule, 2026-11-26). A name and a number read right for any pack. |
| D30 | **You never leave what you're editing to connect it.** Every "what it changes" picker can create or seat a council member, and a member's page can give a card or event a change to them, making your own version of the game's first (D7). Placeholders are fine while you work; the checks only stop the export. | The owner found connecting content the most confusing part of editing: make the member first, or the card? With this, either order works, from either side. |
| D31 | **Changing someone who isn't seated is a feature, and the Studio explains it, never blocks it.** A note says why it's there: the game shares a card (nothing to do), you took them out, or your own content changes them (fine for a card shared with another scenario). The author guide explains sharing cards between scenarios. | The owner (2026-11-26): pack authors may share cards between scenarios with different councils on purpose, as the base game does (Automate Deployment Pipeline in Microservice Sprawl). The note should alert and explain, so it can be done on purpose. |
| D32 | **"Play it" is trusted in production only from the launch.** Until then the game trusts only the local Studio, in development builds; the launch PR adds `https://studio.dddnd.app` and switches the Studio's button on together (a test keeps them in step). Deploy previews are never trusted (D17). | The owner's call (2026-11-26), keeping the plan in §12: a pack sent by "Play it" skips the bazaar's review, so the live game starts trusting the Studio when the Studio is announced, not before. |
| D33 | **A new topic is an extension of the base game with everything else its own:** its own scores, council, cards, events and endings, the game's five outcome tiers (the owner's call), and none of the game's cards, events or council members, whose changes and conditions name the game's scores. It starts as a skeleton (a scenario, a fallback ending, a class with no score bonus) that the summary's steps walk through. | Matches the SRE pack, the one real topic. Reusing the tiers keeps the first topic short (§5); the game's content would only fail the checks in a topic; the skeleton means a fresh topic already plays once it has scores. |
| D34 | **Endings are an ordered list, never priorities.** Authors see "tried 1st of 4" and move endings earlier or later; the Studio writes evenly spaced priorities. The fallback (no conditions) is always last and can't be deleted while it's the only one. Conditions are written generically (D29): "Rest ends below 25". | The game picks the first ending, by priority, whose conditions all hold. A number authors must keep unique and ordered is a rule the model can keep instead, and the validator's errors (two endings at one priority, an ending below the fallback) become impossible to make. |
| D35 | **The guided round is a view of the workspace, not a separate app.** `#/guided/<draft>` shows the same editors, with the ember header and step strip (D20) above, and the step's guide (what it asks, its teaching moment, a worked example from the Gilded Ledger) in place of the sidebar. Where the author is in the round is kept with the draft, never exported. "Next" never blocks; a step ticks when the draft has what it asks for, as the domain reads it. Leaving keeps everything, and "Back to the guided round" returns to it. | One set of editors means the round teaches the real tool, and nothing in it can drift from the workspace. Ticks read from the draft (two people with a reaction each, three cards, one bad and one good surprise, clean checks) can't say "done" when it isn't. The round is a first hour, not a gate. |
| D36 | **Balance hints measure against the game's own scenarios, read live, per score.** The yardstick is the range the five scenarios the game offers span, worked out from its content when the Studio loads (cards +9.0 to +12.2 on average, aftershocks included; events −3.3 to +0.5 a draw, weighted by how often each is drawn), not a number written into the Studio. Compared per score, since a run is judged on its scores' average. A deck is worth a look only more than a point outside that range (`NEAR_ENOUGH`). Hints never block, and never comment on the game's own cards. | A written-in number had already drifted: the plan said "+11 to +12", but Startup Hypergrowth's cards net +9.0. Reading the game's content keeps the yardstick honest as the game is rebalanced. The point of slack comes from evidence: the SRE pack wins 40% of runs with cards at +8.2. |
| D37 | **The new-topic round is the retelling's, plus what a topic makes for itself, in two sittings.** Ten steps: world, **what it trades off** (three scores), scenario, council; then cards, surprises, **endings** (two besides the fallback), **a class** (named, with a favourite), check, play. No "Fill the deck": a topic uses none of the game's. Scores come before the scenario, which sets where they start. The first sitting ends at the council, said in the guide's pinned footer. A stand-in the Studio made (the "Generalist" class, "New score", "New ending") never ticks a step. The examples are the SRE pack's (D14). | §5 asks for exactly this ("longer, in two sittings", scores, endings, one class, the base tiers). The world is what a second sitting needs to exist; what happens in it is the second. A tick for the skeleton's own class would say "done" before the author did anything (D35's honest ticks). |

---

## 3. Two authors, one Studio (D1)

| | Workshop facilitator | Topic teacher |
|---|---|---|
| **Wants** | "The Monolith, but it's *our* system, *our* stakeholders, *our* politics" | "DDDnD, but about SRE / security / product discovery / …" |
| **Pack kind** | `extension` of the base pack | `standalone` (still depends on base for generic parts such as tiers) |
| **Reuses** | Base scores, endings, tiers, coupling, often base cards and events | Little: maybe the outcome tiers and a few generic events |
| **Creates** | A scenario, their stakeholders, a handful of cards and events | Everything: scores, council, cards, events, aftershocks, endings, classes |
| **Hardest part** | Writing good cards and reactions for real people | Designing scores that trade off, and endings that mean something |
| **Example** | The Gilded Ledger (4 new cards, 4 events, 2 stakeholders) | SRE: The Pager Storm (6 scores, 22 cards, 6 endings, 4 classes) |

**How the Studio serves both:**

- **The editors are the same.** A card editor is a card editor. Facilitators simply use fewer of them.
- **The start screen asks which kind of pack it is** ("Retell DDDnD for my organization" / "Teach a different topic"), and that choice only decides:
  - which editors are shown up front. A retelling hides scores, endings and coupling behind "Advanced", because it uses the base ones;
  - what's pre-filled. A retelling starts with the base scores and endings attached, a new topic with empty slots and a checklist;
  - which tutorial round runs.
- **A retelling can grow into a new topic.** Adding its own scores later is allowed; the Studio just shows more editors. Nothing is locked in by the first choice.
- **Build order:** the editors both authors need come first (scenario, council, cards, events, aftershocks), then the ones only topic packs need (scores, endings, tiers, coupling, classes, modifiers).

---

## 4. The creative studio (D2)

### 4.1 The workspace

One draft pack at a time, with a sidebar of what's in it:

```
┌───────────────┬──────────────────────────────────────────────┐
│ My Pager Pack │  Card: "Tune the Noisy Alerts"               │
│               │                                              │
│ ▸ Scenarios 1 │  Name ......... Tune the Noisy Alerts        │
│ ▸ Council   5 │  Says ......... Delete the alerts nobody…    │
│ ▾ Cards    22 │  Flavor ....... Forty pages a night…         │
│   + New card  │                                              │
│   Tune the N… │  When played                                 │
│   …           │   Rest  +8   Sight +2   Uptime −1  Velocity −1│
│ ▸ Events   14 │   On-Call Engineer  +4                       │
│ ▸ Scores    6 │  Later (aftershock): none   [+ add]          │
│ ▸ Endings   6 │  Limits: 2 uses, 2-turn cooldown             │
│               │                                              │
│ ⚠ 2 problems  │  Used in: The Pager Storm                    │
│ ⇩ Export      │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

- **Every entity has a "Create" button and an editor:** scenario, stakeholder (with its reactions), card, event, aftershock, score, ending, tier, coupling rule, class, modifier.
- **No ids, no versions in the UI.** Ids are generated from names with the pack's prefix (`sre_tune_noisy_alerts`), and versions are managed by the version-bump assistant (CONTENT_PACKS.md §7, item 4). An advanced view can show them.
- **References are pickers, not typed ids:** "affects: [On-Call Engineer ▾]", "score: [Rest ▾]". A picker only offers what exists in the pack and its dependencies, so a broken reference can't be typed.
- **Player-facing words, not schema words:** "Council" (stakeholders), "Aftershock" (delayed effect), "Ending" (outcome archetype), "Reaction" (reaction rule), the same words the game uses.
- **Live validation:** the same validator as the game and CLI. Each problem names its field and has a "go to" link. Export is allowed with warnings, but not with errors.
- **Plain-language previews** where they're cheap. A reaction reads "When Rest falls below 30, the On-Call Engineer's satisfaction drops by 6 and Uptime by 2". (The full explainer is M6.)

### 4.2 Import and starting points

- Start blank, from a kind template (§3), or **from an example pack** (the Gilded Ledger or SRE). Examples are the best documentation there is.
- Import a `.dddnd-pack.json` or a repository zip to keep editing a pack.
- Drafts live in this browser (IndexedDB), with the same honest "kept in this browser only" notice as the bazaar, and a nudge to export.

---

## 5. The guided tutorial round (D2)

A first-run walkthrough that **builds a real, small pack**, then hands it over. It doesn't use a separate practice mode. The game's own tutorial (short, one concept per step, done in a few minutes) is the model.

**Retelling round (facilitator), about 15 minutes:**

1. **Name your world:** the pack's name and description; the prefix is suggested.
2. **Your scenario:** "What system are you untangling?" Name, the situation, starting health (pre-filled base scores, adjustable), number of turns.
3. **Your council:** add two stakeholders from your organization; give each one reaction ("When Delivery drops below 40, the Head of Payments gets nervous").
4. **Your cards:** write three cards for moves your team actually argues about. Each must trade something away (the Studio nudges if a card only helps).
5. **Your surprises:** one bad event, one good one.
6. **Fill the deck:** pick base cards and events to complete the scenario (pickers with names and short summaries).
7. **Check it:** the validation panel, read together.
8. **Play it:** open the scenario in the game's sandboxed preview (D6). Export comes after, from the workspace.

**New-topic round (teacher), longer, in two sittings:** it adds "What does your topic trade off?" (three to six scores that pull against each other, phrased so higher is better), endings ("what kinds of leader can a player become?"), and one class. It reuses the base tiers to keep it short.

**Teaching moments to build into the round,** from what building the SRE pack taught us (journal M3.11):

- **Cards should net positive.** A realistic card that costs as much as it gives makes an unwinnable game; the trade-off lives in *which* scores move.
- **Scores should trade off,** or one strategy wins.
- **Endings should be reachable,** and mean something in *this* topic: "Firefighter" meant different things in DDD and SRE.

---

## 6. M4 scope, as it stands

**In M4 (Studio MVP):**
- The app, its Netlify site, IndexedDB drafts.
- The start screen with the two kinds and the example packs.
- Editors for every entity type, with pickers and the live validation panel.
- The version-bump assistant.
- The retelling tutorial round, and the new-topic round (M4.25, D37).
- Balance hints (D3), copy-to-edit (D7), several drafts (D8).
- The minimal playtest: "Play it" opens the draft in a sandboxed game preview (D6).
- Export (bundle file and zip) and import.

**Order for the rest of M4** (after M4.5b; D23). On 2026-11-25 the owner moved the UI/UX audit (item 7) up, to start next. §14 has the handoff.
1. ~~Aftershocks and event conditions~~ (M4.6).
2. ~~The version-bump assistant~~ (M4.7).
3. ~~Zip export and import~~ (M4.8).
4. ~~"Play it" (D15, D17)~~ (M4.16; live in production from the launch, D32).
5. ~~New-topic authoring (scores, endings, classes) and the guided round~~ (M4.17–M4.21), ~~and the new-topic round~~ (M4.25, D37).
6. ~~Balance hints~~ (M4.22, D36), and the smaller items: ~~"Go to it" focusing the exact field~~ and ~~a warning when the prefix (the pack's id) changes after a release~~ (M4.23), ~~undo/redo, and search~~ (M4.24). (The sidebar's collapse and filter came with the audit, M4.9.)
7. ~~**The UI/UX audit (D23)**~~ (M4.9–M4.15, brought forward and done first). The patterns for every later screen are in §9.1.
8. Launch: remove `noindex`, and add the Studio's origin to the game's preview allowlist.

**Later:**
- **M5:** balance lab (D3).
- **M6:** full explainer, relationship graph, card previews.

**Done when** (from the plan): an author can build the demo pack from scratch in the Studio and load the export in the game.

---

## 7. Open questions (for discussion)

Q1–Q8 from the first round are settled: Q1 → D6, Q2 → D3, Q3 → D12, Q4 → D10, Q5 → D7, Q6 → D8, Q7 → D9, Q8 → D11. Q9 → D15 and D17, Q10 → D14, Q11 → D16, Q12 → D18.

| # | Question | Options and notes |
|---|---|---|
| Q14 | **A simpler start screen** | **Settled in M4.13** (the UI/UX audit): the start screen leads with the author's packs; "+ New pack" opens the game's scenarios one step in (`#/new`). |
| Q13 | **Text size in the game too?** | **On hold** (owner, 2026-11-24). The Studio's text-size setting (§10) could later come to the game, which has the same reading load on cards and briefings. |

## 8. Not doing (and why)

- **Assets from packs** (D5).
- **GitHub publishing / accounts / a backend** (D4).
- **A drag-and-drop canvas editor.** Forms, pickers and previews give most of the value (CONTENT_PACKS.md §7).
- **Editing other people's packs in place.** Import a pack to make your own copy; packs never override each other.

### A possible later step for visuals that keeps D5

If packs ever need more visual identity, the safe form is **choosing from the game's own built-in art**, never supplying it. For example, a score could say `"icon": "shield"`, and the game would look that name up in its own icon set, ignoring anything unknown. No URL, no file and no fetch is involved, so the worst case stays text. That needs its own ADR, and isn't part of M4.

---

## 9. Look and feel (D12)

**Mockup:** [DDDnD Pack Studio look](https://claude.ai/artifact/1kvHTsALbzcpdLjMvMUmMB) (private to the owner), three screens: the start screen, the workspace with the card editor, and step 4 of the guided round.

**Principles**

- **Same world, quieter room.** The game's palette and type, without its stage effects. The council chamber has torchlight and shaking tables; the Forge has steady light and room to work.
- **Clarity first.** Plain labels in the game's own words, one primary action per screen, and everything a player will read shown in a "what players read" section.
- **Engaging, not decorated.** Delight comes from seeing your work become a game: plain-language previews of every card, the balance hints, the guided round's progress, and "Play it". It doesn't come from ornament.

**Tokens** (from the game's design tokens, so the two apps match)

| Role | Value | Use |
|---|---|---|
| Ground | `#0c0a05` (the game's page background) | Page |
| Panels | `#15110a`, sidebars `#100c06` | Sections, cards, rails |
| Hairlines | bronze `rgba(160,112,24,0.35)` | Borders, dividers |
| Headings | engraved gold `#d4b860`, Cinzel | Titles and section heads only |
| Text | `#f0e8d0` bright, `#c8bc9c` body, `#a89a78` secondary | `#a89a78` replaces the game's `#7a6e54`, which is too dim for long reading |
| Primary action | ember `#e0803a` | One per screen ("Start the guided round", "Export", "Save card") |
| New-topic mark | teal `#6cc7bb` | The "A different topic" pill, as in the bazaar |
| Effects | green `#8fd18f` up, coral `#ef8a6a` down | Score and satisfaction changes |
| States | coral = must fix, amber `#fbbf24` = worth a look | The Checks panel |
| Type | Cinzel (headings), Inter (everything else), JetBrains Mono (ids, advanced view) | Same fonts as the game |

**Layout**

- A header with the name and subtitle, the draft's name and kind, save state, "Play it" and "Export".
- The workspace (D28, replacing the first layout's three columns): the contents sidebar and the editor, each scrolling on its own under a fixed toolbar. The checks are a toolbar button that opens a panel, at every width. In a narrow window the contents sit above the editor.
- Editors are stacked sections: "What players read", "When played", limits, a plain-language preview, and "Used in".

**Settled:**
- the mark is the anvil with sparks (D19);
- the guided round's header is ember-tinted (D20);
- the start screen leads with the author's packs (Q14, M4.13).

### 9.1 Patterns for every screen (the UI/UX audit, D23)

The audit (M4.9–M4.14) made the Studio consistent. Every screen still to come follows these patterns: "Play it", new-topic authoring (scores, endings, classes), the guided round, and the balance hints. Each pattern names where it already lives, so a new screen copies a working example instead of inventing one.

**1. Where a screen goes**
- **Inside a pack, a screen is an editor in the workspace (D28).** Add a kind to `Selection` (`studio/src/workspace/selection.ts`) and a branch in `workspace_view.vue`. The toolbar, the contents sidebar, the checks button and the scrolling come with it. Don't make a separate page that hides the sidebar: the owner chose the sidebar because it always shows where the pack stands.
- **A view of the whole pack** (like the summary) is a `Selection` too, switched from the toolbar, with the sidebar still there.
- **Outside a pack, a screen is a route** in `App.vue` (`#/`, `#/new`, `#/draft/<id>`), with `<main id="main" tabindex="-1">` so the skip link and route changes can focus it.
- **A new kind of content gets a sidebar group** in `contents_nav.vue`. The group gets:
  - a count;
  - "+ New …" and, where the game has some, "+ From the game";
  - the author's own items first, the game's under a closed "From the game";
  - the to-fill-in ring.

**2. The editor frame** (`studio.css`, shared by every editor)
- **`.editor-head`:**
  - `.editor-head-text` holds a kicker that says what it is and whose ("Score · yours", "Ending · from the game") and the title, which is the item's name;
  - `.head-actions` on the right holds the editor's actions, always there;
  - a `.head-confirm .confirm` opens under the head before anything is removed.
- **Then `.editor-section`s,** each with an `.editor-section-title`: "What players read", what it does, limits, then the connections ("What changes their satisfaction").
- **A placeholder of the author's own gets a `.to-fill-in` line:** "To fill in: … Fine while you work; the pack needs them before you export". It never blocks.

**3. The game's own content is shown, locked**
- Same layout as the author's own, read-only, with a `.locked-note`. The note is one line on what to do instead ("To change it, make your own version") and a `details.why-more` with the reasons. Explanations are said once, behind "Why?", not repeated on every page.
- The way to change the game's content is always a copy (D7, D21), offered in the head: "Make my own version", "Copy to a new member".

**4. Actions and their words**
- **One ember button per screen** (`.button-primary`). In the workspace it's "Export pack", and on the export page the download is. Everything else is `.button-quiet`, and "Delete" is `.button-danger`. "Play it" will be quiet too, beside Export.
- **Three verbs for removing, by scope:**
  - **Take out of this pack:** the game's content leaves this pack; the original stays.
  - **Delete:** the author's own is gone.
  - **Remove:** a row or link inside an editor.

  Each removal asks first and says what goes.
- **Disabled buttons look disabled,** and a hint beside them says why ("A council needs at least one member…").

**5. Words**
- **Names, never ids or versions,** anywhere an author reads. Ids belong behind "Advanced" at most.
- **Words about content come from the domain:**
  - effects (`describeEffects`, generic: "Domain Clarity +6; Head of Payments +2 satisfaction", D29);
  - conditions (`describeCondition`);
  - when aftershocks land (`landingWords`);
  - signed changes (`signedDelta`, a true minus);
  - a check's problem (`describeIssue`);
  - a pack's release state (`releaseState`).

  New content needs its words added there, with a test, before a screen shows them. Never guess a verb from a pack's own names (a "Nerdiness" score).
- **The Studio's own words** (buttons, hints, steps) live in the screen. They're short and direct: say what you can't do, why, and what to do instead (the owner's rewrite of D21's explanation is the model).

**6. Connections (D30)**
- **You never leave what you're editing to connect it.** A picker that chooses something (a score, a member, an ending) can also create it from the typed name, or bring in one of the game's, through one domain operation named for the author's intent (`connectNewMember`). The picker is `change_target_picker.vue`: an ARIA combobox where what exists comes first and "+ “…” as a new …" comes last.
- **Show connections from both sides:** what an item changes on the item, and what changes it on the other end, each a link.
- **Placeholders are fine while working.** The domain's `toFillIn` lists them, the summary links them, and only the game's checks stop an export.

**7. Checks and notes**
- **What stops an export is the game's own checks,** shown in the toolbar's checks button and the summary, in the Studio's words (`describeIssue`), each with "Go to it".
- **Notes never block, and say why they exist** (D31: the game shares a card, you took someone out, your own content). A note that can be on purpose says so and explains how.

**8. Accessibility (§10), on every screen**
- Every control works from the keyboard. A popup closes on Escape and returns focus to what opened it. Creating something moves focus into it (its name, or a new row's amount).
- One live region per fact: the checks button announces the checks. Don't add a second one for the same status.
- Landmarks the Studio focuses (`[tabindex='-1']`) get no focus ring; controls always do.
- Nothing by colour alone: +/− and words beside green and coral, a ring and words for "to fill in".
- Sized in `rem`. Check every screen at 1024 px with Largest text.

**9. Architecture (D22): the rule behind all of it**
- **A screen shows a draft and turns input into domain calls.** Anything true about content (what it's called, whose it is, what changed, what's allowed, how it's said in words) is a named function in `src/domains/authoring`, with a test, written before the screen that needs it.
- **Adapters stay at the edges:** `studio/src/content` (the game's content, zips, license texts) and `studio/src/drafts` (IndexedDB).
- **The boundary tests** (`tests/architecture/studio_boundaries.test.ts`) guard each kind of leak found so far:
  - the game's UI imported into the Studio;
  - content services reached from screens;
  - content file names parsed in screens;
  - the validator's messages read in screens (M4.13).

  A new kind of leak gets a new guard, one that fails on the code before the fix.

**10. Checking a screen before it ships**
- **Component tests mount the screen with the game's real content,** read from the repository through a mocked adapter (`tests/studio/editor_actions.test.ts`).
- **They can't catch everything.** M4.12's workspace failed to open in the production build while every component test passed, so every slice is also walked in headless Chrome on a production build with the real CSP (§14 "How to check work"). The walk covers each new flow, by keyboard where it's an input flow, at 1024 px with Largest text, with zero CSP violations and no console errors.

**Applying it to what comes next**
- **"Play it" (D15, D17):** a quiet "▶ Play it" in the toolbar beside Export, opening the game's preview in a new tab. Its state (opening, sent, the tab was closed) shows in the toolbar, not in a page.
- **New-topic authoring:** scores, endings and classes are editors in the frame above, each with a sidebar group. A card's picker gains "+ “…” as a new score" (create from the picker), and an ending shows what reaches it from the other side.
- **The guided round (§5, D20):** the one place for a step-by-step flow. It's the same editors under the ember "Guided round" header, with its steps as a list like the summary's "Where to go next", and "leave the round: your work is kept" always visible.
- **Balance hints (D3, D36):** domain arithmetic (`balance_hints.ts`) shown as "worth a look" lines in an editor and in the summary, never blocking. They're worded like the notes, saying what to try. Built in M4.22.

---

## 10. Accessibility (D16)

Requirements, checked like the game's (automated checks plus a keyboard and screen-reader pass per milestone):

- **Text size setting:** Standard, Large and Largest, behind a **Display** button in the header (a small panel with a radio group; Escape or a click outside closes it), remembered in this browser (a per-viewer convenience, like the bazaar's notices). Everything is sized in `rem`, so browser zoom and the system font size work too. Layouts reflow at Largest instead of truncating.
- **Readable by default:** body text at least 16 px at Standard, long text in the body font (Inter), Cinzel only for headings. Text contrast at least 4.5:1, including secondary text (the reason for `#a89a78`, §9).
- **Keyboard first:**
  - every editor and picker works without a mouse;
  - visible focus everywhere;
  - a "skip to editor" link;
  - shortcuts for "new card" and moving between items, never single-key shortcuts that fire while typing.
- **Real controls:** labelled inputs, real buttons and links, and pickers built on listbox or combobox patterns with announced selections.
- **Not by colour alone:** score changes show `+`/`−` as well as green and coral, and checks say "must fix" or "worth a look" in words, not just colour.
- **Announced changes:** the Checks rail and balance hints update in a polite live region, so screen-reader users hear "2 problems" without losing their place.
- **Motion:** none needed, and `prefers-reduced-motion` respected wherever any is added.

---

## 11. The preview's trust boundary (D15, D17)

"Play it" hands a pack to the game in memory, which skips the bazaar's review screen. So the preview must only ever accept a pack from DDDnD's own Studio.

**How the game makes sure:**

1. **One trusted origin, in code:**
   - the preview route accepts messages only from `https://studio.dddnd.app`, a constant in the game's source;
   - a development build may also accept the local Studio dev server; a production build never does;
   - there is no setting, query parameter or stored value that adds an origin. Approving another means a code change, reviewed, with an ADR.
2. **Only from the tab that opened it.**
   - The preview runs only when it was opened by another tab (`window.opener`).
   - It accepts a message only if `event.source` is that opener and `event.origin` is the trusted origin. Both are checked, every time.
3. **A handshake, then one message:**
   - the preview tells its opener it's ready, with a fresh random nonce;
   - the Studio's reply must carry the same nonce;
   - the first valid pack is played, and every later or invalid message is ignored.
4. **Same validation as any import:** the bundle goes through the full snapshot builder, schemas and playability check. A preview pack gets no shortcuts, and a failure shows the same errors the bazaar would.
5. **Nothing stored (D15):** no-op adapters for runs and packs. Closing the tab ends it.
6. **Clearly marked:** the preview shows a "Preview from DDDnD Pack Studio" banner, and its results screen has no share link (D18).
7. **No other way in:** no URL parameter, fragment, `localStorage` handoff or file path can load a preview. `frame-ancestors 'none'` (already in the CSP) stops the game being framed by another site.

**Built in M4.16.** Where each control lives:
- the exchange is `src/domains/content/services/preview_handoff.ts` (both apps);
- the game's side is `src/ui/views/preview_view.vue` and `src/ui/preview/`;
- the Studio's side is `studio/src/content/game_preview.ts`.

Its tests:
- messages from any other origin (including a deploy preview of the Studio), or from a window other than the opener, are ignored;
- a wrong or reused nonce is ignored;
- a second pack after the first is ignored;
- a pack failing validation says why and doesn't play;
- a preview run writes, reads and clears no saved run, and stores no preference;
- the game and the Studio agree on when production trusts the Studio.

Where the build departs from the outline above:
- **"Nothing stored" is decided when the page loads.** The Studio names the preview tab (`dddnd-studio-preview`), and a tab with that name, or one opened at `/preview`, runs the game with no-op storage from its first moment. The name only switches storage off; trust still takes the origin, the opener and the nonce. A reload asks the Studio again, so it isn't a way in.
- **Production trusts no origin until launch** (D32). Until then "Play it" works with both apps running locally in development, and the live Studio's button says it arrives with the launch.
---

## 12. Deploying the Studio (Netlify)

The Studio is its own Netlify site, built from this repository. Its settings live in [`studio/netlify.toml`](../studio/netlify.toml).

**Creating the site** (once):

1. In Netlify: **Add new site → Import an existing project → GitHub → `mooeypoo/DDDnD`**.
2. Build settings:
   - **Branch to deploy:** `main`
   - **Base directory:** `studio`. This is the important one: Netlify then reads `studio/netlify.toml` and never the game's `netlify.toml`, whose settings would otherwise build the game.
   - **Build command** and **Publish directory:** leave them as Netlify fills them, or empty. `studio/netlify.toml` sets both, and a file's settings override the UI: the build is `cd .. && npm ci && npm run studio:build` (the Studio shares the game's domain code, so it installs and builds from the repository root), and the publish directory is `dist` (relative to `studio/`).
   - **Functions directory:** leave empty.
3. Site name: something like `dddnd-studio`, giving `dddnd-studio.netlify.app` until the domain is attached.
4. No environment variables are needed (Node 24 is set in `studio/netlify.toml`).

After the first deploy, **Site configuration → Build & deploy → Build settings** should show Base directory `studio`. The deploy log should show the build command above, and `vite build --config studio/vite.config.ts`.

**When to do it:**
- **Create the site now** (with the first Studio PR), so every Studio PR gets a deploy preview.
- **Attach `studio.dddnd.app` when the Studio is ready for authors** (end of M4). Until then, the site carries `noindex` and the start screen says it's being built.

**Attaching the domain:**

1. In the Studio site: **Domain management → Add a domain → `studio.dddnd.app`**.
2. DNS:
   - if `dddnd.app`'s DNS is managed by Netlify, Netlify adds the record itself;
   - otherwise, add a `CNAME` record `studio` → `<site-name>.netlify.app` at the DNS provider.
3. Wait for Netlify's HTTPS certificate (automatic).
4. At launch, in one PR:
   - remove `noindex` (`studio/index.html` and `X-Robots-Tag` in `studio/netlify.toml`);
   - switch "Play it" on: add `https://studio.dddnd.app` to `PRODUCTION_PREVIEW_ORIGINS` (`src/ui/preview/preview_session.ts`) and set `PLAY_IT_IN_PRODUCTION = true` (`studio/src/content/game_preview.ts`). A test (`tests/architecture/game_studio_sync.test.ts`) fails if only one of them changes.

**What the game's site needs:** nothing until "Play it" (§11). The game's `netlify.toml` and site are unaffected, because the Studio site reads only `studio/netlify.toml`. The Studio site skips deploys when nothing under `studio/`, `src/domains/`, `content/` (it ships the first-party packs, M4.3) or the package files changed. That was checked locally: the scaffold commit builds, and the launch PR, which touches neither, is skipped.

---

## 13. Implementation log

### M4.1: The Studio's scaffold (2026-11-24)

The first piece: an app that builds, deploys on its own, and keeps its boundaries. No editing yet.

- **The app:** `studio/` is a Vite + Vue app with its own config (`npm run studio:dev`, `studio:build`, `studio:preview`).
  - It uses the `@studio` alias for its own code and `@/domains/*` for the shared domain code.
  - It's type-checked with the rest of the repository, and CI builds it.
- **The shell (D10–D12, D16, D19):**
  - the header: "DDDnD Pack Studio" with "The Forge" under it, the anvil-with-sparks mark (also the favicon), and the text-size control;
  - the start screen, saying plainly that the Studio is being built, with no buttons that lead nowhere;
  - the desktop-primary note.
- **Accessibility from the first commit (§10):**
  - **Text size:** Standard, Large and Largest scale the root font size, and everything is in `rem`. The setting is remembered in this browser when storage works, and the Studio works without it.
  - **Navigation:** a skip link, visible focus, and labelled controls.
  - **Readability:** secondary text at `#a89a78`, and reduced motion respected.
- **The authoring domain** starts with `contentIdFromName`: "Tune the Noisy Alerts" in a pack prefixed `sre` becomes `sre_tune_the_noisy_alerts`. It follows the content id grammar, avoids reserved ids, stays within 64 characters, and adds `_2`, `_3`… on a clash. Authors never type an id (§4.1).
- **Boundaries, enforced:** a test fails if the Studio imports the game's UI, if the game imports the Studio, or if the authoring domain touches Vue, the DOM or storage. It was checked by planting a violating import, which failed the test.
- **Deploying:** `studio/netlify.toml` (with Base directory `studio`) sets the build, a strict CSP (`connect-src 'self'`: the Studio fetches nothing yet), `noindex`, and skipping deploys when nothing the Studio is built from changed. The Netlify steps are in §12.

**Verification**
- Headless Chrome against the production build, served with the Studio's CSP:
  - desktop (1440), tablet (834) and phone (390) all render with no horizontal scroll;
  - zero CSP violations and no console errors;
  - Largest text sets the root to 20px and survives a reload;
  - the first Tab reaches "Skip to the content".
- Tests: +15 (id generation, the shell and text size, the boundaries).

### M4.1a: Display settings behind one button (2026-11-24)

The three text-size buttons took too much of the header (owner's review). They now sit behind one **Display** button with an "Aa" icon:
- The button opens a small panel with a "Text size" radio group (Standard, Large, Largest), each shown at its own size.
- Radio buttons give keyboard and screen-reader behaviour for free: arrow keys change the size, and the choice is announced.
- Opening the panel focuses the current size. Escape closes it and returns focus to the button; a click outside closes it.
- The panel leaves room for future display settings.

Verified in headless Chrome at desktop and phone widths: the keyboard path from open to arrow to Escape works, with no console errors. That check caught a bug the unit tests missed: focus didn't move into the panel. Tests: the shell tests now cover opening, the radio choice, Escape returning focus, and a click outside.
### M4.2: The draft model, checked and exported by the game's own code (2026-11-24)

The Studio's core, in the pure `authoring` domain. No editors yet: this is what they will edit.

**The draft** (`draft_pack.ts`):
- **What it holds:** the pack's details (name, description, prefix, version, authors) and its own content by section, already in the game's content shapes.
- **How it points at base content:** by `{ id, version }`, exactly as a published pack does.
- **Operations:** `createDraft`, `addContent` (the id comes from the name), `putContent`, `removeContent` and `updateDraftDetails`. Each returns a new draft, so the Studio can keep undo history and save drafts without the domain knowing how.

**Export and check** (`draft_export.ts`):
- **No Studio validator:** a draft becomes the same raw files a pack folder holds, and the game's own code takes over. `buildPackSnapshot` checks schemas, limits and the community identity rules; `checkPackPlayable` checks that the scenarios build next to the base pack and that classes and modifiers fit. "The Studio says it's fine" and "the game imports it" are one statement.
- **Export only what imports:** `exportDraftBundle` refuses a draft with any issue, and otherwise returns the `.dddnd-pack.json` text (D4).
- **The manifest:** both kinds of draft export as `extension` packs of the base pack, with `GPL-3.0-only`. A `standalone` pack may not depend on anything, and both kinds use base content (new topics use its outcome tiers). "Retelling" and "new topic" stay a Studio distinction.
- **The pack's id** is its prefix, kept off `base` and `tutorial`.

**Starting from base content** (`draft_from_base.ts`):
- **"Copy and adapt" a base scenario (D13):** the draft gets its own copy (a new id), still pointing at the base council, cards, events and endings. It starts with a description the author can change ("A DDDnD retelling of …"), because a pack needs one.
- **"Make my own version" of a base card or event (D7):** a copy under a new id, and the draft's scenarios switch to it.
- **Stakeholders aren't copyable yet:** base cards that affect the original stakeholder wouldn't reach a copy (that change would be ignored, M3.9), so copying a council member needs its own design.

**Prefixes stop at a word boundary.** "Payments Platform Quest" first came out as `payments_platfor`, which every id in the pack would carry; it's now `payments`. A single long word is still cut at 16.

**Verification**
- **The proof:**
  1. a draft started from the Monolith is exported, then read back through the game's import (`readPackBundle`);
  2. it's registered next to the base pack, then built and simulated;
  3. over 20 runs on the same seed, the copy and the original end with identical scores, endings and tiers.
- **Copy-to-edit:** the scenario points at the copy, the base card is untouched, and the edited draft still checks clean.
- **Refusals, worded by the game's validator:** a draft referencing a missing card is refused, naming the card; a draft without an author is refused; a blank description is refused (found by the first test run).
- Tests: +14 in `tests/authoring`, 1185 total.

### M4.3: The first working Studio: start from a scenario, edit, check, export (2026-11-24)

The retelling path works end to end, for the scenario and the pack's details. Council, cards and events are listed but not yet editable (M4.4).

**What an author can do now**
1. **Start from a DDDnD scenario (D13):** the start screen lists the base game's five adventures, and "Copy and adapt" makes a draft and opens it.
2. **Edit the pack's details:** name, description, author, and the prefix for new content.
3. **Edit the scenario:** name, one-line summary, situation, flavor, turns, and starting health. Each field's limits come from the game's `CONTENT_LIMITS`, so the form and the validator agree.
4. **See the Checks rail update as they type:** it runs the game's own checks a moment after each change. The commonest messages are reworded plainly ("Add your name as the author."), and "Go to it" opens the right editor.
5. **Export:** the button unlocks only when the checks pass, and downloads `<prefix>-v<version>.dddnd-pack.json`.
6. **Come back later:** drafts save automatically to this browser (IndexedDB, D8), and "Your drafts" lists them, with delete behind a confirmation. Each draft has its own address (`#/draft/<id>`), so a reload stays on it. Without storage, the Studio says drafts last only until the page closes.

**How**
- **First-party content:** a small Vite plugin serves the game's content folder at `/content` in development and copies it into the Studio's build. The Studio reads base and tutorial content from its own site, with the game's own `loadManifest` and content provider, so its CSP stays `connect-src 'self'`. The Netlify skip check now includes `content/`.
- **State:** one module (`studio/src/state/studio_state.ts`) holds the drafts, the open draft, saving (400 ms after the last change) and checking (700 ms).
- **New topics:** still "arrives in a later release" on the start screen, with a link to the SRE pack as an example.

**Found on the way**
- **Vue's proxies break saving and checking.** Editors build the next draft from Vue's reactive state, which wraps every nested object in a proxy. `toRaw` only unwraps the top level, and `structuredClone` (which IndexedDB uses too) refuses proxies: the first edit after "Copy and adapt" showed "Couldn't save" and a failed check. A draft is plain JSON data, so `plainDraft` copies it with a JSON round trip. A test builds an edited draft from reactive state, shows `structuredClone` refusing it, and shows `plainDraft` fixing it.
- **The disabled Export button** showed a "busy" cursor; it's now "not allowed".

**Verification** (headless Chrome, production build, Studio CSP):
- The five scenarios are listed. "Copy and adapt" opens the Monolith draft.
- The checks report the missing author and Export is disabled. "Go to it" opens Pack details with focus in its first field.
- With an author added, the checks say "Ready to export" and the draft saves.
- Renaming the scenario and setting 12 turns keeps it clean. The card list shows the 26 Monolith cards by name.
- Export downloads the pack. After a reload, the draft is still open, and it appears under "Your drafts".
- Zero CSP violations and no console errors.
- **The downloaded file through the game's own import:** `readPackBundle`, registered next to base, with no playability issues. It carries the author, the new name and 12 turns, and five simulated runs each played all 12 turns.
- Tests: +2 (plain drafts, the draft store); 1191 in total, with #47 and #48 included.

**Next (M4.4):** editing cards, events and the council, including "make my own version" of a base card (D7). Smaller follow-up: "Go to it" focusing the exact field at fault.

### M4.4: Cards and events: your own, the game's, and your own versions of the game's (2026-11-24)

The deck becomes editable. The sidebar lists every card and event by name, marks the author's own with "yours", and offers **+ New** and **+ From the game** in each group.

**What an author can do now**
- **Look at one of the game's cards or events.** It's read-only and described in plain words ("playing this raises Delivery Confidence by 7 and User Trust by 2; lowers Maintainability by 6 and Domain Clarity by 2"), with its aftershocks and, for events, when it can happen.
- **Make my own version (D7):** an editable copy replaces it in the deck, under a new id. The game's original is untouched.
- **Create a new card or event.** It opens with its name selected, ready to type. The Checks rail then asks for its description ("Card: Add a description: what it does, in a sentence.") with "Go to it".
- **Edit their own:**
  - name, description and flavor;
  - **what it changes**: score and council changes as picker + amount rows. The pickers offer only the scenario's own scores and council, and changes show as up/down in words as well as colour;
  - for cards, times per game and rest turns; for events, how often (weight, with the base game's range as a guide).
- **See it in plain words with its net** ("It nets +4"), plus:
  - **the "only helps" nudge (§5):** a card that only raises scores says so, and why a cost matters;
  - **a calibration hint:** base cards net about +11 to +12, with at least one score going down.
- **Add the game's cards or events** from a filterable list of those not in the deck, and **take any out**. Taking out one of the author's own deletes it, after a confirmation.

**Domain** (`deck.ts`):
- `addToDeck`, `removeFromDeck`, `isOwn`, `createOwnCard` and `createOwnEvent`;
- `describeEffects`, `netScoreChange` and `onlyHelps`;
- `settleNewItemId` (below).

Deck changes apply to every scenario in the draft.

**Found on the way**
- **"Make my own version" did nothing.** It was the M4.3 proxy problem again, one layer down: the base card lives in Vue state, and the domain's copy used `structuredClone`. The domain now copies content with a JSON round trip (content is plain JSON), so it no longer depends on its callers unwrapping UI state. A test hands it a card wrapped in Vue's `reactive`.
- **New cards were stuck with `…_new_card` ids,** which show in the pack's files. Now, while a card or event still has its placeholder id, naming it settles its id from the name: when the name field loses focus, so typing doesn't lose focus. After that, an id never changes.
- **Prefixes drop a leading "the", "a" or "an":** "The Monolith of Mild Despair, retold" gives `monolith_of_mild`, not `the_monolith_of`.
- **Plain words separate clauses with semicolons,** so a card that raises two scores and lowers two doesn't read "… and … and lowers … and …".
- **The Checks rail's plain wording depends on where the problem is,** so a card's missing description doesn't read "Add a description of the pack."

**Verification** (headless Chrome, production build, Studio CSP):
1. Copy the Monolith and add an author.
2. Open the game's "Ship Quick Fix": it's read-only, in plain words. "Make my own version" opens the copy, marked yours; rename it and change an amount.
3. **+ New card**: its name is selected for typing. Name it; the id settles and focus stays.
4. The checks ask for a description. With only a score going up, the nudge appears; adding a cost and a council reaction clears it.
5. Add an event from the game, and take a base card out. The checks are clean; export.
6. **Through the game's own import:** no playability issues, five runs played through, and both of the author's cards are in the file with their edits (`…_ship_quick_fix`, `…_split_the_refunds_context`).
7. Zero CSP violations, no console errors.

Tests: 1201 in total (+10 for the deck, id settling, prefixes, and copying from reactive state).

**Next:** the council (stakeholders and their reactions), which needs the design question from M4.2 answered: what a copy of a council member means when base cards still name the original. Smaller follow-ups:
- the sidebar gets long with a full deck (collapse or filter);
- "Go to it" could focus the exact field;
- aftershocks and event conditions aren't editable yet.

### M4.5: The council: who sits at the table, and your own members (2026-11-24)

Decision **D21** (option c of the M4.4 question): the base game's council members can't be edited. They can be left out, and a copy of one is a new member. The council screen says it plainly: "You can't edit the base game's council members, because the game's cards and events refer to them. You can create new members, or copy a base member and edit the copy. The base game's cards and events don't affect your new members; only your own cards and events do. Only the members seated here take part in the game. If you don't want one of the base game's members, take them out of the scenario." The first wording ("because the game's cards are written for them") was too indirect; the owner asked for this plain version.

**What an author can do now**
- **See the council:** "4 of 8 seats", each member marked "yours" or "from the game", with the game's unseated members listed under it.
- **Open one of the game's members.** It's read-only, with their reactions in plain words ("CTO Wants Clarity. When Domain Clarity drops below 35: lowers Budget by 3 and Team Morale by 2; makes Chief Technology Officer unhappier (-5).") and a note saying why it can't be edited and what to do instead.
- **Take any member out.** A confirmation says what follows: for one of the game's members, "they won't take part … the game itself is unchanged"; for the author's own, their reactions go with them. For the author's own member, it lists their cards or events that will stop moving them; for one of the game's, it says Notes will list what still names them (M4.5a). The last seat can't be emptied.
- **Seat one of the game's members**, up to the game's limit of 8.
- **Copy one of the game's members to a new member** ("Copy to a new member"): it starts as "Chief Technology Officer (copy)" with the same description and all reactions as the author's own, editable. Reactions that moved the original move the copy. It sits next to the original, who can then be taken out.
- **Seat their own member** ("+ New member" or "+ Seat your own member"):
  - name, description and optional summary; the id settles from the name, like cards;
  - **reactions:** a name, a sentence, a condition ("When [Budget] [drops below / is at most / rises above / is at least] [40]") and what changes, with the same score and council rows as cards, in plain words. Every reaction whose condition holds happens once a turn, as in the game. The condition's text in the file (`condition_description`) is written from the condition, so it can't disagree with it.
- **Pick their own members on cards and events:** the card editor's council picker offers whoever is seated.
- **"Go to it"** from the Checks rail now reaches council members and reactions (a reaction opens its member's page).

**Domain** (`council.ts`):
- `addToCouncil`, `removeFromCouncil`, `isOwnMember`, `createOwnMember`, `copyMember` and `ownReactionsTo`;
- `addReaction`, `setReactionCondition`, `removeReaction`, `describeCondition` and `conditionText`;
- `settleNewMemberId` and `settleNewReactionId`.

Id settling for cards, events, members and reactions now shares one helper (`placeholder_ids.ts`).

`removeFromCouncil` also:
- drops the member's satisfaction floor from the scenario's balance targets. Every base v2 scenario sets one for each member, and the game's checks refuse a floor for someone not at the table;
- for the author's own member (who is deleted), strips the draft's own changes aimed at them. For one of the game's members it leaves them, and the Checks rail notes them instead (M4.5a).

**For the talk: an id is a promise.** The council question is the D7 question one level down. Content in other packs refers to a council member by id, so an "edited copy" isn't the same member, however alike it looks: it's a new identity that nothing else knows. The Studio doesn't pretend otherwise. It offers what the model really supports: seat or unseat the shared member (the scenario owns who's at its table), or bring a new member with a new identity. The scenario is the aggregate that decides membership; the council member is shared content it refers to, and only its owner, the game, can change it.

**Found on the way**
- **Naming something new lost focus after all.** M4.4 settled a card's id when its name field lost focus, so that typing wasn't interrupted. But the editor was keyed on the id, so when the id settled, Vue rebuilt it and Tab landed nowhere: the next keystrokes went nowhere. The editors are now keyed by kind, not id, and a slow load for the previous item can't land on the next one. This was verified in the browser for cards, members and reactions (focus moves on to the description).
- **The Checks rail asks council members for "who they are and what they care about",** not "what it does".

**Verification** (headless Chrome, production build, Studio CSP):
1. Copy the Monolith and add an author. Open the council: 4 of 8 seats, the explanation, and the four unseated game members.
2. Open the CTO: read-only, 5 reactions in plain words. Take them out: 3 of 8 seats, and the checks stay clean.
3. **+ New member:** type "Head of Payments", then Tab. The id settles to `…_head_of_payments` and focus moves to the description. The checks ask for the description until it's written.
4. Add a reaction: name it (focus moves on), give it a sentence, and set the condition to "is at most 30". The plain words read "when Domain Clarity is at most 30, this makes Head of Payments unhappier (-3)". The checks are clean.
5. A new card's council picker offers Head of Payments. Seat the CTO again: 5 of 8. Export.
6. **Through the game's own import:**
   - no playability issues;
   - the council is VP of Product, Lead Developer, Operations Manager, Head of Payments and CTO;
   - five runs played, and in one of them Head of Payments' reaction fired (44 at the end).
7. Zero CSP violations, no console errors.

Tests: 1211 in total (+10 for the council). One of them exports a Monolith without the CTO and with an own member whose reaction fires every turn, then plays it through the game's import: the member finishes above 50 and the CTO is absent.

**Next:** aftershocks and event conditions; then the version-bump assistant, zip export and import, and "Play it" (D15/D17). Smaller follow-ups:
- the sidebar gets long with a full deck (collapse or filter);
- "Go to it" could focus the exact field.

### M4.5a: Notes about council members who aren't seated (2026-11-24)

The owner asked for a check that warns, but doesn't refuse, when a card, event, aftershock or reaction changes how someone feels who isn't seated, and offers to seat them or change the content. The game allows this and ignores those changes (M3.9). That's right for shared content, but in a draft it usually means the author forgot something.

**What an author sees.** A **Notes** list under Checks, marked "These don't block export", with one note per person:

> **Chief Technology Officer isn't seated.** 5 cards and 2 events change how they feel. The game ignores changes to people who aren't at the table, so they do nothing. Seat them, or change those so they don't name them.

Each note has:
- **Seat [name]**;
- **Show what changes them**: every card, event, aftershock ("Aftershock of …") and reaction ("…'s reaction"), with the amount, marked yours or from the game, and **Go to it**. An aftershock goes to its card, and a reaction to its member;
- **Remove the change** on the author's own items. On the game's items, a hint says to make your own version.

The card and event editors show such a change as "Chief Technology Officer (not seated)" with "does nothing: not seated", instead of an empty picker.

**A change of behaviour.** M4.5 removed the draft's own changes to a game member the author took out of the scenario. Now those changes stay and are noted, so nothing is edited without the author asking. The confirmation says so. Deleting the author's *own* member still strips changes aimed at them, because that member no longer exists and can't be seated again.

**Domain** (`council_notes.ts`):
- `unseatedNotes(draft, base)` walks each scenario: its deck, each card's and event's aftershocks, and the seated members' reactions. It resolves the draft's own content first, then the game's, and groups the changes by person;
- `removeChangesTo` takes one person's changes out of one of the draft's own items.

The notes run alongside each check; the game's content loader caches, so they're cheap.

**Base scenarios, untouched:** none has notes except Microservice Sprawl. There, "Automate Deployment Pipeline" names the VP of Product, who isn't seated: the case M3.9 found. The note is accurate, so it shows.

**For the talk:** this is the "warn, don't refuse" side of the trust boundary. Refusing is for what could hurt a player (ADR 0014). Something that's merely surprising gets a note, with the fixes next to it.

**Verification** (headless Chrome, production build, Studio CSP):
1. Copy the Monolith: no notes.
2. Take the CTO out. The confirmation mentions Notes. Checks still says "Ready to export", and export stays enabled.
3. The note reads "5 cards and 2 events". The list shows each with its amount.
4. **Seat Chief Technology Officer** from the note: the note goes away and the CTO is back in the sidebar.
5. Take them out again. **Go to it** on Define Bounded Context opens it; "Make my own version" shows "Chief Technology Officer (not seated) … does nothing: not seated".
6. **Remove the change** on the now-yours card: the note drops to "4 cards and 2 events" and the card's council row is gone.
7. Export works with notes present. Zero CSP violations, no console errors.

Tests: 1215 in total (+4 for notes: an untouched Monolith has none; the game's content is listed by person; own content is marked and fixable; re-seating clears them).

### M4.5b: The Studio, checked for domain separation (2026-11-24)

The owner asked, after M4.5 merged, to make sure the Studio's code follows DDD and keeps the domain separate. They also set the UI/UX audit for after the important functionality (D23).

**How it was checked.** The import boundaries were already enforced by a test (ADR 0005): the Studio never imports the game's UI, the game never imports the Studio, and the authoring domain imports no Vue, DOM or storage. That held. So the audit read every screen's script for the other kind of leak: **a rule about content written inside a screen.** The test for one: would the same question be answered somewhere else, and must the answers agree?

**What was found, and where it went:**

| Rule found in a screen | Where it was | Now |
|---|---|---|
| Reading a pack's manifest file names (`cto-v1.json`) into references | three screens, each with its own regular expression | `manifestRefs` (domain, using the content model's `parseFilename`), behind `listBaseRefs` in the Studio's content adapter |
| "The draft's own content first, then the game's" | five places: the notes, the sidebar names, the aftershock names, the council and the member page | `resolveRef`, `resolveNames`, `ownEntity` and `isOwnRef` in `draft_reading.ts`. **The copies had drifted:** the sidebar treated an own item as the draft's at any version, while the notes required the exact version. The domain's answer is the exact version, the same as `isOwn`. |
| Everything a draft's scenarios refer to, once each | the sidebar, and a second version in "From the game" | `scenarioRefs` and `isReferenced` |
| An empty optional field is left out of the file, not saved empty | four editors, by hand | `withOptionalText` |
| Council changes are written only when there are some | the card editor, the reaction editor and the notes | `withEffects` |
| Reading a check's file path (`stakeholder-reaction-rules/…-v1.json`) back into what it's about | the Checks rail, with the folder names typed out | `issueSubject`, using the same file-layout table the export writes with |
| Which member a reaction belongs to | the workspace's "Go to it" | `memberOfReaction` |
| What still names a member once they're removed | the removal confirmation | `ownItemsNamingAfterRemoval` |

The notes' resolver (M4.5a) now uses `resolveRef` too, and `BaseContentReader` moved to `draft_reading.ts`, since every query uses it. `PackIssue` is exported from the authoring domain, so the screens don't reach into the content domain's services.

**What stays in the screens, on purpose:**
- Turning input into numbers and clamping them to `CONTENT_LIMITS` as the author types. The limits are the domain's; holding a field inside them while typing is input handling, and the game's checks still decide.
- Focus, selection, load guards, and every word the author reads. Wording is presentation; the plain words for *content* (`describeEffects`, `describeCondition`) were already in the domain.

**Guards.** Two new boundary tests:
- only the Studio's content adapter (`studio/src/content`) imports the content domain's services; screens ask the authoring domain;
- no Studio file parses content file names itself.

The second test fails on the code before this change, which is how we know it catches the leak.

**For the talk: the second client is the test of a domain.** The game's UI kept its rules out because the engine was built first and the UI came later. The Studio was built screen by screen, and each screen needed "whose is this?", so each answered it locally. Nothing was wrong on any one screen. The bug was that there were five answers, and two of them disagreed about versions. In DDD terms, the draft is an aggregate seen through a lens: "our content shadows the game's, by id *and* version". A lens like that belongs in the model, once, with a name. The audit's value wasn't moving code; it was naming the rules ("own first, then the game's", "empty optional fields are left out") so that there's one place to change them.

**Verification** (headless Chrome, production build, Studio CSP), with every screen the change touched:
1. Copy the Monolith. The sidebar names everything. "Go to it" opens Pack details; with an author, the pack is ready to export.
2. The council shows 4 of 8 seats and the game's four unseated members.
3. "+ From the game" lists 17 cards and 19 events, none already in the deck. Adding one removes it from the list and adds it to the sidebar.
4. Make your own version of Define Bounded Context; set its flavour text, then clear it. The pack still checks clean.
5. A new member with a reaction. "Go to it" on the reaction's issue opens its member.
6. The whole M4.5a notes flow (take out the CTO; 5 cards and 2 events; seat from the note; remove the change on your own copy; 4 cards and 2 events; export) gives the same results as before.
7. Zero CSP violations, no console errors.

Tests: 1225 in total (+10: reading a draft over the game, issue subjects, the editing helpers, and the two boundary guards). No engine change, so the fixed-seed audit is unaffected.

**Next:** aftershocks and event conditions (see §6 for the rest of M4's order, ending with the UI/UX audit).

### M4.6: Aftershocks and when events can happen (2026-11-24)

This finishes editing cards and events. Until now, aftershocks and event conditions were shown with "arrives in a later release".

**What an author can do now** on their own card or event:
- **See its aftershocks** ("2 of 8"), each marked "yours" or "from the game", in plain words: "2 turns later, this raises Domain Clarity by 7 and Maintainability by 3."
- **Make their own version of one of the game's aftershocks.** Only this card switches to the copy; the game's other cards keep the original.
- **Write a new aftershock:** name (the id settles from it, as with cards), what players read when it lands, how many turns later (1–20; the game's use 1–3), and its score and council changes in the same rows as cards.
- **Add one of the game's aftershocks** from a list, or **take one off.** Taking off the draft's own aftershock deletes it once nothing else uses it; one shared by two of the author's cards says "Also on …".
- **See the net with aftershocks:** "It nets 0, or +10 with its aftershocks". The calibration hint ("the base game's cards net about +11 to +12, aftershocks included") was already counting aftershocks, but the number beside it wasn't, so the two couldn't be compared until now.
- **Choose when an event can happen:** "Any turn" or "Only while [score] [is below / is at most / is above / is at least] [value]", in plain words. As with reactions, the text the game stores (`trigger_condition_description`) is written from the condition.
- **"Go to it" on an aftershock's issue** opens the card or event it's on, with focus in the aftershock.

The game's cards and events (read-only) now list their aftershocks and conditions in plain words, too.

**Domain:**
- `aftershocks.ts`: `addNewAftershock`, `attachAftershock`, `detachAftershock`, `copyAftershockToEdit`, `settleNewAftershockId`, `aftershockUsers` and `netWithAftershocks`.
- `setEventCondition` in `deck.ts`.
- The condition vocabulary moved out of `council.ts` into `conditions.ts`, since reactions and events share it: `CONDITION_WORDS`, `describeCondition`, `conditionText`, `startingCondition`, and `PLAY_RANGE` (0–100, replacing two hard-coded 100s in screens).
- The Studio has one `ConditionEditor` and one `AftershockEditor`, and the member page uses the same condition editor as events.

**A wording fix found on the way.** Conditions said "drops below" and "rises above". That describes a *crossing*. The game checks conditions every turn, so a reaction fires on *every* turn its condition holds, not once when the score crosses the line. "Drops below" taught authors the wrong model, and "it can only happen while Budget drops below 40" read badly. The words now describe a state: "is below", "is above".

**For the talk: shared content forces the copy question again, one level down.** Cards (D7), then council members (D21), now aftershocks: "Refactoring Payoff" follows nine of the game's cards. Editing it in place would change nine cards the author never opened. Each time the answer is the same: the shared thing belongs to its owner, and the author gets their own version, with a new identity, scoped to where they asked for it. Because the domain already said this twice, this slice was mostly reuse: the same id settling, the same "yours / from the game" marks, and the same plain words.

**Verification** (headless Chrome, production build, Studio CSP):
1. The game's Define Bounded Context shows "Aftershock, 2 turns later: Boundaries Clarify Over Time: raises Domain Clarity by 7 and Maintainability by 3."
2. Make your own version: 1 of 8 aftershocks, "from the game". It nets 0, or +10 with its aftershocks.
3. Make your own version of the aftershock and set it to 3 turns: "3 turns later, this …". The checks stay clean.
4. **+ New aftershock:** type "Knowledge Spreads", then Tab. Focus moves to "What players read when it lands". The checks ask for its description; "Go to it" opens the card with focus in the aftershock. Fill it in and the checks are clean.
5. Add the game's Team Energized: 3 rows, and the net rises to +23. Take it off: 2 rows.
6. **+ New event "Audit Season":** "Only while" Domain Clarity is above 60, in plain words. Switching to "Any turn" removes the condition, and switching back restores it. The checks stay clean, and the pack exports.
7. The game's events read "Only when: Team Morale is below 30". The CTO's reactions read "When Domain Clarity is below 35"; a copy's condition can be changed with the shared editor.
8. Zero CSP violations, no console errors.

Tests: 1232 in total (+7 for aftershocks and event conditions). One exports a draft with its own aftershock and two own events, one that can always happen and one that never can, imports it through the game's own code and plays five runs: the first event happens, the second never does, and the aftershock is in the scenario bundle.

**Next:** the version-bump assistant.

### M4.7: Exporting is a release: the version-bump assistant (2026-11-24)

The assistant was planned in CONTENT_PACKS.md §7 (item 4): compare the draft with the last export, and when a gameplay field changed on content that already left the Studio, explain why and make the next version. Decision **D24** records the result.

**What an author sees.** "Export pack file" now opens an **Export your pack** page instead of downloading at once:
- **First export:** "This is the first export of … From now on the Studio remembers what you exported." Version 1.0.0.
- **Later exports**, under "Since version 1.1.0":
  - **Plays differently:** "Define Bounded Context (card): Rest turns changed: version 1 → 2. Also reworded: flavour text." and "The Monolith of Mild Despair (scenario): Something it includes changed, so it moves too: version 2 → 3." New and removed content is listed too.
  - **Wording only:** "… Name and flavour text changed. It keeps version 1."
  - A short **why**: "A version names exactly how something plays. Once version 1 of 'Define Bounded Context' has left the Studio, it must always mean that, so a change to how it plays gets the next number. The Studio updates everything in your pack that points to it."
- **The pack version** players will see, prefilled with a suggestion ("Suggested: 1.2.0, because something plays differently") and checked: "Use a version after 1.1.0: players' copies of 1.1.0 are already out there." With nothing changed, the same version can be downloaded again.
- **Download version 1.2.0.** The bumped draft is kept, and saved at once, only if the game's checks accept the export. A refused export leaves the draft as it was.
- Pack details says "Last exported as version 1.2.0" instead of showing a version that might be about to change.
- If the open card or member gets a new version, its editor stays open on it.

**Domain** (`releases.ts`):
- `DraftPack.released` holds the last export's pack version and a copy of its content. It's Studio memory and never goes into the pack file (a test checks this).
- `changedFields` compares field by field, with stable key order, and splits the changes into play and wording. The wording list is short and explicit (name, short name, description, summary, flavour text, the two condition wordings, balance targets). Anything else, including fields the Studio doesn't know yet, counts as play.
- `applyVersionBumps` runs until nothing else moves. A bumped card changes the scenario's `card_refs`, so the scenario is bumped on the next pass, and an aftershock moves its card and then the scenario. Content already bumped since the last export isn't bumped again, however often it changes in between.
- `planRelease` builds the summary, the release kind and the suggested version. `releaseDraft` applies the bumps and records the release. `releaseVersionProblem`, `isLaterVersion` and `nextPackVersion` handle pack versions.

**A design question on the way: ship the old versions?** CONTENT_VERSIONING says "never modify old versions; leave the old file on disk", and the base game ships both `improved_clarity-v1` and `-v2`. So the first design kept released versions inside the new pack file. That would have meant a draft holding two versions of one id, a model change everywhere. The deciding fact was elsewhere: the game resumes a saved run only with the *exact* content it was played with (a content hash, M2.6), so an old version inside the new file helps no player. The guarantee that matters is that the *name* `card-v1` never means something else; the previous pack file keeps `-v1`. So the draft stays one version per id, and the number moves.

**For the talk: a version is part of an identity, and identity is a domain rule, not a file-naming convention.** CONTENT_VERSIONING.md was written for developers editing JSON by hand. The Studio's authors will never read it, so the model has to carry the rule. The interesting part was the cascade: a reference is part of the referrer's behaviour, so changing what a card is changes what the scenario is. Once the version is treated as identity, the cascade is obvious.

**Verification** (headless Chrome, production build, Studio CSP):
1. With a check failing, the export page disables "Download version 1.0.0" and says to fix the problems under Checks first.
2. **First export:** 1.0.0 downloads.
3. **Make my own version of Define Bounded Context.** "Scenario: Cards changed: version 1 → 2" and "Define Bounded Context (card): New since 1.0.0"; 1.1.0 is suggested and downloads.
4. **Change the card's rest turns to 2 and its flavour text.** "Rest turns changed: version 1 → 2. Also reworded: flavour text." The scenario "moves too: version 2 → 3". 1.1.0 is refused; 2.0.0 is accepted and downloads.
5. After the release, the export page reads "Nothing has changed since you exported version 2.0.0". The card's editor is on its new version, still editable.
6. **Reload:** Pack details says "Last exported as version 2.0.0".
7. The 2.0.0 file read by the game's own bundle reader:
   - pack version 2.0.0;
   - scenario `-v3`, card `-v2` with rest turns 2 and the new flavour text;
   - no `released` anywhere in the file.
8. Zero CSP violations, no console errors.

Tests: 1242 in total (+10 in `releases.test.ts`, including an export of a released draft through the game's own import). No engine change.

**Follow-ups noted:**
- **Changing the pack's prefix after a release** changes the pack's id, so players would see a different pack. Pack details should warn about this once a draft has been exported.
- **Imported packs** (the zip and bundle import, next) should start with their imported content as the "last export".

**Next:** zip export and import.

### M4.7b: Which game a pack is for (D25) (2026-11-24)

Reviewing #55, the owner asked the right question: authors should manage their versions, and the Studio should manage which *game* version a pack is tied to. Was that the case? Half of it was. D24 now names the three kinds of version and who owns each.

**The pack's version belongs to the author.** The Studio suggests and refuses only going backwards. Nothing changes there.

**Content versions belong to the Studio.** Authors never see ids, and a forgotten bump would change a saved run under a player. Nothing changes there either, but D24 now says why in those words.

**Which game a pack is for belongs to the game, and that's what was missing.** A pack declares two things:
- `schema_version`: the file format. A game that's too old refuses a newer format instead of misreading it.
- `depends_on: base <version>`: the base content it builds on. The game accepts any later base of the same major version (caret).

The Studio wrote both as constants: format 1 and base 1.0.0. Both were right today. The risk was tomorrow: base 1.1.0 adds a card, an author uses it, the pack says it works on 1.0.0, and a player on 1.0.0 installs it and meets missing content.

**What changed:**
- **Domain:** `gameTarget(firstParty)` reads the format from the game's `CURRENT_PACK_SCHEMA_VERSION` and the base version from the base pack the draft is checked against. `draftManifest` and `draftToRawPack` now take that target; `checkDraft` and the export compute it. The `DRAFT_DEPENDENCY` constant is gone. Without a base pack loaded, the Studio refuses to guess.
- **Export page:** "Made for DDDnD's base game 1.0.0. It works in any 1.x version from 1.0.0 on." (`compatibleBaseGames`, from the same caret rule the game uses.)
- **The base pack's promise, enforced** (`scripts/lib/base_content_lock.ts`, `scripts/base-content-lock.json`). Within a major version:
  - every `<id>-v<n>` the base has shipped stays shipped;
  - it plays the same: the lock stores a short hash of each file's *play* (`playSignature`, the same wording/play split the Studio uses for drafts), so rewording passes and a changed number fails;
  - new content comes with a later base version.

  A new major version starts a new lock.
- **Nobody has to remember it** (the owner's follow-up: "make sure the npm scripts run the locks so GitHub and local dev don't forget"):
  - `npm install` runs `prepare`, which points git at `.githooks/`. Its pre-commit hook acts only when a commit includes base content: it records the lock and adds it to the commit, or stops the commit with the broken rule. It also stops when base content has unstaged changes, since the lock is recorded from the files on disk. `prepare` does nothing where there's no git checkout, so it can't break a build.
  - CI runs `npm run content:lock:check` as its own named step, writing nothing. The test suite checks it as well, so `npm test` catches it locally. CONTENT_VERSIONING.md allows one exception: making behaviour explicit in a new structured field when a test proves it plays identically (M1.4). That goes through `--accept <section>/<file>`, so it's always named on purpose.

**Why a check, not a habit:** the game, its content and the Studio live in one repository and both sites deploy from `main` (a `content/` change rebuilds both). So "the Studio is up to date with the game" doesn't need a release process: the Studio reads the game's own files, and the lock makes the base keep its word to packs already out there.

**For the talk: a published language needs a contract, and in a monorepo the contract can be a test.** The base pack is upstream of every community pack (a customer/supplier relationship, in context-mapping terms). The game's ids and versions are the published language. Writing the supplier's promise down as a lock file turned "be careful with base content" into a failing build with a sentence that says what to do.

**Verification:**
- Tests: 1250 in total. `game_studio_sync.test.ts` exports a real draft and checks it declares this repository's format and base version. Lock cases: removed, changed play, reworded, new content without a version bump, an earlier version, a new major, and a named exception.
- By hand: changing a base card's score change makes `npm run content:lock` refuse, naming the file and what to do. Changing only its name passes. The card was restored.
- The hook, on a throwaway branch: a play change, unstaged base changes, and new content without a base version bump each stopped the commit with the right sentence. A wording change committed with the lock unchanged. New content with base 1.1.0 committed, and the hook added the updated lock to that commit. Afterwards `content:lock:check` passed.
- Headless Chrome (production build, Studio CSP): the export page shows the base-game line. All three downloaded files declare `depends_on: base 1.0.0` and format 1. Zero CSP violations, no console errors.

**Risk noted:** the game and the Studio are two Netlify sites building the same commit, so for a few minutes one can be ahead of the other. If the Studio deploys a base version bump first, a pack exported in that window declares a base the live game doesn't have yet, and the game refuses it with its "needs a newer DDDnD" kind of message. This fails safe and is short-lived; launch (step 8) could order the deploys if it matters.

### M4.8: Zip export and import (2026-11-25)

D4 promised two downloads: the pack file the bazaar imports, and a zip in the repository layout to commit to GitHub. Both now exist, and both come back in.

**What an author sees:**
- **The export page** has a second button, **Download as a zip for GitHub**, with one line on which to use: "The pack file is what players import in the game's Community bazaar. The zip holds the same pack as a folder, with a README, to publish on GitHub." Either download is the release: download one, and the other is the same version.
- **The zip** is the packs repository's layout under the pack id (`gilded_ledger/manifest.json`, `gilded_ledger/cards/…`) with a generated README: the description, version, which base game it works with (D25), authors, license, the contents by name, and how to play it from a file or from GitHub, with a tag-pinned manifest URL.
- **The start screen** has "Keep editing a pack" with **Import a pack**. It takes a `.dddnd-pack.json` or a zip, whether a pack's folder or a whole repository download holding one pack. It opens as a new draft, or lists every reason it can't ("It is a standalone pack. The Studio makes packs that build on DDDnD's base game.").
- **An imported pack starts as released** at its version, so the export page compares the next export with it: the follow-up from M4.7 is done.
- **Your drafts** show each draft's version.

**Domain** (`pack_files.ts`): `readPackArchive` finds the pack's one `manifest.json`, reads it, then reads only the files its inventory lists, and hands them to the game's own snapshot builder. `draftFromPack` turns a snapshot into a draft, or refuses (D26). `exportDraftArchive` checks the draft and lays out the files; `packReadme` writes the README. The domain sees an archive only as names and a batch read (`PackArchive`); the zip format is the Studio's.

**The zip itself** (`studio/src/content/pack_files.ts`, T11). The first version was a hand-written reader on the browser's `DecompressionStream`, because installing a library was blocked in the session. The owner's call: "let's not reinvent the wheel". Zip parsing is where edge cases live (zip64, data descriptors, damaged archives), so the format is now **fflate 0.8.2** (MIT, no dependencies, pinned exactly, Studio only: the game never imports it). The bounds stay ours, checked before and while anything decompresses:
- the file's size, before it's read;
- the number of entries, and every entry's name: plain relative paths only (no `..`, no leading `/`, no backslashes or drive letters);
- only the manifest, and then the listed files, are decompressed, each counted while it inflates and stopped past its cap, whatever its header claims; everything read is capped together;
- every entry must be UTF-8 text.

**A design question on the way: one pass or many.** The domain first read files one at a time. With a streaming unzip that means a pass over the archive per file, up to 2,000 passes. So the archive reads in batches: one pass for the manifest, one for everything it lists.

**For the talk: an anti-corruption layer can be one function.** A pack from outside is the game's published language, but the Studio's model is a draft, which can't hold everything a pack can be. `draftFromPack` is the translation, and the important design choice was what it does when the translation would lose something: refuse, and say what. Silently translating less is how a model corrupts the data it was meant to protect.

**Verification:**
- Tests: 1267 in total (+17). Domain: an import→export→import round trip of the Gilded Ledger keeping its content, license and homepage; every refusal; the batch reads and their caps. The adapter: zips from the Studio and from a repository layout; a 4 MiB zip bomb stopped while inflating; the total cap; unsafe names; too many entries; broken and non-pack files; the game's own refusals passed through.
- Headless Chrome (production build, Studio CSP), with zips made by Python's `zipfile`, not by fflate:
  1. A text file, a zip with two packs and a standalone pack are each refused with the reason.
  2. A repository zip opens as "Demo: The Gilded Ledger", with checks clean and the export page reading "Nothing has changed since you exported version 1.0.0".
  3. Rest turns on "Split Out the Refunds Context" changed: "Rest turns changed: version 1 → 2", and the scenario "moves too: version 1 → 2". 1.1.0 is suggested and downloads as a zip; the same version then downloads as a pack file.
  4. Both downloads import back as drafts that are unchanged since 1.1.0.
  5. Zero CSP violations, no console errors.
- The exported zip, unpacked by Python (`testzip` clean), passes `scripts/validate-content-pack.ts`, the validator the packs repository's CI runs.
- The Studio's bundle grew from 81.9 to 92.3 kB gzipped. The game's bundle is unchanged.

**Left open:** the zip has no LICENSE file; the README names the license and links the GPL text. Bundling the full text would add about 35 kB to the Studio. (Settled in M4.8a: the zip carries it.)

**Next:** "Play it" (D15, D17).


### M4.8a: The zip carries the license (2026-11-26)

The owner settled M4.8's open question: the zip carries a `LICENSE` file.

**What an author sees:**
- The zip for GitHub now holds `LICENSE`, the GPL's full text, next to the README. The README says "GPL-3.0-or-later, like DDDnD's base game. The full text is in `LICENSE`."
- Pack details names the pack's actual license. Since D27 the game and new packs are GPL-3.0-or-later, so an imported GPL-3.0-only pack (both published packs are) reads "licensed GPL-3.0-only", where it used to say "GPL-3.0 like the game".

**Domain:**
- `draftLicense(draft)` answers which license a draft has (its own, kept from an import by D26, or the Studio's) and whether it is the game's. The README and Pack details both ask it. Before, the README said "like DDDnD's base game" for every pack, and Pack details had "GPL-3.0" typed into it.
- `exportDraftArchive` takes `LicenseTexts` (full texts by SPDX id). It adds `LICENSE` when it has the pack's license text. Otherwise the README says the text isn't included and to add it before publishing.

**The adapter** (`studio/src/content/license_texts.ts`) bundles the repository's own `LICENSE` at build time (`?raw`), so the text is exactly the game's. A pack that builds on the base game must be GPL-3.0-only or GPL-3.0-or-later (the game's validator), and both have this text, so every Studio zip carries it. The "not included" wording is only a fallback.

**Decision:** the domain chooses the license and the app supplies the words. The domain reads no files, and a license text is 35 kB of data, not a rule, so it lives at the edge like the zip format.

**For the talk: a fact typed into a screen is a rule in disguise.** "Licensed GPL-3.0 like the game" looked like copy, but it stated a fact about the draft. It became false the day imports could keep their own license (D26), and false for every published pack the day the game moved to GPL-3.0-or-later (D27), which happened while this slice was in review. Copy that states a fact about content needs a domain answer behind it, which is what D22 says, applied to a sentence.

**Verification:**
- Tests: 1269 in total (+2). The zip carries the text it's given, and still imports back as the same draft. A pack's own license is named without "like the game", and the README says when the text is missing.
- Headless Chrome (production build, Studio CSP): copy the Monolith, add an author, and download the zip. Python's `zipfile` reads it cleanly. Its `LICENSE` is byte-identical to the repository's, and `scripts/validate-content-pack.ts` passes it. The zip imports back unchanged ("Nothing has changed since you exported version 1.0.0"). Zero CSP violations, no console errors.
- The Studio's bundle grew from 92.3 to 105.0 kB gzipped. The game's bundle is unchanged.


### M4.8b: Authors choose their pack's license (2026-11-26)

After the relicense (D27), the owner asked to let pack authors pick a compatible license, so an imported GPL-3.0-only pack can move to GPL-3.0-or-later, or the other way.

**What an author sees:**
- **Pack details** has a **License** section with two choices: "GPL-3.0-or-later, like the game" and "GPL-3.0-only". Each has one plain line on what it means. A note says players see the license before they import, and that changing it after an export makes the next export a new version.
- **The export page** lists a license change under its own heading: "GPL-3.0-only → GPL-3.0-or-later. Players who have version 1.1.0 keep it under GPL-3.0-only." It suggests a patch ("1.1.1, because the license changed") and refuses the same version.

**Domain:**
- `licenseChoices()` lists what a Studio pack may use: the game's validator's GPL list (ADR 0004), the game's own first, each with its plain words.
- `withLicense(draft, id)` sets one and keeps the existing rule: the Studio's own license isn't stored. It refuses anything else.
- A release now records its license (`DraftRelease.license`), from the export or, for an import, the manifest. `planRelease` reports `license: { from, to }` when it changed, and counts it like wording: no play changed, so a patch.

**Decisions:**
- **A license change is a new release.** Same pack id and version must mean the same thing (D24), and different terms are a different thing, even when every card plays the same.
- **A patch, not a minor:** nothing plays differently.
- **A release from before the Studio recorded its license compares nothing.** Only drafts exported between M4.7 and now lack it, and the Studio hasn't launched.

**For the talk: the release is the aggregate's memory.** The version-bump assistant already compared content with "what you last exported". A license is just another fact a release must remember, so the change was one field on `DraftRelease` and one comparison in `planRelease`. The screen didn't learn anything about versions. When the model owns "what changed since the last release", a new kind of change is a one-line addition to the model, and every screen that shows a release gets it.

**Verification:**
- Tests: 1273 in total (+4): the choices and their order; storing only a non-default license and refusing others; a license change as a patch release that the same version can't reuse, and changing back is no change; an older release without a recorded license compares nothing. Imports record the released license.
- Headless Chrome (production build, Studio CSP):
  1. Import the Gilded Ledger zip. Pack details shows GPL-3.0-only checked.
  2. An arrow key moves the choice to GPL-3.0-or-later.
  3. The export page shows the License change and suggests 1.1.1.
  4. The zip's manifest and README say GPL-3.0-or-later, "like DDDnD's base game", with `LICENSE`.
  5. After the download: "Nothing has changed since you exported version 1.1.1".
  6. Zero CSP violations, no console errors.

**Left open:** ADR 0017 lists this control as a follow-up; it is now done.


### M4.9: The workspace shell (UI/UX audit, slice 1) (2026-11-26)

The first slice of the audit (D23), after the owner chose Direction A with a summary view (D28). It changes the frame around the editors; the editors themselves come in later slices.

**What an author sees:**
- **The workspace fills the window.** The header and the toolbar stay put, and the contents sidebar and the editor each scroll on their own. Before, the whole page scrolled as one: scrolling down a 26-card list left an empty editor, and the Checks rail went with it.
- **The sidebar groups everything:** Pack (details, scenario), Council ("4 of 8"), Cards and Events. Each group collapses.
  - Your own members, cards and events come first.
  - The game's cards and events sit under a closed "From the game · 26".
  - "+ New …" and "+ From the game" sit inside each group. "All seats" opens the council page.
- **A filter finds anything by name,** and says what each match is ("card", "council", "scenario").
- **Whatever opens is shown:** a new card, a check's "Go to it" or a link opens the right group and scrolls the item into view.
- **The checks are a toolbar button** ("1 to fix · 1 note", "Ready to export") at every width. It opens a panel with the game's checks and the council notes. Escape or a click outside closes it, and "Go to it" closes it and opens the editor.
- **No gold frame around the start screen.** The Studio moves focus to the page's main landmark on every route change, and Chrome drew the focus ring around it. A landmark isn't a control, so it no longer gets one.

**Domain:** nothing new. The sidebar asks the domain whose each item is (`isOwn`, `isOwnMember`), as the old sidebar did. Putting "yours first" is ordering on that answer, not a new rule. Filtering by the names the workspace already shows is input handling.

**Decisions:**
- **The checks button owns the live region.** The panel's own status no longer announces when it's inside the panel, so a screen reader hears "2 things to fix before export. 1 note." once, without opening anything. It stays silent while checking, so typing isn't interrupted.
- **The game's items start closed, your own open.** An author's work is what they came to edit; the game's 26 cards are one click away and open by themselves when something points to one.
- **Undo/redo and "Find anything" (search with a shortcut) wait** for their own slices, and the summary view comes with the connection work.

**For the talk: layout is where a model's shape shows.** The old sidebar was a flat list because the screen read the draft as a flat list of references. The new one shows the aggregate as it is: one pack, with the author's own content and references to the game's. Every sidebar decision mapped onto a distinction the domain already made (`isOwn`), so the redesign needed no new rule. That's what you hope for when the model is right: the UI can change shape without the model changing.

**Verification:**
- Tests: 1280 in total (+7, `tests/studio/workspace_shell.test.ts`): your own cards first and the game's under a closed "From the game · 26"; the selected item's group opens; the filter, its kinds and its empty message; "+ New member" off when the council is full; the checks button's text and single live region; Escape and "Go to it".
- Headless Chrome (production build, Studio CSP):
  1. The start screen has no frame.
  2. A new card shows, selected, in the sidebar; scrolling the editor keeps the toolbar in view.
  3. The checks panel's "Go to it" opens Pack details; Escape returns focus to the button.
  4. The filter finds "Harden Operational Runbooks".
  5. At 1024 px with Largest text and at 700 px, the toolbar wraps and the checks button stays.
  6. Regression, M4.5a's notes flow: take out the CTO; the button reads "1 to fix · 1 note"; the note lists 7 sources (5 cards, 2 events, as in M4.5b); seating from the note clears it.
  7. Zero CSP violations, no console errors.
- `scripts/dev/browser-check.example.mjs` now waits on the checks button (the rail it read is gone).

**Next:** slice 2, consistent actions and wording (two verbs for removing, one ember action, explanations said once, a game card shown like your own but locked), then the connections and the summary.


### M4.10: Actions and wording, the same everywhere (UI/UX audit, slice 2) (2026-11-26)

The second slice of the audit (D23, D28): every editor does the same things in the same place, with the same words.

**What an author sees:**
- **Every editor's actions are in its head,** to the right of its title: "Make my own version" and "Take out of this pack" on the game's cards and events, "Copy to a new member" and "Take out of this pack" on the game's members, "Delete" on your own. Before, they sat at the bottom of long pages, under the fold.
- **Removing has a verb per scope:**
  - **Take out of this pack**: one of the game's cards, events or members leaves your pack. The game's original stays.
  - **Delete**: something of your own is gone.
  - **Remove**: a row or a link inside an editor goes (a score change, an aftershock from this card).

  Before, there were six phrasings: "Take it out of the deck", "Take them out of the scenario", "Delete it", "Delete this member", "Take it off this card", "Remove this reaction". Each removal still asks first, in one shared confirmation under the head that says what goes.
- **The game's content is shown locked, with one line and a "Why?":**
  - Cards and events: "It plays exactly as in DDDnD. To change it, make your own version."
  - Members: "They react exactly as in DDDnD. To change them, copy them to a new member."

  The reasons (D7, D21) are behind "Why?", said once. Before, the council's explanation was repeated in full on the council page and on every member's page. A game card also shows its limits, and a game event its weight, read-only.
- **One ember button per screen:** "Export pack". The council's "+ Seat your own member" is now a quiet "+ New member" (the same words as the sidebar). The start screen's "Open" buttons are quiet. On the export page, the toolbar's Export goes quiet and the download is the one action.
- **A disabled button looks disabled:** the export page's "Download" was a dim ember that still looked pressable.
- **Only your own members are marked** on the council page ("yours"); "from the game" on every other card was noise.
- **Small fixes:**
  - "Times per game" says "No limit" when empty.
  - The weight's hint is no longer squeezed into the field's width.
  - "Fix the problems listed under Checks" now points at the toolbar's "to fix" button.

**Domain:** nothing new. Every word that changed is about the Studio's own actions, not about content. Whose an item is still comes from `isOwn` and `isOwnMember`. The confirmation's list of what stops working when a member goes is still `ownItemsNamingAfterRemoval`.

**Decisions:**
- **Three verbs, not two.** The canvas proposed two ("Take out" and "Delete"). Walking the editors showed a third scope: removing a row or a link inside an editor, which deletes nothing. "Remove" keeps that apart from the other two.
- **The editor frame is shared.** Every editor had its own copy of the same head styles (`.editor`, `.editor-kicker`, `.editor-title`). They now live once in `studio.css`, with the new head row, the locked note, the "Why?" disclosure and the confirmation, so the screens still to come (Play it, new-topic authoring, the guided round) get them for free. This is the start of the pattern guide (slice 5).
- **The removal component is only the confirmation now.** The member page owns the button in its head; `RemoveMember` is what opens under it. That's the same shape as the card editor's.

**For the talk: consistency is a vocabulary problem.** The six phrasings for removing weren't careless: each was written on the day its editor was built, and each was locally right. What was missing was a shared vocabulary of scopes: leaves your pack, gone for good, unlinked here. That's the same move as DDD's ubiquitous language, applied to the UI. Name the concepts once, and every screen that needs one uses the word.

**Verification:**
- Tests: 1285 in total (+5, `tests/studio/editor_actions.test.ts`):
  - a game card shows its actions in the head, its locked note and "Why?", its limits, and no ember button;
  - your own card is deleted from the head after a confirmation, which "Keep it" cancels;
  - a game member offers "Copy to a new member" and "Take out of this pack", and the confirmation says what taking them out does;
  - the last council member can't be taken out, and the hint says why;
  - the council page marks only your own members, with a quiet "+ New member".

  The editors load the game's content from the repository in these tests, through a mocked content adapter.
- Headless Chrome (production build, Studio CSP):
  1. Define Bounded Context from the game: actions in the head, the locked note, and "Why?" opening the reasons.
  2. "Make my own version" opens yours with "Delete" in the head; the confirmation reads "Delete “Define Bounded Context”? It's gone from your pack."
  3. VP of Product: "Copy to a new member" and "Take out of this pack".
  4. A new event's weight hint spans the section.
  5. On the export page the only ember is the download, and it's disabled until the checks pass.
  6. Zero CSP violations, no console errors.

**Next:** slice 3, connections. Pickers that create what they pick, placeholders the summary tracks, "what changes their satisfaction" on a member, and the generic effect words ("Head of Payments +2 satisfaction").


### M4.11: Connections, from both sides (UI/UX audit, slice 3a) (2026-11-26)

The owner named the confusing part of editing: *where to start, and how to connect things*. For example, a card that affects a council member: make the member first and come back to the card, or the other way round? Slice 3 answers it in two parts. This first part makes connections visible from both sides and writes effects generically. The second (3b) lets a picker create what it picks, so an author never has to leave what they're editing.

**What an author sees:**
- **Every council member's page lists "What changes their satisfaction":** each card, event, aftershock and reaction, with its signed change ("Freeze the Ledger · card · yours, −3 satisfaction"). Each one links to where it's edited: an aftershock opens its card, and another member's reaction opens that member. For a new member it says how to connect one ("Give one of your cards or events a change to Head of Payments…"), and the D21 rule in one line: the game's own cards don't change members you create, so make your own version.
- **The sidebar counts them:** "Chief Technology Officer 12".
- **Placeholders are marked, not blocked:**
  - An amber ring before the name of your own members, cards and events that still have a Studio name ("New card") or no description.
  - On their editor: "To fill in: what they care about. Fine while you work; the pack needs them before you export."
- **Effects read the same for any pack (D29):** "Domain Clarity +6, Maintainability +2, Delivery Confidence −3, Budget −5; Chief Technology Officer +2 satisfaction". This replaces "raises … by …; makes … happier (+2)". The minus is a true minus sign, so a screen reader says "minus".

**Domain (`connections.ts`, new):**
- `scenarioChanges(draft, base)`: one walk per scenario of everything that changes anyone's satisfaction (cards, events, their aftershocks, seated members' reactions), seated or not.
- `changesByMember`: that walk, merged across scenarios, each source once.
- `unseatedNotes` (M4.5a) is now the part of the same walk about people missing from the table. Its tests pass unchanged, and a new test checks that the notes and a member's sources agree, because they are one walk.
- `toFillIn(draft)`: the draft's own members, cards, events and aftershocks still named by the Studio or without a description.
- `describeEffects` is rewritten (D29), with `signedDelta` and `SATISFACTION_WORD` (the game's own word).
- `landingWords` ("the next turn", "2 turns later") moved into the domain from two screens that each had a copy.
- The Studio walks once per check and derives the notes and every member's sources from it (`unseatedNotesFrom`, `changesByMemberFrom`).

**Decisions:**
- **"Made from" isn't stored.** The canvas said "You added Head of Payments from Freeze the Ledger". That needs no history: "What changes their satisfaction" says the same thing, from what the pack is now, and stays true when the card changes later.
- **A placeholder is a name or a description,** the two things every member, card, event and aftershock has. Missing reactions or effects are design choices, not gaps.

**For the talk: one walk, three screens.** The council notes, a member's "what changes them" and the sidebar's counts all answer the same question: what changes whom. Before this slice only the notes asked it, so it lived in a function named after the notes. Naming the question (`scenarioChanges`) and making the notes one filter of it is a small refactor, but it means three screens can never disagree about who is changed by what. It's the same lesson as M4.5b's "own first, then the game's": when a second screen needs an answer, that's the moment to give the answer its own name.

**Verification:**
- Tests: 1292 in total (+8).
  - `tests/authoring/connections.test.ts`: a seated member's sources; notes and sources agree; a new member sees only the author's own content (D21); what's still to fill in.
  - `deck.test.ts`: the generic wording, including a pack-named "Nerdiness" score, and its empty case.
  - `aftershocks.test.ts`: `landingWords`.
- Headless Chrome (production build, Studio CSP):
  1. The sidebar counts the Monolith's council (CTO 12, VP of Product 7, Lead Developer 5, Operations Manager 7).
  2. The CTO's page lists 12 sources; Define Bounded Context's link opens it, reading "Domain Clarity +6, … Chief Technology Officer +2 satisfaction".
  3. A new member named Head of Payments shows "To fill in: what they care about" and how to connect them.
  4. A new card changing them by −3 reads "Head of Payments −3 satisfaction". Their page then lists it, and the sidebar shows the ring and "1".
  5. Zero CSP violations, no console errors.

**Next (3b):** the picker that creates or seats a member from inside a card ("+ “Head of Payments” as a new council member"), and adding a card's or event's change from the member's page.


### M4.12: Connecting from where you are (UI/UX audit, slice 3b) (2026-11-26)

The second half of slice 3 (D30). An author can connect a card and a council member from either side, in any order, without leaving the editor they're in.

**What an author sees:**
- **"What it changes" is one list:** scores and council members together, each row naming what it changes ("Head of Payments · council") and its amount, with "satisfaction" beside a member's. Before, there were two blocks ("Scores" and "Council") of dropdowns.
- **"+ Add a change" opens one picker:** "Who or what does it change?". It offers:
  - the scores it doesn't change yet;
  - the members at the table;
  - the game's members who aren't seated ("Chief Financial Officer, seats them, 3 seats free");
  - last, the typed name as someone new: **+ “Head of Payments” as a new council member**.

  Choosing someone new makes them, seats them and adds the change, and the author stays on the card. Head of Payments then shows in the sidebar with the to-fill-in ring (M4.11).
- **The picker is keyboard-first:** it's focused when it opens, arrows move, Enter picks, Escape closes and returns to "+ Add a change", and a new row's amount is focused, ready to type.
- **From a member's page, "Make a card or event change how they feel":** choose any card or event in the deck and an amount, then **Add**. If it's one of the game's, the Studio makes your own version first, with the change on it, and it replaces the original in your deck: "Ship Quick Fix (now your own version) changes their satisfaction by −2."
- The same picker works in aftershocks and in a member's reactions.

**Domain (`connections.ts`):**
- `addMemberChange`: sets one item's change to someone, or adds it.
- `connectNewMember`: made, seated and connected in one step. Null with no free seat or no name.
- `connectGameMember`: seated and connected.
- `connectItemToMember`: from the member's side. Your own item gets the change; the game's is copied first (D7) and the copy replaces it in the deck.

The screens turn the picker's choice into one of these calls. Picking each game member's newest version uses the domain's `newestRef`.

**Decisions:**
- **Someone new comes last in the picker.** Typing "chief" finds both chiefs before it offers "+ “chief” as a new member", and an exact existing name is never offered as new.
- **A row's target isn't changed in place.** To point a change at someone else, remove it and add another. A row that could silently switch from a score to a person was harder to read than it was worth.
- **New changes start at +1,** with the amount focused, as before.

**For the talk: an operation named after the user's intent.** The author's sentence is "this card upsets the Head of Payments, who doesn't exist yet". Four steps in the old model (create a member, seat them, open the card, add a change) became one domain operation named for that intent, `connectNewMember`, and one picker option. The model had every piece already; what it lacked was the verb. In DDD terms, the aggregate's operations should be the things people say they're doing, not the steps the data needs.

**A bug the browser check caught:** the workspace watched the council (with `immediate`) before declaring it, so a draft failed to open in the production build ("Cannot access … before initialization"). The component tests mount editors one at a time and never saw it. Moving the block below the declaration fixed it, and the walk in Chrome is why it didn't ship.

**Verification:**
- Tests: 1304 in total (+12).
  - Domain, 5: a new member from a card; nobody made with no seat or no name; seating a game member; setting rather than duplicating a change; from a member's page, a game card copied first, replacing the original.
  - `tests/studio/connection_pickers.test.ts`, 7: the combobox's label, focus and options; creating from a typed name with Enter; an existing name never offered as new, and the arrow keys; full seats; Escape; the unified rows; adding a score at +1 and passing a new member up.
- Headless Chrome (production build, Studio CSP), keyboard only:
  1. On a new card, "+ Add a change", type "Head of Pay", Enter: still on the card, a "Head of Pay · council" row, the council at 5 of 8 with a ring.
  2. Add "trust": the amount is focused; type 8: "User Trust +8; Head of Pay +1 satisfaction".
  3. "financial" offers the CFO with "seats them, 3 seats free"; Enter seats them (6 of 8).
  4. On Head of Pay's page, "Ship Quick Fix" at −2: "(now your own version)", and both sources listed.
  5. Zero CSP violations, no console errors.

**Next:** slice 4, the summary view and the start screen.


### M4.13: The pack summary and the start screen (UI/UX audit, slice 4) (2026-11-26)

The owner's "where do I start?", answered in two places: the start screen leads with your packs, and every pack opens on a summary of where it stands and where to go next. This settles Q14.

**What an author sees:**
- **The start screen leads with "Your packs":** tiles with each pack's name, how much is your own ("4 cards, 4 events and 2 members of your own"), where it stands ("Not exported yet", "Imported as 1.1.0", "Changed since 1.0.0") and when it was last edited.
  - **"+ New pack"** (the one ember button) and **"Import a pack"** sit beside the title.
  - **"Start something new"** below offers "Retell a DDDnD scenario" and, marked as later, "Teach another subject".
- **Choosing a scenario is one step in** (`#/new`), on its own page with a back button. Before, the start screen showed five scenarios, the drafts, import and two notes at once.
- **Two drafts that would export as one pack are flagged.** "Another copy of this pack is in your packs" covers the same zip imported twice. "Exports under the same pack id as “…”" covers two drafts started from one scenario. Both say why it matters and how to keep both (change the prefix).
- **A pack opens on its summary,** and a **Summary | Edit** switch in the toolbar moves between it and the last editor open. The sidebar stays visible in both. The summary shows:
  - **"Where to go next":** copied ✓, write a card of your own, bring your people to the table, fill in what you started (with links to each placeholder), add your name, export it. Each open step has its button, and any order works.
  - **"Before you export":** the game's checks in the Studio's words ("Pack details: Add your name as the author."), and the notes.
  - **The pack's parts:** council, scenario, cards and events, with counts.
- **An imported pack says it was imported:** "imported as 1.1.0" on its tile and summary, "Nothing has changed since you imported version 1.1.0" on the export page, "Imported as version 1.1.0" on Pack details. Before, all of these said "exported". After the Studio's first export of it, they say "exported".

**Domain (`pack_overview.ts`, new):**
- `releaseState(draft)`: never, unchanged or changed since a version, and whether that version came from an import.
- `nextSteps(draft)`: each step done or not, from what the draft holds.
- `packCounts(draft)`.
- `sharedPackIds(drafts)`: for each draft, the others that export under its pack id.

Plus:
- `DraftRelease.imported`, set by `draftFromPack` and dropped by the next `releaseDraft`.
- `describeIssue(issue)` moved from the checks panel into the domain (`draft_export.ts`), next to `issueSubject`. It's how a check's problem is said in words, so the checks panel and the summary now share one answer.

**Decisions:**
- **The summary is a view of the editor, not a separate page** (D28): the sidebar stays, so the summary never hides where things are.
- **The steps are a list, not a wizard.** They tick themselves off from the draft, any order works, and the copy already plays: the guided round (§5) is where a step-by-step path belongs.
- **The pack id clash is a warning, not a block.** Two drafts of one pack can be useful (a variant to compare); the author needs to know before exporting both.

**For the talk: questions about the whole aggregate.** Until now, every domain question was about one item: whose is this card, what changes this member. The summary asks about the pack as a whole (where it stands, what's left, does it collide with another), and the start screen asks about all of an author's packs at once. They're still the domain's questions with names (`releaseState`, `nextSteps`, `sharedPackIds`), and that is why "imported, not exported" could be fixed once and show up correctly in four places.

**Verification:**
- Tests: 1312 in total (+8).
  - `tests/authoring/pack_overview.test.ts`: release states, including imported then exported; next steps from a fresh copy to finished; counts; shared pack ids.
  - `draft_reading.test.ts`: `describeIssue`.
  - `tests/studio/summary_and_start.test.ts`: the summary's steps, fill-in links and issues; the start tiles' words and the shared-id warning.
- Headless Chrome (production build, Studio CSP):
  1. The start screen, empty, offers "+ New pack", which opens "Choose a scenario to retell".
  2. Copying the Monolith opens on Summary, with the step buttons working ("+ New card" opens a new card). Edit returns to the last editor.
  3. Importing the Gilded Ledger twice: both open on "imported as 1.1.0", the export page says "since you imported", and both tiles say "Another copy of this pack is in your packs".
  4. The layout holds at 1024 px.
  5. Zero CSP violations, no console errors.
- `scripts/dev/browser-check.example.mjs` now starts at `#/new`.

**Left open:** a fresh copy of Microservice Sprawl opens with "1 note", because the game's own content changes a member that scenario doesn't seat. Settled in M4.14: the note now says why.

**Next:** slice 5, a written pattern guide for the screens still to come.


### M4.14: Notes that say why (2026-11-26)

A fresh copy of *Microservice Sprawl* opened with "1 note: VP of Product isn't seated". The game's shared card *Automate Deployment Pipeline* also makes the VP happier, and Microservice Sprawl doesn't seat the VP, so in that scenario the change does nothing. That's how the game shares one card between scenarios with different councils (M3.9). The note had no way to tell this apart from a change the author caused. The owner's call (D31): authors may share cards this way on purpose, so the note should explain and alert, never block, and the author guide should explain it too.

**What an author sees.** Each note says why it's there:
- **The game shares a card:** "The game's card “Automate Deployment Pipeline” changes how they feel. DDDnD shares cards between scenarios and ignores a change to someone who isn't seated, so this is how the game plays here. Nothing to do, unless you want them at the table."
- **You took someone out:** "You took Chief Technology Officer out. 6 cards and 3 events still change how they feel, and the game ignores those changes now. Leaving them out is fine. To have them react again, seat them."
- **Your own content:** "Card “Freeze the Ledger” changes how they feel, and the game ignores that in this scenario. That's fine on purpose, for a card you share with another scenario where they sit. If you meant them to react here, seat them; if not, remove the change."

Every note has a **"Why does the game ignore it?"** that explains shared cards, and a single source is named rather than counted. The author guide has a new section, "Sharing cards between scenarios", with the same three cases.

**Domain:**
- `UnseatedNote.reason` (`taken_out`, `yours`, `shared`), decided in `unseatedNotesFrom(draft, tables)`. Taken out first, then the author's own, then the game's sharing.
- To tell "taken out" from "shared", a draft now remembers where each scenario came from: `DraftPack.origins`, the game's scenario and who it seated, set by `draftFromBaseScenario`. It's the Studio's memory only, never exported; a test checks it isn't in the pack files.

**Decisions:**
- **Explain, don't hide.** The first idea was to stop showing notes about the game's own sharing. The owner preferred to keep them and explain, because a pack author can share cards the same way and should know it happens.
- **Drafts without an origin** (imported, or made before this change) read a game-only note as "shared". That wording still offers to seat them, so nothing is lost if it was really a take-out.

**Found on the way:** the game's checks verify the scores a card changes, but not the council members, so a misspelled member id is skipped silently, like an unseated one. The guide says so for authors writing JSON by hand; in the Studio people are picked by name, so it can't happen. Whether the validator should check member ids is a separate question for the game, not changed here.

**For the talk: the model knew *what*, not *why*.** The notes were right about the facts and wrong about the meaning: the same fact (a change to someone not seated) is a mistake in one draft and a design choice in another. Telling them apart needed one fact the model had thrown away: where the scenario came from. Keeping it (`origins`) turned a warning into an explanation.

**Verification:**
- Tests: 1317 in total (+5, `tests/authoring/connections.test.ts`): origins are recorded and never exported; Microservice Sprawl's note is "shared" (from Automate Deployment Pipeline); taking the CTO out is "taken_out"; the author's own card is "yours"; no origin reads as "shared".
- Headless Chrome (production build, Studio CSP): a fresh copy of Microservice Sprawl shows the shared-card note with its "Why?"; taking the CTO out adds "You took Chief Technology Officer out". Zero CSP violations, no console errors.
- The docs site builds.


### M4.15: A pattern guide for the screens still to come (UI/UX audit, slice 5) (2026-11-26)

The audit's last slice. The screens still to build ("Play it", new-topic authoring, the guided round, balance hints) should look and behave like the ones the audit made consistent, so the patterns are now written down: **§9.1, "Patterns for every screen"**. It covers:
1. where a screen goes;
2. the editor frame;
3. the game's content shown locked;
4. actions and their three removal verbs;
5. words, and which come from the domain;
6. connections;
7. checks and notes;
8. accessibility;
9. the D22 architecture rule;
10. how to check a screen before it ships.

It ends with how each coming screen applies them. Each pattern names the file where it already works, so a new screen copies a working example.

**A new guard.** M4.13 found a new kind of leak: the checks panel read the validator's message text ("must not be blank") to reword it, which is a rule about content in a screen. `describeIssue` moved it into the domain then, and now a boundary test stops it coming back: no Studio file may match the validator's phrases. The test fails on the checks panel as it was before M4.13.

**For the talk: a design system that's mostly a domain.** Most of §9.1 isn't about colour or spacing. It's about where answers live: names, words, whose something is, what changed. The visual patterns are a page of CSS classes. The part that keeps the Studio consistent is the rule that every screen asks the model the same questions, and gets the same answers.

**Verification:** tests 1318 in total (+1, the guard). No screen changed.

**The audit, in numbers:** seven PRs (#61–#66 and this one), seven journal entries (M4.9–M4.15), four decisions (D28–D31), and the tests from 1273 to 1318. Two bugs were caught in the browser before shipping: M4.12's initialization order, and M4.14's guide claim, corrected against the validator.


### M4.16: "Play it" (2026-11-26)

D6, D15 and D17, with §11's trust boundary. The Studio's toolbar has **▶ Play it**, which opens the draft in the game, in a tab of its own, with nothing saved.

**What an author sees:**
- **"▶ Play it"** (quiet, beside Export, §9.1) opens the game in a tab named for the preview. Its state shows beside it: "Opening the game…", "Playing in the game's tab", "Fix what the checks list first", "The game didn't answer", or "Your browser blocked the game's tab".
- **The game's tab says "Preview from DDDnD Pack Studio. Nothing here is saved, and this run can't be shared. Close this tab to end it."** on every page.
- **The tab opens the pack's own table:** the pack's banner says "Published by the DDDnD Pack Studio (a preview)", and there's no way back to the bazaar.
- **A run plays as normal.** The results screen has no share card and no "Return Home" (D18). "Play again" goes back to the pack's table.
- **Play it again replaces what the tab plays** (the same tab). A reload of the tab asks the Studio again.
- **A pack can be played before its details are finished:** the preview fills in a placeholder author and description, never exported (`previewBundle`). Anything else the game would refuse is refused before sending, with the same checks.
- **Until the launch (D32),** the live Studio's button is disabled ("Play it arrives with the launch"). It works with both apps running locally in development.

**How it's kept safe** (§11, threat T12):
- **The exchange is domain code both apps share** (`preview_handoff.ts`). The game accepts a pack only from the window that opened it, at a trusted origin, carrying the 128-bit nonce it made for this page, and only once. It says it's ready only to trusted origins, so another site never sees a nonce.
- **The pack then goes through the same checks as any import** (the bundle reader, the schemas, the playability check), and a pack that fails shows the bazaar's own titles and problems.
- **Nothing is stored.** A preview tab is decided when the page loads, before the game store builds its storage:
  - the store gets a save adapter that keeps nothing, so `reset()`, which the play screens call, can't clear the player's real saved run;
  - there's no pack store at all, the content adapter's existing no-op mode;
  - preferences aren't written;
  - the router sends every other page back to the preview, and never restores a saved run there.

**Decisions:**
- **The preview's storage is chosen by the tab, not by a later switch.** The store builds its storage once, and a preview that switched storage mid-visit could already have read the player's save. Deciding at page load means there's no moment where real storage is reachable.
- **The tab's name selects only the safe direction.** Anyone can open the game under that name, and all they get is a game that saves nothing and accepts nothing.
- **Production trusts nothing yet** (D32, the owner's call): `PRODUCTION_PREVIEW_ORIGINS` is empty, and a test ties it to the Studio's `PLAY_IT_IN_PRODUCTION`, so the launch PR can't switch on only half.
- **The Studio has its own Vite cache** (`node_modules/.vite-studio`). With both dev servers running, which "Play it" needs, the shared cache made each re-optimize the other's dependencies ("504 Outdated Optimize Dep").

**For the talk: a trust boundary is a domain too.** The handshake's rules (whose window, which origin, which nonce, how many times) are about as far from cards and councils as the code gets, and they still went in the domain, as pure functions both apps share, with the hostile cases as tests. The windows and events stay at the edges; the decisions are where they can be read and tested in one place. And the safest part isn't a check at all: a preview tab never has real storage to protect, because it never builds it.

**Verification:**
- Tests: 1338 in total (+16):
  - the exchange, 9: origins, including a deploy preview and look-alike hosts; the opener; nonces; only the first pack; no trusted origin; the Studio's side;
  - a preview tab writes, reads and clears no save and stores no preference, 4;
  - a failing pack says why and isn't added, 3.

  Also `previewBundle`, 2, and the game–Studio sync, 2.
- Headless Chrome, both apps' dev servers:
  1. Copy the Monolith (set to 1 turn), Play it: the game's tab opens on the pack's table with the banner. Join, play a card: the results show "by the DDDnD Pack Studio (a preview)", with no share card. The game's storage still holds only the player's real save (untouched), and no IndexedDB database was created.
  2. Rename the pack and Play it again: the same tab plays "Monolith at Acme". Reloading the tab plays it again.
  3. A card with no name: the Studio says to fix the checks first.
  4. A page at another origin opens `/preview` and posts packs: it never receives "ready", and its blind post is ignored.
  5. No console errors.
- Headless Chrome, production builds with their real CSP:
  1. The Studio's button is disabled until launch.
  2. The game's `/preview` says it isn't switched on yet; opened directly, it says it only opens from Play it.
  3. An ordinary game tab has no banner.
  4. Zero CSP violations, no console errors.


### M4.17: Teaching another subject: starting a topic, and its scores (2026-11-26)

The first slice of new-topic authoring (§3, D1). The owner's calls: a topic reuses the game's five outcome tiers, and starts from a skeleton (D33). Next: endings, then classes, modifiers and coupling rules, then importing the SRE pack and the guided round.

**What an author sees:**
- **"Teach another subject"** on the start screen is live. It asks what the pack teaches and a sentence for players, then opens the summary.
- **The skeleton** is a scenario named after the topic, the game's outcome tiers, an ending every run can reach ("Held It Together", no conditions), and a class with no score bonus ("Generalist"), so the table always has someone to play as. Its only failing check is the one only the author can fix: the scenario's story.
- **"Where to go next" starts with "Name what your topic trades off":** three to six scores that pull against each other, named so more is better. Then the usual steps.
- **A Scores group in the sidebar** (first, since everything else changes scores), with "+ New score".
- **A score editor:**
  - what players read: the name; a short name for tight spots, which follows the name until you write your own; and what it measures;
  - where it starts (0–100; the game's weakest scores start around 30);
  - what changes it, each linked.

  Delete says which of your items stop changing it, and anything still checking it shows under the checks.
- **From any card's picker, "+ “Uptime” as a new score"** (D30), offered before "+ … as a new council member".
- **A topic doesn't offer the game's cards, events or council members** ("+ From the game", "The game's council members", the picker's unseated game members). They change and check the game's scores, which a topic doesn't track.
- **The checks name the new kinds:** "Score: Add a description: what it measures, in a sentence", "Ending: …", "Class: …". "Go to it" opens a score.

**Domain (`topics.ts`, new):**
- `draftForNewTopic`, `createOwnScore` and `connectNewScore` (D30);
- `removeOwnScore` and `ownChangesToScore`;
- `shortNameFor`, `withScoreName`, `canAddScore` and `usesGameContent`;
- `SCORES_PER_SCENARIO` (the game's 12).

Elsewhere:
- `toFillIn` includes scores;
- `nextSteps` starts a topic with `name_scores` (done from three, `TOPIC_SCORES_ENOUGH`);
- `packCounts` counts scores;
- `describeIssue` names scores, endings, tiers, classes, modifiers and coupling rules;
- `manifestRefs` reads any inventory section, so the Studio can list the game's tiers.

**Decisions:**
- **A score's id comes from the name it's made with** and doesn't change when renamed. Authors never see ids, and a fixed id means nothing that refers to the score needs repointing.
- **Deleting a score removes your own changes to it, but not conditions that check it.** Only the author knows what should replace a condition, so the checks point at it instead.
- **No minimum number of scores is enforced.** The game's checks don't require one, so the summary's first step asks for three, and the pack can't be played meaningfully before then.

**For the talk: a second kind of aggregate root.** A retelling is "the game's scenario, with my changes": almost every rule asks "is this mine or the game's?". A topic is "everything is mine", and the same rules mostly fall away: `usesGameContent` is false, so nothing offers the game's content. One flag on the aggregate (its kind) decides which rules apply, and the screens ask the domain rather than checking the kind themselves.

**Verification:**
- Tests: 1348 in total (+12, `tests/authoring/topics.test.ts`):
  - the skeleton, which the game's checks accept except for the scenario's story;
  - steps;
  - scores (tracked, starting at 50, short names, placeholders, the limit of 12);
  - a score made from a card;
  - deleting one;
  - who can add a score;
  - renaming;
  - game content in a topic.

  Plus `describeIssue` for scores and endings.
- Headless Chrome, production build with the Studio CSP:
  1. Start "Incident Response".
  2. Name Rest from the summary's step.
  3. A card makes "Uptime" from its picker, and the plain words read "Uptime +1, Rest +1".
  4. Deleting Uptime says the card stops changing it, and removes it.
  5. Zero CSP violations, no console errors.
- Headless Chrome, both dev servers: a complete small topic (three scores, a council member, two cards, one turn, an author) reads "Ready to export". Its zip passes the validator. "Play it" plays it in the game: the game shows Rest, Uptime and Learning, the On-Call Engineer and the Generalist class, and the run ends on the skeleton's "Held It Together".

**A correction to this session's earlier checks.** M4.8a and M4.8b say their exported zips pass `scripts/validate-content-pack.ts`, but those runs passed the folder without `--content-root`, so the validator checked the base game instead. Re-run properly here (`--content-root <folder> --dependency-root content`, as the packs repository's CI does), a retelling's zip, a re-exported import and this topic all pass. §14 now gives the exact command.

**Left open:**
- **A topic's endings are only the fallback until N2's ending editor.**
- **Classes, modifiers and coupling rules** come in N3 (M4.19).
- **Retellings can't add their own scores yet** (§3 says a retelling can grow into a topic); `canAddScore` is where that would change.


### M4.18: Endings: what kind of leader the player was (2026-11-26)

N2 of new-topic authoring (§5: "Endings should be reachable, and mean something in this topic"). D34.

**What an author sees:**
- **An Endings group in the sidebar** (for topics), listed in the order they're tried, with "+ New ending" and **Order**. The fallback is marked "every run".
- **The ending editor:**
  - **What players read at the end:** name, meaning, flavor.
  - **When it's chosen:** condition rows, all of which must hold. Each row is one of the game's four measures:
    - a score at the end;
    - how much scores changed over the run (one or several, added together);
    - how much the council's satisfaction changed (some members, or the whole council);
    - pressure (events and aftershocks per turn).

    Each measure has its comparison and a value, read back in plain words: "chosen when Rest ends below 25, and the council's satisfaction changes by less than −10 over the run".
  - **When it's tried:** "Try it earlier" and "Try it later", and "tried 1 of 3" in its kicker.
- **The Order page** lists every ending, numbered, with its plain words and Earlier or Later buttons. The fallback sits last as "every run".
- **A new ending is tried first,** with a condition to start from (the first score ends at or above 70), since a new ending is usually a particular one.
- **Exactly one fallback, always last.** It can't be deleted, and it takes no conditions. An ending with conditions keeps at least one: its last condition has no Remove, and a line says the fallback already catches every other run.
- **For topics, "Where to go next" adds "Write the endings":** done once there's an ending besides the fallback.

**Domain (`endings.ts`, new):**
- order: `endingsInOrder`, `isFallback`, `moveEnding`;
- making and removing: `createOwnEnding` (first in order, listed by every scenario), `endingDeletion` and `removeOwnEnding`;
- conditions: `setEndingConditions` (keeps exactly one fallback), `startingEndingCondition` and `endingConditionOf`;
- words: `describeEndingCondition`, `describeEnding`, `endingOperatorChoices` and `ENDING_MEASURES`;
- limits: `ENDINGS_PER_SCENARIO` and `CONDITIONS_PER_ENDING`.

Priorities are written evenly spaced (…, 20, 10, 0), so the pack's files stay readable. Endings also join `toFillIn` and the topic's `nextSteps`.

**Decisions:**
- **Order, not numbers (D34).** The game's two ending errors (two endings at one priority, an ending that can never be reached because it's below the fallback) can't be made in the Studio.
- **A new ending goes first, not just above the fallback.** Particular endings belong first, and the one being written is usually the particular one.
- **Exactly one fallback, enforced by the model.** The first version let an ending lose all its conditions and become a second fallback, which can never be reached. A probe showed the game's checks don't flag two fallbacks, so the model now refuses it: an ending with conditions keeps at least one, and the fallback takes none.
- **The game's "reachable" is the only reachability the Studio promises.** Whether an ending's conditions can actually be met in play is a balance question, which belongs to the balance hints and, later, the balance lab (D3).

**For the talk: an invariant the model keeps so the author doesn't have to.** The game's rule is "highest priority first, unique priorities, a fallback at the bottom". As data, that's three things an author can get wrong. As an operation on an ordered list ("try it earlier"), none of them can go wrong. The domain turns a format's constraints into the shape of its operations: the same move as the council's seats (M4.5) and the release's versions (M4.7).

**Verification:**
- Tests: 1358 in total (+10, `tests/authoring/endings.test.ts`):
  - order: new first, moving, renumbering, the fallback staying last;
  - exactly one fallback (an ending keeps a condition; the fallback takes none);
  - deleting, and keeping the last fallback;
  - every kind of condition in words, including several scores, named members and decimals;
  - comparisons that fit the measure;
  - the topic's step;
  - a topic with three endings passing the game's own checks.
- Headless Chrome, production build with the Studio CSP:
  1. Create "Pager Haunted" from the summary's step ("tried 1 of 2").
  2. Set "Rest ends below 25" and add "the council's satisfaction changes by less than −10"; the plain words read both.
  3. A second ending, then move it later on the Order page.
  4. The fallback's Delete is off, with the reason.
  5. Zero CSP violations, no console errors.
- Headless Chrome, both dev servers: a complete topic with an extra ending ("Rested Responder": Rest ends at or above 0) reads "Ready to export", and "Play it" ends the run on **Rested Responder**, ahead of the fallback, as the Studio ordered them.

**Left open:**
- **Retellings keep the game's endings,** read-only and not listed.
- **No check yet that an ending can actually be reached in play:** that's the balance hints' job.

---

### M4.19: Rules of play: classes, challenges and coupling rules (2026-11-26)

N3 of new-topic authoring (§5). A topic now has its own answer to "who can I play as, what harder start can I choose, and how does one score drag another down".

**What an author sees:**
- **A "Rules of play" group in the sidebar** (for topics), with "+ Class", "+ Challenge" and "+ Coupling rule". Each item is marked class, challenge or coupling, with the to-fill-in dot. The filter finds them by name.
- **The class editor:** name, who they are, flavor, and a favourite score (or none). In plain words: "Rest +1 every turn", or "no favourite score: fits any table". The topic's last class that fits every table can't be deleted, and says why.
- **The challenge editor:** what players read, then what it changes at the start:
  - where each score starts, compared with the scenario (0 is no change);
  - turns, more or fewer;
  - every council member's starting satisfaction (optional).

  In plain words: "Rest starts −10, Uptime starts −5; every council member starts at 40 satisfaction; 2 fewer turns."
- **The coupling rule editor:**
  - What players read while it's active.
  - How it works: while a chosen score is below a line, gains to the ticked scores are cut to a percentage. The last ticked score stays ticked, because the game needs one.

  In plain words: "While Rest is below 25, gains to Uptime and Learning are cut to 60%. Losses aren't changed."
- **Deleting a score says what it does to them**, and names the coupling rules that go with it.

**Domain (`play_rules.ts`, new):**
- classes: `createOwnClass`, `setClassFavourite`, `classDeletion`, `removeOwnClass` and `describeClass`;
- challenges: `createOwnChallenge` (the first score starts 10 lower), `removeOwnChallenge` and `describeChallenge`;
- coupling rules: `createOwnCoupling` (listed by every scenario, within the game's limit), `removeOwnCoupling`, `couplingInOrder` and `describeCoupling`;
- a score deleted: `couplingLostWith` and `withoutScoreInPlayRules`, which `removeOwnScore` now calls.

All three join `toFillIn`. The checks' "Go to it" and the summary's "Fill in what you started" open their editors.

**Decisions:**
- **A deleted score takes its coupling rules with it.** That covers a rule that watched the score, or cut only that score. The walk found that the game's checks don't flag a coupling rule watching a score no scenario tracks: it silently never fires, and its plain words showed a raw id. The model now deletes those rules with the score, and the delete confirmation names them first. Rules that cut other scores too just stop cutting it. Classes lose their favourite, and challenges stop changing it.
- **Plain words never show an id.** A score the pack doesn't have is written "a score that isn't in this pack".
- **The topic keeps one class that fits every table.** It's the same move as the fallback ending (M4.18): the game's "every table needs a class" check becomes an operation that can't break it.
- **The cut is shown as a percentage** (10–100%). The game stores a multiplier (0.1–1); the editor converts it.
- **One sidebar group, not three.** Classes, challenges and coupling rules are each short lists, and together they answer one question: the rules of play.

**For the talk: the same invariant, found by walking it.** The domain tests passed, and so did the game's checks. A rule that would never fire was only visible on screen, where it read "While incident_new_score is below 25". A screen that shows ids is often the symptom of a missing domain rule, not a missing label.

**Verification:**
- Tests: 1371 in total (+13):
  - `tests/authoring/play_rules.test.ts` (10):
    - favourites, and a class's words;
    - keeping the last class that fits;
    - a challenge's words from its numbers;
    - coupling rules listed by every scenario, and their words;
    - deleting a score: what happens to each, the coupling rules lost, and never an id;
    - a topic with all three passing the game's own checks.
  - `tests/studio/play_rule_editors.test.ts` (3): each editor's plain words, and its input becoming domain calls.
- Headless Chrome, production build with the Studio CSP:
  1. Make a class favouring Rest, a challenge changing two scores, the turns and the council, and a coupling rule cutting two scores to 60%. Each editor's plain words read back.
  2. Delete a score that a coupling rule cuts alongside another: the rule keeps the other.
  3. Delete the score a coupling rule watches: the confirmation names the rule, and it goes.
  4. Zero CSP violations, no console errors.
- Headless Chrome, both dev servers: a complete topic with Pager Paladin (favours Rest), Launch Week (Rest starts 10 lower) and Burnout Spiral reads "Ready to export". Its zip passes `validate-content-pack.ts --content-root`. "Play it" offers Pager Paladin and Launch Week. Played with both, Rest starts at 25 (35 − 10), and the run ends on the author's own ending.

**Left open:**
- **The game's own challenges that change no scores (Speed Run) are offered in topics too.** That's the game's rule, not the pack's: fine, but worth knowing.
- **Whether a class's favourite or a coupling rule is balanced** belongs to the balance hints.

---

### M4.20: An imported pack exports as the same pack (2026-11-26)

N4, first half: importing the SRE pack (the one real topic, from DDDnD-packs) and editing it end to end.

**What the walk found.** SRE imported cleanly as a new topic and read "Ready to export". All 64 items opened in their editors, with no ids on screen. Then I exported it untouched and compared:
- **It was a different pack to players.** The game identifies a pack by a hash of its manifest and files, and the manifest's lists are hashed in order. The Studio wrote every list sorted by id, but SRE offers its classes in its own order (Pager Paladin first), so an untouched re-export had a new identity: a new table in the bazaar, and saves that no longer match. The table also listed the classes in a different order.
- **The Gilded Ledger had the same problem another way.** Its manifest has no coupling rules list, and the Studio wrote an empty one. An empty list where there was none is also a different hash.
- **Every file was rewritten anyway.** Keys came back in the parser's order, and each file's `$schema` line (the editor support the official packs carry) was dropped. An author who imports from GitHub, changes one number and commits would see 81 files change.
- **The pack's own README was replaced** by the one the Studio writes.

**What changed:**
- **The draft remembers an imported pack's layout** (`DraftPack.layout`): the order of each list in its manifest, and which sections it lists. Export follows it, so an untouched pack is the same pack. New content goes after the pack's own, by id. A section the pack never listed stays out while it's empty. Drafts the Studio started keep exporting as before.
- **Files keep how the author wrote them.** At import, each checked entity takes back the key order of its source file, nested keys too (values always come from the game's checks). Every file the Studio writes starts with its `$schema` link, as the packs repository does. Whitespace isn't kept, and isn't part of a pack's identity.
- **The pack's own README goes back in the zip as written** (`DraftPack.readme`, up to 64 KB). The export page says the README is the author's, and to check what it says about versions. A pack without one gets the Studio's, as before. The Studio stores this text and never shows it.

**Domain:**
- `PackLayout`, and the export's ordering and sections (`draft_export.ts`), and the `$schema` link;
- `readPackArchiveFiles` (the files as written, split from `readPackArchive`), `readPackReadme`, `zipReadme` and `PACK_README_MAX_BYTES`;
- `draftFromPack(snapshot, { sources, readme })`.

The Studio's import adapter passes the files it read along with the snapshot.

**Result, on the real SRE pack:**
- **Untouched:** imported and exported again, it's identical to the original, file for file and byte for byte, apart from the `LICENSE` the zip adds (M4.8a).
- **One edit:** "Tune the Noisy Alerts" gives Rested On-Call 9 instead of 8. In git, that's a three-file change:
  - the card's file renamed to v2, with its version and the one number changed;
  - the scenario's file renamed to v2, since it includes the card;
  - the manifest's version and file names.
- **Both pass** `validate-content-pack.ts --content-root`.
- **Play it** offers SRE's classes in its own order.

**For the talk: identity is a domain concept, and "unchanged" has to mean unchanged.** The game's rule (a pack is its content hash) is sound. The Studio broke it without changing any content, just by having opinions about order. Every check passed: the content was identical, value for value. Only comparing the files, and then the hashes, showed the pack had quietly become another one. Lossless (D26) turned out to be three promises: the same values (kept since M4.8), the same identity (now), and the same files as written, so an author's diff shows only their edit (now).

**Verification:**
- Tests: 1373 in total (+2, and the existing round-trip test now also asserts the identity). Both identity tests fail without the fix.
  - `tests/authoring/pack_files.test.ts`:
    - a pack with its cards out of id order and its keys in its own order exports with the same hash, its manifest and every file byte for byte, and a new card comes after its own;
    - the Ledger's round trip keeps its identity;
    - a pack's own README is kept, and one that's missing or too large is not.
  - `tests/studio/pack_files.test.ts`: the adapter passes the source files from a zip, and none from a pack file.
- Headless Chrome, production build with the Studio CSP:
  1. Import SRE's zip.
  2. Export it untouched: identical to the original.
  3. Change one number and export: the three-file diff above.
  4. Zero CSP violations, no console errors.
- Headless Chrome, both dev servers: "Play it" on the imported SRE pack lists Pager Paladin, Signal Seer, Toil Druid and Budget Keeper, in the pack's order.

**Left open:**
- **Whitespace isn't kept.** The Ledger's scenario writes short lists on one line; after an export, they're on several. That's a one-time diff, and not part of the pack's identity.
- **The README can't be edited in the Studio.**
- **A pack file (`.dddnd-pack.json`) carries no README or `$schema` links,** so a pack imported from one gets the Studio's README in its zip.

---

### M4.21: The guided round (2026-11-26)

N4, second half: the retelling round from §5, in the look the owner approved (the mockup's step 4). D35.

**What an author sees:**
- **"Build your first pack, step by step"** on the start screen, first among "Start something new" and in ember. A first visit's empty state points to it too.
- **They choose the game's scenario closest to theirs** ("Which of the game's stories is closest to yours?"), and the round starts on a copy of it. The pack plays from the first minute.
- **The round's header** (D20): the "Guided round" pill, "Retell DDDnD for your organization", the pack's name, its save state, and "Leave the round (your work is kept)". Below it are the eight steps, each a button that ticks when it's done.
- **The guide**, in place of the sidebar:
  - "Step 3 of 8", the step's question and what it asks for;
  - a teaching moment from §5 ("The one rule: every move trades something away…");
  - what the author has made for this step so far:
    - people, each with "✓ a reaction" or "needs a reaction";
    - cards, each "✓ trades off", "only helps", "only costs" or "changes nothing yet";
    - surprises, each "✓ bad", "✓ good" or "mixed: neither";
    - dashed slots for what's still missing;
  - a worked example from the Gilded Ledger (D9, D14);
  - Back and Next, pinned to the bottom of the guide.
- **The editor beside it is the workspace's own**, for each step:
  1. **Name your world:** pack details.
  2. **Your scenario:** the scenario editor.
  3. **Your council:** a member.
  4. **Your cards:** a card, or "Your first card" with a prompt.
  5. **Your surprises:** an event.
  6. **Fill the deck:** the game's cards and events to add, and the ones in the deck, which can be opened and taken out.
  7. **Check it:** the game's checks.
  8. **Play it:** "▶ Play it", then the export page.
- **"Finish the round"** opens the pack's summary in the full workspace. Leaving keeps the round's place, and the workspace's toolbar offers "Back to the guided round".

**Domain (`guided_round.ts`, new):**
- the steps: `ROUND_STEPS` and `ROUND_ASKS`;
- moving through them: `startRound`, `goToRoundStep`, `nextRoundStep`, `previousRoundStep` and `finishRound`;
- `roundStepDone` and `roundProgress`, which read the draft. "Check it" also takes the checks' verdict, which the Studio runs.
- what each step holds: `roundCouncil`, `roundCards` with `cardVerdict`, and `roundSurprises` with `eventLeaning`.

The round's place is `DraftPack.round`, the Studio's memory, like `origins`: a test shows the exported pack is identical with or without it.

**Fixed along the way:**
- **Re-opening the open draft read an older copy back.** The round and the workspace are two routes to one draft, and moving between them called `openDraft`, which reloaded from storage. An edit still waiting to be saved was lost: the walk caught it when "Finish the round" came back unfinished. Opening the draft that's already open now keeps it (with a test that fails without the fix).
- **The checks said "Card" three times.** With three cards each missing a description, the checks listed "Card / Card / Card". `describeIssue` now names which one from the draft ("Card · Freeze the Payment Path"), in the checks panel, the toolbar's popover and the summary. This dated from M4.13; the round made it obvious.
- **A watcher that fired on every edit.** The round reopened its step's first member whenever anything changed, so typing a second person's name renamed the first. It now watches the step alone. The walk caught it, not a test: the domain was right, and only the screen misbehaved.

**Decisions:**
- **A view of the workspace (D35).** §9.1 asked for "the same editors under the ember header", and building the round as a mode of `workspace_view` gave exactly that, with no second copy of any editor's wiring.
- **Next never blocks; ticks are honest.** The summary's steps work the same way (M4.13). A tick that says "done" when it isn't teaches the wrong thing, so the countable steps tick from the draft, and "Check it" ticks only when the checks pass.
- **"Name your world" asks for the author's name too.** It's the one thing a copied scenario always fails the checks on.
- **The round starts from a full copy** of the chosen scenario, so "Fill the deck" (§5, step 6) is about keeping what fits and taking out what doesn't, as much as adding.
- **The examples are the Studio's words about the Ledger** (D14), not loaded from DDDnD-packs. The Studio's CSP and offline use argue for text in the app; the list naming the Ledger as the source is `EXAMPLE_PACK`.
- **Topics have no round yet.** `#/guided/<id>` on a topic opens the workspace. §6 lets the new-topic round follow. (It did: M4.25.)

**For the talk: the round has no rules of its own.** Every tick is a question the domain already knew how to answer, or a small new one with a name: "is this card one-sided?" (`onlyHelps`, from M4.4, now `cardVerdict`), "which way does this event go?" (`eventLeaning`). The round's own state is just a place in a list. That's why it could reuse every editor: a tutorial is a view over the model, not a second model.

**Verification:**
- Tests: 1383 in total (+10):
  - `tests/authoring/guided_round.test.ts` (8):
    - moving through the round, never blocked;
    - the round never reaching the export;
    - each step's ask: the world with its author, two people with a reaction each, three cards and their verdicts, one bad and one good surprise (a mixed one is neither), and "Check it" only on clean checks;
    - the progress list.
  - `tests/authoring/draft_reading.test.ts`: a check names its item.
  - `tests/studio/studio_state.test.ts`: re-opening the open draft keeps an unsaved edit.
- Headless Chrome, production build with the Studio CSP, the whole round:
  1. Start it from the start screen and choose the Monolith.
  2. Name the world with an author, and move on past the scenario.
  3. Add two people, a reaction each: "Your council ✓".
  4. Write three cards: "trades off", "only helps" (in amber), "trades off", then "Your cards ✓".
  5. Write a bad and a good event: "Your surprises ✓".
  6. The deck lists 29 cards (3 of your own) and 13 events (2 of your own).
  7. The checks name each card and member still to describe, and "Check it" stays unticked.
  8. Leave the round, come back to it, and finish it: the summary, with no "Back to the guided round".
  9. Zero CSP violations, no console errors.
- Headless Chrome, both dev servers: a round's draft, named and with an author, plays from step 8's "▶ Play it" in the game, and Next is in view without scrolling.

**Left open:**
- **The new-topic round** (scores, endings, a class), which §6 allows in a point release.
- **The round's words aren't checked by anyone but me yet;** the owner's read of the steps' copy is the next review.
- **Balance hints** (§6), which the cards step would use ("nets +9; base cards net +11 to +12").

---

### M4.22: Balance hints (2026-11-26)

D3's balance hints: arithmetic on the draft's decks, beside the game's own scenarios. D36.

**What an author sees:**
- **In the summary, "Balance, beside the game's":**
  - "Your cards net +10.8 on average, aftershocks included; the game's scenarios: +9.0 to +12.2."
  - "Your events net −2.4 a draw, weighted by how often each is drawn; the game's scenarios: −3.3 to +0.5."
  - then "Nothing worth a look", or each hint with what to try, and "Open …" for a card or event it names. The count is a polite live region (§10).
- **In a card's or event's editor:**
  - the deck's line, in place of the fixed "+11 to +12" calibration hint;
  - the hints about this item, in the amber nudge that "This card only helps" used.
- **In the guided round:** the cards and surprises steps show the deck's line under what the author has made.

**The hints:**
- **Cards gain less, or more, than the game's** (more than a point outside the range): "Players may struggle to reach your endings. Keep each card's cost, and raise what it gains."
- **Events are harsher, or kinder:** "Add a good event, soften a bad one, or make a bad one happen only sometimes."
- **A card of your own only helps.**
- **A card or event of your own changes nothing yet:** "Playing it is a wasted turn."

**Domain (`balance_hints.ts`, new):**
- `deckBalance` works out a scenario's numbers through a `DeckLookup`: the draft's (`draftLookup`, its own content first) or the game's (`gameLookup`). The same arithmetic measures both sides.
- `gameBalance` gives the range of the game's scenarios, per score; `rangeFor` scales it to a deck's own score count.
- `balanceHints` lists what's worth a look, whole decks first. `deckHolding` and `hintsAbout` find what an editor needs.
- The words: `netWords` ("+8.2", "−3.3"), `deckBalanceWords` and `describeBalanceHint`, so the Studio holds no wording about balance.

The Studio works the numbers out in the same pass as the checks (`checkNow`), so they're as current as the checks. It works out the game's range once (`loadGameBalance`).

**What the hints say about real packs:**

| | Cards | Events | Hints |
|---|---|---|---|
| The game's scenarios | +9.0 to +12.2 | −3.3 to +0.5 | |
| SRE, first draft (from M3) | +4.7 | −5.7 | both |
| SRE, as published | +8.2 | −2.0 | none |
| Gilded Ledger | +10.9 | −6.3 | events harsher |

The Ledger's flag is a real finding, not a false alarm the slack should hide. Its events are harsher than any of the game's scenarios. Whether that's the story it means to tell (an audit looming) is the balance lab's question (M5).

**Decisions (D36):**
- **The yardstick is read from the game's content, not written in.** The plan's "+11 to +12" had already drifted: it fits four of the five scenarios, but Startup Hypergrowth's cards net +9.0.
- **Per score.** A run is judged on its scores' average, so a pack with three scores needs half what a six-score pack does per card. Every scenario so far has six scores, so the numbers read as before.
- **A point of slack** (`NEAR_ENOUGH`). The SRE pack wins 40% of runs at +8.2, under a point below the range, so being that close isn't worth a hint.
- **Never about the game's own content.** A copy of the Monolith has nothing worth a look, and a test holds it.
- **Conditional events count at their weight.** An event that only happens when a score is low is drawn less often than its weight says. The hint's advice ("make a bad one happen only sometimes") points at that, but the arithmetic doesn't model it; the balance lab will.

**Fixed along the way:** **toolbar buttons moved while the draft saved.** "Saving…" is shorter than "Saved in this browser", so the Summary and Edit switch slid 85 px left for a moment. A click that starts by leaving a field triggers that save, so the click landed on empty space: typing a card's name and then clicking Summary did nothing. The save state now holds the width of its longest message. This dated from the audit; the walk caught it.

**For the talk: the yardstick is in the domain's own language.** The game's balance work counted "net with aftershocks" and "weighted event net" in a script and a journal entry. Giving those numbers names (`deckBalance`, `GameBalance`) meant the same function could measure the game's scenarios and the author's draft. The hint is then a comparison of two values of one type, not a constant someone has to keep in step.

**Verification:**
- Tests: 1395 in total (+12):
  - `tests/authoring/balance_hints.test.ts` (9):
    - the game's range, read from its content;
    - per-score scaling;
    - aftershocks and weights counted, missing content left out;
    - the words;
    - a copy of the game's scenario says nothing;
    - the SRE first draft's shape is caught;
    - the point of slack;
    - only the author's own cards and events are named.
  - `tests/studio/summary_and_start.test.ts` (2): the summary's numbers and "Open …"; nothing worth a look for a copy.
  - `tests/studio/editor_actions.test.ts` (1): a new card's nudge and its deck line.
- Headless Chrome, production build with the Studio CSP:
  - the SRE and Gilded Ledger imports show the numbers in the table above;
  - a new card in a Monolith copy, at 1024 px with Largest text: the nudge, the deck line, the summary's hint, and "Open Write an RFC";
  - the round's cards and surprises steps show the deck's line;
  - Summary opens straight from a focused name field, and the switch holds still while saving;
  - zero CSP violations, no console errors.

**Left open:**
- **Starting scores and turn count aren't compared.** A low start makes the same deck harder. That needs play, so it's the balance lab's.
- **Hints aren't in the checks popover.** §9.1 puts them in the editors and the summary; the popover stays about what blocks export, plus the council notes.

### M4.23: "Go to it" lands on the field, and a changed pack id is noticed (2026-11-27)

Two of §6 item 6's smaller items.

**"Go to it" lands on the field a check is about.** Before, it opened the right editor and focused its first input, usually the name, even when the problem was the description. Now:
- "Add your name as the author" focuses the author field on pack details.
- "Card · Write an RFC: Add a description" focuses that card's description.
- A reaction's missing description focuses that reaction's description, on its member's page, not the member's own.
- "score_changes[1].delta: must be at most 100" focuses the second score change's amount.
- The field is scrolled to the middle of the editor area, so what's around it says what it's for.
- A problem that names no field (a cross-reference, the pack as a whole) still opens the editor at its first input.

**A pack id changed after an export is noticed.** The prefix is the pack's id, and to players a different id is a different pack: it won't update their copy, it sits beside it. Once a pack has been exported:
- the prefix's hint says so;
- if it has changed, pack details and the export page show an amber warning naming both ids, with "Change it back to “ours”".

**Domain:**
- `issueField(issue)` (`draft_export.ts`, beside `describeIssue`): the field and list position from the path the game's checks start their messages with. Its tests use messages captured from the real checks on a broken Monolith copy.
- `DraftRelease.pack_id`: the id an export went out under, recorded by `releaseDraft` and by an import (the imported manifest's id).
- `packIdChange`, `keepReleasedPackId` and `describePackIdChange` (`pack_overview.ts`). Changing back keeps what was made meanwhile: ids never change once given.

**Studio:**
- Inputs say which field they edit with `data-field` (and `data-index` in a list). A reaction or an aftershock, edited inside another's page, is marked with `data-subject`.
- `field_focus.ts` finds the element (`fieldElement`) and centres it in the editor area alone (`centreIn`).
- The checks panel's targets carry the field; `goTo` strips it before selecting.
- `pack_id_warning.vue` is one component, on pack details and the export page. `.nudge` (amber, "worth a look") moved to `studio.css`, now that three screens use it.

**Decisions:**
- **The field comes from the game's own message.** The checks already name it, so the Studio reads that path rather than guessing from the wording. A message without one falls back safely.
- **Markers, not a map of selectors.** A screen that's redesigned keeps working as long as its inputs keep their `data-field`.
- **The scope rule is in one place:** without a subject, a reaction's or an aftershock's fields aren't the page's own.
- **Warn, don't block.** Renaming a pack can be deliberate (a fork, a fresh start). The warning says what players will see and offers the way back.
- **Older exports say nothing.** A release made before M4.23 has no recorded id. Guessing it from the prefix would be wrong exactly when it matters.

**Fixed along the way:** the first version scrolled the field into view with `scrollIntoView`, which also scrolled the window and pushed the Studio's header off the top. The walk's screenshot caught it.

**For the talk: the validator already knew.** Every check message started with the path to its field; the Studio had been throwing that away. Naming it (`issueField`) turned a string into a fact the screens can act on. Like M4.21's named checks, the fix was to stop discarding what the model already said.

**Verification:**
- Tests: 1406 in total (+11):
  - `tests/authoring/draft_reading.test.ts` (2): fields from real messages, and none for a pack-wide problem.
  - `tests/authoring/releases.test.ts` (3): the id recorded and its change noticed; changing back keeps new content; older exports say nothing.
  - `tests/authoring/pack_files.test.ts`: an import records its id.
  - `tests/studio/go_to_field.test.ts` (6): the page's own field over a reaction's, a reaction's own field and list position, the fallbacks, the checks panel carrying the field, and the warning shown and undone.
- Headless Chrome, production build with the Studio CSP:
  - "Go to it" lands on the author, a card's description, a member's description, and a reaction's description, centred, with the header in place;
  - export 1.0.0 as "ours", change the prefix to "acme": the warning on pack details and the export page; "Change it back" restores "ours" and the warning goes;
  - zero CSP violations, no console errors.

**Left open:** a field with no input of its own (a list the Studio edits through a picker) still lands on the editor's first input.

### M4.24: Undo, redo, and find (2026-11-27)

The last of §6 item 6's smaller items.

**Undo and redo:**
- **Undo** and **Redo** buttons sit beside the Summary/Edit switch, with Ctrl Z / Ctrl Shift Z / Ctrl Y (⌘ on a Mac). "Undone" or "Redone" is announced politely.
- **Typing is one step:** edits less than a second apart join the step they follow, so undoing a name takes back the whole name, not a letter.
- **Inside a text field, Ctrl Z is the browser's own** and takes back the typing. The pack's undo works from anywhere else, and from the buttons. No shortcut fires while typing (§10).
- **Undoing what's open** (a card just made) opens the summary instead of an empty editor.
- **Moving through the guided round isn't a step.** Undo keeps the round where the author left it.
- **An export ends the history.** Undoing past it would forget what players already have. An export the checks refuse doesn't count.
- **The history is per draft and per session.** Opening another draft starts a new one; it isn't saved.

**Find:**
- **Ctrl K (⌘ K) focuses the sidebar's filter** from anywhere in the workspace, now called "Find in this pack (Ctrl K)". Enter opens the first match.
- **It finds more than the sidebar lists:**
  - reactions and aftershocks by name, each with whose page it's on ("reaction · on Head of Payments");
  - anything of the author's own by their words ("card · in its description").

  A match found in the words opens at that field, through the same `goTo` as the checks (M4.23).
- **Matching ignores case and accents:** "cafe" finds "Café".

**Domain:** `searchOwnContent` (`pack_search.ts`, new): the author's own content matching a query, name matches first, then words (short name, summary, description, flavor), with whose page a reaction or aftershock is on (`memberOfReaction`, `aftershockUsers`). The game's own content is found by the names the Studio already has; its words aren't loaded.

**Studio:**
- `draft_history.ts` (new, pure): `recordEdit`, `undoEdit`, `redoEdit`, `GROUP_MS`, `MAX_STEPS = 100`.
- `studio_state`:
  - `updateDraft(next, { sameStep })` records each edit, except one that only moves the round;
  - `undoDraft` and `redoDraft`;
  - `state.undo` for the toolbar;
  - the history is cleared with the rest of a draft's findings, and after an export.
- **`settle` events:** a new item's id following its name is part of naming it. The card, member, reaction and aftershock editors emit it, and the workspace joins it to the last step.
- `selection.ts`'s `stillThere` decides when what's open has gone. The sidebar's filter exposes `focusFilter` for the shortcut.

**Fixed along the way:** the walk's first try undid a card's description and landed on the summary. When the name field lost focus, the card's placeholder id followed its name as an edit of its own; undoing that brought the placeholder id back, so the open card "vanished". The id change now joins the naming step, however late the field loses focus, and doesn't restart the clock, so what's typed next is its own step. A test covers both.

**Decisions:**
- **Whole drafts, not inverse operations.** Every edit already makes a new draft (D22), so a step back is the draft before. No editor needed to learn how to reverse itself, and nothing an editor adds later can be missed.
- **The browser's undo inside fields.** Taking Ctrl Z from a text field would surprise everyone. Outside one, the pack's undo is what an author means.
- **Find, not a second search box.** The sidebar's filter already found things by name, so the shortcut and the wider matches went there.
- **Not in the guided round.** The guide takes the sidebar's place there. Undo works by shortcut, but Find isn't offered; leaving the round brings both.

**For the talk: undo came free from immutability.** Because the domain never mutates a draft (D22), history is a list of values. The only design work was deciding what isn't a step: the round's place and an id settling are the Studio's bookkeeping, not the author's edits. That's the same line the domain draws everywhere between content and the Studio's memory.

**Verification:**
- Tests: 1416 in total (+10):
  - `tests/studio/undo_and_find.test.ts` (8): grouping, a late id settle, redo cleared by an edit, the round's place, the step limit, the Studio state (the round not recorded; a refused export keeps the history and a real one ends it), what's open after an undo, and Find in words with Enter.
  - `tests/authoring/pack_search.test.ts` (2): order and accents; whose page.
- Headless Chrome, production build with the Studio CSP, at 1440 and 1024 px:
  - "Ours" then ", at home" are two steps; Ctrl Z in the field takes back a letter; Undo, Undo, Redo;
  - a new card with a description: Ctrl Z takes back the description (the card stays open), Ctrl Z again takes back the card (the summary opens), Ctrl Shift Z twice brings both back;
  - Ctrl K, "payments team": "Write an RFC · card · in its description"; Enter lands in its description;
  - zero CSP violations, no console errors.

### M4.25: The new-topic round (2026-11-27)

§5's "new-topic round (teacher), longer, in two sittings", on the round M4.21 built. D37.

**What an author sees:**
- **The way in:** "Teach another subject" now asks for the topic's name and offers **"Start with the guided round"** (the ember button, and what Enter does) beside **"Start on my own"**. The retelling round's first page ("Which of the game's stories is closest to yours?") links to it: "Teaching something other than domain-driven design? Start a new topic, with its own round".
- **The header** says "Teach your topic with DDDnD", with ten steps:
  1. **Name your world** (as in a retelling).
  2. **What it trades off:** "Name three to six things your topic pulls between, each phrased so that higher is better." The teaching moment is §5's "Scores should trade off". The list beside it says how the author's cards pull each score: "✓ pulls both ways", "only goes up", "only goes down", or "no card moves it yet". With no score yet, "Your first score" asks what someone in the field worries about losing.
  3. **Your scenario:** where each score starts.
  4. **Your council.**
  5. **Your cards** (all the author's own; the deck line compares them with the game's, per score, D36).
  6. **Your surprises.**
  7. **Your endings:** "What kinds of leader can a player become?" Two of the author's own, listed in the order they're tried, with the fallback marked "any run that fits no other". The teaching moment is "Endings should be reachable, and mean something here".
  8. **Your class:** the skeleton's Generalist, waiting for "its own name" and a favourite score.
  9. **Check it.**
  10. **Play it.**
- **Two sittings:** the kicker says "Step 4 of 10 · first sitting". On the council step, the guide's pinned footer says "A good place to stop", that the work is kept, and that "Back to the guided round" brings them back.
- **The examples are the SRE pack's** (D14): Rested On-Call, the On-Call Engineer's reaction, Tune the Noisy Alerts, The 3 a.m. Outage, The Hero Firefighter, the Toil Druid.

**Domain (`guided_round.ts`):**
- `RETELLING_ROUND` and `TOPIC_ROUND`, `roundSteps(draft)` and `secondSitting(draft)`. Next, Back and the progress list follow the draft's own round, and `goToRoundStep` refuses a step the round doesn't have.
- `roundScores` (each score's `pull` from the author's cards), `roundEndings` and `roundClasses` (with `named`).
- `roundStepDone` for `scores`, `endings` and `class`. A name the Studio gave ("New score", "New ending", "New class", the skeleton's "Generalist") doesn't count as the author's.
- `ROUND_ASKS` gains `scores: 3` and `endings: 2`.

**Studio:**
- `round_words.ts`: `ROUNDS` per kind (the header's words, the example pack, each step's words), `stepWords`, `SITTING_BREAK` and `PULL_WORDS`.
- The guide, header and panel read the draft's round. The workspace maps the new steps to the score, ending and class editors, and the round's own "first score" and "first ending" panels.
- `startNewTopic(name, description, { guided })`.
- `.link-button` moved into `studio.css`: four screens had the same copy, and the round's start page needed a fifth.

**Fixed along the way (all caught by the walk):**
- **The class step ticked for the skeleton's class.** Choosing a favourite for "Generalist" ticked "Your class ✓", though the step asks the author to name it, and a Generalist with a favourite contradicts its name. `roundClasses` now says whether the author named it, and the row reads "favours Rested On-Call; give it its own name".
- **"A good place to stop" was out of sight.** As a box below the example, it sat under the guide's pinned Back/Next on a laptop screen. It's now part of that footer.
- **The break's first wording promised too much.** It said "Back to the guided round" would pick up at the cards, but leaving on the council step comes back to the council. It now says "brings you back here".
- **A click that left a new item's name could land on nothing (older than this slice).** Leaving the name field gives a new card, event or member the id of its name, and the editor then opened the item afresh under that id, which scrolls the editor to the top. If the click that left the field was further down (on a laptop-height window, "+ Add a change" usually is), the editor jumped away between mouse-down and mouse-up, and the click was lost. The walk at 1024×768 caught it; at 1440×1000 the button happened to be in view. Now `settle` carries the new id, and the workspace keeps the same item open in place (`settleOpen`). A copy ("make my own version") still opens at the top, since it's a different item.

**Decisions (D37):**
- **Scores before the scenario.** The scenario's starting values are per score, so a topic needs its scores first. In a retelling, the scores came with the copy.
- **No "Fill the deck".** A topic uses none of the game's cards (D33). Its deck is the cards the author writes, and three play a whole run (a test plays twenty).
- **The sitting is a word, not a wall.** Nothing stops at the break; it's said where it can be seen, like everything else in the round (D35: Next never blocks).
- **A stand-in never ticks.** D35's honest ticks, applied to what the skeleton (D33) pre-fills.
- **The round's own start page links to a topic's round,** rather than the start screen gaining a fourth tile: the start screen's "Start something new" is the owner's next review (§14).

**For the talk: one round, two aggregates' worth of steps.** The round M4.21 built had no rules of its own, only questions the domain already answered. The topic round is the same shape: its list of steps is a function of the draft's kind, like every other topic/retelling difference (`usesGameContent`, M4.17). Three new questions have names ("how do the cards pull this score?", "is this ending the fallback?", "did the author name this class?"), and the screens changed only to ask the draft which round it's in.

**Verification:**
- Tests: 1430 in total (+14):
  - `tests/authoring/guided_round.test.ts` (+7):
    - the topic's steps, and a step it doesn't have;
    - the two sittings;
    - scores and their pulls;
    - endings besides the fallback, with a Studio-made name not counting;
    - a class of the author's naming, with a tracked favourite;
    - the world;
    - **a topic made by the round alone exports with no issues and plays twenty whole runs in the game's simulation, on three cards.**
  - `tests/studio/topic_round.test.ts` (6, new):
    - every step of each round has words, and a topic's examples come from the SRE pack;
    - the header and its ten steps;
    - the scores list with pulls;
    - the break and the sittings in the kicker;
    - the class waiting for a favourite, then for its own name;
    - both ways in from "Teach another subject".
  - `tests/studio/undo_and_find.test.ts`: a topic's round now moves on to its scores.
  - `tests/studio/editor_actions.test.ts`: naming a new card settles its id with the new ref, and doesn't open it afresh.
- Headless Chrome, production build with the Studio CSP, at 1440×1000 and 1024×768:
  1. From the round's start page, "Start a new topic, with its own round".
  2. "Incident Response", then Enter starts the round.
  3. Name the world with its author.
  4. Three scores: "What it trades off ✓".
  5. The scenario's starting values.
  6. Two people, each with a reaction: the first sitting's footer.
  7. Three cards; the deck line reads "+4.5 on average; the game's scenarios: +4.5 to +6.1" (per score, three scores).
  8. Back on the scores, the cards pull Rested On-Call and Availability both ways, and Change Velocity reads "no card moves it yet".
  9. A bad and a good surprise.
  10. Two endings, tried before "Held It Together".
  11. A favourite for the class.
  12. The checks name what's still to describe.
  13. Leave the round, come back to step 10, and finish on the summary.
  14. Zero CSP violations, no console errors.

**Left open:**
- **The owner's read of both rounds' copy.** The retelling round's words haven't been reviewed yet (M4.21), and now there are a topic's too.
- **The start screen's guided tile** still describes the retelling round ("your system, your people…"). It's the next thing to review with the owner, with the rest of "Start something new".
- **More classes, challenges and coupling rules** aren't in the round. §5 asks for one class; the rest are in the workspace.
- **The deck line lags an edit by a moment.** It's the last check's numbers (D36), so right after writing a card it can still say "No cards in the deck yet" until the checks run again (about a second).

## 14. Picking up the work

What a new session needs to continue without the conversation that built M4.1–M4.8. Keep this section current at the end of each session: it is a handoff note, not a log (the log is §13).

### Where things stand (2026-11-26)

- **On `main`:** M4.1–M4.14.
  - The Studio creates and edits retellings of base scenarios: details, scenario, council, cards, events, aftershocks, event conditions.
  - It checks them with the game's own validator and exports them as releases (D24, D25), as a pack file or a zip with its `LICENSE` (D26).
  - DDDnD and new packs are GPL-3.0-or-later (D27, ADR 0017).
- **The UI/UX audit (D23) is done** (M4.9–M4.15):
  - the workspace is an editor with a sidebar and a summary view (D28);
  - actions and words are consistent;
  - effects are written generically (D29);
  - connections can be made from where you are (D30);
  - notes say why they exist (D31);
  - the start screen leads with your packs (Q14).

  The patterns are written down in §9.1; every new screen follows them. The canvas from the design round: https://claude.ai/artifact/Hs3Wu7gs5VqccQCpXuu4VQ.
- **The owner's rules from the audit:**
  - say what changes generically ("Head of Payments +2 satisfaction"), never a verb guessed from a score's name;
  - changing someone who isn't seated is a feature, so explain it and never block it;
  - any rule about content goes in the domain first, with a test.
- **Other open PRs:** #23 (Dependabot, vite) and #11 (Copilot) are deferred by the owner, like the Dependabot alerts.
- **"Play it" is built** (M4.16), trusted in production from the launch (D32).
- **New-topic authoring has started** (M4.17: the skeleton and scores, D33). Endings (N2) are M4.18 (D34); classes, challenges and coupling rules (N3) are M4.19; importing and editing the SRE pack (N4, first half) is M4.20, and the guided round (N4, second half, D35) is M4.21. Balance hints are M4.22 (D36). "Go to it" landing on the field, and the pack-id warning, are M4.23; undo/redo and find are M4.24, which finishes §6 item 6. The new-topic round is M4.25 (D37). Next: the start screen's "start something new", walked with the owner (they have feedback: it reads as if you must pick an existing pack, and "+ New pack" sits apart from the emphasized "Start something new"). Each follows §9.1.
- **Left open from the audit:**
  - a map view of cards and their impact (maybe, D28);
  - whether the game's validator should check council member ids in changes (M4.14).

### Inputs to the UI/UX audit

The owner's words and the known items, collected from the conversations that built M4:
- **The start screen is cluttered and confusing** (M4.5b, Q14). It offers two kinds of pack, five base scenarios, example packs, import and drafts at once. The owner's idea: "start from core pack" first, and choose a scenario one step further in. The example-pack choice "is a bit cluttered" too (Q10's follow-up).
- **"Some edit functionality" is confusing** (M4.5b). The owner didn't name which parts. Ask, and walk the editing flows with them, before changing anything.
- **Copy is plain and direct.** The owner rewrote the council explanation (D21) because it was roundabout: say what you can't do, why, and what to do instead, in short sentences.
- **Names, never ids or versions,** anywhere an author reads (§4.1).
- **Known items:**
  - importing the same pack twice gives two drafts with the same name;
  - the release page says "since you exported" for imported content;
  - the sidebar has no collapse or filter;
  - "Go to it" opens the right item but doesn't always focus the exact field;
  - nothing warns when the prefix (the pack's id) changes after a release.
- **Constraints that stay:**
  - desktop-primary (D10);
  - the look in §9 (D12);
  - accessibility and text size (D16, §10);
  - the guided round's ember header (D20);
  - no assets from packs (D5).
- **The mockup** from the design round: https://claude.ai/artifact/1kvHTsALbzcpdLjMvMUmMB.

### How the code is laid out (and the rule to keep)

- **The authoring domain is `src/domains/authoring/`.** It holds the draft model and every rule about content: reading a draft over the game's content, ids, the council, the deck, aftershocks, conditions, releases, export and import. It is plain TypeScript, with no Vue, DOM or storage, and is exported through `index.ts`.
- **The Studio's screens** are in `studio/src/views` and `studio/src/workspace`. They show a draft and turn input into domain calls (D22). Their state lives in `studio/src/state/studio_state.ts`.
- **The adapters** are in `studio/src/content` (the game's content, and zips through fflate) and `studio/src/drafts` (IndexedDB).
- **The guards:**
  - `tests/architecture/studio_boundaries.test.ts`: the Studio never imports the game's UI, the game never imports the Studio, the domain imports no Vue, DOM or storage, only the content adapter imports the content domain's services, and no Studio file parses content file names.
  - `tests/architecture/game_studio_sync.test.ts`: exports declare this repository's format and base version (D25).
- **The rule for the audit, too:** a UI change may move, rename or restyle anything, but a rule about content (what something is called, whose it is, what changed, what is allowed) belongs in the domain, once, with a name (M4.5b). If a screen needs a new answer about content, add a domain function and a test, then call it.

### How to check work

- `npx vitest run` (1358 tests at M4.18). `npx vue-tsc --noEmit` for types.
- **Headless Chrome on a production build with the real CSP.** `vite preview` sends no CSP, so:
  1. Run `npm run studio:build`.
  2. Run `node scripts/dev/serve-with-csp.mjs studio 4319` (for the game: `npm run build`, then the same script with `.` and port 5317).
  3. Start from `scripts/dev/browser-check.example.mjs`. It uses playwright-core with `/usr/bin/google-chrome`, installed in a scratch folder, not in the project. Every check reports CSP violations and console errors, and both must be empty.
  4. Stop the server with `pkill -f serve-with-csp.mjs` in its own command (it exits 144, which is expected).
- **"Play it" before launch works only between the two dev servers** (D32). Run `npm run dev -- --port 5173 --strictPort` (the game) and `npm run studio:dev` (the Studio, port 5318) side by side; each keeps its own Vite cache. Production builds show the "arrives with the launch" state, which is worth checking too.
- **Validating an exported pack:** unzip it, then `npx tsx scripts/validate-content-pack.ts --content-root <unzipped>/<pack id> --dependency-root content`. Without `--content-root`, the script validates the base game instead.
- **After any engine or base-content change,** run `scripts/dev/compare-audit.sh <scratch dir>`. It checks that the fixed-seed audit report is identical to `origin/main`'s, unless the change is meant to alter play.
- **Before a merge,** also check the PR's Netlify deploy preview.
- **Base content changes:** the pre-commit hook records `scripts/base-content-lock.json` and CI checks it (D25).

### Working agreements with the owner

- **Each slice:**
  - write a §13 entry covering what an author sees, the domain changes, the decisions and why, "for the talk" (the DDD lens), verification, and what's left open;
  - add a row to §2 for a new decision;
  - add an ADR rather than editing an accepted one.
- **Each PR:**
  - targets `main`, never another feature branch;
  - its body ends with a manual "How to test" checklist;
  - create and edit it with `gh api` (`gh pr edit` fails on this repo).
- **Pushing:** push feature branches freely. Pushing to `main`, creating tags and anything public need the owner's OK.
- **Packages:** the owner installs them; installing was blocked for the agent. Prefer a maintained library to a hand-written one ("let's not reinvent the wheel"), pinned exactly, with our own bounds around it.
- **Security:** a pack's worst case is unwanted text (ADR 0014). No assets from packs (D5). The preview accepts packs only from the Studio's origin (D17).
- **Risks:** flag any risk of regression, anywhere, before it lands.

