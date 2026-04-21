# Cleanup and Refactor Implementation Plan

Purpose: execute approved cleanup findings without gameplay behavior changes.

Inputs:
- docs/CODEBASE_CLEANUP_ANALYSIS.md
- docs/CODE_DOCUMENTATION_PASS_TRACKER.md

## 1. Scope and Guardrails

In scope:
- F-002 simulation runner orchestration concentration (do now)
- F-006 game store responsibility concentration (do now)
- F-005 type contract leakage (scheduled follow-up)
- F-004 repeated rule helper conversions (scheduled follow-up)

Out of scope for this plan cycle:
- F-001 large game view decomposition (watch)
- F-003 component filename casing migration (watch)

Non-negotiable guardrails:
- No intentional gameplay behavior change.
- Determinism preserved for simulation runs and turn pipelines.
- Layer boundaries remain intact: UI does not execute simulation rules.
- Each slice lands with tests and boundary checks.

## 2. Milestones

### M1: Do-Now Design and Slice Plan

Goal:
- Define and land the first safe extraction slices for F-002 and F-006.

Exit criteria:
- Simulation runner has explicit internal stage helpers extracted with unchanged external API.
- Game store has at least one extracted concern module/service adapter integrated behind the same store facade.
- Focused regression suite passes.

### M2: Scheduled Boundary and Utility Cleanup

Goal:
- Implement F-005 and F-004 with low-risk contract and utility refactors.

Exit criteria:
- Outcome archetype types imported from stable shared contract surface, not rules modules.
- Duplicated score/stakeholder conversion helpers consolidated in simulation rules layer.
- Regression and boundary checks pass.

### M3: Watch-List Reassessment

Goal:
- Reassess F-001 and F-003 after M1/M2 changes stabilize.

Exit criteria:
- Decision note: promote to schedule or remain watch.

## 3. Workstream Plans

## WS-1 F-002 Simulation Runner Decomposition

Primary file:
- src/domains/simulation/services/simulation_runner.ts

Objective:
- Reduce orchestration density by extracting pure stage helpers while preserving report contract and deterministic behavior.

Target structure:
- run execution stage helpers
- telemetry mapping stage helpers
- aggregate/fingerprint stage helpers

Planned PR slices:
1. PR-1A Internal helper extraction only
- Move run-seed, delta-map, opening-sequence, and pair-calculation helpers into clearly named local sections or sibling helper module.
- Keep exported interfaces and simulate_runs entrypoint unchanged.

2. PR-1B Execute-run pipeline shaping
- Split executeRun into step-oriented helpers with explicit inputs/outputs.
- Keep action selection behavior and run loop semantics identical.

3. PR-1C Aggregate stage shaping
- Split computeAggregate into focused reducers.
- Preserve AggregateTelemetry shape exactly.

Acceptance criteria:
- No type/interface changes in public simulation runner API unless explicitly planned and reviewed.
- Existing telemetry tests continue to pass.
- Determinism checks continue to pass.

Validation commands:
- npx vitest run tests/simulation/strategy_fingerprint_telemetry.test.ts tests/simulation/turn_pipeline.test.ts tests/simulation/engine_shell.test.ts

## WS-2 F-006 Game Store Responsibility Decomposition

Primary file:
- src/ui/stores/game_store.ts

Objective:
- Reduce responsibility concentration while preserving current store consumer API for UI components.

Candidate concern slices:
- content loading and registry management
- run lifecycle orchestration
- persistence and restore path
- modal/chrome state handling
- tutorial lifecycle coordination

Planned PR slices:
1. PR-2A Extract content-loading service adapter
- Move content pack load/merge/provider logic to dedicated adapter module under UI services or store helpers.
- Keep store method names and return types unchanged.

2. PR-2B Extract persistence/restore adapter
- Move persist_run_state and restore_saved_run flow into dedicated helper with same behavior.

3. PR-2C Extract run-lifecycle coordinator
- Isolate start_new_run, refresh_turn_briefing, and play_turn orchestration internals into helper while retaining store facade.

Acceptance criteria:
- Store public API remains backward-compatible for current views/components.
- Intro splash, tutorial triggers, and run completion flow remain unchanged.
- Save/restore behavior remains unchanged.

Validation commands:
- npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts tests/simulation/turn_pipeline.test.ts
- Optional manual smoke: start run, play turn, complete run, restore run

## WS-3 F-005 Stable Archetype Type Surface

Primary files:
- src/ui/components/results/share_result_card.vue
- src/ui/components/results/outcome_panel.vue
- src/ui/views/end_of_run_view.vue

Objective:
- Remove UI type imports from simulation rules modules and use stable shared contract type.

Planned approach:
- Introduce or reuse archetype id type in shared runtime/reporting contract module.
- Update UI imports to new contract location.
- Keep runtime behavior unchanged (type-level refactor).

Acceptance criteria:
- UI files no longer import from simulation rules paths for archetype types.
- Boundary grep remains clean for rule execution leakage.

Validation commands:
- npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts
- grep boundary check used in tracker.

## WS-4 F-004 Rule Helper Consolidation

Primary files:
- src/domains/simulation/rules/resolve_action.ts
- neighboring simulation rule modules using duplicate conversion logic

Objective:
- Consolidate duplicated score/stakeholder conversion helper patterns.

Planned approach:
- Add shared helper utility file in simulation rules layer.
- Migrate duplicate call sites in small batches.

Acceptance criteria:
- Fewer duplicate helper implementations.
- Rule ordering and clamping behavior unchanged.

Validation commands:
- npx vitest run tests/simulation/turn_pipeline.test.ts tests/simulation/card_availability.test.ts tests/simulation/system_coupling_rules.test.ts

## 4. Sequencing and Dependencies

Recommended order:
1. WS-1 PR-1A then PR-2A in parallel-safe branches.
2. WS-1 PR-1B then PR-2B.
3. WS-1 PR-1C then PR-2C.
4. WS-3 then WS-4.
5. Reassess watch items (M3).

Dependency notes:
- F-001 should wait until F-006 decomposition stabilizes to avoid duplicate file churn in game view wiring.
- F-005 is low risk and can be done before or after F-004; prefer before to strengthen boundary contracts early.

## 5. Owners and Cadence

Owner placeholders:
- Simulation refactor owner: TBD
- Store decomposition owner: TBD
- Contract cleanup owner: TBD
- Test and regression verifier: TBD

Cadence:
- One small PR per slice.
- Max two active slices in parallel.
- Merge only on green tests and boundary checks.

## 6. Acceptance Gates

Per-PR mandatory gates:
- Focused vitest subset for affected area.
- No new type or lint errors in changed files.
- If touching UI/simulation boundaries, run boundary grep check.

Per-milestone gates:
- M1: all WS-1 and WS-2 slice criteria satisfied.
- M2: WS-3 and WS-4 criteria satisfied.
- M3: explicit decision log for watch items.

## 7. Risk Register

Risk: hidden behavior drift in run orchestration.
- Mitigation: keep external contracts unchanged, use small extraction-only slices first.

Risk: UI regressions from store decomposition.
- Mitigation: preserve store facade API, extract internals incrementally.

Risk: contract churn from type surface move.
- Mitigation: type-only PR first, no runtime changes.

## 8. First Execution Checklist

1. Assign owners for WS-1 and WS-2.
2. Open PR-1A (simulation helper extraction).
3. Open PR-2A (content-loading adapter extraction in store internals).
4. Run focused test suites and boundary checks.
5. Update tracker with slice status after each merge.

## 9. Execution Status

- 2026-04-20: PR-1A complete.
	- Scope: extracted deterministic helper and aggregate computation logic from
		simulation runner into `simulation_runner_helpers.ts` with full module and
		function-level documentation.
	- Validation: `npx vitest run tests/simulation/strategy_fingerprint_telemetry.test.ts tests/simulation/turn_pipeline.test.ts tests/simulation/engine_shell.test.ts tests/reporting/share_payload.test.ts`
	- Result: pass (4 files, 64 tests).
	- Behavior/API: unchanged.

- 2026-04-21: PR-2A complete.
	- Scope: extracted content-loading adapter logic from game store into
		`src/ui/stores/game_store_content_adapter.ts` and rewired
		`src/ui/stores/game_store.ts` to delegate manifest URL resolution,
		manifest loading, and merged provider creation through the adapter.
	- Added tests: `tests/ui/game_store_content_adapter.test.ts`
	- Validation: `npx vitest run tests/ui/game_store_content_adapter.test.ts tests/ui/game_store_orchestration.test.ts`
	- Result: pass (2 files, 9 tests).
	- Behavior/API: unchanged.
