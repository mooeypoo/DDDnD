# ADR 0013: Community packs may depend only on first-party packs

Status: Accepted  
Date: 2026-11-22  
Refines: [ADR 0012](0012-pack-identity-from-source.md) (its `depends_on` consequence) and [ADR 0011](0011-reusable-pack-validation-workflow.md) (`dependency-roots`)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (entry M2.8)

## Context

ADR 0012 gave every pack a key derived from where it is published, because a manifest `id` is a name anyone can choose. It left one thing keyed by id: `depends_on`. Its reasoning was that this is fine while dependencies are first-party.

The project owner pushed back. Without a central registry, nobody approves names or tracks duplicates, so a manifest id can't be trusted for anything that decides *which pack* is used. A dependency is exactly that kind of decision. If pack C declares `depends_on: alice_core`, then *any* pack named `alice_core` satisfies it. C's scenarios would then run on cards, stakeholders, and text that C's author never wrote and the player never chose for C. That is pack impersonation (threat T15) through the dependency graph, rather than through storage or saves.

There are two ways to make a dependency name something unique:

1. **Name the dependency by key** (`"pack": "github:alice/packs/core"`). Correct, but it changes the published pack format (a new `schema_version`). It also raises questions we don't need to answer yet: version ranges across sources, what to do when the dependency was loaded from a file, and how the registry's id-based scoping maps to keys.
2. **Allow only dependencies whose ids are already unique by construction:** the packs that ship with DDDnD. We control those ids, they are registered first, and the registry refuses any other pack with the same id.

Every pack that exists today depends only on `base`. No one is asking for community-on-community dependencies yet.

## Decision

1. **A community pack's `depends_on` may name only first-party packs** (`FIRST_PARTY_PACK_IDS`: `base`, `tutorial`).
2. **A community pack may not use a first-party id.** The registry already refused it as a duplicate. Now it is refused earlier, with a message that says why.
3. **Both rules are enforced where every community pack enters:**
   - in the game, by `parseManifestText`, which the remote loader, the file import, and the bundle script all go through, before any content is fetched;
   - in the author CLI and the reusable workflow, for any pack that isn't one of ours validated from our own folder. The rule lives in one function, `communityManifestIssues` in `pack_identity.ts`.
4. **`dependency-roots` / `--dependency-root` stay, with a narrower meaning:** a folder that stands in for a first-party pack, such as a work-in-progress base pack. The input is part of the published `pack-validator-v1` workflow, so it isn't removed.
5. **Removing a community pack no longer cascades.** Nothing can depend on it, so the cascade code is deleted rather than kept unreachable.
6. **The review shows the publisher.** No id rule stops a pack from copying another pack's *title* or *author names*. Those are the pack's own claims. So the consent screen and the added-packs list show "Published by: `<owner>` on GitHub (`<owner>/<repo>`)", taken from the URL the pack was loaded from. It sits next to the credits, with a note that the credits are written by the pack itself. For a file, the publisher is "Unknown".

## Consequences

- No community pack can stand in for another pack's dependency. Every dependency resolves to content we ship.
- Authors can't build a family of packs that share each other's content. If that's wanted, it needs decision 1 of the context above (key-based dependencies), in a new schema version.
- The validator is stricter. A pack that depended on a community pack would now fail. No such pack exists, and the game would refuse it anyway, so the validator now matches the game. Moving the `pack-validator-v1` tag to include this is a compatible change in practice, to be done after merge.
- T15 is closed for storage, saves (ADR 0012), and dependencies (this ADR). What remains is **look-alike presentation**: a pack can copy a title and credits. It can't copy its publisher, and the publisher is now always shown. A curated list ([ADR 0010](0010-sanctioned-list-lives-in-official-repo.md)) is the next layer if look-alikes become a real problem.

## Alternatives considered

- **Key-based dependencies now.** Rejected for now: a format change with open design questions, and no demand yet. This ADR leaves room for it.
- **Keep id-based dependencies, but warn when the dependency's publisher differs from the dependent's.** Same-publisher packs are the common case for a family of packs. But it would still let a same-named pack from that same publisher's *other* repository stand in, and a warning is weaker than a rule.
- **Namespaced ids** (`owner.pack`) chosen by authors. Rejected: authors can type any owner name, so this only *looks* unique. That is the same flaw as before.
