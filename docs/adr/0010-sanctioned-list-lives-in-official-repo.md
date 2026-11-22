# ADR 0010: Which packs are "sanctioned" is decided only in the official DDDnD repository

Status: Accepted  
Date: 2026-11-21  
Supersedes: [ADR 0008](0008-multi-pack-repository.md), decision 4 (an `index.json` with a `status` in the packs repository)  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)

## Context

ADR 0008 proposed that the shared packs repository keep an `index.json` listing its packs, each marked `demo` or `sanctioned`.

The project owner pointed out the flaw. A trust label stored next to the thing it vouches for can be written by whoever writes the thing. Anyone can copy the repository layout, or open a pull request against it, and call their pack "sanctioned". In DDD terms: the authority for "this pack is endorsed by DDDnD" belongs to the DDDnD context, not to the context that supplies packs.

## Decision

1. **The packs repository makes no trust claims.** It holds packs and a README that describes them. It has no `index.json`, no status field, and no "sanctioned" or "official" wording that the game or players are meant to rely on.
2. **If DDDnD ever endorses packs, the list lives in the official DDDnD repository** (`mooeypoo/DDDnD`), is reviewed like code, and ships with the game build. Each entry identifies a pack by its exact pinned manifest URL (a tag or commit SHA, never a branch), so an endorsement can't silently follow later changes.
3. **The game decides by looking up its own bundled list,** never by reading anything inside a pack or its host.
4. **Endorsement affects discovery only.** An endorsed pack still goes through the same validation, consent screen, and labeling as any other community pack (unchanged from ADR 0008's consequences).
5. **Building the list is not part of M2.** This ADR fixes where it must live when it is built (milestone M7, the curated directory).

## Consequences

- No one can make a pack look endorsed by editing files they control.
- Endorsing or withdrawing a pack is a reviewed change in the official repository, with history.
- Pinning endorsements to an exact URL means a new pack release needs a new review to stay endorsed. That is intended.

## Alternatives considered

- **Status field in the packs repository** (ADR 0008 decision 4). Rejected for the reason above.
- **Signed manifests** (packs carry a signature from a DDDnD key). Stronger and portable, but key management for a small project is more burden than value right now. A bundled, reviewed list of pinned URLs gets the same guarantee for the packs we list.
