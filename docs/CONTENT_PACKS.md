# Community Content Packs

Status: In progress. M1 (harden the content boundary) is complete; M2 is next. See section 11. This file is the journal and plan for the feature.  
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
| **Pack id** | The name a pack gives itself in its manifest (`gilded_ledger`). Not unique |
| **Pack key** | A pack's identity, from where it is published (`github:<owner>/<repo>/<folder>`). See [ADR 0012](adr/0012-pack-identity-from-source.md) |
| **Publisher** | The GitHub account a pack was loaded from: the one thing about a pack it can't claim falsely. Shown next to its credits ([ADR 0013](adr/0013-community-packs-depend-only-on-first-party.md)) |
| **Snapshot** | The validated, in-memory copy of a loaded pack; stored on the device under its pack key, with a content hash for the exact content |
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
| **M2** | Game loads packs (**MVP 1**) | Required | Source allowlist and fetch policy; consent screen; pack manager (add, remove, list, see source and license); local bundle-file import; "community pack" label during play; pack identity and hash in saves and exact-run records; IndexedDB snapshots; seeded per-run cast and scene assignment ([ADR 0002](adr/0002-presentation-cast-decoupled-from-content.md)), fixing the three cast defects; fallback score presentation; **demo `extension` pack** in its own public GitHub repo plus an in-repo fixture; public docs-site pages for players and authors | A player can load the demo pack from its GitHub URL and from a file, play it, save, and reload, and base play is unaffected. Saves and exact-run records carry the pack's identity (there is no player-facing export; see M2.13) |
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
| ~~Schema library~~ | **Resolved (M1.1):** `zod/mini` in jitless mode with our own messages. See [ADR 0007](adr/0007-zod-mini-jitless-for-content-validation.md). | Done |
| ~~Exact limits~~ | **Resolved.** Per-file limits in M1.1 (table in [CONTENT_SCHEMA.md](../CONTENT_SCHEMA.md#validation-and-limits)). 2000 files per pack in M1.2. | Done |
| ~~Demo pack topic~~ | **Resolved (M2.1):** "The Gilded Ledger", the monolith story retold for a fictional payments company. | Done |
| ~~Demo pack repository name~~ | **Resolved (M2.1):** [mooeypoo/DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs), one folder per pack (ADR 0008). | Done |
| SRE pack design | Strawman agreed in M3.0: scores (all higher-is-better), council, cards, events, endings. Details settle while building it. | M3 |
| "Lower is better" scores | **Deferred (M3.0).** For now every score is higher-is-better, and packs phrase scores positively ("Rested on-call", not "Pager fatigue"). Supporting lower-is-better later touches: the tier average (invert or normalize per score), coupling triggers (fall *below* vs rise *above*), ending criteria (already explicit comparisons, so mostly fine), the balance audit's low-score telemetry, and the UI meters and deltas (a rising number shown as bad). It would be a `direction` field on the score, defaulting to higher-is-better, so existing content is unaffected. | When a pack needs it |
| Studio subdomain and repo folder names | Working names: `studio.dddnd.app`, `studio/` | M4 |
| License rule review | Sanity check of ADR 0004 by someone qualified | Before M4 ships |
| Phantom stakeholders | `stakeholder_changes` aimed at a stakeholder not in the scenario silently create one (found in M2.1; `microservice_sprawl-v2` does it today). The fix changes behavior, so it needs a new scenario version plus a validator error. | M3 |
| ~~Whose pack does `depends_on` mean?~~ | **Resolved (M2.8):** community packs may depend only on first-party packs, whose ids we control ([ADR 0013](adr/0013-community-packs-depend-only-on-first-party.md)). Community-on-community dependencies would need key-based references in a new schema version. | Done |
| ~~Community hall look~~ | **Resolved (M2.12):** warm canvas, a thin awning stripe, and a stitched border as the external mark ([ADR 0015](adr/0015-community-packs-in-their-own-place.md)). | Done |
| Player-facing run download | **Ready in code, not used.** The exact-run export (seed, scenario, pack identity and content hash, every turn's choice, history, outcome) can replay a run exactly, but nothing in the game creates or reads one; only tests do. Possible uses: a player sends a pack author a run that felt broken, or a facilitator collects a workshop's runs. Add a button when one of those is wanted (M2.13). | When needed |
| ~~Exact-run replay of retired remote packs~~ | **Resolved (M2.13): no promise.** If a pack is taken down, it's gone. Saved runs continue only while their exact pack is imported in that browser; players aren't led to expect more. Same stance as retired base scenarios in CONTENT_VERSIONING.md. | Done |

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
- **"The worst case is text."** One rule that every feature must keep, and that makes repo-jacking and pretenders survivable. (M2.9, ADR 0014)
- **"A name is not an identity."** Pack ids were quietly used as identities until review asked what happens when two authors pick the same name. Identity moved to where a pack is published, owned by the trust context: first for what persists, then for dependencies, then for everything that runs (and content ids, via squatting). The textbook attribute-vs-entity distinction, found in the wild three times. (M2.7–M2.9, ADR 0012–0014)
- **"The screen should show the model you built."** The game had kept packs separate since M2.9, but the lobby still took their scenarios out and dealt them into one deck. Testing it by hand raised the question "can a pack have more than one scenario?", and the answer turned the pack, not the scenario, into the thing a player chooses. (M2.11)
- **The context map** in §4.3 works as a slide.

---

## 11. Implementation log

One entry per slice of work: what changed, what we learned, and why we chose what we chose. Newest last. Each entry is written for someone reading it months later, such as the talk, a blog post, or a reviewer.

### M1.1: Field-level schemas and limits (2026-11-21)

Branch: `feat/content-packs-mvp1` (PR #34).

**What changed**

- New `src/domains/content/validation/` module (the folder already existed, empty, from the original architecture):
  - `content_limits.ts`: every bound in one place, each annotated with the base pack's measured maximum.
  - `schema_primitives.ts`: id grammar, bounded integers, safe text, refs, records, https URLs.
  - `content_entity_schemas.ts`: one strict schema per content type, typed against `model/content_types.ts`.
  - `content_entity_parser.ts`: `parseContentEntity()`, the single entry point, plus author-facing error messages.
- `bounded_json_reader.ts`: reads a response body with a byte cap. It checks `Content-Length` early, then counts the actual stream, because the header can lie or be missing.
- The browser loader (`createContentProvider`) now goes: bounded read → JSON parse → schema → filename identity check. The old `score_shape.ts` check is subsumed by the score schema. Its tests moved to `content_schema.test.ts` with the same rules.
- The four CLI scripts each had their own copy of a disk loader that checked only `id`/`version`. They now share `scripts/lib/file_content_provider.ts`, which applies the same schema as the game.
- `Stakeholder.short_description` was documented in CONTENT_SCHEMA.md but missing from the TypeScript type. It's now in the type, so the strict schema accepts a documented field.
- CONTENT_SCHEMA.md gains a "Validation and Limits" section. Its accidentally duplicated opening section (noted during planning) is fixed.

**How the limits were chosen**

We measured all 209 first-party content files first (longest strings, numeric ranges, array sizes, largest file at about 5 KB). Each limit is that maximum with generous headroom: descriptions 174 → 600 characters, cards per scenario 26 → 100, `max_turns` 12 → 50. Two limits are set by something other than content:

- **Stakeholders per scenario is 8.** That keeps it below the UI's 9 avatar roles, so ADR 0002's distinct cast is always possible.
- **Deltas are bounded at ±100**, because scores and satisfaction live on roughly a 0–100 scale.

**What we learned**

1. **Every first-party file passed on the first run.** The base content was already disciplined; the boundary was the only thing missing. That made it safe to make objects strict (unknown keys are errors).
2. **Zod v4 quietly calls `new Function`.** We had picked Zod partly because Ajv uses `new Function`. Reading Zod's source showed it does too: it probes for `eval` to JIT-compile object parsers. The probe fails safely under CSP but still triggers a violation report. Fix: `jitless: true`. We wrote a test that spies on the `Function` constructor and confirmed it failed with jitless off, so the test is real.
3. **We measured the bundle before committing to the API.** Classic Zod added 28 kB gzipped (about 20%). `zod/mini` adds 9.5 kB. We switched while the schemas were fresh.
4. **`zod/mini` has no English messages, and that turned out to be useful.** Its default is "Invalid input", which helps no author. We wrote about 40 lines mapping Zod's structured issues to plain messages, such as `unknown field "stakehoder_changes" (check the spelling)`. These are the messages Pack Studio will show. One subtlety: mini doesn't keep the input value on issues, so "missing" and "wrong type" looked the same. We tell them apart by looking up the path in the raw JSON.
5. **Zod silently drops a `"__proto__"` key from records.** That's safe (no prototype pollution), but an author would never learn their key vanished. Our rule is "reject, don't silently fix", so we check the raw input first and report it. Same reasoning for text: bidi-override characters are rejected with a message, not stripped (this refines the threat model's original "stripped").
6. **One boundary, many doors.** The game validated nothing, and neither did the CLI, but they skipped validation in four separate places. Consolidating the loaders matters for authors: before this, a pack could pass `npm run content:validate` and still be rejected by the game.

**How we know the game didn't change**

- The full test suite passes (894 tests, up from 664).
- A fixed-seed audit report (5 scenarios × 20 runs × both bot policies, about 300 KB of JSON) is byte-identical between `main` and this branch. This matters because schema parsing rebuilds objects (key order can change). The engine's behavior did not.

**Still to do in M1:** manifest schema (`schema_version`, `kind`, URL rules, files per pack), pack-scoped resolution, structured reaction conditions, JSON Schema export, CSP header, and the hostile-pack fixture suite.

### M1.2: Manifest schema, pack kinds, and the license rule (2026-11-21)

**What changed**

- Manifests gain two required fields:
  - `schema_version` (integer, currently `1`)
  - `kind` (`standalone` or `extension`)

  The base manifest is `standalone`. The tutorial manifest is `extension` (it depends on base).
- `manifest_validator.ts` keeps its public API (`{ valid, errors: [{ field, message }] }`), so the loader, CLI, and tests did not change their calls. The hand-written checks were replaced by `validation/manifest_schema.ts`, which has the same strictness, limits, and messages as content files.
- New rules that span several fields (`manifestRuleIssues`):
  - A `standalone` pack has no dependencies. An `extension` has at least one.
  - **ADR 0004 is enforced:** a pack that depends on `base` must be `GPL-3.0-only` or `GPL-3.0-or-later`.
  - Every entry point (scenario, class, modifier, tutorial) must be listed in the pack's own inventory.
  - At most 2000 files per pack.
- New field rules:
  - Inventory entries must be versioned filenames built from safe ids, so `../../secrets-v1.json` is rejected.
  - `base_url` is a root-relative path without `..` or an `https://` URL.
  - Author and homepage URLs must be `https://`.
- Manifest reads are byte-capped (256 KB) like content reads.
- New policy constants live in `validation/pack_policy.ts`, each naming its ADR.

**Decisions made along the way**

1. **`schema_version` is checked before anything else.** A pack written for a newer format will contain fields this game has never seen. Strict validation would report each one as "unknown field", which is accurate but useless. A single message ("this pack uses pack format 2, but this version of DDDnD supports up to 1") tells the player what to do. Forward compatibility comes from the explicit version, not from tolerating unknown keys.
2. **`overlay` is not accepted yet.** The three kinds are designed, but only two have engine support. Accepting `overlay` before the overlay merge exists would mean loading a pack that does nothing. It will arrive with a schema bump.
3. **`kind` is required, not defaulted.** A default would be convenient, but the content philosophy is "explicit", and kind is part of what a player is told on the consent screen. The cost was adding two fields to five test fixtures. Expectations were unchanged.
4. **The authoring guide's own example was invalid under ADR 0004.** It depended on `base` and used MIT. Both copies of the guide (repo and public docs site) are fixed. A new test extracts the example manifest from each guide and validates it, so the docs can't drift again.

**How we know nothing broke:** all existing manifest tests pass unchanged against the new implementation, both first-party manifests validate, and the CLI validator passes for base and tutorial.

### M1.3: One owner per file, and scenarios see only their own pack (2026-11-21)

**What changed**

- `ContentPackRegistry` now records an owner for every inventory file:
  - **Registering a pack that claims a file another pack owns fails** (`ContentPackConflictError`). So does registering a second pack with the same id. Nothing is registered in that case.
  - **No fallback search.** Before, content that no pack listed was looked for in every pack, newest first. Now it is simply not found. Every file must be listed in its pack's inventory.
- New `createScopedProvider(packId)` and `createScenarioProvider(scenarioRef)`. A scenario's bundle resolves only from the pack that owns the scenario plus its transitive `depends_on`:
  - Content in a loaded but undeclared pack fails with `ContentOutOfScopeError`, which names the owning pack.
  - A missing or incompatible dependency fails with `ContentPackDependencyError`.
- Dependency versions use caret semantics: same major, at least the declared version.
- The game store builds every scenario bundle (lobby warm-up, run start, restoring a save) with the scenario's scoped provider. The game-wide merged provider is still used for things a player chooses across packs: the quest list, player classes, challenge modifiers.
- The run-lifecycle coordinator's `buildScenarioBundle` dependency no longer takes a provider, because choosing the provider is now the store's job.

**The design discussion**

The plan said "external packs may not override another pack's content", which suggests tracking which packs are first-party and which are community. Before building that, we checked the data: **the base and tutorial inventories share no files at all.** So the simpler rule holds for everyone, first-party included: *one file, one owner*. No origin flag, no special cases, and nothing a future code path could forget to set. A stricter invariant turned out to be cheaper than a conditional one.

Scope is a separate question from ownership. Ownership stops one pack *replacing* another's content. Scope stops a pack *depending on* content it never declared. Without scope, a community pack could quietly use another community pack's cards. It would work on the author's machine (where both are loaded) and break for players who only loaded one. Scope makes `depends_on` mean something.

Player classes and challenge modifiers are deliberately *not* scoped. They are run-setup choices that sit outside a scenario bundle. A base-pack class works with any scenario, because classes only affect presentation and a score affinity, which is ignored if the scenario doesn't track that score. Whether standalone packs should bring their own classes is a question for M3.

**Tests that changed, and why**

- "prefers later packs when multiple packs own the same challenge modifier ref" asserted the old override behavior. ADR 0001 removes that behavior on purpose, so the test now asserts the opposite: a second claim is refused and the registry is unchanged.
- "derives available outcome archetypes" had two fixture packs both owning `system_stabilizer-v1.json`. The second pack now owns only its own file. The expected result is identical.

**How we know nothing broke:** with the fallback removed, every first-party scenario and tutorial builds and validates under its own pack scope (new integration test). That proves the first-party inventories were already complete. The game store orchestration tests (start, restore, tutorials) pass unchanged.

### M1.4: Conditions become data, and the prose parser leaves the engine (2026-11-21)

**What changed**

- `StakeholderReactionRule.condition` (required) and `Event.trigger_condition` (optional) use the existing structured `NumericCondition` shape: `{ target_type, target_id, operator, value }`.
- `condition_description` and `trigger_condition_description` stay, but **only as text for people**. The schema requires `trigger_condition` whenever an event has the description.
- The engine evaluates only the structured fields. `parseConditionDescription` (a regex plus a fuzzy match of the left side against score/stakeholder ids *and display names*) is gone from the simulation.
- The bundle validator checks every rule and event condition: scores must be in `score_refs`, stakeholders must be in the scenario. Card requirements and failure conditions now get the stakeholder check too.
- All 42 first-party rule and conditional-event files gained a structured condition. This was a pure text insertion; the diff has no removed lines.
- The old parser lives on, unchanged, as `tests/content/support/legacy_condition_parser.ts`. A permanent test uses it to prove that every structured condition in every playable first-party scenario equals what its prose meant (over 100 rule/event checks).

**What we found before changing anything**

We ran the old parser over every rule in every scenario first. 33 of 36 rules resolved the same way everywhere. **Three rules resolved to a condition in some scenarios and to nothing in one.** In that scenario they silently never fired. That scenario was `test_scenario-v1`, which tracks neither `maintainability` nor `domain_clarity`. It turned out to be unplayable anyway: it already fails bundle validation for other untracked scores. So no player ever met the bug. But it is exactly the bug a community author *would* hit: rename "Domain clarity" to "Model clarity" in a workshop pack, and every rule that mentions it goes quiet with no error.

There was also a trap in the obvious fix. With structured conditions, a condition on a score the scenario does not track reads that score as 0. So "Maintainability < 45" would go from "never fires" to "always fires". The new bundle-validator check closes that: an untracked condition target is now an error, the same rule that already applied to card requirements.

**Why no content version bump**

CONTENT_VERSIONING.md says to bump when behavior changes. Here, behavior is provably identical: the equivalence test covers every playable scenario, and the fixed-seed audit report is still byte-identical to `main`. Adding the structured field makes an implicit rule explicit without changing it. That interpretation is now written into CONTENT_VERSIONING.md, so the next person doesn't have to re-derive it.

**Why require it instead of keeping a prose fallback**

A fallback ("use `condition` if present, otherwise parse the text") would have kept old-style files working. But no community packs exist yet, so this is the cheapest moment the format will ever have to become strict. And a fallback keeps the silent-failure mode alive for exactly the authors least able to debug it.

**The DDD angle (talk material)**

This is "make the implicit explicit" in its most literal form. The domain concept, *when a stakeholder reacts*, lived inside an English sentence, and the engine recovered it by guessing. The human description and the machine rule had been one string, so changing the wording changed the behavior. Now there are two fields, each with one job: the ubiquitous-language sentence for people and the model for the engine. The equivalence test keeps them in agreement for first-party content.

**Tests that changed, and why**

Test fixtures that build rules by hand gained a `condition` matching their prose (type change, no expectation changes). One fixture needed care: a turn-pipeline event with prose `"Team morale > 40"`. Without a matching `trigger_condition` it would have quietly become unconditional and changed what the test exercises. Two content tests that called the parser on rules now read `rule.condition`, with the same assertions.

### M1.5: Published JSON Schemas for authors (2026-11-21)

**What changed**

- `validation/json_schema_export.ts` generates JSON Schemas from the same Zod schemas the game validates with. `npm run content:schemas` writes them to `public/schema/v1/`, so they are served at `https://dddnd.app/schema/v1/<type>.schema.json`.
- The generated files are committed. A test regenerates them and fails on any difference, so the published contract can't drift from the validator.
- Authors may put `"$schema": "<url>"` at the top of any manifest or content file. The parser accepts and drops it before strict validation, because it is tooling metadata, not content.
- Both authoring guides gained an "Editor support" section (per-file `$schema`, or a `.vscode/settings.json` folder mapping).

**Decisions**

1. **Serve from the game's domain, not the docs site.** The docs site is on GitHub Pages under a project path. `dddnd.app` is the stable, owned domain, and `$id` URLs should outlive hosting changes. The path carries the pack format version (`/v1/`), so a future format can publish `/v2/` without breaking v1 authors.
2. **Commit the output, test for drift.** Generating at build time would hide changes to the published contract inside unrelated diffs. A committed file makes every contract change visible in review, which is what a published language needs.
3. **Be honest about what JSON Schema can't say.** Refinements such as "not blank", forbidden characters, license-by-dependency, and cross-file references don't translate. Each schema's `description` says so, and the guides tell authors to run the validator before publishing. The editor helps; the validator is the authority.
4. **The export stays out of the player bundle.** It is not re-exported from the validation barrel, so only the script and the test import it.

**DDD angle:** this is the *Published Language* from the context map (§4.3), made concrete. Until now the "pack schema" was a TypeScript type plus prose docs. Now it is a versioned, machine-readable contract at a stable URL, generated from the one model the engine trusts.

### M1.6: Content Security Policy and the rendering guard (2026-11-21)

**What changed**

- `netlify.toml` now sends a Content Security Policy on every page:

  ```
  default-src 'self'; script-src 'self';
  style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob:; connect-src 'self';
  object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  ```

  It also sends `X-Content-Type-Options: nosniff` and a `Referrer-Policy`. Published schemas under `/schema/*` get `Access-Control-Allow-Origin: *`, so browser-based editors (vscode.dev, github.dev) can fetch them.
- `tests/ui/no_markup_injection.test.ts` fails if any file uses `v-html`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, or `createContextualFragment`. There is one allow-listed exception, with its reason: the social links panel renders hard-coded SVG icons. The test also checks that the allow-list doesn't go stale.
- AGENT.md gains a non-negotiable rule: content is rendered as text, never as markup.

**How the policy was chosen**

We inventoried what the game actually loads instead of guessing:
- `index.html` has no inline scripts, and nothing in `src` uses `eval` or `new Function`.
- Fonts come from Google Fonts (a CSS `@import`).
- CSS backgrounds use `data:` SVG images.
- The result-card export draws an SVG `foreignObject` into a canvas through a `data:` image.

The policy allows exactly those and nothing else. There is no `'unsafe-inline'` and no `'unsafe-eval'`. `connect-src` is `'self'` for now. M2 adds the GitHub pack hosts from ADR 0003, and that will be the only change pack loading needs.

**How we verified it (a CSP is easy to get subtly wrong)**

Unit tests can't see a CSP, so we checked it in a real browser:
1. We served the production build (`npm run build`) from a small local server that sends the *exact* header string read from `netlify.toml`.
2. Headless Chrome (playwright-core, run from a scratch directory, not added to the project) recorded every `securitypolicyviolation` event and console error.
3. A scripted player then:
   - loaded the welcome page,
   - entered the lobby (all five quests, class selection, fonts and art rendered),
   - joined an adventure and played a complete run to the results screen,
   - exported the result card as a PNG (the riskiest path: canvas plus `data:` SVG),
   - and separately started the advanced tutorial.

**Result: zero CSP violations and zero console errors across all of it.** As a side effect, this was also the first end-to-end check of M1.1–M1.4 in a real browser: every quest and the tutorial loaded through the validated, pack-scoped pipeline.

**Checked again on real Netlify hosting (2026-11-22).** Before merging, the same browser checks ran against the PR's Netlify deploy preview: a full run with result-card export, the tutorial, and the flag-off `?pack=` check. Everything worked, and the real headers were confirmed: CSP, `nosniff`, `Referrer-Policy`, and CORS on `/schema/v1/`. The browser did report two violations the local check never showed: a blocked inline `style` attribute and a blocked frame from `app.netlify.com`. Comparing the served HTML with our build found the cause. On Deploy Preview URLs only, Netlify inserts a `<div style="position:fixed">` with a script that loads its collaboration toolbar in a frame. Production pages don't get that injection, so production is unaffected. The cost is that Netlify's preview toolbar doesn't load on previews. We chose not to widen the production policy for a preview-only tool. A local check would never have found this; testing on the real host did.

**Follow-ups noted:** Trusted Types (`require-trusted-types-for 'script'`) would turn the rendering guard into a browser-enforced rule. It needs the one `v-html` replaced with components first. Making the browser check a permanent CI job would need Playwright as a dev dependency, which is worth considering when M2 adds a real network path.

### M1.7: The hostile-pack suite (2026-11-21)

`tests/content/hostile_packs.test.ts` is the acceptance test for M1. It starts from a small, valid community `extension` pack (a facilitator's "Payments Monolith" built on base scores) and writes it to disk. It then runs it through the whole pipeline next to the real base pack: manifest validation → registry ownership → scoped provider → bundle build (bounded read and schema per file) → bundle validation.

The baseline passes. Then 17 variants each apply one attack or mistake, and each is stopped at the stage and with the message an author would need:

| Threat | Attack | Stopped at |
|---|---|---|
| T2 | `javascript:` author URL | manifest |
| T3 | inventory filename `../../../etc/passwd-v1.json` | manifest |
| T3 | `base_url` with `..` | manifest |
| T3 | content ref id `../../secrets` | bundle build (schema) |
| T4 | `"__proto__"` key in starting scores | bundle build (schema) |
| T4 | `constructor` as a score id | bundle build (schema) |
| T5 | `max_turns: 1000000000` | bundle build (schema) |
| T5 | `delta: 1e999` (parses to Infinity) | bundle build (schema) |
| T5 | 100 KB card file | bundle build (byte cap) |
| T6 | shipping its own `define_bounded_context-v1.json` | registry (ownership) |
| T6 | naming itself `base` | registry (pack id) |
| T7 | rule with only a prose condition | bundle build (schema) |
| T7 | condition on an untracked score | bundle validation |
| T7 | typo `stakehoder_changes` | bundle build (schema) |
| T14 | `schema_version: 2` | manifest |
| ADR 0004 | depends on base, licensed MIT | manifest |
| scope | uses base content without declaring `depends_on` | bundle build (scope) |

One case is deliberately different. **T1: a card named `<img src=x onerror=alert(1)>` passes validation.** Validation doesn't sanitize text, because there is nothing to sanitize: the text is never interpreted. The defense is that content is only ever rendered as text (the M1.6 rendering guard), with the CSP as a second wall. Rejecting angle brackets would be security theater, and it would also break legitimate content (`"Latency < 200ms"`).

---

### M1 summary: what "harden the content boundary" turned out to mean

Seven slices, each shipped with tests and a journal entry:

| Slice | Result |
|---|---|
| M1.1 | Every content file is validated by a strict, bounded schema; byte-capped reads; one loader shared by the game and every CLI script |
| M1.2 | Manifests: `schema_version`, `kind`, safe filenames and URLs, entry points in the inventory, the ADR 0004 license rule |
| M1.3 | One owner per content file; scenarios resolve only within their own pack and its dependencies |
| M1.4 | Conditions are structured data; the engine no longer parses English |
| M1.5 | Published JSON Schemas for editors, with a drift test |
| M1.6 | Content Security Policy and a rendering guard, verified in a real browser |
| M1.7 | Hostile-pack suite: 17 attacks stopped, 1 baseline passing |

What held throughout:
- **The base game did not change.** A fixed-seed audit report (5 scenarios × 20 runs × both bot policies) is byte-identical to `main` after every engine-touching slice.
- **Tests went from 664 to 946.** No test was changed just to make it pass. Every changed test was either a fixture gaining a new required field, or an assertion of the old override behavior that ADR 0001 removes on purpose. Each is listed in its slice's entry.
- **Bundle cost was +9.5 kB gzipped**, measured before choosing the API (ADR 0007).

What we learned that the plan did not predict:
1. "Use Zod, not Ajv, because of CSP" was half right: Zod needs `jitless` too.
2. Validation libraries make choices for you: Zod silently drops `__proto__` keys and ships no English messages in `zod/mini`. Both pushed us toward explicit, author-facing errors, which is what Pack Studio will need anyway.
3. Three reaction rules were silently dead in one scenario. Real data found it before any author did.
4. The first-party inventories didn't overlap at all, which made "one owner per file, for everyone" possible. That is a stricter and simpler rule than the planned "community packs can't override".
5. The docs had an example that broke the new rules. They are now tested.

**Next: M2**, where the game actually loads a pack: source allowlist, consent screen, pack manager, bundle-file import, pack identity in saves, the seeded cast (ADR 0002), and the demo pack.

---

### M2.0: Decisions before building the player path, and the feature gate (2026-11-21)

Two decisions from the project owner shaped M2 before any UI was written:

1. **One repository for several packs** ([ADR 0008](adr/0008-multi-pack-repository.md)). The owner asked whether demos and, later, "sanctioned" packs could share one public repo. M1's design already allows it: a pack is addressed by its manifest URL, and ADR 0003 only requires a pack to stay within its own repo prefix. So the layout is `packs/<pack_id>/manifest.json`, plus an `index.json` that seeds the future curated directory. One principle came out of the discussion: **"sanctioned" is a label, not a security boundary.** Trust affects discovery, never validation.
2. **Ship behind a build-time flag** ([ADR 0009](adr/0009-community-packs-behind-a-flag.md)). `VITE_ENABLE_COMMUNITY_PACKS=true` in a local `.env` turns the feature on; production leaves it unset. That lets M2 merge to `main` slice by slice without exposing anything on dddnd.app. A runtime flag (query string, like the existing play-stage switch) was rejected, because anyone could flip it in production, and this feature fetches third-party content.

The entry point is a small "Community packs" control in the lobby. Its final design is deliberately left for later.

**What this changed in the code:** `src/ui/config/feature_flags.ts` (`isCommunityPacksEnabled()`, true only for the exact string `"true"`), typed `import.meta.env`, `.env.example` documentation, and a test.

**Launch checklist** (kept here so turning the feature on is one reviewable change):
- [ ] Set `VITE_ENABLE_COMMUNITY_PACKS=true` in Netlify production
- [ ] Add `https://raw.githubusercontent.com` and `https://*.github.io` to `connect-src` in `netlify.toml`
- [ ] Re-run the headless CSP check (M1.6) with a remote pack loaded
- [ ] Public docs-site pages for players and authors are live
- [x] Demo pack published and pinned to a tag (`gilded_ledger-v1.0.0`)

### M2.1: The packs repository, the demo pack, and where trust lives (2026-11-21)

**Where "sanctioned" lives ([ADR 0010](adr/0010-sanctioned-list-lives-in-official-repo.md))**

ADR 0008 (written the same day) put an `index.json` with a `demo`/`sanctioned` status in the packs repository. The project owner caught the flaw right away: a trust label stored next to what it vouches for can be written by whoever writes that thing. ADR 0010 supersedes that one decision. The packs repository makes no trust claims. If DDDnD ever endorses packs, the list lives in the official repository, pinned to exact manifest URLs and reviewed like code. In DDD terms, endorsement belongs to the DDDnD context, not to the supplier context. It is a small example of ADRs working as intended: the decision changed within hours, and the record shows both the mistake and the correction.

**The packs repository ([mooeypoo/DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs))**

Created by the project owner and set up for many packs, not one:
- `packs/<pack_id>/`, each pack self-contained with its own README
- a README explaining what the repo is, how to load and add packs, the license, and credits
- GPL-3.0 `LICENSE`
- `.vscode/settings.json` mapping the published JSON Schemas onto pack folders
- a CI workflow that checks out DDDnD and runs its validator *with the balance audit* on every pack

The CI checks out a DDDnD ref set in one variable. It currently points at this feature branch and must move to `main` after merge.

**Two gaps the demo pack exposed in M1, fixed here**

1. **`base_url` had to be absolute for hosted packs.** That meant editing the manifest for every release tag, which defeats pinning. ADR 0003 always said `base_url` resolves relative to the manifest. The schema now accepts `"."` and `"./folder"` (never `..`). The one hostile-pack test that matched the old error wording was updated; the attack is still rejected at the same stage.
2. **The CLI validator couldn't check an extension pack.** It read one folder, so the base content an extension references was "missing". It now builds the same registry the game uses (one owner per file, pack-scoped resolution). `base` and `tutorial` come from the DDDnD checkout, and other dependencies come from `--dependency-root`. This one change is what lets the packs repo's CI work.

**The demo pack: The Gilded Ledger**

An `extension` pack about a fictional payments company with one monolith and an audit coming. It is deliberately mostly reuse:
- **From base, by reference:** all six scores, the CTO and Security Officer, 16 base cards, 6 base events, all outcome tiers and endings.
- **New:** 2 stakeholders with 4 reaction rules, 4 cards, 4 events, and 1 aftershock.

All new ids are prefixed `ledger_`, because content ids are global and the registry refuses collisions. That convention is now in the authoring guides.

**Balancing it was the best demo of the tooling so far.** The first draft *validated* fine and was still a bad game. The audit said why:

| Draft | What the audit / simulation showed | Change |
|---|---|---|
| 1 | 2 critical: the CTO declined on 87% of turns and ended at 6/100. All event weight negative. | The base CTO loses satisfaction every turn while clarity is below 35, and the draft started at 28. Start clarity at 36; drop a CTO penalty; add two positive events and a CTO-friendly card. |
| 2 | Criticals gone, but the stakeholder list included **`vp_product`**, who isn't in the scenario. The win rate was 12.5% (base scenarios: 67–72%), budget averaged −5.6. | Swapped out a reused base event that targets `vp_product`; added budget and morale relief cards from base; softened the new cards' costs. |
| 3 | 0 findings, win rate 47% | Starting budget 66 → 72 |
| 4 | **0 critical, 0 warnings**, success 48.5% / partial 37.5% / failure 14% | Done. Deliberately a little harder than base: an audit deadline should feel tight. |

The base comparison came from running base scenarios through the same harness. That turned "is 12.5% too hard?" from a gut call into a comparison.

**A finding: phantom stakeholders**

`apply_stakeholder_changes` creates a stakeholder entry for *any* id a card, event, aftershock, or rule names, even one who isn't at the table. That phantom then counts toward the end-of-run archetype metrics, and could even be picked as a stage actor. The demo hit it by reusing base content, which is exactly what extension packs are for. A scan of first-party content found one existing case: `automate_deployment_pipeline` targets `vp_product` in `microservice_sprawl-v2`. Fixing it changes that scenario's behavior, so it needs a new content version and then a validator error. It is logged for M3, and the guides tell authors how to avoid it meanwhile. The demo pack's fixture test asserts it has no phantom targets.

**Tests:** the demo pack is copied to `tests/content/fixtures/packs/gilded_ledger`, so CI never needs the network. A test builds it next to the real base pack and asserts zero bundle errors and no phantom stakeholder targets.

### M2.2: How pack authors validate, and how packs are versioned (2026-11-22)

**"Do authors need our tests?"**

The project owner asked whether pack authors would need a pack of DDDnD's tests, or instructions for including them. Answering it separated two things that are easy to blur:
- DDDnD's test suite and hostile-pack fixtures test **the engine**.
- Authors need **the validator applied to their pack**.

So the question became how to give authors the validator. There were three options:
- each author copies a workflow,
- a reusable GitHub workflow published from DDDnD,
- an npm CLI.

The reusable workflow won ([ADR 0011](adr/0011-reusable-pack-validation-workflow.md)). The npm CLI is not planned unless authoring sees real use.

**What changed**

- `.github/workflows/validate-pack.yml` in DDDnD (`workflow_call`). Inputs: `dddnd-ref`, `packs` (globs), `dependency-roots`, `audit-runs`, `fail-on-audit-critical`. A pack repo needs about 5 lines to use it.
- DDDnD-packs now uses it, replacing its copied 40-line workflow.
- Both authoring guides have a "Continuous validation" section.

**A payoff of the architecture**

The workflow installs only DDDnD's *runtime* dependencies (about 50 MB) plus the exact `tsx` version from DDDnD's lockfile, instead of the whole game toolchain. That works only because the validator imports the content and simulation domains and never the UI, which is the AGENT.md boundary rule doing practical work years after it was written.

**How it was verified**

GitHub Actions can't run locally, so we reproduced the job's checkout layout in a scratch folder (a fresh clone of this branch with the lean install, plus a copy of DDDnD-packs) and ran the step's actual script. The demo pack passed. Then a copy of the pack with `max_turns: 999` was added: the job exited 1 with `max_turns: must be at most 50`, and still checked the valid pack after it.

**Confirmed on GitHub (2026-11-22):** the first push of DDDnD-packs ran the reusable workflow for real. All steps passed, and the demo pack was validated and audited with 0 critical findings and 0 warnings.

**Versioning decisions (agreed with the project owner)**

- **Pack releases are tagged per pack:** `<pack_id>-v<version>`, for example `gilded_ledger-v1.0.0`, matching the manifest's `version`. A repo-wide `v1.0.0` becomes ambiguous once a second pack releases on its own schedule. The load URL is `…/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json`.
- **Timing:** the first tag waits until this PR is merged and the packs CI points at released DDDnD rules, so the first tagged release is validated against what players will run.
- **The validator gets a moving major tag, `pack-validator-v1`,** published at release and moved forward only for compatible changes.

**Also done:** the GPL-3.0 `LICENSE` file was added to DDDnD's root on `main` (it had been declared in `package.json` and manifests, but the file was missing). DDDnD-packs has its own.

**Release checklist additions:**
- [x] After merge: tag DDDnD `pack-validator-v1`, and switch the DDDnD-packs workflow refs to it (done 2026-11-22)
- [x] Tag DDDnD-packs `gilded_ledger-v1.0.0` once its CI is green against the released validator (done 2026-11-22)

### M2.3: Where packs may come from, and loading one into memory (2026-11-22)

**What changed**

- `pack_source_policy.ts` (ADR 0003 as code):
  - `checkPackSourceUrl` allows only `https://raw.githubusercontent.com/<owner>/<repo>/<ref>/…/manifest.json` and `https://<owner>.github.io/…/manifest.json`. It refuses ports, credentials, query strings, `.`/`..` segments, and lookalike hosts (`github.io.evil.example`, `raw.githubusercontent.com.evil.example`).
  - It also classifies how the URL is pinned: a full commit SHA, a release-tag-looking ref, or `unpinned` (branches, and every GitHub Pages URL). The consent screen will show this.
  - `resolvePackContentBase` resolves `base_url` against the manifest and keeps it inside the same origin, and on GitHub raw inside the same owner/repo/ref.
- `PackSnapshot` (model) and `pack_snapshot_builder.ts`. A snapshot is a whole pack held in memory:
  - the manifest,
  - every validated entity,
  - the origin,
  - a `sha256:` content hash over the manifest and files exactly as published.

  The builder collects *every* problem (missing files, unlisted extra files, size limits, schema errors with field paths, filename/id mismatches) before failing, so an author sees the full list at once. `createSnapshotContentProvider` serves a snapshot to the registry like any other pack.
- `remote_pack_loader.ts`: policy check → manifest (no redirects, no credentials, byte-capped) → content base → every inventory file, six at a time, byte-capped → snapshot.
- A new limit: 4 MB per whole pack.

**The design decision: fetch everything up front**

The game's first-party loader fetches files lazily as a scenario needs them. For community packs we fetch the whole inventory at load time instead, into one in-memory snapshot. The extra up-front cost buys a lot:

1. **One shape for every way a pack arrives.** A GitHub URL, an imported file, and a cached copy all become a snapshot through the same validation. The next steps (file import, local cache) reuse the builder unchanged.
2. **Every file is validated before the consent screen**, not only the files one scenario happens to reach. A broken card in an unplayed scenario is still reported.
3. **The content hash is exact and free**, because we already hold every byte.
4. **After loading, nothing is fetched**, so a pack can't change mid-run and the host sees one visit per load, not one per turn (threat T9, privacy).

**Verification**

- Unit tests run the real demo-pack fixture through a fake GitHub: load, hash stability, registering next to the real base pack and building a valid bundle. Each refusal is tested too (disallowed URL with zero fetches, a redirect, a missing file, invalid files reported with paths, a `base_url` escaping its tag, smuggled unlisted files).
- A live check loaded the demo pack from real GitHub (the copy committed in this branch, pinned to the pushed commit SHA): 16 files in about 0.6 s, pinning detected as `commit`. The same path on `main` produced a clear `HTTP 404` message.

Browser behavior (CORS and the real `redirect: 'error'`) gets its own check in the end-to-end step, with the CSP widened only on that branch's preview, per ADR 0009.

### M2.4: Single-file packs, and what a pack's identity is (2026-11-22)

**What changed**

- `pack_bundle_file.ts`: the `.dddnd-pack.json` format (`format`, `format_version`, `manifest`, `files`).
  - `readPackBundle` turns a file into a snapshot through the *same* builder as remote loading.
  - `writePackBundle` turns a snapshot back into a file.
  - A newer `format_version` gets a "needs a newer DDDnD" message.
- `npm run content:bundle -- --content-root <pack folder>` writes a validated bundle for authors and releases.
- **The content hash became canonical.** Each file is hashed as its parsed JSON with keys sorted at every level, no whitespace, and no top-level `$schema` link.

**Why the hash changed after M2.3**

M2.3 hashed files exactly as published. That is "exact" in the wrong way. The same pack loaded from GitHub and from a bundle would get *different* hashes, because a bundle re-serializes the JSON, and the schema parser even reorders keys. A save made with the file version would then look like it belonged to a different pack.

The question was what identity should mean. The answer: **a pack's identity is its content, not its bytes.** Reformatting, reordering keys, or adding an editor `$schema` link doesn't change what a player plays, so it shouldn't change identity. Any change to a value does. The tests pin both halves, and a round-trip test proves a URL-loaded pack written to a bundle and read back keeps its hash.

**Verified against reality:** the demo bundle built from the DDDnD-packs folder and the copy loaded live from GitHub produced the identical hash, `sha256:90fae984…ea078`.

### M2.5: Adding a community pack in the game (2026-11-22)

Behind the `VITE_ENABLE_COMMUNITY_PACKS` flag (ADR 0009).

**What a player sees**

1. **The lobby header gains a small "Community packs" link.** It opens a dialog where the player pastes a GitHub link to a pack's `manifest.json` or picks a `.dddnd-pack.json` file.
2. **The game downloads and checks the pack *before* showing anything to accept.** If it is broken, the player sees the problems grouped by stage, up to 12 of them (the author can see all of them with the validator).
3. **The confirmation screen** shows:
   - a standing note: "Not made or checked by DDDnD. Packs can't run code: they only change the game's text and numbers."
   - name, version, and description
   - authors, with each link's hostname next to it
   - what kind of pack it is ("Builds on DDDnD's base pack")
   - the license
   - **where it comes from**, in plain words: pinned to a commit ("This exact content can't change"), to a release, or *not pinned* ("The author can change this content at any time"), the last shown in warning color
   - a short content fingerprint
   - the scenarios it adds
   - a privacy note for downloads ("GitHub can see your IP address, as any website can. Once added, nothing more is downloaded")
4. **On "Add this pack"**, its scenarios appear in the lobby with a **Community** badge, the briefing names the pack, and during play a "Community pack · <name>" label sits under the scenario title.
5. **Packs last for this visit only**; the dialog says so. Keeping them across reloads is the next step.

**`?pack=<url>` links** open the dialog with the link filled in, but never download by themselves. Fetching tells GitHub the player's IP address, so the player decides. With the flag off, the link does nothing at all.

**How it's built (and where the boundaries are)**

- **Domain:** `checkPackPlayable` registers the candidate next to the packs it will be played with, then builds and validates every one of its scenarios. File-level validation can't see cross-pack problems (ownership conflicts, missing dependencies, untracked scores), so this runs *before* the consent screen. A player is never offered a pack that would fail when they sit down.
- **Store adapter:**
  - It caches first-party manifests separately from the registry, so adding a pack rebuilds the registry without refetching.
  - `checkCommunityPack` is a dry run that changes nothing.
  - `addCommunityPack` re-checks, then adds.
  - `removeCommunityPack` cascades to packs that depend on the removed one.
  - Quests from community packs get a `communityPack` label.
- **UI:**
  - `community_pack_review.ts` is a pure view model. All the wording lives there and is unit-tested.
  - `use_community_packs.ts` is the load → check → review → confirm flow.
  - `community_packs_dialog.vue` renders it with the existing modal and button components.

  All pack text is rendered as text (the M1.6 guard still passes).

**Verification**

- **Unit tests** cover the adapter with the real registry, base pack, and demo fixture: accept, refuse an impostor without side effects, refuse a scenario that would fail, cascade removal. They also cover the review wording for each origin, and the flow: nothing is added before confirm, declining adds nothing, error stages, issue capping, file import.
- **Headless Chrome against the dev server with the flag on and real GitHub:** opened the dialog, pasted a commit-pinned link to the demo pack, read the confirmation screen (same fingerprint as the CLI, `90fae984cfca`), added it, found "The Gilded Ledger" in the lobby marked Community, joined, and played with a hand mixing base cards (Introduce Anti-Corruption Layer) and pack cards (Add a Transactional Outbox). Zero console errors.
- **Production build with the flag off,** served with the production CSP: no lobby link, a `?pack=` link opens nothing, **zero requests to GitHub**, zero CSP violations.

**Two small things the browser test taught us**

- `File.text()` is missing in some older browsers (and in jsdom). File reading falls back to `FileReader`.
- A community quest has no difficulty plate, because the difficulty table only knows first-party scenarios. The Community badge takes its place. Fine for now; worth revisiting with the lobby design.

---

### Release point: PR #34 merged (2026-11-22)

PR #34 (M1 plus M2.0–M2.5) was merged to `main`. In production, the community-pack UI stays off (ADR 0009). The hardened content boundary, the CSP, and the published schemas are live.

**Before merging**, the browser checks were run once more against the PR's Netlify deploy preview, which is how the preview-only toolbar injection was found (recorded under M1.6).

**After merging:**
1. DDDnD was tagged `pack-validator-v1` at the merge commit. This is the moving major tag from ADR 0011.
2. DDDnD-packs' CI was switched from the feature branch to that tag. Its run passed, so the published contract works for a real consumer.
3. DDDnD-packs was tagged `gilded_ledger-v1.0.0`, the first per-pack release tag. A live load from `https://raw.githubusercontent.com/mooeypoo/DDDnD-packs/gilded_ledger-v1.0.0/packs/gilded_ledger/manifest.json` succeeded: 16 files, pinning recognized as a release, and the same content hash as every earlier load (`sha256:90fae984…`).

The rest of M2 continues in a follow-up PR: pack identity in saves, local snapshots, the seeded cast, docs-site pages, and the end-to-end check.

### M2.6: Packs and saved runs survive a reload (2026-11-22)

Behind the flag (ADR 0009). With the flag off, the pack store is never opened.

**What changed**

- **Runs know their pack.** `RunMeta.content_pack` records `{ id, version, origin, content_hash?, source_url? }` when a run starts. First-party runs get `origin: "first_party"`; community runs also get the content hash and, for GitHub packs, the manifest URL. The simulation never reads it: it is identity, not behavior.
  - Save files carry it automatically, because they store the whole game state and normalization spreads `meta`.
  - Exact-run exports also summarize it in `seed_info.content_pack`.
  - Persistence validation rejects malformed identities (for example, a hash that isn't `sha256:` plus 64 hex characters).
  - Fun fact: `meta.content_pack_version` already existed in saves and exports but was never set. The schema had anticipated pack identity long before anything needed it.
- **Added packs are kept on the device** (`community_pack_store.ts`, a persistence adapter next to the existing localStorage save adapter).
  - It uses IndexedDB, keyed by pack id (one version per pack).
  - What's stored is the pack's `.dddnd-pack.json` text, **re-validated on every load** with that day's rules and that day's loaded packs. A pack that no longer passes is left out, and the dialog says why.
  - Without IndexedDB (some private modes, blocked storage), a memory store is used, and the dialog says packs last only until the page closes.
- **Stored packs are restored inside content loading,** before anything else. A saved run is restored by the router before any lobby code runs, so the restore has to happen as part of the content load, not in a view.
- **Saved runs are never deleted because their pack is missing.** Before, any restore failure called `reset()`, which deletes the save. Now, if a community run's pack isn't loaded, or a different version (different hash) is, the save is kept and `savedRunPackNotice` explains it. The lobby checks the save when it opens (without restoring it), opens the Community packs dialog with the explanation, and fills in the pack's original link so it can be re-added in one click.

**Decisions**

1. **One version per pack id.** *(Refined in M2.7 / [ADR 0012](adr/0012-pack-identity-from-source.md): one version per pack **key**, and one pack per id loaded at a time.)* Adding a new version replaces the old one. A saved run resumes only with the *exact* content it was played with (same hash). Otherwise it is kept and explained. Supporting two versions of a pack side by side would need two packs with the same id in the registry, which ADR 0001 forbids for good reasons. Known limitation, accepted for MVP.
2. **Store text, not objects, and re-validate on load.** Storing parsed objects would trust whatever was written under an older validator. Storing the bundle text and running it back through `readPackBundle` means stricter future rules apply to old packs too.
3. **Storage failures never block play.** If a pack can't be kept, it is still added for the visit, and the "Added" message says it won't survive closing the page.

**Two bugs the real browser found (and the unit tests didn't)**

1. **IndexedDB can't store Vue reactive proxies.** The candidate snapshot passes through a `ref`, so `origin` was a Proxy, and IndexedDB threw `DataCloneError`. Worse, the pack had already been added to the session, so the dialog said "couldn't be added" while it was in play.
   - **Fix:** write plain copies, and add to the session regardless of storage.
   - **Prevention:** the in-memory store used by tests now uses `structuredClone` like IndexedDB does, and a regression test adds a `reactive()` snapshot. We confirmed it fails with the same `DataCloneError` when the fix is removed.
2. **A write isn't durable when the request succeeds, only when the transaction commits.** The first store resolved writes on request success. In the scripted scenario, adding a pack and immediately navigating away left IndexedDB empty. The store now resolves writes on `transaction.oncomplete`.

   This one was found *because of* a mistake in the test script. The dialog has two `role="status"` regions; the script waited for the wrong one and navigated away mid-add. That accidental "player leaves immediately" turned out to be a real scenario.

**Verification**

- **Unit tests:**
  - identity validation;
  - save and exact-run round trips with a community identity;
  - a malformed identity rejected;
  - a pack restored on the "next visit" (a fresh adapter on the same store) with origin and hash intact;
  - `describeScenarioPack` for community and first-party scenarios;
  - a tampered stored pack left out and reported;
  - removal deleting the stored copy;
  - the reactive-proxy regression.
- **Headless Chrome against the dev server, real GitHub, real IndexedDB:**
  1. Add the demo from its release tag. The dialog says "Kept on this device".
  2. Reload: the pack is still in the lobby.
  3. Start the community scenario and play two turns. The save carries the full identity (`sha256:90fae984…`, the tag URL). Reload mid-run: the run resumes with its Community label.
  4. Remove the pack and go to `/game`: redirected home, **save kept**. Open the lobby: the dialog opens by itself with the explanation and the original link filled in.
  5. Re-add the pack and go to `/game`: the run resumes.

  Run three times in a row with zero console errors.


### M2.7: A pack's name is not its identity (2026-11-22)

Behind the flag (ADR 0009). Decision recorded in [ADR 0012](adr/0012-pack-identity-from-source.md).

**How it came up**

Reviewing M2.6, the project owner asked what stops two remote packs with the same name from overriding each other. Nothing did. Stored packs and saved runs were keyed by the manifest `id`, and any author can call their pack `gilded_ledger`. The content hash would have stopped a wrong run from resuming, but the player would have been told "a different version", and the first pack would have been silently replaced on the device.

This is a textbook DDD confusion between an **attribute** and an **identity**. The manifest id is something the pack *says about itself*. Identity has to come from something the author can't freely choose to collide with: here, the place the pack is published. It's the same shape as ADR 0010 ("a pack can't vouch for itself"), and it puts the authority in the Distribution and Trust context, which owns the source policy.

**What changed**

- **`pack_identity.ts`** (content domain) derives a **pack key**:
  - `dddnd:base`
  - `github:<owner>/<repo>/<folder>`
  - `github-pages:<owner>/<folder>`
  - `file:sha256:…`

  The source policy now also reports `pack_dir`, the folder holding `manifest.json`.
- **The ref is not in the key,** so `gilded_ledger-v1.0.0`, `-v1.1.0`, `main` and a commit SHA are the same pack. The content hash still pins the exact content.
- **Owner and repo are lowercased; folders aren't.** That follows GitHub's own case rules.
- **A file's key is its content hash,** so a file can never take over a GitHub pack's identity.
- **Saves:** `RunContentPack.key` is required. A save is matched by key, then by hash.
- **Storage:** IndexedDB version 2 is keyed by `pack_key`. Version 1 only ever existed in dev builds, so its store is dropped on upgrade. On restore, the key is recomputed from the stored origin and content and compared with the stored one. A mismatch is left out and reported ("doesn't match where it says it came from").
- **Replacing is explicit.** The registry still holds one pack per manifest id, so a pack with a taken id replaces the loaded one. The review now says so before confirming, in three tones:
  - another version of the same pack (calm): "Replaces the version you added before (v1.0.0)."
  - the same content from somewhere else (caution): "The same content is already added from …"
  - a different pack with the same name (caution, `role="alert"`): who, from where, and "adding this one removes it".

  Replaced packs are also removed from storage, or they'd come back next visit beside the new one.
- **The saved-run notice has a third case.** Besides `missing` and `different_version`, there is now `different_source`: "the pack added now with that name was loaded from somewhere else, and saved runs only continue with the pack they were played with". The matching moved from the store into the content adapter (`whyRunPackUnavailable`), where it can be unit-tested.

**Decisions and trade-offs**

1. **Readable key, not a URL hash.** The first idea in review was "some hash of the URL". A hash of the full URL would include the ref, making every release a different pack and stranding saved runs on update. A readable key without the ref keeps updates working, and is legible in a save file or an export.
2. **Strict about provenance.** The same bytes from GitHub and from a file are two packs. We considered letting a matching content hash resume a run regardless of key: it would be safe for determinism, but it blurs "which pack is this", and the case is rare. We kept it strict, and worded the review gently for it.
3. **Moving a pack changes its identity.** Renaming the repo, moving the folder, or transferring ownership makes a new pack. That's the price of identity-by-location without a central registry. The authoring guides now warn authors.
4. **`depends_on` still uses ids.** That's fine while dependencies are first-party (`base`, `tutorial`), whose ids the registry protects: a community pack named `base` is refused outright. *(Not fine enough: tightened into a rule in M2.8 / ADR 0013.)*

**Verification**

- **Unit tests** (+17, 1022 total):
  - key derivation, including every ref form mapping to one key, case rules, and same-named packs from other owners, repos, folders or Pages getting distinct keys;
  - files keyed by content, and a tampered remote origin refused;
  - the key shape check;
  - a same-named pack reported as a non-same-pack replacement;
  - adding it replaces the first in memory *and* storage;
  - two versions of one pack stored as one entry;
  - all three saved-run reasons;
  - a file stored under a GitHub key refused on restore;
  - a key now required in saves;
  - the three review wordings.
- **Headless Chrome, real GitHub, real IndexedDB:**
  0. Seed a version-1 database like an old dev build left behind.
  1. Add the demo from its tag. The database is version 2, keyed by `pack_key`, holding `github:mooeypoo/dddnd-packs/packs/gilded_ledger`, and the old entry is gone.
  2. Play two turns. The save carries the key.
  3. Add the same pack from its `.dddnd-pack.json` file. The review warns "The same content is already added from raw.githubusercontent.com/…". Confirm: storage holds only `file:sha256:90fae984…`.
  4. Open `/game`: the save is kept, and the lobby explains the pack was loaded from somewhere else, with the original link prefilled.
  5. Re-add from the link (the review warns about replacing the file copy). The run resumes with its Community label.

  The only console error was Chrome's favicon request on the raw JSON page the script used to seed the old database, not the game.


### M2.8: Dependencies must name a pack we can vouch for (2026-11-22)

Behind the flag (ADR 0009). Decision recorded in [ADR 0013](adr/0013-community-packs-depend-only-on-first-party.md).

**How it came up**

M2.7 left `depends_on` keyed by manifest id, and called it "fine while dependencies are first-party". The project owner didn't accept the hedge: without a central registry, nobody approves names or tracks duplicates, so an id can't decide *which pack* gets used. A dependency decides exactly that. If C depends on `alice_core`, any `alice_core` satisfies it, and C's scenarios run on someone else's content.

They also asked whether always-unique ids would mitigate T15. The honest answer had three parts:

1. **Storage and saves:** already closed by the pack key (M2.7).
2. **Dependencies:** this was the open hole. It closes once a dependency can only name something whose identity can't be faked.
3. **Look-alikes:** no id rule fixes these. A pack can copy another's title and write any author name. The only defense is to show the one fact it can't fake: who published it.

"Always unique" can't be enforced on a name the author chooses, so uniqueness must come from something they can't choose. For dependencies today, the simplest such thing is "ships with DDDnD".

**What changed**

- **`communityManifestIssues`** in `pack_identity.ts` refuses two things:
  - a `depends_on` naming anything but `base` or `tutorial` (`FIRST_PARTY_PACK_IDS` in `pack_policy.ts`);
  - a community pack using one of those ids.
- **It is enforced in `parseManifestText`,** which every community pack passes through (URL, file, bundle script), before any content is fetched.
- **The author CLI applies the same function** to any pack that isn't one of ours, validated from our own folder. So the reusable workflow catches it in the author's CI, with the same message the game would give. `--dependency-root` / `dependency-roots` stay (the workflow input is published in `pack-validator-v1`), and now only stand in for a first-party pack.
- **The removal cascade is deleted.** It removed community packs that depended on the removed one. Nothing can depend on a community pack now, so that was dead code. It is deleted rather than left looking meaningful.
- **The review shows the publisher.**
  - A new "Published by" row comes first: "mooeypoo on GitHub (mooeypoo/DDDnD-packs)", taken from the URL. For a file it shows "unknown (loaded from a file)".
  - It carries the note "The account it was loaded from. Names below are written by the pack itself."
  - "Made by" became "Credits".
  - The added-packs list shows the publisher instead of the pinning label.

**Decisions and trade-offs**

1. **Restrict now, generalize later.** Key-based dependencies (`"pack": "github:alice/packs/core"`) are the general answer. But they change the published format, and they raise open questions: version ranges across sources, file-loaded dependencies, and how id-scoped registry resolution maps to keys. Nobody needs them yet. The restriction is reversible, and the general form fits in a later `schema_version`.
2. **Show provenance rather than police names.** We considered refusing look-alike titles. There is no reliable way to tell "similar" from "same theme", and refusing would invite name-squatting games. Showing the publisher next to the credits lets the player compare a claim with a fact.
3. **A stricter validator under the same tag.** In principle, a pack that passed `pack-validator-v1` could now fail. In practice, no such pack exists, and the game itself refuses it. A validator that passes packs the game refuses is worse than a stricter one.

**DDD note (talk material)**

This is about where trust may come from inside a model. An attribute (the id) is fine for *referring* to something inside a boundary you control: the registry within one session, or our own first-party packs. It is not fine for *choosing* something across a boundary you don't control. A dependency crosses that boundary, so it must refer to something the trusted side owns. M2.7 and M2.8 are the same lesson applied twice, and the second time it took a reviewer to see it.

**Verification**

- **Unit tests** (+6, 1028 total):
  - first-party dependencies allowed;
  - a community dependency refused, with the reason;
  - first-party ids refused;
  - both rules enforced on a real pack read (`PackLoadError` at the manifest stage);
  - the publisher shown for GitHub raw and Pages, and "Unknown" for a file even when its credits name a real person;
  - removal no longer cascading.
- **CLI:**
  - the demo pack, `base`, and `tutorial` still pass;
  - a copy of the demo depending on `alice_core` is refused with exit code 1 and the same message the game gives.
- **Headless Chrome:** the review shows "Published by" for a GitHub pack and "Unknown" for a file; the added list shows the publisher.

### M2.9: Packs are known only by their key, and their worst case is text (2026-11-22)

Behind the flag (ADR 0009). Decision recorded in [ADR 0014](adr/0014-pack-keys-everywhere.md).

**How it came up**

After M2.8, the project owner restated the goal more sharply than the code met it. Names may repeat; the identity the *system* uses must be unique and come from details that can't be duplicated. Players can see two packs called `gilded_ledger`, with where each comes from, but the game must never mix them up.

An audit showed where we stood:

- **Saves, storage and dependencies** already used keys.
- **The running session did not.** The registry was keyed by manifest id, content files belonged to "the pack with that id", and the lobby picked scenarios by `(id, version)`. It was safe only because of the M2.7 rule that kept one pack per name loaded, so correctness rested on an invariant rather than on identity.

The owner also set the primary rule: even repo-jacking or a pretender pack must never be able to *do* anything to the player. Seeing unwanted text is the worst acceptable case.

And they asked about "content-id squatting", which I had listed as a minor risk. Today a content file belongs to whichever pack listed it first, so a pack that copies your card ids blocks yours from loading. The answer was the same move one level down: content belongs to its pack's key, not to a global space.

**What changed**

- **Registry (content domain).**
  - Packs are registered and found by key; `registerPack(manifest, provider, key)` returns the key, and unkeyed packs are first-party (`dddnd:<id>`).
  - Each pack keeps its own file set. Two packs may list the same file unless one depends on the other, or both are first-party.
  - Scope resolution walks dependencies to `dddnd:<id>`, so a community pack named `base` can't satisfy a dependency even if it gets past the boundary checks.
  - `getAvailableScenarios` and `getAvailableTutorials` return `{ pack_key, ref }`.
  - The merged provider is gone. `createGameWideProvider` (first-party only) serves player classes and challenge modifiers, and `createScopedProvider(key)` serves everything else.
  - `findOwnerPackId` and `createScenarioProvider` are gone: nothing asks "who owns this scenario id?" any more.
- **Boundary.** `communityManifestIssues` also refuses community `classes` and `challenge_modifiers`. They are game-wide choices, and the demo has none.
- **UI.**
  - `QuestDisplayModel.packKey`, with `questKey` and `isSameQuest` for comparing quests.
  - `RunSetupOptions.pack_key`, and a bundle cache keyed by `packKey|id-vN`.
  - Restoring a save uses `meta.content_pack.key`. Saves from before pack identity are always first-party, so they fall back to the first-party pack that lists the scenario.
  - Quest cards are loaded per pack with that pack's scoped provider.
  - Adding a pack replaces only the same key. The review names same-named packs from elsewhere: "You also have another pack called …, published by …. Both stay added."
  - Removal is by key.
- **The publisher everywhere.** It is shown on the lobby badge tooltip, the table line ("Community pack: … · published by …"), and the in-game label, in addition to the review and the list. For a file it reads "unknown (loaded from a file)".
- **Warnings.**
  - The review banner now reads "From a source DDDnD hasn't reviewed: `<publisher>`. Packs can't run code or reach your device … The worst a pack can do is show you text you didn't expect."
  - Pack-supplied links (author, homepage) have a tooltip and a visible note: "The links above come from the pack and lead to sites DDDnD doesn't know. Use caution."
- **Rules written down.** AGENT.md has a new primary rule section, ARCHITECTURE.md lists the identity and worst-case rules, and the threat model updates T1, T8 and T15, adds T16 (squatting, closed), and adds the non-goal "a compromised official repository".

**Decisions and trade-offs**

1. **No filtering of URLs or HTML in text.** The owner's call: once nothing is rendered as markup and nothing is clickable, a URL or `mailto:` in text is visible and inert. Filtering would mostly block ordinary sentences ("the site example.com just died").
2. **Plain text only, no formatting.** If emphasis is ever added, it has to come from our own tiny parser that builds elements, never HTML and never links.
3. **Author and homepage links stay,** with a visible caution, so authors can be credited.
4. **Repo-jacking is accepted as text-only damage.** The key names a location, and a location can change hands. The primary rule bounds the harm, saves still pin the content hash, and the banner always says the source isn't reviewed. Closing it fully would need GitHub's numeric repository ids, which only the API provides.
5. **Same content from two places is two packs.** For example, the demo added from GitHub and from its file both appear, with different publishers. That's the principle applied consistently.

**DDD note (talk material)**

M2.7 to M2.9 is one lesson at three depths: what persists, what depends, and what runs. In each place, a name the outside world chose had been quietly doing an identity's job. The fix was the same each time: the identity comes from the context that owns the trust (where a pack is published), and names go back to being labels for people. Squatting was the tell that content ids had the same problem as pack ids.

**Verification**

- **Unit tests** (+7 net, 1035 total):
  - registry: two same-named packs with identical content ids registered side by side, each resolving only its own content; a duplicate key refused; shadowing a dependency's file still refused; a community pack calling itself `base` can't satisfy a dependency; game-wide classes from first-party only;
  - adapter: two `gilded_ledger`s added side by side and stored under both keys; each key resolves its own scenario text; removing one keeps the other; a newer version of the same key replaces it;
  - boundary: community classes and challenge modifiers refused;
  - review: the "replaces" and "both stay" notes.
  - Tests that encoded the old one-pack-per-name behavior were rewritten rather than kept: replacement by name no longer exists. Everything else moved to the key-based APIs.
- **Determinism:** a fixed-seed audit report is identical to `main`, so first-party bundles resolve exactly as before.
- **Headless Chrome, real GitHub, real IndexedDB:**
  1. Add the demo from its tag, then from its file. The review says "You also have another pack called … published by mooeypoo on GitHub … Both stay added". Storage holds both keys.
  2. The lobby shows two Gilded Ledger quests, badged "published by mooeypoo on GitHub (mooeypoo/DDDnD-packs)" and "published by unknown (loaded from a file)".
  3. Play the file copy. The save carries `file:sha256:90fae984…`, and the play label names the publisher.
  4. Reload mid-run: the run resumes with the same pack.
  5. Remove the GitHub copy: storage keeps only the file key, and `/game` still resumes the run.

  No console errors.

### M2.10: A run's cast, decided once (2026-11-22)

Implements [ADR 0002](adr/0002-presentation-cast-decoupled-from-content.md). This change is not behind the flag: it changes how the base game looks too, which was the point. Three bugs from §3.4 get fixed here.

**What changed**

- **One cast function.** `buildRunCast(seed, stakeholderIds)` in `gameplay_stage_presentation.ts`:
  - it shuffles the avatar-role pool with its own seeded generator (salt `dddnd:presentation-cast:v1` plus the run seed);
  - it deals roles in sorted stakeholder-id order.

  Play, the legacy game view, the end-of-run screen and the share card all call it. The old `shuffleAvatarRoles()` (`Math.random()`) and `resolveStakeholderAvatarRole(id)` (id hash, unshuffled pool) are gone.
- **The three defects:**
  1. **Duplicates.** `hash(id) % pool` could give two stakeholders the same role: `ab` and `ba` always collided. Roles are now dealt, not hashed, so they are distinct up to the pool size of 9. Validation caps a scenario at 8 stakeholders.
  2. **Screens disagreed.** The results screen and the share card used the unshuffled pool. They now build the same cast from the same seed.
  3. **Reloads reshuffled.** `Math.random()` gave a new cast on every reload. The seed is part of the save, so the cast comes back with the run.
- **The share card needs the seed.** A share link is opened by someone without the save. So the share payload gained an optional `sd` (the run seed), checked on decode as a string of at most 200 characters. It only feeds the presentation generator. Older links still decode, and get a distinct, stable cast that may not match the one played.
- **Scenes.**
  - First-party scenarios keep their hand-picked scene.
  - Any other scenario gets a scene from the pool, picked by a stable hash of its pack key and scenario id.
  - The hand-picked map applies only to first-party pack keys, so a community scenario that reuses a base scenario's id doesn't borrow its scene (ADR 0014's rule, applied to looks).
  - The legacy view, which picked a random scene, now uses the same function.
- **Scores the UI doesn't know.**
  - Before, they all got 📈 and the same grey.
  - Now they get an icon and color from a six-entry fallback palette, by position among the active scenario's unknown scores. The game store records the scenario's `score_refs` order when a bundle becomes active.
  - The fallback colors are global CSS classes with their own tokens, so every score component picks them up without its own rule. Their icons are ones no known score uses.

**Decisions and trade-offs**

1. **Scenes are picked by scenario, not by run.** ADR 0002 says "a seeded pick". We used the pack key and scenario id as the seed rather than the run seed. That way the lobby (which has no run yet) previews the same scene the run will use, and a scenario has a recognizable place, as first-party ones do.
2. **The cast is dealt in sorted id order,** not in the order stakeholders appear. This makes it independent of how a snapshot was built or serialized.
3. **Score order lives in a small reactive module value** set by the store, not threaded through six presentational components as a prop. It is UI presentation state, like the active theme.
4. **Changing the role pool or the salt changes old runs' casts.** This was accepted in ADR 0002 as cosmetic.

**DDD note (talk material)**

The bugs came from one missing concept. "Which character plays the CFO in this run" was never anything's job. Each screen worked it out for itself, from whatever it had: a shuffled pool, an unshuffled pool, `Math.random()`. Naming it, as *the run's cast*, gave it one owner (the UI), one input (the run seed) and one function. The three bugs disappeared because the duplication behind them did. It is the presentation-side version of "a name is not an identity": a stakeholder's look had no identity of its own.

**Verification**

- **Unit tests** (+19, 1054 total):
  - cast: distinct roles, including the old `ab`/`ba` collision; independent of stakeholder order; varies across seeds; cycles past the pool; leaves the simulation's random stream untouched; the stage uses it;
  - scenes: first-party map, stable pick for other scenarios, spread across the pool, no borrowing of first-party scenes;
  - scores: known looks kept, position-based fallbacks, cycling, no icon clash;
  - share payload: the seed round-trips, older links decode, bad seeds are refused.

  The old scene test "falls back to the hall for unknown packs" was replaced. It encoded the behavior ADR 0002 changes (every unknown scenario in the same hall).
- **Determinism:** a fixed-seed audit report is identical to `main`. The engine and its random stream are untouched.
- **Headless Chrome:** played The Merger of Minor Chaos. The four seated stakeholders had four different roles. After a reload mid-run the cast was identical, and the end-of-run screen and the share card showed the same role for every stakeholder. The fifth stakeholder, who isn't seated, has its own distinct role on both. No console errors.

### M2.11 (design): Community packs get their own room (2026-11-22)

A design decision made while testing PR #35 by hand. The build follows in the next PR, and the ADR will be written there once the look is chosen.

**How it came up**

When the project owner looked for the "Community packs" entry, it raised a broader question. Since M2.5, adding a pack has put its scenarios **into the existing lobby**: community adventures were dealt into the Adventures fan alongside the base game's, and community tutorials into the Tutorials tab, each with a small badge. The owner named two risks:

1. **Confusion with the base game.** A pack's scenario sits among DDDnD's own as if it were one of them.
2. **Confusion between packs.** Packs can be about radically different topics, an SRE incident pack next to a payments pack, and a mixed deck hides that.

Then the more important question: **do packs only add one scenario?** No. A manifest has a `scenarios` list and a `tutorials` list, and the demo just happens to have one. Two six-scenario packs would put twelve community cards among the base game's five. That turned the presentation issue into a modeling one. The thing a player chooses is a **pack**, and a scenario is chosen *within* a pack.

**Why this fits**

Since M2.9 the game has known packs only by pack key, and every scenario is addressed as (pack key, id, version). The model already said "a scenario belongs to its pack". The lobby was the one place that flattened that back out. Showing packs as groups means the screen shows the model the code already has.

**Decisions**

1. **A separate route.** The lobby (`/play`) goes back to first-party content only: Tutorials and Adventures are "the DDDnD game". Community packs get their own place at `/community`, reached from the lobby. A route rather than a third lobby tab, because it is a different place, and `?pack=` links can land there directly.
2. **It's a bazaar.** The community area has its own feel: a bazaar rather than the council chamber. Different shades, and a border or similar marking, tell the player at a glance that this content is external. The exact look will be chosen from screenshots of two or three versions.
3. **Always pack first, then scenario.** The bazaar shows one tile per added pack: its name, publisher, kind, how many adventures and tutorials, and the unreviewed mark. Opening a tile shows that pack's table: its tutorials first, then its adventures, in the same quest-fan style, with the pack's banner and source warning visible throughout. **A one-scenario pack still opens its table**, for consistency.
4. **"Add a pack" moves to the bazaar.** It is the same dialog, now inside the place where packs live.
5. **The order of work.** PR #35 merges as groundwork (everything new in it is behind the flag except the M2.10 cast fix). The follow-up PR covers:
   - the screenshots, an ADR, and the build;
   - the docs-site pages, written for the new flow so they don't need rewriting;
   - the end-to-end check.

**What it sets up**

The pack table is where pack-specific choices can live later: a standalone pack's own scores, and classes or challenge modifiers scoped to a pack (left open in ADR 0014), never in the base lobby. Overlay packs, which change text and have no scenarios, would show a tile that says what they change instead of offering quests.

**DDD note (talk material)**

The model had moved and the screen hadn't. A pack had been an aggregate in the code since M2.9: it owns its content, has one identity, and is added and removed as a whole. But the UI treated packs as a delivery mechanism for loose scenarios. A hands-on test plus one naive-sounding question ("do packs only add one scenario?") showed the gap. The fix is the same as in M2.7–M2.9: make the boundary that exists in the model visible where people meet it. Here that means a room of its own, with its own look, so the context boundary is something a player can *see*.

### M2.12 (design): The bazaar and the pack table, brainstormed (2026-11-22)

The UX brainstorm for the community area decided in M2.11, and the owner's answers. It's recorded before the build so the reasoning survives whichever look wins.

**The shape**

- **The council lobby (`/play`) is first-party only.** Its "Community packs" dialog link becomes "Community bazaar ›", a link to a page.
- **The bazaar (`/community`)** has one stall per added pack. Each stall shows:
  - the pack's name and version;
  - its publisher, prominently, so same-named packs are told apart;
  - how many adventures and tutorials it has;
  - its description;
  - an "External · not reviewed" ribbon.

  Each stall has Open, and Remove with an inline confirmation that names the cost: a saved run from that pack can't continue until the pack is added back. "Add a pack" is a stall of its own that opens the existing dialog. `?pack=` links and saved-run notices land here.
- **The pack table (`/community/<pack key>`)** is the lobby's own layout, reused, with:
  - the pack's banner: "Community pack · not reviewed by DDDnD", name, publisher, description;
  - only that pack's scenarios;
  - "‹ Bazaar" in place of the bazaar link.

  The pack key goes in the path as is (`/community/github:mooeypoo/dddnd-packs/packs/gilded_ledger`). It is readable and shareable. A link to a pack that isn't added here lands in the bazaar with an explanation.

**The owner's answers**

1. **Pack-owned classes and modifiers: later.** The owner had assumed packs could already add them. They can't: ADR 0014 refuses them, because the lobby offered every class with every scenario. Now that each pack has its own table, that reason goes away. The preferred design for later is **option A**: a pack's table offers its own classes and modifiers plus those of the packs it depends on, filtered to the scenario's scores. This is recorded as a planned improvement, not built now. Until then a pack table offers the game's classes, as before. The other options considered were:
   - B: the pack's own only, which leaves the Gilded Ledger with no classes until its author copies them;
   - C: own plus base everywhere, which breaks standalone packs whose scores differ.
2. **A visible external marker during a run, including in what people share.** If a player screenshots a community run, it must be clear that it isn't a DDDnD pack. The play screen already has the "Community pack · name · publisher" label. The results screen and the share card get one too.
3. **Entry points: the lobby only, for now.** The welcome page can link to the bazaar later.
4. **The look:** compare a warm canvas-and-awning market with an indigo night market.

**A new requirement from the owner: say where packs are kept**

Added packs live in this browser's storage (IndexedDB). There are no accounts and DDDnD stores nothing about the player. A player who sees their pack in the bazaar today could reasonably assume it will always be there, on any device. So the bazaar says it plainly: "Kept in this browser only … they won't follow you to another browser or device, and clearing this site's data removes them. Keep the links to packs you like somewhere of your own." When the browser refuses persistent storage, it says packs last only until the page closes.

**The external mark**

Both looks share one rule: community content has a **stitched (dashed) border**, which base content never uses, plus an awning stripe across the top. The colors come from `.bazaar-look-<look>` tokens in `design-system.css`, so the look is a palette swap. `?look=night` switches while the comparison is open.

**The owner's review of the two looks**

- **Warm canvas won.** The indigo night market and the `?look=` switch were removed, leaving one `.bazaar-theme` token set.
- **"Too much" became "quieter":**
  - the awning is now a thin valance (10 px instead of 26 px, with softer stripes);
  - the stalls lost their own awnings for a 3 px striped top edge;
  - the stitching is 1 px and fainter;
  - the title is a size smaller.

  The external mark is still unmistakable, just not loud.
- **"Add a pack" became "Import a pack".** "Add" read as if the player would be *creating* a pack, which is the Pack Studio's job (M4+). "Import" says the pack exists elsewhere and is being brought in. The whole flow now uses the one verb: the dialog title, "Import this pack", "Don't import", "Importing…", the saved-run notices ("Import it again from its original link"), and the bazaar.

  Words in the UI are part of the ubiquitous language too: *import* (bring an existing pack in) and *create* (make one, in the Studio) are different actions and get different words.
- **Importing is an action, not a pack.** In the first version "Import a pack" was a stall of its own and looked too much like the packs. It is now a plain button with a line of help *below* the stalls: no card, no stripes, nothing that could be mistaken for a pack.
- **Stalls are centered:** fixed-width columns, centered as a group, so a single pack sits in the middle. The striped top edge is a little taller (6 px), so the rounded corners don't cut it off.
- **Importing closes the dialog.** Most players import one pack and then play it, not a series of packs. After importing, the dialog closes, and the bazaar says "Imported “…”. Open it to play", linking to the pack's table. The new stall is highlighted (solid border instead of stitched). `confirm()` now returns what was imported (key, name, whether the browser keeps it), so the bazaar can point at it.

**DDD note (talk material)**

Where data lives is part of the model the player needs to know. "Your packs" sounds like an account. Saying "kept in this browser" is the user-facing side of a decision made for privacy: no backend, no accounts, nothing about the player stored. Hiding that would have made the privacy choice look like a bug the first time someone switched devices.

### M2.13: The community area, built (2026-11-22)

Builds M2.11 and M2.12, behind the flag (ADR 0009). Decision recorded in [ADR 0015](adr/0015-community-packs-in-their-own-place.md).

**What changed**

- **Routes.** `/community` is the bazaar. `/community/<pack key>` is the pack's table, the same `RunSetupView` given a `packKey` prop. The route takes the key with its slashes (`:packKey+`), so a table's address is readable: `/community/github:mooeypoo/dddnd-packs/packs/gilded_ledger`. Both routes redirect to `/play` with the flag off.
- **The lobby view filters by table.** Without a pack key it shows first-party quests only (`isFirstPartyPackKey`). With one, it shows only that pack's quests and passes the pack's banner to the lobby component, which switches to the bazaar theme. Moving from one pack's table to another resets the selection.
- **Leaving a run goes back to the run's table.** `lobbyRouteFor(key)` is used by "Play again", reset, leaving a tutorial, and "start the real game". Tutorials suggested after a tutorial come from the same table, so a base tutorial never suggests a community one.
- **The external marker.** `describeRunCommunityPack` works from what the save recorded (key, origin, source URL), so it still marks a run whose pack has since been removed, falling back to the pack id for the name. It feeds:
  - the play label;
  - a new label on the results screen ("… · not a DDDnD scenario");
  - the share payload's optional `cp` field, which the share card renders as plain text.

  The decoder accepts `cp` only as two non-empty strings of at most 160 characters.
- **Docs.**
  - A new player page on the docs site, [Community packs](../docs-site/guide/community-packs.md), opens with a "not switched on yet" notice, because the site is public and the flag is still off in production. It covers safety, the bazaar, importing, publishers, where packs are kept, saved games, and removing a pack.
  - Both authoring guides gained "How players find your pack": the share-link format, one table per pack, browser-only storage, and runs marked as the author's. The class note now points at the planned pack-owned classes.
  - The threat model's T8 and T15 rows mention the separate area and the run marker, including that share links were always forgeable.

**Decisions and trade-offs**

1. **One view, two roles.** The pack table is the lobby view with a prop, not a copy. Everything the lobby does (difficulty order, warming bundles, tutorials, modifiers) works the same at a pack's table.
2. **The marker uses the save, not the loaded pack.** It is about the run, so it must survive the pack being removed.
3. **The docs page is published before launch, with a notice,** so authors can prepare packs and the page can be reviewed alongside the code.

**DDD note (talk material)**

The routes say the model out loud. `/play` is the game's own context. `/community/<pack key>` names a pack by its identity (ADR 0012), right in the address bar. The same view serves both because a table is a table; what changes is which context's content it shows and how it frames it.

**Verification**

- **Unit and component tests** (+26, 1080 total):
  - routes: the pack key round-trips through the path; runs return to the right table;
  - run labels: remote, file, removed pack, first-party;
  - share payload: the `cp` marker is built, round-trips, and malformed values are refused;
  - share card: the marker is shown as text, never markup, and is absent for base runs;
  - lobby and tables (flag on): the lobby is first-party only; the bazaar link; `?pack=` is forwarded; a pack table shows only its quests under its banner, starts runs with the pack key, goes back to the bazaar, and sends unknown keys to the bazaar;
  - bazaar: stalls with publisher and external mark, both storage notices, remove only after confirming, import as an action and not a stall, the demo offered when empty;
  - flow: `confirm()` returns what was imported.

  One flow-test expectation changed with the wording ("Both stay; the bazaar shows…"), and another with "import" replacing "add".
- **End to end in headless Chrome, with real GitHub and real storage:**
  1. The lobby has 5 base adventures.
  2. Lobby → bazaar → import the demo from its tag. The dialog closes and "Imported … Open it to play" appears.
  3. Open it. The table's address is the pack key.
  4. Play: the label names the pack and publisher. The save carries the key, version and content hash.
  5. Reload mid-run: it resumes with the label.
  6. Finish: the results screen and the share card both say "Community pack · Demo: The Gilded Ledger · mooeypoo on GitHub (mooeypoo/DDDnD-packs) · not a DDDnD scenario".
  7. "Play again" returns to the pack's table.
  8. Import the same pack from a file: two stalls, with different publishers.
  9. Play a base adventure: no marker anywhere, and "Play again" returns to `/play`.
  10. A share link carrying `cp`, opened in `/share`, shows the marker.

  No console errors.
- `vue-tsc` and the docs-site build pass.

**Follow-up decisions while reviewing PR #36**

- **No player-facing export in MVP 1.** M2's "done when" said "save, reload, and export". That meant both run formats (the in-browser save and the exact-run export) record which pack a run used, and they do (M2.6). There is no export button, and the owner chose not to add one: it is a technical format with no player purpose yet. The milestone text now says so, and the open-questions table records "player-facing run download" as ready in code but not used.
- **No replay promise for packs that are taken down.** A saved run continues only while its exact pack is imported in that browser.
- **Launch waits.** The CSP change and the production flag come after MVP 1 and more local testing by the owner.
- **Checked by the owner:** removing a pack while its run is saved, and leaving to `/play` or `/game` afterwards, behave as described.

### M3.0 (design): Moving the engine's DDD knowledge into content (2026-11-22)

The start of milestone M3. Before writing code, we listed every place where the engine, the balance audit, or the UI still hard-codes knowledge of the base game, and the project owner made the decisions below.

**The inventory**

None of it crashes. A pack whose scores differ from the base game's quietly gets wrong results:

| Concept | Where it lived | What a different-domain pack got |
|---|---|---|
| Final tier | Literal ids and thresholds in `classify_run_outcome.ts` (≥75 triumph, ≥60 success, ≥45 survival, ≥30 struggle, else collapse). Tier JSON had only name, description and rank. | No tier unless it reused the base ids, and then the base thresholds |
| Coarse result (success / partial / failure) | ≥60 / <35, written twice (`get_run_outcome.ts`, `serialize_exact_run.ts`). The simulator's "win" uses it. | The base game's idea of winning |
| Ending (archetype) | Nine predicates over fixed score groups in `classify_outcome_archetype.ts`, with missing scores read as 50. The scenario's `outcome_archetype_refs` were ignored. | Almost always "Pragmatist" or "System Stabilizer", with the base game's icon, text and art |
| Coupling | Five rules in `apply_score_changes.ts` (three base, two tutorial). Fixed text in the UI warnings and the rules modal. | No coupling at all, silently |
| Archetype ids | A closed TypeScript union of 10, used by saves, exports and share links | A type error as soon as a pack names its own ending |
| Results screen | Ending and tier names title-cased from the id; descriptions, icons and art from code maps | Base text, or generic fallbacks |
| Balance audit | Targets keyed by base scenario ids; scripts scan only `content/` | Audits that find nothing |

Stakeholder reaction rules were already fully driven by content (structured conditions since M1).

**The surprise:** the tutorial is already a small standalone pack, and it is already affected. It has its own scores, tiers (`tutorial_done`, `tutorial_success`) and ending (`tutorial_learner`), and the engine never selects any of them. It works only because two of the hard-coded coupling rules were written for it.

**The names question.** The owner asked why endings are shown as title-cased ids when every ending file has a human-written `name`. There is no good reason. The bundle loads the ending files, but the engine reports only an id, and the screens never looked the id up. The share card had a real constraint: a shared link opens on another device without the pack, so it only had the id. The fix is to use the content's names and descriptions on the results screen, and to carry the display name in share links.

**Decisions**

1. **Scores stay higher-is-better for now.** "Lower is better" is documented as a future option (open questions, §9), including everything it would touch.
2. **Endings get declarative criteria in content,** replacing the TypeScript predicates. There must be no regressions in current packs: the base game's endings are re-expressed as content and proven identical by golden replays. Pack authors get clear documentation of the criteria.
3. **The tutorial's endings and coupling get fixed,** through new tutorial content versions. Watch for regressions, and flag any risk.
4. **The SRE pack is a community pack,** living in [DDDnD-packs](https://github.com/mooeypoo/DDDnD-packs) alongside the demo, not in this repository. That collection is the owner's own "extras" (demos and additional packs). A separate "sanctioned community packs" list can come later (ADR 0010).
5. **Pack-owned classes and challenge modifiers are part of M3** (option A from ADR 0015): a pack's table offers its own, plus those of the first-party packs it depends on, filtered to the scenario's scores. The SRE pack needs this, because the base classes favour scores it doesn't have.
6. **SRE and incident response is the second domain,** with the strawman below.

**The slices**

0. **Golden replays.** Record fixed seeds × every first-party scenario × the simulator's play policies, capturing full history and outcome. Every later slice must reproduce them exactly for the base pack. Tutorial changes are deliberate, versioned, and called out.
1. **Names from content:** ending and tier names and descriptions on the results screen and share card.
2. **Coupling rules as content,** including the warning text the UI shows.
3. **Tiers with thresholds and a result** (success, partial or failure), replacing both copies of the 60/35 rule.
4. **Declarative ending criteria,** over generic measures:
   - each score's final value and how much it changed;
   - sums over score groups the pack defines;
   - stakeholder average and minimum;
   - volatility and event pressure.

   Each ending has a priority, and the first match wins. The scenario names a fallback ending.
5. **Ending ids become validated strings.** Icons and art fall back as they do for scores (ADR 0002).
6. **Balance audit targets as content,** and audit scripts that accept a pack folder.
7. **Phantom stakeholders refused** by the validator, with a new `microservice_sprawl` version.
8. **Pack-owned classes and modifiers.**
9. **The SRE pack** in DDDnD-packs: the acceptance test, needing no TypeScript changes.

**The SRE strawman**

- **What it teaches:**
  - reliability is a budget you spend, not a virtue;
  - heroics feel good and burn people out;
  - blameless learning beats blame;
  - toil compounds.
- **Scores:** Availability (against the SLO), Error budget, Rested on-call, Customer trust, Change velocity, Observability.
- **The council:** VP of Engineering, Product lead, Customer support lead, Finance, Security, the on-call engineer.
- **Cards:** SLOs with an error-budget policy, runbooks, blameless postmortems, alert tuning, feature freeze, automated rollback, chaos drills, paying down toil.
- **Events:** a 3 a.m. outage, cascading failure, a cloud region down, an alert storm, "root cause by noon", an expired certificate.
- **Endings:** Reliability Architect, Error-Budget Accountant, Toil Slayer, Hero Firefighter (burnout), Pager-Haunted.

**DDD note (talk material)**

The tutorial was the first "second domain" all along, and nobody noticed. It had its own scores, tiers and ending, and the engine ignored them. Its coupling only worked because someone added tutorial score ids to the engine's own rule list. That is what implicit knowledge looks like up close: the system works because the code quietly knows things the model never said. The test for M3 is that both the tutorial and the SRE pack get their endings from their own content, with nothing about either in TypeScript.


### M3.1 (slice 0): Golden replays, the safety net for M3 (2026-11-22)

**What changed**

- **`tests/simulation/golden_replays.test.ts`** replays fixed seeds (`golden-v1`) through:
  - every first-party scenario, 12 runs each, with both simulator policies (`player_true`, `full_pool_oracle`);
  - each base scenario once more with a class affinity and a challenge modifier, rotated so all five classes and all four modifiers are covered;
  - both tutorials, 60 runs each, with both policies;
  - the demo pack fixture.

  Each run is recorded as a readable summary (coarse tier, tier id, ending, status, turns, final scores) plus a SHA-256 of its full telemetry: every turn's cards, events, reactions, scores and stakeholders. The fixture is `tests/simulation/golden/first_party_runs.json`. The test never rewrites it; `npm run test:golden:update` does, and should only be used when content deliberately changes.
- **The simulation runner** accepts an optional `class_score_affinity` and `challenge_modifier`, applied the way the game applies a player's picks, so the replays cover those paths. Its per-run telemetry gained `selected_tier_id`. The fixed-seed audit report is still identical to `main`.

**Checking the net catches things**

A golden test that never fails is worth nothing, so each coupling rule was perturbed in turn:

- **A tiny change** (0.7 → 0.71) did *not* fail. Scores are whole numbers, so it was absorbed by rounding.
- **A real change** (→ 0.31) failed for all three base rules and the tutorial's `team_capacity` rule. It did **not** fail for the tutorial's `system_health` rule: twelve gentle tutorial runs never pushed system health below 25.
- **The fix** was 60 tutorial runs, with the oracle policy too. After that, all five rules fail the replay when changed.

**What the net does not cover**

- **Three endings never occur** in the replays: Boundary Builder, Budget Hawk and Pragmatist. All five base tiers and seven of the ten endings do occur.
- **The plan for slice 4:** when endings move into content, an equivalence test will compare the old TypeScript classifier with the new content-driven one on many synthetic run summaries, covering every rule and the priority order. The golden replays alone can't prove those three.

**Risk flagged for the owner**

The tutorial currently ends with **no tier** and with base endings (Stakeholder Whisperer, System Stabilizer), because the engine ignores its own tiers and ending. Fixing that (decision 3) will deliberately change the tutorial's golden results. It will be done with new tutorial content versions and a re-recorded fixture, called out in that slice's entry.

**DDD note (talk material)**

Characterization tests ("golden master") are how you change a model you don't fully trust yet. They don't say what the behavior *should* be, only what it *is*. The perturbation check is the part people skip: we found a rule the net couldn't see before relying on it.
