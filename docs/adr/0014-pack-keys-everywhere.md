# ADR 0014: The game identifies packs and their content only by pack key, and a pack's worst case is unwanted text

Status: Accepted  
Date: 2026-11-22  
Supersedes: [ADR 0012](0012-pack-identity-from-source.md), decision 6 (one pack per manifest id, with explicit replacement)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (entry M2.9)

## Context

ADR 0012 introduced the pack key (`github:<owner>/<repo>/<folder>`, `file:sha256:…`, `dddnd:<id>`) for everything that persists: saves, exports, and stored packs. ADR 0013 made dependencies name only first-party packs.

Inside a running session, the game still worked by manifest id. The registry was keyed by id, content files belonged to "the pack with that id", and the lobby picked scenarios by `(id, version)` alone. That was safe only because of a rule that kept one pack per id loaded at a time. Adding a same-named pack replaced the other one, and the review warned about it.

The project owner set the principle plainly:

> I don't care that the *names* aren't unique. I care that the ID by which we evaluate them internally is always unique and identifiable … made by the actual location/details of the pack, which can't be duplicated. … There should be no way for an attacker to *run* code for the user or take advantage, including repo hijacking and pretending to be good packs.

Two consequences followed from this.

1. **Pack identity.** Everything the system *decides* about a pack must use the key; the name is only shown. Then two `gilded_ledger`s are simply two packs, and nothing needs to be replaced.
2. **Content identity.** Card, scenario and event ids are also names an author picks. With one global space for content files, a pack that listed `ledger_refund-v1` first would block any other pack listing it. That is "squatting": not impersonation, but a way for one pack to keep another from loading. Content therefore belongs to its pack's key too.

## Decision

1. **The registry registers and looks up packs only by pack key.** `registerPack(manifest, provider, key)` returns the key. A pack registered without a key is first-party (`dddnd:<id>`). A duplicate *key* is refused. A duplicate *name* is fine.
2. **Content belongs to its pack.** Two packs may list the same file unless they can see each other:
   - a pack may not list a file its dependency closure lists, because its scenarios couldn't tell which one they meant;
   - first-party packs never overlap each other.

   Unrelated packs never conflict, so squatting is impossible, and forks of the same pack can be loaded side by side.
3. **A scenario is always addressed as (pack key, scenario id and version):**
   - in the lobby (`QuestDisplayModel.packKey`, `questKey`, `isSameQuest`),
   - when starting a run (`RunSetupOptions.pack_key`),
   - in the bundle cache,
   - and when restoring a save (`meta.content_pack.key`).

   Saves from before pack identity existed are always first-party, and resolve to the first-party pack that lists the scenario.
4. **Dependencies resolve only to `dddnd:<id>`.** A community pack that calls itself `base` can't satisfy anyone's dependency, even if it gets past the boundary checks. This is defense in depth under ADR 0013.
5. **Game-wide choices come only from first-party packs.** Player classes and challenge modifiers are offered for every scenario, so a community pack can't add them. The boundary refuses a community manifest that lists them, and the registry's game-wide provider reads first-party packs only.
6. **Adding a pack replaces only the same key** (usually a newer version). The review names other added packs with the same name and who published them, and says both stay.
7. **The publisher is shown wherever a community pack appears:** in the review, the added-packs list, the lobby quest badge and table line, and the in-game label. That way two same-named packs never look the same.
8. **The primary rule (recorded in AGENT.md and ARCHITECTURE.md): a pack's worst case is unwanted text.** Pack data must never reach code execution, markup, navigation, network requests, or asset loading. That holds whoever published the pack, including a hijacked repository or a pack pretending to be another. Every future feature (Pack Studio, formatting, previews) must keep it true. Concretely:
   - Pack text is plain text. It is never parsed as HTML or Markdown, and nothing in it is clickable. A URL or `mailto:` in text shows as visible, inert characters. Text is deliberately **not** filtered for URLs or HTML: once nothing renders or follows them, they are harmless. Blocking them would mostly catch legitimate text ("the site example.com just died").
   - The only links a pack can supply are its author and homepage URLs. They must be `https`, open in a new tab with `noopener noreferrer`, show their hostname, and carry a visible caution that they lead to sites DDDnD doesn't know.
   - Packs can't reference images, fonts, or any other asset.
   - The review opens with the source and the worst case: "From a source DDDnD hasn't reviewed: `<publisher>`. Packs can't run code or reach your device … The worst a pack can do is show you text you didn't expect."
9. **Formatting stays plain text for now.** If emphasis is wanted later, it must be our own parser for a tiny subset (`*italic*`, `**bold**`) that builds elements itself. It must never produce HTML and never produce links.

## Consequences

- Nothing in the running game can confuse two packs. A pretender with the same name, the same content ids, and even the same text is a different key. It is shown with a different publisher, resolves only its own content, and never satisfies another pack's dependency.
- One pack can no longer block another by claiming its content ids first.
- **Repo-jacking stays possible.** If an account or repository name is given up and re-registered, the new owner publishes under the old key. Because of decision 8, the damage is limited to text the player sees:
  - Saved runs still require the exact content hash.
  - The review still shows "a source DDDnD hasn't reviewed".

  GitHub's numeric repository ids would close this, but only the API exposes them, and the game makes no API calls. This is accepted and recorded under T15.
- The same content loaded from two places (GitHub and a file, or GitHub raw and Pages) is two packs, listed twice with different publishers. That is intended.
- Community packs can't add player classes or challenge modifiers yet. Supporting that would need classes scoped to a pack's own scenarios, which is a design question for later.
- Compromise of the official DDDnD repository is out of scope. Whoever controls it controls the game itself. It is recorded as a non-goal in the threat model.

## Alternatives considered

- **Keep one pack per name, replacing explicitly** (ADR 0012 decision 6). Safe, but it leaves correctness resting on an invariant, and it treats the name as meaningful to the system. The owner's principle is that the system should never reason about names.
- **Namespace content ids in the files** (authors write `owner.pack.card`). Authors can type anything, so this only *looks* unique. Scoping content to the key gives the same guarantee without asking authors for anything.
- **Filter URLs and HTML out of pack text.** Considered and rejected for the reasons in decision 8: plain-text rendering already makes them inert, and filtering would block ordinary sentences.
