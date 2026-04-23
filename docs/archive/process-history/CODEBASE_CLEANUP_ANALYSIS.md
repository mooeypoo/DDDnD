# Codebase Cleanup and Refactor Analysis

Purpose: summarize findings from the completed documentation pass and provide a decision-ready cleanup plan.

## 1. Executive Summary

- Total findings: 6
- Do now: 2
- Schedule: 2
- Watch: 2
- Ignore for now: 0
- Top 5 priorities:
  1. F-002 simulation runner orchestration concentration
  2. F-006 game store responsibility concentration
  3. F-005 UI type contract leakage from simulation rule modules
  4. F-004 repeated rule helper conversions
  5. F-001 large game view cognitive load

Overall assessment:
- Architecture boundaries are largely healthy and were validated during the pass.
- Highest-value cleanup work is in orchestration decomposition and contract-surface cleanup, not in algorithm rewrites.
- Most findings are medium or low risk and suitable for incremental, test-backed refactors.

## 2. Ranked Findings Table

| Rank | ID | Area | Finding | Evidence File | Importance | Effort | Priority (I/E) | Risk | Recommendation |
|---|---|---|---|---|---:|---:|---:|---|---|
| 1 | F-002 | simulation | Orchestration concentration in one service may reduce readability and testability | src/domains/simulation/services/simulation_runner.ts | 5 | 3 | 1.67 | medium | do now |
| 2 | F-006 | ui | Main game store centralizes many concerns and increases maintenance cost | src/ui/stores/game_store.ts | 4 | 3 | 1.33 | medium | do now |
| 3 | F-005 | ui | UI imports outcome archetype types from simulation rule modules, creating contract leakage | src/ui/components/results/share_result_card.vue | 3 | 2 | 1.50 | low | schedule |
| 4 | F-004 | simulation | Repeated score and stakeholder conversion helpers across rule files suggest shared utility opportunity | src/domains/simulation/rules/resolve_action.ts | 3 | 2 | 1.50 | low | schedule |
| 5 | F-001 | ui | Large view file likely high cognitive load for maintenance | src/ui/views/game_view.vue | 4 | 4 | 1.00 | medium | watch |
| 6 | F-003 | ui | Mixed component filename casing may reduce consistency | src/ui/components | 2 | 2 | 1.00 | low | watch |

## 3. Finding Detail Cards

### F-002 Simulation Runner Orchestration Concentration

- Area: simulation services
- Evidence: src/domains/simulation/services/simulation_runner.ts
- Why it matters: dense orchestration logic can hide edge-case coupling, increase change risk, and slow test isolation.
- Scope affected: simulation run lifecycle, telemetry/audit flow, scenario-run coordination.
- If unchanged: more friction adding rules, more expensive debugging in multi-step run behavior.
- Importance (1-5): 5
- Effort (1-5): 3
- Risk: medium
- Suggested approach (high level, no implementation): split orchestration into bounded pipeline steps with explicit input-output contracts and narrow unit tests per stage.
- Dependencies: preserve deterministic behavior and existing test expectations for turn pipeline and engine shell.

### F-006 Game Store Responsibility Concentration

- Area: UI state/store orchestration
- Evidence: src/ui/stores/game_store.ts
- Why it matters: one large store owning content loading, run lifecycle, persistence, tutorial, and modal state increases merge pressure and regression surface.
- Scope affected: gameplay UI flow, startup/load paths, share/persistence interactions.
- If unchanged: increasing risk of accidental coupling in future features and slower onboarding for contributors.
- Importance (1-5): 4
- Effort (1-5): 3
- Risk: medium
- Suggested approach (high level, no implementation): extract focused store modules or service adapters for run lifecycle, UI chrome/modal state, and persistence/restore concerns.
- Dependencies: maintain current public store API during migration or provide compatibility layer.

### F-005 UI Type Contract Leakage from Simulation Rule Modules

- Area: UI and simulation contract boundary
- Evidence: src/ui/components/results/share_result_card.vue, src/ui/components/results/outcome_panel.vue, src/ui/views/end_of_run_view.vue
- Why it matters: importing types from rule modules weakens layer clarity and encourages future runtime coupling.
- Scope affected: end-of-run and share result UI surfaces.
- If unchanged: boundary drift risk and harder future separation of simulation internals from UI/reporting contracts.
- Importance (1-5): 3
- Effort (1-5): 2
- Risk: low
- Suggested approach (high level, no implementation): promote archetype ids to a shared simulation-runtime or reporting contract type and import from that stable surface.
- Dependencies: verify no serialization/reporting mismatch in share payload tests.

### F-004 Repeated Rule Conversion Helpers

- Area: simulation rules
- Evidence: src/domains/simulation/rules/resolve_action.ts and neighboring rule modules
- Why it matters: duplicated conversion logic increases drift and bug-fix scatter.
- Scope affected: score change and stakeholder change application helpers.
- If unchanged: repeated edits and inconsistent behavior during future balancing updates.
- Importance (1-5): 3
- Effort (1-5): 2
- Risk: low
- Suggested approach (high level, no implementation): introduce shared helper utilities inside the rules layer and replace duplicated local conversions incrementally.
- Dependencies: keep current deterministic ordering and clamping semantics intact.

### F-001 Large Game View Cognitive Load

- Area: UI views
- Evidence: src/ui/views/game_view.vue
- Why it matters: large view files are harder to reason about and review.
- Scope affected: gameplay page composition and integration wiring.
- If unchanged: slower review cycles and higher chance of accidental side effects when editing.
- Importance (1-5): 4
- Effort (1-5): 4
- Risk: medium
- Suggested approach (high level, no implementation): progressively extract presentational sub-sections and orchestration adapters while preserving current behavior and props contracts.
- Dependencies: coordinate with game store decomposition decisions to avoid duplicate churn.

### F-003 Mixed Component Filename Casing

- Area: UI component conventions
- Evidence: src/ui/components
- Why it matters: naming inconsistency increases friction for discovery and contribution patterns.
- Scope affected: import ergonomics and contributor conventions.
- If unchanged: mild long-term readability cost.
- Importance (1-5): 2
- Effort (1-5): 2
- Risk: low
- Suggested approach (high level, no implementation): define casing policy and apply in small migration batches with path-safe updates.
- Dependencies: repository-wide import updates and CI path checks on case-sensitive platforms.

## 4. Domain Summaries

### Content

- What improved in docs: trust boundary and validation contracts are now explicit end-to-end.
- Main risks observed: low.
- Notable cleanup candidates: none urgent.

### Simulation

- What improved in docs: model lifecycle and rule/service responsibilities are clearly documented with deterministic assumptions.
- Main risks observed: orchestration concentration and duplicated helper patterns.
- Notable cleanup candidates: F-002, F-004.

### Persistence

- What improved in docs: serialization and validation responsibilities are explicit, with non-authoritative boundaries preserved.
- Main risks observed: low.
- Notable cleanup candidates: none urgent.

### Reporting

- What improved in docs: share payload contracts and encoding boundaries are explicit.
- Main risks observed: low, except contract-type placement overlap with UI imports.
- Notable cleanup candidates: support F-005 by providing a stable type surface.

### UI/App/Shared

- What improved in docs: ownership boundaries across views, stores, composables, primitives, and tutorial surfaces are now explicit.
- Main risks observed: centralization in game store and large gameplay view.
- Notable cleanup candidates: F-006, F-001, F-005, F-003.

## 5. Decision Proposal

### Do Now

1. Refactor simulation runner orchestration into explicit pipeline stages while preserving deterministic behavior and existing tests.
2. Decompose game store responsibilities into clearer modules or adapter slices with compatibility-preserving API.

### Schedule

1. Move outcome archetype ids to a stable shared contract surface and remove UI type imports from rule modules.
2. Consolidate repeated rule conversion helpers into shared internal utilities.

### Watch

1. Monitor game view complexity trend while store/simulation refactors land.
2. Track naming inconsistency until a low-risk casing migration window is available.

### Ignore for Now

1. None.

## 6. Open Questions

1. Should game store decomposition preserve a single facade for UI callers or migrate callers directly to multiple stores?
2. Where should outcome archetype id contracts live long-term: shared simulation runtime contract or reporting contract package?
3. For simulation runner decomposition, should stage boundaries follow turn phases or domain concerns (selection, resolution, audit, telemetry)?

## 7. Next Planning Input

Capture what is needed to move from analysis to implementation planning:

- owners:
  - simulation refactor owner
  - UI store decomposition owner
  - contract cleanup owner
- milestones:
  - M1: F-002 and F-006 design and slice plan
  - M2: F-005 and F-004 implementation
  - M3: optional F-001 and F-003 follow-up
- acceptance criteria:
  - no gameplay behavior change
  - deterministic and regression tests stay green
  - boundary checks remain pass
- test strategy:
  - run existing focused suite per slice
  - add targeted unit tests for extracted stages/helpers as part of each refactor
- rollout strategy:
  - small PRs by finding
  - keep compatibility adapters during transitions
  - gate each step with test and boundary checks
