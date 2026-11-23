# DDDnD Pack Studio ("The Forge"): design brainstorm

Status: **brainstorm in progress** (started 2026-11-24; look and naming settled the same day)  
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
- The retelling tutorial round. The new-topic round may follow in a point release.
- Balance hints (D3), copy-to-edit (D7), several drafts (D8).
- The minimal playtest: "Play it" opens the draft in a sandboxed game preview (D6).
- Export (bundle file and zip) and import.

**Later:**
- **M5:** balance lab (D3).
- **M6:** full explainer, relationship graph, card previews.

**Done when** (from the plan): an author can build the demo pack from scratch in the Studio and load the export in the game.

---

## 7. Open questions (for discussion)

Q1–Q8 from the first round are settled: Q1 → D6, Q2 → D3, Q3 → D12, Q4 → D10, Q5 → D7, Q6 → D8, Q7 → D9, Q8 → D11.

| # | Question | Options and notes |
|---|---|---|
| Q9 | **What does "Play it" need from the game?** | A preview route that accepts a bundle only from the Studio's exact origin, runs it like an imported pack (same validation), labels it "Preview", and writes no saves. Does a preview run show the results screen and share link? Probably the results, but no share link: a preview isn't a published pack. |
| Q10 | **Who maintains the tutorial's worked examples?** | Written once, in the Studio's own code, around a neutral example organization. Or taken from the Gilded Ledger, which already exists and is a retelling. |
| Q11 | **Accessibility bar** | The Studio is forms-heavy: keyboard-first editing, visible focus, labelled controls, and 4.5:1 text contrast as a requirement, checked like the game's. |

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
- Three columns in the workspace: the pack's contents, the editor, and the Checks rail with balance hints. Below about 1100 px the Checks rail moves under the editor; on a tablet the contents become a drawer.
- Editors are stacked sections: "What players read", "When played", limits, a plain-language preview, and "Used in".

**Open on the look:** the Forge's mark (the mockup uses a simple anvil outline), and whether the ember accent should also tint the header on the guided round, to make "you're in a lesson" more obvious.
