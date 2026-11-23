# Architecture Decision Records

This folder holds Architecture Decision Records (ADRs) for DDDnD.

An ADR captures one decision: the context that forced it, what we chose, what we gave up, and what we considered instead. ADRs are short on purpose. The long-form thinking, discussion, and plan for a feature live in that feature's journal doc (for example [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)), and the ADRs link back to it.

## Conventions

- One decision per file: `NNNN-short-kebab-title.md`.
- Status is one of `Proposed`, `Accepted`, `Superseded by NNNN`, or `Rejected`.
- Accepted ADRs are not rewritten. If a decision changes, write a new ADR that supersedes the old one and update the old one's status line only.
- Every ADR names the canonical docs it affects, so the rule it introduces lands in [AGENT.md](../../AGENT.md), [ARCHITECTURE.md](../../ARCHITECTURE.md), or the schema docs when it is implemented.

## Index

| ADR | Title | Status | Date |
|---|---|---|---|
| [0001](0001-community-content-packs.md) | Community content packs as untrusted, declarative data | Accepted | 2026-11-21 |
| [0002](0002-presentation-cast-decoupled-from-content.md) | Stakeholder cast and scenes are assigned by the UI, never declared by content | Accepted | 2026-11-21 |
| [0003](0003-remote-pack-source-allowlist.md) | Remote packs load only from GitHub raw and GitHub Pages at first | Accepted | 2026-11-21 |
| [0004](0004-pack-license-compatibility.md) | Packs that build on the base pack must use a GPL-3.0-compatible license | Accepted | 2026-11-21 |
| [0005](0005-pack-studio-as-separate-app.md) | Pack Studio is a separate local-first app that shares the domain code, not the game UI | Accepted | 2026-11-21 |
| [0006](0006-delivery-order-loading-before-studio.md) | Ship pack loading (with a demo pack) before the Studio | Accepted | 2026-11-21 |
| [0007](0007-zod-mini-jitless-for-content-validation.md) | Validate content with `zod/mini` in jitless mode, with our own error messages | Accepted | 2026-11-21 |
| [0008](0008-multi-pack-repository.md) | One public repository holds several packs (demos now, sanctioned packs later) | Accepted | 2026-11-21 |
| [0009](0009-community-packs-behind-a-flag.md) | Community packs ship behind a build-time flag until we choose to launch | Superseded by 0016 | 2026-11-21 |
| [0010](0010-sanctioned-list-lives-in-official-repo.md) | Which packs are "sanctioned" is decided only in the official DDDnD repository | Accepted | 2026-11-21 |
| [0011](0011-reusable-pack-validation-workflow.md) | Pack authors validate with a reusable workflow published from DDDnD | Accepted | 2026-11-22 |
| [0012](0012-pack-identity-from-source.md) | A pack's identity comes from where it is published, not from its manifest id | Accepted | 2026-11-22 |
| [0013](0013-community-packs-depend-only-on-first-party.md) | Community packs may depend only on first-party packs | Accepted | 2026-11-22 |
| [0014](0014-pack-keys-everywhere.md) | The game identifies packs and their content only by pack key, and a pack's worst case is unwanted text | Accepted | 2026-11-22 |
| [0015](0015-community-packs-in-their-own-place.md) | Community packs live in their own place, grouped by pack | Accepted | 2026-11-22 |
| [0016](0016-community-packs-launched.md) | Community packs are launched; the flag is removed | Accepted | 2026-11-24 |
