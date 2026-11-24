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
| D21 | **The game's council members are seated or left out, never copied.** Authors seat their own members, each with their own reactions, and change how a game card treats the council by making their own version of the card (D7). | The game's cards and events name council members by id; a copy has a new id, so the deck would stop reaching it (M3.9). Copying every card that names the original too would balloon the pack. The scenario decides who takes part, so leaving one of the game's members out is harmless: cards that name them do nothing. |

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

Q1–Q8 from the first round are settled: Q1 → D6, Q2 → D3, Q3 → D12, Q4 → D10, Q5 → D7, Q6 → D8, Q7 → D9, Q8 → D11. Q9 → D15 and D17, Q10 → D14, Q11 → D16, Q12 → D18.

| # | Question | Options and notes |
|---|---|---|
| Q14 | **A simpler start screen** | The mockup's start screen offers a lot at once: two kinds of pack, five base scenarios, example packs, import, and drafts. A simpler flow might be "Start from the core pack", then choose a scenario, with the rest one step further in. Revisit once the Studio works end to end, to see which starting points authors actually use (owner, 2026-11-24). |
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
- Three columns in the workspace: the pack's contents, the editor, and the Checks rail with balance hints. Below about 1100 px the Checks rail moves under the editor; on a tablet the contents become a drawer.
- Editors are stacked sections: "What players read", "When played", limits, a plain-language preview, and "Used in".

**Settled:** the mark is the anvil with sparks (D19), and the guided round's header is ember-tinted (D20). The start screen's layout will be simplified later (Q14).

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

**Tests to write with it:**
- messages from any other origin, or from a window other than the opener, are ignored;
- a wrong or reused nonce is ignored;
- a second pack after the first is ignored;
- a pack failing validation shows errors and doesn't play;
- a preview run writes nothing.

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
4. At launch: remove `noindex` (`studio/index.html` and `X-Robots-Tag` in `studio/netlify.toml`), and add the Studio's origin to the game's preview allowlist (§11) in the same PR.

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

Decision **D21** (option c of the M4.4 question): the game's council members are seated or left out, never copied. The council screen says so in words, so authors know why: "Your scenario decides who sits at the table. Anyone who isn't seated simply doesn't take part: the game's cards that would move them do nothing here, so there's no harm in leaving people out."

**What an author can do now**
- **See the council:** "4 of 8 seats", each member marked "yours" or "from the game", with the game's unseated members listed under it.
- **Open one of the game's members.** It's read-only, with their reactions in plain words ("CTO Wants Clarity. When Domain Clarity drops below 35: lowers Budget by 3 and Team Morale by 2; makes Chief Technology Officer unhappier (-5).") and a note saying why it can't be edited and what to do instead.
- **Take any member out.** A confirmation says what follows: for one of the game's members, "they won't take part … the game itself is unchanged"; for the author's own, their reactions go with them. Either way it lists the author's own cards or events that will stop moving them. The last seat can't be emptied.
- **Seat one of the game's members**, up to the game's limit of 8.
- **Seat their own member** ("+ New member" or "+ Seat your own member"):
  - name, description and optional summary; the id settles from the name, like cards;
  - **reactions:** a name, a sentence, a condition ("When [Budget] [drops below / is at most / rises above / is at least] [40]") and what changes, with the same score and council rows as cards, in plain words. Every reaction whose condition holds happens once a turn, as in the game. The condition's text in the file (`condition_description`) is written from the condition, so it can't disagree with it.
- **Pick their own members on cards and events:** the card editor's council picker offers whoever is seated.
- **"Go to it"** from the Checks rail now reaches council members and reactions (a reaction opens its member's page).

**Domain** (`council.ts`):
- `addToCouncil`, `removeFromCouncil`, `isOwnMember`, `createOwnMember` and `ownReactionsTo`;
- `addReaction`, `setReactionCondition`, `removeReaction`, `describeCondition` and `conditionText`;
- `settleNewMemberId` and `settleNewReactionId`.

Id settling for cards, events, members and reactions now shares one helper (`placeholder_ids.ts`).

`removeFromCouncil` also:
- drops the member's satisfaction floor from the scenario's balance targets. Every base v2 scenario sets one for each member, and the game's checks refuse a floor for someone not at the table;
- strips the author's own content's changes aimed at them, since those would do nothing (M3.9).

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

Tests: 1210 in total (+9 for the council). One of them exports a Monolith without the CTO and with an own member whose reaction fires every turn, then plays it through the game's import: the member finishes above 50 and the CTO is absent.

**Next:** aftershocks and event conditions; then the version-bump assistant, zip export and import, and "Play it" (D15/D17). Smaller follow-ups:
- the sidebar gets long with a full deck (collapse or filter);
- "Go to it" could focus the exact field.
