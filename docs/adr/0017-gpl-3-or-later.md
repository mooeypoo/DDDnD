# ADR 0017: DDDnD is licensed GPL-3.0-or-later, and so are new Studio packs

Status: Accepted  
Date: 2026-11-26  
Amends: the base pack's license stated in [ADR 0004](0004-pack-license-compatibility.md) (its rule for packs is unchanged)  
Feature journal: [docs/PACK_STUDIO.md](../PACK_STUDIO.md) (M4.8a)

## Context

DDDnD, its base content and its tutorial were `GPL-3.0-only`. ADR 0004 requires packs that build on the base pack to use a GPL-3.0 license (`GPL-3.0-only` or `GPL-3.0-or-later`), and the Studio gave every new pack `GPL-3.0-only`, like the game.

"Only" ties a work to version 3 of the GPL for good. Moving to a later version would need every copyright holder to agree. For the game that is one person today: the owner wrote the code. The other commits are owner-directed Copilot agent changes and Dependabot version bumps. For packs it is many people, some of whom will be unreachable, so a pack ecosystem on "only" could never move together.

## Decision

1. **The game, its base content and its tutorial are licensed `GPL-3.0-or-later`** (owner's decision, 2026-11-26). The `LICENSE` file is unchanged; "or later" is stated in `package.json`, the first-party manifests, the README and the docs site.
2. **The Studio gives new packs `GPL-3.0-or-later`** (`DRAFT_LICENSE`).
3. **ADR 0004's rule stays:** a pack that builds on the base pack may be `GPL-3.0-only` or `GPL-3.0-or-later`. Both are version 3, so either works with the base pack.
4. **Imported packs keep their license** (D26). A `GPL-3.0-only` pack stays "only" until its author changes it.

## Consequences

- If a GPL version 4 is ever published, the game and every "or later" pack can be used under it without asking anyone. Recipients may choose its terms, which the Free Software Foundation will write; the owner accepted that trade over keeping a veto (a proxy under GPL v3 §14 was the alternative considered).
- Released versions keep the license they were released under. The two published packs in DDDnD-packs (`gilded_ledger`, `sre_on_call`) are `GPL-3.0-only` at their current tags; their next releases may switch.
- The base pack's version does not change: the base-content lock (D25) records content files, not the manifest's license, and no content changed.
- The Studio has no control for changing a pack's license yet, so an imported "only" pack exports as "only". Offering the switch is a small follow-up.
- ADR 0004's "pending a legal sanity check" caveat covers this change too.

## Alternatives considered

- **Keep `GPL-3.0-only`.** It changes nothing today, but it would hold every pack at version 3 unless each author relicensed.
- **`GPL-3.0-only` with a proxy (GPL v3 §14)** who decides whether later versions apply. It keeps a veto, but it's less familiar and adds a step later.
