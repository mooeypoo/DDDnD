# Community Content Packs

Status: Planning. No implementation yet. This file is the journal and plan for the feature.  
Audience: future-us, other agents, and later writing (talk, blog posts, the public docs site)  
Decisions: [docs/adr/](adr/README.md) (ADRs 0001–0006)  
Threat model: [docs/CONTENT_PACKS_SECURITY.md](CONTENT_PACKS_SECURITY.md)  
Related: [AGENT.md](../AGENT.md), [ARCHITECTURE.md](../ARCHITECTURE.md), [CONTENT_SCHEMA.md](../CONTENT_SCHEMA.md), [CONTENT_VERSIONING.md](../CONTENT_VERSIONING.md), [docs/CONTENT_PACK_AUTHORING_GUIDE.md](CONTENT_PACK_AUTHORING_GUIDE.md), [docs/GAMEPLAY_V2.md](GAMEPLAY_V2.md)

If a conversation about packs starts cold, read this file after the base AGENT.md set.

---

## 1. What we are doing, in one page

DDDnD was built so the game is a deterministic engine plus versioned content packs. The packs have manifests, ids, versions, and a registry that can merge several of them. That was a deliberate bet. This feature collects on it.

The goal: **a domain expert can make their own pack, host it themselves, and have their workshop players load it into dddnd.app.** At first, "domain expert" means a DDD facilitator who wants the Monolith retold in their organization's terms. Later it means other software-architecture disciplines (SRE and incident response, Team Topologies, threat modeling, data mesh) and eventually teaching that is not about software at all.

There are three parts:

1. **The game loads community packs safely.** From a GitHub URL or a dropped file, with consent, strict validation, and a visible "community pack" label.
2. **Pack Studio**, a separate site on a dddnd.app subdomain. Authors create and edit packs with forms instead of raw JSON, see live validation, run the same balance audits we run on the base pack, preview, and export a file or a GitHub-ready zip.
3. **Documentation** for authors (the public docs site) and for us (this file, the ADRs, the threat model).

The one-sentence principle behind all of it: **a pack is data that a fixed engine interprets. It is never code, and it is never trusted until validated.**

---

## 2. Who this is for, and what they get

| Who | What they want | What this feature gives them |
|---|---|---|
| **Workshop facilitator** (DDD coach, architect running an internal session) | Scenarios in their organization's own language: their legacy system, their stakeholders, their politics | An `extension` pack built on base mechanics. Players open a link, approve, and play. |
| **Discipline expert** (SRE lead, security architect, platform team) | The same "decisions have delayed consequences" loop, about *their* subject | A `standalone` pack with its own scores, stakeholders, outcomes, and coupling |
| **Translator / localizer** | DDDnD in another language | An `overlay` pack that changes text only, with zero behavior risk |
| **Player** | Try something new without risk | Clear consent, a visible label, nothing runs as code, saves keep working |
| **Us** | Grow the game without becoming a content host or moderator | Authors host on their own GitHub. We publish a schema, an engine, and a Studio. |

The bigger benefit is the one the game itself teaches. A team that builds a pack has to name its scores, decide what each stakeholder cares about, and model which decisions have delayed consequences. That is a modeling exercise. **Writing a pack is a small act of domain modeling.** Facilitators can use pack creation itself as a workshop activity.

---

## 3. How we got here: the thinking process

This section records how the discussion went, because the reasoning is as useful as the result (and it is talk material).

### 3.1 Starting question: "can we just load someone else's folder?"

Technically, almost. `resolveContentPackManifestUrls` already accepts extra manifest URLs. The registry already merges packs. The authoring guide already describes hosting on GitHub raw.

So the first instinct was "build a UI for adding a URL". Before doing that, we read the code again with one changed assumption: **a stranger on the internet wrote this pack.** Most of the planning came out of that shift.

### 3.2 What the "stranger wrote it" reading found

1. **The validation boundary checked references, not shapes.** `createContentProvider` does `response.json() as T`. TypeScript types are compile-time only, so a `delta` of `"lol"`, a `max_turns` of `1e9`, a 50 MB description, or a score id of `__proto__` would all reach the engine. The architecture docs already said "raw JSON is untrusted until validated". The code honored that for references and coverage, which was enough for reviewed first-party content and not enough for the internet.
2. **DDD lived in the engine, not just the content.** Coupling rules name `domain_clarity` and `team_morale`. Outcome tiers are chosen by hardcoded thresholds and ids. The ten outcome archetypes are a closed TypeScript union with predicates over base score groups. A Team Topologies pack would load fine and then end every run as "System Stabilizer". The engine was *shaped* generic, but it still carried DDD knowledge.
3. **A rule's condition was hidden in its prose.** Reaction rules carry `"condition_description": "Domain clarity < 35"`, which the engine parses by regex and fuzzy-matches against *display names*. Rename the score "Domain Clarity" to "Model Clarity" for a workshop and the rule silently stops firing. The human sentence and the machine condition were the same string.
4. **Last-registered-wins overrides.** Fine for a curated tutorial pack, dangerous for a remote one: any pack could redefine `define_bounded_context-v1` and change the base game under the player.

None of these were bugs for a single-author game. All of them are bugs once there are many authors. That framing kept the plan honest: **the first milestones are boundary work players never see.**

### 3.3 "Only strings and booleans?"

The opening instinct on security was "packs should only replace strings and boolean behavior tags". We tested that against what a teaching pack actually needs and found it too narrow: a facilitator has to tune numbers (how much a card costs, how fast morale decays, when the CFO gets angry).

The underlying worry was "can a pack make the game *do* something". That is answered by a different line: **no field is ever interpreted as code or markup, and every number is bounded.** Numbers are data. Expressions, scripts, templates, and HTML are behavior, and packs never get those.

The strings-only idea did not disappear. It became the `overlay` pack kind, which is the safest kind and the natural form for translations.

### 3.4 Presentation: who decides what a stakeholder looks like?

The first proposal was a per-pack `presentation.json` (for example "the CFO is the dragon warrior"), limited to fixed values and validated by the UI layer. It would have bent an existing architecture rule: presentation must not leak into content.

The better question, raised in discussion: **do we need content to say anything about looks at all?** If the UI assigns a cast on its own every run, content and presentation are fully decoupled. We can also add or redraw avatars later without touching any pack.

Reading the code showed the game already half-did this (a shuffled role pool plus an id hash), with three flaws:

- two stakeholders can get the same role,
- the results screen and share card use a different (unshuffled) pool than play, so a stakeholder can look different after the run,
- `Math.random()` makes the cast change on reload.

The decision ([ADR 0002](adr/0002-presentation-cast-decoupled-from-content.md)): content has no presentation fields at all. The UI derives a stable cast from the run seed with its own generator, separate from the simulation's random stream. One function serves every screen. The cast is random across runs, stable within a run, and gameplay can never be affected.

This is a small decision with a big lesson: **the cleanest answer to "how should content describe its looks?" was "it shouldn't".**

### 3.5 Where can packs come from?

Options ranged from "any https URL" to "we host a registry". Hosting a registry makes us responsible for accounts, storage, moderation, and legal takedowns. Any https URL maximizes reach but also tracking, phishing, and CSP surface.

Decision ([ADR 0003](adr/0003-remote-pack-source-allowlist.md)): start with GitHub raw and GitHub Pages only, plus local file import. Widening the list later is a one-line data change plus a new ADR. Narrowing it after people depend on it would hurt.

### 3.6 Licensing

The base pack is GPL-3.0-only. Packs derived from it (copied and edited base cards, or Studio templates seeded from base) are very likely derivative works. Decision ([ADR 0004](adr/0004-pack-license-compatibility.md)): packs that depend on or derive from base must use a GPL-3.0-compatible license. That is the safest, simplest rule, and it is easy to relax later. To be confirmed with someone qualified before the Studio ships.

### 3.7 Which comes first: loading or Studio?

Loading first, with a demo pack ([ADR 0006](adr/0006-delivery-order-loading-before-studio.md)). The security work lives on the player path, so it should be in production first. A loader with nothing to load is hard to test or demo, so a small `extension` demo pack, hosted in its own public GitHub repo, ships with it. The SRE and incident-response pack becomes the first `standalone` pack and the acceptance test for engine generalization.

---

## 4. The DDD lens: this feature designed the way the game teaches

DDDnD teaches Domain-Driven Design, so the feature should hold up to the same thinking. Here is how it maps (talk material).

### 4.1 Subdomains: what is core, what is supporting, what is generic

| Subdomain | Type | Consequence |
|---|---|---|
| Simulation rules and content semantics (what a card *means*, how a turn resolves) | **Core** | We own it, it stays deterministic, and it is the one source of truth for both apps |
| Pack authoring (drafts, editing, versioning help, balancing) | **Supporting** | Worth building because nobody else will, but it serves the core |
| Hosting, file storage, zip, identity, CDN | **Generic** | We do not build these. GitHub hosts packs, the browser stores drafts, a library zips. We never become a content host. |

The decision not to run a backend or a registry is a subdomain decision. Hosting is generic, so we "buy" it (GitHub) instead of building it.

### 4.2 Bounded contexts

The same words mean different things in different places, which is the signal for a context boundary:

| Term | In **Play** | In **Pack Authoring** | In **Pack Distribution** |
|---|---|---|---|
| Card | Something in your hand that resolves when played | A draft entity with fields, validation errors, and a version history | A file listed in a manifest inventory |
| Version | Fixed identity of behavior (`-v2`), never mutated | Something the version-bump assistant proposes when gameplay fields change | Pack semver (`1.2.0`) that players see |
| Valid | Already guaranteed (the engine only sees validated bundles) | A live, changing state with field-level errors | "Passed the boundary checks for this source" |
| Stakeholder | A person at the table with satisfaction and a mood | A form with reaction rules attached | Content owned by a specific pack |

So there are three contexts:

- **Play**: today's game, meaning the content runtime, simulation, persistence, reporting, and game UI.
- **Pack Authoring**: the new `authoring` domain plus the Studio UI.
- **Pack Distribution and Trust**: source policy, fetching, consent, hashing, snapshots. This sits in the content domain because it guards the content boundary.

### 4.3 Context map

```
          Published Language: pack schema (JSON + generated JSON Schema, schema_version)
                                       │
   ┌─────────────────────┐   exports   │   loads    ┌──────────────────────────────┐
   │   Pack Authoring    │ ──────────► │ ─────────► │            Play              │
   │ (Studio + authoring │             │            │  ┌────────────────────────┐  │
   │      domain)        │             │            │  │ Anti-Corruption Layer: │  │
   └─────────┬───────────┘             │            │  │ schema + limits +      │  │
             │ Shared Kernel           │            │  │ source policy + consent│  │
             │ (content + simulation   │            │  └───────────┬────────────┘  │
             │  domains, same code)    │            │              ▼               │
             └─────────────────────────┼──────────► │   content → simulation       │
                                       │            └──────────────────────────────┘
               External authors' repos (GitHub) — upstream we do not control
```

- **Published Language**: the pack schema, versioned by `schema_version`, published as JSON Schema. It is the contract between authors and the engine.
- **Anti-Corruption Layer**: the hardened content boundary. External packs are an upstream we do not control, so nothing from them reaches the core model without being translated into validated, typed structures. The architecture docs always described this layer. This feature makes it real.
- **Shared Kernel**: the Studio and the game share the content and simulation domains as the same source code ([ADR 0005](adr/0005-pack-studio-as-separate-app.md)). We accept the coordination cost because "balance in the Studio equals balance in play" is a core promise.
- **Conformist**: authors conform to the published language. We protect them from churn with `schema_version` and the rule that released content versions never change.

### 4.4 Making implicit concepts explicit

The biggest modeling move in the plan is moving knowledge out of code into the model:

- **Coupling rules** ("when delivery confidence collapses, architecture gains shrink") were constants in a rules file. They are domain knowledge, so they become content.
- **Outcome tiers and archetypes** were thresholds and predicates in TypeScript. They describe what a good or bad run *means* in this domain, so they become content.
- **Reaction conditions** were hidden inside an English sentence. They are split into a human description and an explicit structured condition.

That is the classic DDD refactoring: the code was quietly holding a domain concept, so we name it and model it. The test that the model is now right is the SRE pack. If a different domain can express itself without touching TypeScript, the concepts are truly in the model.

### 4.5 Aggregates and invariants

A **pack** behaves like an aggregate root, and a **scenario bundle** is a consistent snapshot built from it. The invariants enforced at the boundary are:

- every ref resolves within the pack or its declared dependencies,
- every reachable `score_id` is in the scenario's `score_refs`,
- `id`/`version` match the filename,
- released versions are never mutated,
- every value is within limits.

The engine never re-checks these, because the boundary guarantees them. That is why the boundary must be strict.

### 4.6 Ubiquitous language for the feature

| Term | Meaning |
|---|---|
| **Pack** | A versioned, licensed collection of content with a manifest |
| **Pack kind** | `overlay` (text only), `extension` (builds on another pack), `standalone` (complete world) |
| **Base pack** | The first-party DDDnD pack in `content/` |
| **Community pack** | Any pack not shipped in the game build |
| **Source** | Where a pack was loaded from (allowlisted URL or local file) |
| **Consent screen** | The screen where a player approves loading a community pack |
| **Snapshot** | The locally stored copy of a loaded pack, keyed by content hash |
| **Bundle file** | Single-file pack format, `.dddnd-pack.json` |
| **Cast** | The UI's per-run assignment of `avatarRole`s to stakeholders |
| **Studio** | The authoring site |
| **Draft** | A pack being edited in the Studio, stored only in the author's browser |
| **Balance lab** | The Studio's view of simulation and audit results for a draft |

---

## 5. Pack kinds

| Kind | May contain | May not | Engine requirements | Risk |
|---|---|---|---|---|
| `overlay` | Replacement text fields (`name`, `short_name`, `description`, `flavor_text`, and similar) for content in packs it depends on | Any numeric, ref, or behavior field. No new entities. | A text-overlay merge step in the content domain | Lowest |
| `extension` | New scenarios, cards, events, effects, stakeholders, rules, classes, and modifiers that reference its dependencies' scores and stakeholders | Overriding dependency content | Works with today's engine once M1 hardening lands | Medium |
| `standalone` | A complete world: scores, outcomes, archetype criteria, coupling rules | — | Needs M3 engine generalization | Medium (same data rules, more surface) |

Kind is declared in the manifest and checked by the validator. Players see it on the consent screen.

---

## 6. File formats

- **Repository layout** (unchanged): `manifest.json` plus the typed subfolders, as in [CONTENT_PACK_AUTHORING_GUIDE.md](CONTENT_PACK_AUTHORING_GUIDE.md). This is what authors host on GitHub.
- **Bundle file** (new): `.dddnd-pack.json`, one JSON document with the manifest and every content file inlined by type. Used for local file import, Studio export, Studio-to-game playtest, and local snapshots.
  - It goes through the same validation as hosted packs.
  - The game reads only this file or a hosted manifest. **The game never unzips.**
- **Zip** (Studio only): the repository layout, zipped, ready to commit to a GitHub repo.
- **Manifest additions** (M1): `schema_version` (integer), `kind`, and optional `content_hashes` (per-file SHA-256) so authors can pin exact content.

---

## 7. Pack Studio

Separate local-first app, decided in [ADR 0005](adr/0005-pack-studio-as-separate-app.md). Feature ideas, in rough value order:

1. **Start screen with templates**: blank `standalone`, `extension` of base, `overlay` of base, or import an existing bundle or zip. Licensing is explained at this step ([ADR 0004](adr/0004-pack-license-compatibility.md)).
2. **Form editors for every entity type**, built from the same schemas the validator uses. **Reference pickers** replace typing ids and versions. Picking a card shows its name and a short summary.
3. **Live validation panel.** Every error has a field path and a "jump to field" link. Errors from schema, limits, references, `score_refs` coverage, license, and kind rules all appear in one list.
4. **Version-bump assistant.** It compares the draft to the last export. When a gameplay field changed on an already-exported entity, it explains why ([CONTENT_VERSIONING.md](../CONTENT_VERSIONING.md)) and offers to create `-vN+1` and repoint references. Cosmetic edits are left alone. This encodes a rule that non-developers would otherwise break all the time.
5. **Balance lab.** Runs the player-true and full-pool-oracle policies in a Web Worker and shows the existing audit report: win rate per class, card usage, dominant strategies, catalog-only recovery, stakeholder pressure. It reuses the shapes and language from the docs site's "Reading the audit" page. Results can be compared between two drafts.
6. **Plain-language explainer** for each entity. For example: "When Budget drops below 30, the CFO's satisfaction falls by 5 and Team Morale by 2." This is generated from structured data, which is another reason to kill prose-parsed conditions.
7. **Relationship graph**: scenario → cards → aftershocks; stakeholders → rules → scores. Shows orphans and dead ends.
8. **Previews**: card and stakeholder previews in a Studio-native style. Game components are not shared (see ADR 0005), so these are approximations.
9. **Playtest in DDDnD**: sends the bundle to a sandboxed preview route in the game via origin-checked `postMessage`. Preview runs never write to real saves.
10. **Export**: the bundle file and the GitHub zip, plus a generated README with the URL players should use.

Visual "drag-and-drop canvas" editing is deliberately not on the list for now. Forms, pickers, the graph, and the explainer give most of the value with much less complexity.

---

## 8. Milestones

| # | Milestone | Required? | Contents | Done when |
|---|---|---|---|---|
| **M0** | Decisions and docs | Required | This file, ADRs 0001–0006, threat model, pointers in AGENT.md and ARCHITECTURE.md | Merged |
| **M1** | Harden the content boundary | Required | Field-level schemas and limits for every content type and the manifest; id grammar; URL rules; pack-scoped resolution with no cross-pack overrides; `schema_version` and `kind` in the manifest; structured reaction `condition` (with legacy prose parse kept for base); generated JSON Schema; CSP header; hostile-pack test fixtures | Every hostile fixture is rejected with a precise error; base pack still validates; determinism tests unchanged |
| **M2** | Game loads packs (**MVP 1**) | Required | Source allowlist and fetch policy; consent screen; pack manager (add, remove, list, see source and license); local bundle-file import; "community pack" label during play; pack identity and hash in saves and exports; IndexedDB snapshots; seeded per-run cast and scene assignment ([ADR 0002](adr/0002-presentation-cast-decoupled-from-content.md)), fixing the three cast defects; fallback score presentation; **demo `extension` pack** in its own public GitHub repo plus an in-repo fixture; public docs-site pages for players and authors | A player can load the demo pack from its GitHub URL and from a file, play it, save, reload, and export, and base play is unaffected |
| **M3** | Engine generalization | Required for `standalone` | Coupling rules, tier thresholds, archetype criteria, and audit targets become content; `OutcomeArchetypeId` becomes a validated string; base pack gets new content versions that encode today's behavior; golden replay tests; **SRE and incident-response `standalone` pack** as the acceptance test | Base-pack golden runs are identical before and after; the SRE pack plays, ends in its own archetypes, and passes its own audits with no TypeScript changes |
| **M4** | Pack Studio MVP (**MVP 2**) | Required | `authoring` domain; Studio app and Netlify site; IndexedDB drafts; templates; form editors and ref pickers; live validation; version-bump assistant; bundle and zip import/export; licensing guidance (after a legal sanity check) | An author can build the demo pack from scratch in the Studio and load the export in the game |
| **M5** | Balance lab | Strongly recommended | Worker-based runs, audit report, draft-vs-draft comparison | Studio audit numbers match `npm run content:validate:audit` for the same pack |
| **M6** | Explain, graph, preview, playtest | Optional | Plain-language explainer, relationship graph, previews, `postMessage` playtest | — |
| **M7** | Ecosystem | Optional | `overlay` packs and localization; curated pack directory (reviewed list in this repo); GitHub template repo and validation Action; widen source allowlist (new ADR); GitHub publish via OAuth (new ADR, needs a serverless function) | — |

**MVP 1 = M1 + M2.** Players can safely load a third-party `extension` pack. **MVP 2 = M3 + M4.** Anyone can author a `standalone` pack without writing JSON.

Each milestone stays inside the existing working rules: one domain boundary at a time, determinism tests never edited to pass, and content behavior changes made through new versions.

---

## 9. Open questions

| Question | Notes | Decide by |
|---|---|---|
| Schema library | Zod v4 is the working proposal (CSP-safe, emits JSON Schema). Valibot is the alternative. Ajv is out for the runtime. | Start of M1 |
| Exact limits (bytes per file, files per pack, stakeholders per scenario, `max_turns` range, string lengths) | Set them from the base pack's real maximums with generous headroom. Record them in CONTENT_SCHEMA.md. | M1 |
| Demo pack topic | `extension` kind is fixed. A likely shape is "the Monolith, retold for a fictional company", to show the facilitator use case. | M2 |
| Demo pack repository name and owner | Public GitHub repo, separate from this one | M2 |
| SRE pack design | Scores, stakeholders, failure modes, and what "winning" means need a brainstorm | M3 |
| Studio subdomain and repo folder names | Working names: `studio.dddnd.app`, `studio/` | M4 |
| License rule review | Sanity check of ADR 0004 by someone qualified | Before M4 ships |
| Exact-run replay of retired remote packs | Snapshots make it possible. Do we promise it? (CONTENT_VERSIONING.md does not promise it for retired base scenarios.) | M2 |

---

## 10. Notes for the talk and blog posts

Threads worth telling, with where they are recorded:

- **"We built the seams years before we needed them, and still had to finish them."** The manifest and registry existed. The trust boundary did not. (§3.1, §3.2)
- **"Read your own code as if a stranger wrote the input."** One changed assumption produced most of the plan. (§3.2)
- **"Strings and booleans" became "nothing executes, every number is bounded."** Finding the real security line instead of the intuitive one. (§3.3)
- **"The best way for content to describe its looks was not to."** The presentation-cast decision, and the three bugs found on the way. (§3.4, ADR 0002)
- **"Don't host what you can link."** Generic subdomains and the no-backend decision. (§4.1, ADR 0003, ADR 0005)
- **"Make the implicit explicit."** DDD knowledge hidden in engine constants and in English sentences. (§4.4)
- **"A second domain is the only real test of generality."** The SRE pack as an acceptance test. (ADR 0006, M3)
- **"Writing a pack is domain modeling."** Pack creation as a workshop exercise. (§2)
- **The context map** in §4.3 works as a slide.
