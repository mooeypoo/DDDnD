# ADR 0001: Community content packs as untrusted, declarative data

Status: Accepted  
Date: 2026-11-21  
Feature journal: [docs/CONTENT_PACKS.md](../CONTENT_PACKS.md)  
Threat model: [docs/CONTENT_PACKS_SECURITY.md](../CONTENT_PACKS_SECURITY.md)

## Context

DDDnD was built from the start with replaceable, versioned content packs and a manifest ([src/domains/content/model/content_pack_manifest.ts](../../src/domains/content/model/content_pack_manifest.ts)). The registry can already merge several packs ([content_pack_registry.ts](../../src/domains/content/services/content_pack_registry.ts)), and the store can take extra manifest URLs ([game_store_content_adapter.ts](../../src/ui/stores/game_store_content_adapter.ts)). Nothing in the product lets a player use that yet.

We want domain experts (DDD facilitators first, other software disciplines and non-software teaching later) to write their own packs, host them themselves, and have players load them into the game.

When we read the code with "a stranger wrote this pack" in mind, we found four gaps:

1. **The content boundary checks references, not shapes.** `createContentProvider` casts parsed JSON to the target type and only checks `id`/`version` (plus score shape). `validateScenarioBundle` checks that refs resolve and that `score_refs` coverage holds. Wrong types, non-finite numbers, huge values, oversized strings, or hostile ids all pass. This was acceptable for first-party content reviewed in PRs. It is not acceptable for content from the internet.
2. **DDD-specific knowledge is hardcoded in the engine.** Coupling rules ([apply_score_changes.ts](../../src/domains/simulation/rules/apply_score_changes.ts)), outcome tier thresholds ([classify_run_outcome.ts](../../src/domains/simulation/rules/classify_run_outcome.ts)), archetype predicates and the closed `OutcomeArchetypeId` union ([classify_outcome_archetype.ts](../../src/domains/simulation/rules/classify_outcome_archetype.ts)), runner thresholds ([simulation_runner_helpers.ts](../../src/domains/simulation/services/simulation_runner_helpers.ts)), and balance targets ([scenario_balance_targets_audit.ts](../../src/domains/simulation/services/audit/scenario_balance_targets_audit.ts)) all name base-pack score or scenario ids. A pack with its own scores would load, but every run would end in the fallback archetype.
3. **Reaction-rule conditions are machine data hidden in prose.** `condition_description` (for example `"Domain clarity < 35"`) is parsed by regex and fuzzy-matched against score and stakeholder *names* ([condition_evaluator.ts](../../src/domains/simulation/rules/condition_evaluator.ts)). If it does not parse, the rule silently never fires.
4. **Later packs can override earlier packs' content.** For the same `{ id, version }`, the most recently registered pack wins. A remote pack could quietly redefine a base card.

## Decision

1. **Packs are declarative data, interpreted by a fixed engine.** A pack never contains code, expressions, templates, HTML/Markdown that is rendered as markup, or asset URLs. Numbers are allowed and expected (deltas, weights, thresholds), but every numeric field has a bounded range. Every field is rendered as text.
2. **All pack content is untrusted until it passes a field-level schema plus resource limits.** That includes first-party packs. Schemas are written once in TypeScript inside the content domain. JSON Schema is generated from them for authors' editors and the Studio. Limits (bytes, counts, string lengths, numeric ranges, id grammar) are part of the schema, not ad hoc checks.
3. **Resolution is scoped by pack.** A scenario resolves content only from its own pack and the packs it declares in `depends_on`. External packs may not override content owned by another pack.
4. **Packs come in three kinds:** `overlay` (text-only reskin or translation of existing content), `extension` (new content that builds on another pack's scores and stakeholders), and `standalone` (a complete world with its own scores, outcomes, and coupling). Kinds set what a pack is allowed to touch and tell players what they are loading.
5. **Domain knowledge that is hardcoded today moves into content.** That covers coupling rules, tier thresholds, archetype criteria, and audit targets. The base pack gets new content versions that encode today's behavior exactly, and golden replay tests prove base-pack runs are unchanged. This is required for `standalone` packs, not for `extension` packs.
6. **Reaction rules get a structured `condition`** (the existing `NumericCondition` shape). `condition_description` stays as human-readable text. External packs must use the structured field. Base content migrates by new versions.
7. **Manifests declare a `schema_version`** (an integer contract with the engine), so the game can reject packs written for a newer schema instead of misreading them.
8. **Loading a non-bundled pack always needs explicit player consent**, and the pack stays visibly labeled as community content while it is in use (see [ADR 0003](0003-remote-pack-source-allowlist.md)).
9. **Saves and exports record pack identity**: pack id, pack version, source URL, and a content hash. Loaded remote packs are snapshotted locally so exact-run replay does not depend on a mutable remote branch.

## Consequences

- The content domain grows a real schema layer. This is the largest change and the security foundation for everything else.
- The simulation becomes more general and loses its last DDD-specific constants. This is a core-domain change, so it needs golden tests before and after.
- First-party content has to pass the same stricter rules. Some base files may need cosmetic or versioned fixes.
- Authors get exact, early errors (field paths, limits) instead of silent behavior, which the Studio can show next to the field.
- Overrides between packs are no longer possible for external packs. A pack that wants a different card must ship its own id. This is deliberate.

## Alternatives considered

- **Strings and boolean tags only.** Safest, but too narrow: a teaching pack must be able to tune numbers. Bounded numbers carry no code-execution risk, so we kept them and bounded them instead.
- **Scriptable packs (JS, expression language, or WASM rules).** Rejected. That brings a sandbox and supply-chain risk we do not want in a teaching game, and it breaks the promise that content is readable by architects, not only by programmers.
- **Global ids with last-wins overrides (today's behavior).** Rejected for external packs because it lets one pack change another's behavior invisibly.
- **Full namespacing of every ref (`pack:id`).** Workable, but it churns every content file. Pack-scoped resolution gets the same safety without changing ref syntax. We will revisit if collisions between dependency packs become real.
- **Ajv for validation.** Rejected for the game runtime because it compiles validators with `new Function`, which conflicts with a strict Content Security Policy. Zod (v4, which can emit JSON Schema) is the working proposal. Final library choice happens in milestone M1.
