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
| D25 | **The Studio exports for the game in the same repository, and CI keeps them in step.** A pack declares the pack format (`schema_version`) and the base pack version it was checked against (`depends_on`), both read from the game's own code and content, never a copy. The game accepts it on any later base of the same major version. In return the base pack keeps a promise within a major version: what it has shipped stays shipped and plays the same, and new content comes with a later base version. `scripts/base-content-lock.json` records that promise and a test checks it (`npm run content:lock` after changing base content). | The game, its content and the Studio live in one monorepo and deploy from the same commit, so the rule can be a check rather than a habit. The Studio had declared a fixed base 1.0.0: right today, but a pack using content added in 1.1.0 would have claimed to work on 1.0.0. A pack names base content by exact version, so a base that changed or dropped `card-v1` within 1.x would break packs already out there. |

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

**Order for the rest of M4** (after M4.5b; D23):
1. ~~Aftershocks and event conditions~~ (M4.6).
2. ~~The version-bump assistant~~ (M4.7).
3. Zip export and import.
4. "Play it" (D15, D17).
5. New-topic authoring (scores, endings, classes) and the guided round.
6. Balance hints, and the smaller items: sidebar collapse or filter, "Go to it" focusing the exact field.
7. **The UI/UX audit (D23):** the start screen, the workspace and the editing flows, reviewed together and made consistent.
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

  A new major version starts a new lock. A test in CI fails if the lock is broken or out of date, and `npm run content:lock` records it after a deliberate change. CONTENT_VERSIONING.md allows one exception: making behaviour explicit in a new structured field when a test proves it plays identically (M1.4). That goes through `--accept <section>/<file>`, so it's always named on purpose.

**Why a check, not a habit:** the game, its content and the Studio live in one repository and both sites deploy from `main` (a `content/` change rebuilds both). So "the Studio is up to date with the game" doesn't need a release process: the Studio reads the game's own files, and the lock makes the base keep its word to packs already out there.

**For the talk: a published language needs a contract, and in a monorepo the contract can be a test.** The base pack is upstream of every community pack (a customer/supplier relationship, in context-mapping terms). The game's ids and versions are the published language. Writing the supplier's promise down as a lock file turned "be careful with base content" into a failing build with a sentence that says what to do.

**Verification:**
- Tests: 1250 in total. `game_studio_sync.test.ts` exports a real draft and checks it declares this repository's format and base version. Lock cases: removed, changed play, reworded, new content without a version bump, an earlier version, a new major, and a named exception.
- By hand: changing a base card's score change makes `npm run content:lock` refuse, naming the file and what to do. Changing only its name passes. The card was restored.
- Headless Chrome (production build, Studio CSP): the export page shows the base-game line. All three downloaded files declare `depends_on: base 1.0.0` and format 1. Zero CSP violations, no console errors.

**Risk noted:** the game and the Studio are two Netlify sites building the same commit, so for a few minutes one can be ahead of the other. If the Studio deploys a base version bump first, a pack exported in that window declares a base the live game doesn't have yet, and the game refuses it with its "needs a newer DDDnD" kind of message. This fails safe and is short-lived; launch (step 8) could order the deploys if it matters.

