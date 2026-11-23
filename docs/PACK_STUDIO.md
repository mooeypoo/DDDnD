# Pack Studio: design brainstorm

Status: **brainstorm in progress** (started 2026-11-24)  
Decided so far: [ADR 0005](adr/0005-pack-studio-as-separate-app.md) (architecture), [ADR 0006](adr/0006-ship-loading-before-studio.md) (loading before the Studio), and the decisions in §2 below.  
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
| D3 | **Balance waits for M5** (the balance lab). | Simulation in the browser is its own project. M4 ships the authoring itself. See open question Q2 for a cheap step before it. |
| D4 | **Download only. No GitHub publishing.** Export a `.dddnd-pack.json` file (import it in the bazaar) or a zip in the repository layout (to commit to GitHub yourself). | No backend, no accounts, no OAuth, no server function. This retires the "GitHub publish via OAuth" item in M7. |
| D5 | **No art or other assets from packs.** Packs stay text and numbers only. | A pack's worst case must stay "unwanted text" (ADR 0014). Images, fonts or audio from a remote source would open the asset and tracking surface that rule closes. Pack content keeps using the game's own fallback icons, initials and rooms. |

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
8. **Export and play:** download the file, then a "how to import it in the bazaar" step.

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
- Export (bundle file and zip) and import.

**Later:**
- **M5:** balance lab (D3).
- **M6:** full explainer, relationship graph, card previews, playtest handoff to the game.

**Done when** (from the plan): an author can build the demo pack from scratch in the Studio and load the export in the game.

---

## 7. Open questions (for discussion)

| # | Question | Options and notes |
|---|---|---|
| Q1 | **How does a tutorial round end: export, or play?** | Playtest handoff (`postMessage` to a game preview route) is planned for M6. Without it, the round ends with "download, then import in the bazaar": two apps and a file. Bringing a *minimal* playtest into M4 would make the round end with playing your own scenario. |
| Q2 | **Cheap balance hints before M5?** | No simulation, just arithmetic on the draft, compared with the base game. For example: "Your cards net +4.7 on average; base cards net +11"; "Rest is only ever lowered by events"; "No card raises Sight". This would have caught the SRE pack's first draft. Cheap, and teaches calibration. |
| Q3 | **What does the Studio look like?** | Game look (the bazaar's warm canvas), a neutral tool look, or a tool with game accents. ADR 0005 says game components aren't shared, but design tokens may be. |
| Q4 | **Desktop only?** | Editing 20 cards on a phone is painful. The game supports phones; the Studio could say "best on a laptop" and still work on tablets. |
| Q5 | **How much does a retelling see of the base content it reuses?** | Read-only browsing of base cards and events (to pick from) seems essential. Copy-to-edit ("make my own version of this base card") is cheap and useful, and creates a new id, never an override (packs can't replace each other's content). |
| Q6 | **One pack per browser, or several drafts?** | Several drafts is little extra work with IndexedDB; a draft list on the start screen. |
| Q7 | **Where does the tutorial round's content come from?** | Write the facilitator round once around a generic example ("your payments team"), or let the author answer prompts about their own organization from the first step (more useful, harder to guide). |
| Q8 | **Studio name** | "Pack Studio" (working name), or something in the game's voice: "The Scriptorium", "The Forge", "The Map Room". |

---

## 8. Not doing (and why)

- **Assets from packs** (D5).
- **GitHub publishing / accounts / a backend** (D4).
- **A drag-and-drop canvas editor.** Forms, pickers and previews give most of the value (CONTENT_PACKS.md §7).
- **Editing other people's packs in place.** Import a pack to make your own copy; packs never override each other.

### A possible later step for visuals that keeps D5

If packs ever need more visual identity, the safe form is **choosing from the game's own built-in art**, never supplying it. For example, a score could say `"icon": "shield"`, and the game would look that name up in its own icon set, ignoring anything unknown. No URL, no file and no fetch is involved, so the worst case stays text. That needs its own ADR, and isn't part of M4.
