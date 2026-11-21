# ADR 0006: Ship pack loading (with a demo pack) before the Studio

Status: Accepted  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md) (section "Milestones")

## Context

There are two possible first milestones that players and authors can actually use:

- players can load a pack into the game, or
- authors can create a pack in the Studio.

Each one needs the other to be fully useful. A loader with no packs has nothing to show. A Studio with no loader produces files nobody can play.

## Decision

1. **Pack loading in the game ships first (MVP 1).** It forces the security work (hardened validation, source policy, consent, pack identity in saves) into production first, which is where it matters most.
2. **A small first-party demo pack ships with MVP 1** so the feature can be tested, demoed, and documented from day one:
   - It is an **`extension`** pack (it builds on base scores and stakeholders). That means it works before the engine generalization milestone, and it reflects the main workshop use case: "the Monolith, retold for my organization".
   - It is **hosted in its own public GitHub repository**, so it goes through the real remote path (allowlist, consent, snapshot), not a shortcut.
   - A copy lives in the repo as a test fixture so CI does not depend on the network.
3. **Until the Studio exists, authors write JSON by hand.** They use the generated JSON Schema (editor autocomplete) and the existing CLI validator.
4. **The first `standalone` pack is an SRE and incident-response pack.** It is built during engine generalization (milestone M3) as the proof that the engine is no longer DDD-specific. Its exact design is still to be brainstormed.

## Consequences

- Early authors have a rougher experience (JSON plus CLI). That is acceptable for a small audience of technical facilitators. It also tests the schema docs before we build forms on top of them.
- The demo pack doubles as the reference example in the public documentation site.
- The SRE pack gives the generalization milestone a concrete acceptance test instead of an abstract "make it generic" goal.

## Alternatives considered

- **Studio first, loading only in dev builds.** Rejected. It delays the security-critical player path, and the Studio's export format would be designed without a real consumer.
- **A demo pack bundled inside the game build.** Rejected as the *only* demo, because it would skip the remote loading path we most need to exercise. It is kept as a test fixture.
- **Making the SRE pack the demo.** Rejected for MVP 1, because it needs engine generalization first. It would block loading behind the riskiest milestone.
