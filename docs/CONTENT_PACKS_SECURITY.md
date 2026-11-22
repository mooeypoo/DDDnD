# Content Packs: Threat Model

Status: In progress. These are the controls that milestones M1 and M2 must implement. Progress is noted in the Milestone column and in [CONTENT_PACKS.md §11](CONTENT_PACKS.md#11-implementation-log).  
Audience: implementers, reviewers, and later writing  
Feature journal: [docs/CONTENT_PACKS.md](CONTENT_PACKS.md)  
Decisions: [ADR 0001](adr/0001-community-content-packs.md), [ADR 0002](adr/0002-presentation-cast-decoupled-from-content.md), [ADR 0003](adr/0003-remote-pack-source-allowlist.md), [ADR 0005](adr/0005-pack-studio-as-separate-app.md)

---

## 1. What we are protecting

| Asset | Why it matters |
|---|---|
| The player's browser session on dddnd.app | Script injection would run with dddnd.app's origin and storage |
| The player's saves and preferences | They are stored per origin, so a hostile pack must not be able to corrupt or read them |
| The player's attention and trust in the dddnd.app brand | Community text appears under our domain |
| The player's privacy | Fetching a pack reveals their IP address to the host |
| Gameplay integrity of the base pack and other packs | One pack must not change another pack's behavior |
| Determinism and replay | Saves and exports must replay against the same content |
| Tab availability | A pack must not be able to freeze or crash the game |

## 2. Trust boundaries

```
 untrusted                          │ boundary (content domain)                       │ trusted
────────────────────────────────────┼─────────────────────────────────────────────────┼───────────────────────
 remote manifest + files (GitHub)   │ source policy → fetch (no redirects, size cap)  │ validated, typed
 local .dddnd-pack.json file        │ → JSON parse → schema + limits → kind rules     │ ScenarioBundle
 Studio postMessage (preview only)  │ → pack-scoped ref resolution → bundle validator │ → simulation
                                    │ → content hash → snapshot                       │
```

The simulation never sees anything that did not cross this boundary. The UI renders only data that came out of it.

## 3. Threats and controls

| # | Threat | Example | Controls | Milestone |
|---|---|---|---|---|
| T1 | Script injection through text | A card description containing `<img src=x onerror=...>` | All content is rendered as text through Vue interpolation. A lint rule or test bans `v-html` and `innerHTML` on content-derived data (today the only `v-html` is the static social icons). CSP: `script-src 'self'`, no `unsafe-inline` or `unsafe-eval` for scripts. Packs have no Markdown or HTML fields. Primary rule (ADR 0014): a pack's worst case is unwanted text. Text is deliberately not filtered for URLs or HTML: rendered as plain text, they are inert. | **Done in M1.6** (CSP header, rendering-guard test; verified in a real browser) |
| T2 | Script through URLs | `"url": "javascript:alert(1)"` in `authors`, or `pack_homepage_url` | Every URL field must parse with `URL` and use `https:`. Render with `rel="noopener noreferrer"` and `target="_blank"`. | M1 (URL validation **done in M1.2**; rendering in M2) |
| T3 | Fetches outside the pack | `base_url` pointing to another host; an id like `../../x` | Source allowlist ([ADR 0003](adr/0003-remote-pack-source-allowlist.md)). `base_url` resolved against the manifest URL and kept on the same origin and repo prefix. Ids must match `^[a-z0-9_]{1,64}$`, so filenames are built only from safe ids. Redirects are refused. CSP `connect-src` matches the allowlist. | **Done:** id grammar, inventory filenames and `base_url` shape (M1.1/M1.2); allowlist, same-origin/same-repo scope and refused redirects (M2.3). CSP `connect-src` widens at launch (ADR 0009). |
| T4 | Prototype pollution and key confusion | A score id `__proto__` or `constructor` reaching `Record<string, number>` lookups | The id grammar plus an explicit ban on `__proto__`, `prototype`, and `constructor`. Id-keyed runtime records use `Map` or `Object.create(null)` where they are built from pack data. | M1 (id grammar and reserved keys **done in M1.1**; Zod also drops `__proto__` record keys, and we report them explicitly) |
| T5 | Resource exhaustion | `max_turns: 1e9`; 100k cards; 50 MB strings; `NaN` or `Infinity` deltas; deeply nested JSON | Limits on bytes per file (checked while streaming, not only via `Content-Length`), files per pack, entities per scenario, string lengths, and numeric ranges. Finite numbers only. Integer fields must be integers. Bounded `max_turns` and stakeholder count. Studio balance runs execute in a Worker with a time budget. | M1 (per-file limits and byte cap **done in M1.1**; files per pack pending), M5 |
| T6 | Cross-pack tampering | A remote pack ships `define_bounded_context-v1.json` with different numbers | Pack-scoped resolution: a scenario resolves only from its own pack and declared dependencies. No pack can claim a file another pack owns. This applies to first-party packs too, because their inventories turned out not to overlap. | **Done in M1.3** |
| T7 | Silent misbehavior | A rule whose prose condition never parses | Structured `condition` required for every pack (first-party migrated). The engine no longer parses prose. Conditions on untracked scores or absent stakeholders are bundle errors. Validation errors include field paths. | **Done in M1.4** |
| T8 | Phishing or offensive content under our brand | A shared link `dddnd.app/?pack=...` that shows a fake login message | No silent auto-load: a pack link always opens the consent screen (source, authors, license, kind, pinned or unpinned, "not reviewed by DDDnD"). A persistent "community pack" label during play. Packs cannot add links except author and homepage URLs, which are shown with their full hostname. Bidi-override and control characters are **rejected** by validation with a message, not silently stripped (M1.1). Zero-width joiners stay allowed because emoji and several writing systems need them. The review opens with the publisher and the worst case ("From a source DDDnD hasn't reviewed … the worst a pack can do is show you text you didn't expect"); pack-supplied links (author, homepage) carry a visible caution that they lead to sites DDDnD doesn't know (M2.9). Community packs live apart from the base game: in the bazaar and on their own tables, with a stitched "external" border. A community run is marked on the play screen, the results screen and the share card ("not a DDDnD scenario"), so a screenshot or shared card can't pass for an official scenario ([ADR 0015](adr/0015-community-packs-in-their-own-place.md), M2.12). Share links were always forgeable, and now that includes the optional pack marker; the marker renders as plain text and is capped at 160 characters. | M1, M2 |
| T9 | Privacy leak to the pack host | Each player's IP is visible to whoever hosts the pack | Stated on the consent screen. No pack-supplied images or other third-party asset URLs (also an architecture rule). Snapshots mean the host sees one fetch per pack version, not one per run. | M2 |
| T10 | Content changes under a saved run | The author force-pushes a branch and the saved run no longer replays | Saves and exports record pack key, pack id, pack version, source URL, and content hash. A saved run resumes only with the same key and hash. The consent screen flags branch URLs as unpinned. Optional per-file `content_hashes` in the manifest are checked on load. | M2 |
| T11 | Malicious archives | Zip bombs, path traversal in zip entries | The game never unzips. Zip import exists only in the Studio, using a library with entry-count, size, and path checks. Extracted files are validated like any other pack. | M4 |
| T12 | Hostile preview messages | Another site posting a fake pack to the game's preview route | The preview route accepts `postMessage` only from the Studio's exact origin. Preview packs go through the same validation and never write to normal saves. | M6 |
| T13 | Dependency supply chain | A compromised schema or zip library | Pin versions, keep the dependency list small (no new runtime dependencies in the game beyond the schema library), and continue the existing `npm audit` hygiene. | Ongoing |
| T14 | Stale engine reading a newer pack | A pack written for schema 3, loaded by an engine that knows schema 2 | `schema_version` in the manifest. The game rejects unknown future versions with a clear message. | **Done in M1.2** |
| T15 | Pack impersonation by name | Someone publishes their own `gilded_ledger` to replace yours, to be picked up by your saved runs, or to stand in for a dependency. Or a pack copies another's title and credits. Or someone takes over a repository name that was given up (repo-jacking). | **Identity:** inside the game a pack exists only as its **pack key**, derived from where it is published (owner/repo/folder on GitHub; content hash for files), never its manifest id ([ADR 0012](adr/0012-pack-identity-from-source.md), [ADR 0014](adr/0014-pack-keys-everywhere.md)). The registry, saves, storage, lobby and run start all use the key, so same-named packs load side by side and can't be confused. Stored keys are recomputed, not trusted. **Dependencies:** only first-party packs, resolved to `dddnd:<id>`, so no community pack can stand in for one ([ADR 0013](adr/0013-community-packs-depend-only-on-first-party.md)). **Look-alikes:** the publisher (the GitHub account it was loaded from, or "unknown" for a file) is shown in the review, the bazaar, the pack's table, and the play, results and share labels. **Repo-jacking:** the worst case is unwanted text (primary rule, ADR 0014); saved runs still require the exact content hash; the review always says the source isn't reviewed by DDDnD. | **Done in M2.7–M2.9.** Residual: look-alike titles and credits (the publisher is shown) and repo-jacking (accepted: limited to text; closing it needs GitHub's numeric ids, which only the API exposes). |
| T16 | Content-id squatting | A pack lists another pack's card ids so that, loaded first, it blocks the other pack from loading | Content belongs to its pack key: two packs may list the same file unless one depends on the other ([ADR 0014](adr/0014-pack-keys-everywhere.md)). | **Done in M2.9** |

## 4. Explicit non-goals

- **Moderating community content.** We do not host packs, so we do not moderate them. Consent, labeling, and the curated directory (M7) are the trust tools.
- **Hiding packs from the host's logs.** Fetching from a host is visible to that host. We disclose it; we do not proxy.
- **Protecting authors from their own players.** Packs are public files. There is no DRM.
- **A compromised official DDDnD repository.** Whoever controls it controls the game itself (and the validator workflow authors run). Out of scope for the pack threat model; the reusable workflow at least runs with `permissions: contents: read`.

## 5. Test strategy

- **A hostile-pack fixture suite** (M1): one fixture per threat T1–T7 and T14, each asserting rejection with the expected error path. These fixtures live under `tests/content/` and never touch the network. **Done in M1.7:** `tests/content/hostile_packs.test.ts`, 17 attacks plus a passing baseline.
- **A source-policy table test** (M2): allowed and rejected URLs, including custom-domain Pages redirects, ports, userinfo, `http:`, and lookalike hosts (for example `github.io.evil.example`).
- **A rendering guard** (M1): a test or lint check that fails on `v-html` or `innerHTML` bound to content-derived values. **Done in M1.6:** `tests/ui/no_markup_injection.test.ts`.
- **Determinism guard** (M1–M3): existing determinism tests and new golden replay tests stay green with no expectation changes. During M1 this was checked by comparing a fixed-seed audit report against `main` after every engine-touching slice (always byte-identical).
