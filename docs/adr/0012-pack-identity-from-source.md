# ADR 0012: A pack's identity comes from where it is published, not from its manifest id

Status: Accepted  
Date: 2026-11-22  
Refined by: [ADR 0013](0013-community-packs-depend-only-on-first-party.md) (the `depends_on` consequence below)  
Refines: [ADR 0001](0001-community-content-packs.md) (pack ids) and M2.6's "one version per pack id" (journal §11)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

M2.6 made added packs and saved runs survive a reload. Both were keyed by the manifest `id`: the device stored one pack per id, and a saved run asked for "the pack with id `gilded_ledger`".

The project owner spotted the flaw in review: **nothing makes a manifest id unique.** Any author can publish a pack called `gilded_ledger`. With id-only keys:

- adding someone else's `gilded_ledger` would silently replace yours, on the device and in the list;
- a saved run would point at "whichever `gilded_ledger` is loaded", and then only the content hash would stop it from resuming. The player would be told "different version" when it was really a different pack.

In DDD terms, the manifest id is a **name the pack gives itself**, an attribute. It was being used as an **identity**. Identity has to come from something the author can't pick freely to collide with someone else's. Inside our own game that's the registry. Across the world it's the **place a pack is published**. A GitHub owner and repository belong to one account. The authority for "which pack is this" therefore sits with the Distribution and Trust context (source policy), not with the pack's own claims. That is the same reasoning as [ADR 0010](0010-sanctioned-list-lives-in-official-repo.md): a pack can't vouch for itself.

## Decision

1. **Every pack has a pack key,** derived from its source by `pack_identity.ts` in the content domain:

   | Where it comes from | Pack key |
   |---|---|
   | Ships with DDDnD | `dddnd:<id>` |
   | GitHub raw | `github:<owner>/<repo>/<folder>` |
   | GitHub Pages | `github-pages:<owner>/<folder>` |
   | A pack file | `file:<content hash>` |

2. **The ref is not part of the key.** `…/gilded_ledger-v1.0.0/…`, `…/gilded_ledger-v1.1.0/…`, `…/main/…` and a commit SHA all name the same pack, so a newer release replaces the older one. *Which content* was played is pinned separately by the content hash (unchanged from M2.6).
3. **Owner and repository are lowercased** (GitHub treats them case-insensitively). Folder paths keep their case (GitHub doesn't).
4. **A file's identity is its content.** A `.dddnd-pack.json` says nothing trustworthy about where it came from, so it can never take a GitHub pack's key, even if it was downloaded from one.
5. **The key is what persists:** stored packs are keyed by it (IndexedDB version 2), and `RunContentPack.key` is required in saves and exports. When a stored pack is restored, its key is **recomputed** from its origin and content, never read back from storage.
6. **Manifest ids stay a runtime constraint, not an identity.** The registry still loads only one pack per manifest id, so content references and `depends_on` keep resolving by id within a session. Adding a pack whose id is already taken by a *different* key replaces that pack, and **the review says so before the player confirms**: who it replaces, from where, and that runs saved with it will ask for it again.
7. **A saved run resumes only with a pack of the same key and the same content hash.** When it can't, the lobby says which case it is: the pack is missing, a different version of it is added, or a same-named pack from somewhere else is added.

## Consequences

- Two authors' same-named packs never overwrite each other silently. Replacing one with the other is an explicit, explained choice.
- **Moving a pack changes its identity.** Renaming the repository, moving the pack's folder, or transferring the repository to another owner makes it a new pack to the game. Saved runs will ask for the old link. The authoring guides say this.
- The same content loaded from GitHub raw and from GitHub Pages, or from GitHub and from a file, counts as two packs. This is strict on purpose. The review words that case gently ("the same content is already added from…").
- Development data from M2.6 (database version 1, keyed by id) is dropped on upgrade. That build never shipped (ADR 0009), so there is nothing to migrate for players.
- `depends_on` still names a manifest id. A pack can't yet say *whose* `gilded_ledger` it extends. That's fine while dependencies are first-party packs (`base`, `tutorial`), whose ids the registry protects. Revisit when community packs depend on community packs.

## Alternatives considered

- **A hash of the manifest URL** (the first suggestion in review). It is unique, but unreadable in a save or an export, and the URL includes the ref, so each release would be a new pack and updating would strand saved runs. The readable key without the ref keeps both properties we need.
- **Require globally unique manifest ids** (for example `owner.pack`). There's nothing to enforce it against without a central registry, which [ADR 0003](0003-remote-pack-source-allowlist.md) and §4.1 rule out (hosting is a generic subdomain we don't build).
- **Allow several same-id packs side by side** by namespacing content ids per pack. That's a much larger change to the registry and to how content references resolve. The single-active-id rule plus explicit replacement covers the real cases for now.
- **Let a file claim a source** (store the GitHub origin inside exported bundles). Rejected: anyone could write a file that claims to be someone else's pack.
