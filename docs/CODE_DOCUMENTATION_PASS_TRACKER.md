# Code Documentation Pass Tracker

Status: active
Start date: 2026-04-20

## Session Log

| Date | Session | Scope | Planned | Done | Notes |
|---|---|---|---|---|---|
| 2026-04-20 | S0 | setup and standards | 1 artifact | 1 artifact | playbook and templates created |
| 2026-04-20 | S1 | src/domains/content/model | 6 files | 6 files | completed; docs updated in content model files |
| 2026-04-20 | S2 | src/domains/content/services | 10 files | 10 files | completed; service contracts and validation boundaries documented |
| 2026-04-20 | S3 | src/domains/simulation/model + rules | 18 files | 18 files | completed; model + all rule files documented |
| 2026-04-20 | S4 | src/domains/simulation/services | 12 files | 12 files | completed; service and audit contract docs updated |
| 2026-04-20 | S5 | persistence + reporting | 15 files | 15 files | completed; serialization and share contracts documented |
| 2026-04-20 | S6 | app/shared/types + ui + tests | 100+ files | 13 files | in progress; app/shared/types + high-impact UI modules documented |

## Domain Progress

| Domain | File Count | Status | Notes |
|---|---:|---|---|
| content | 17 | complete | model and services documentation pass complete |
| simulation | 31 | complete | model, rules, and services documentation pass complete |
| persistence | 11 | complete | adapters and services documentation pass complete |
| reporting | 4 | complete | share payload and serialization docs complete |
| ui | 100 | not started | prioritize largest files first |

## Session Evidence

| Session | Scope | Evidence | Result |
|---|---|---|---|
| S1 | content model docs | npm test -- tests/content/content_pack_manifest.test.ts tests/content/content_provider.test.ts tests/content/bundle_builder.test.ts | pass (3 files, 25 tests) |
| S2 | content services docs | npm test -- tests/content/content_pack_validator.test.ts tests/content/content_pack_registry.test.ts tests/content/content_pack_manifest_urls.test.ts tests/content/content_pack_integration.test.ts | pass (4 files, 12 tests) |
| S3 (partial) | simulation model + priority rules docs | npx vitest run tests/simulation/model_runtime.test.ts tests/simulation/turn_pipeline.test.ts tests/simulation/outcome_archetype_classification.test.ts | pass (3 files, 25 tests) |
| S3 (final) | simulation model + rules docs | npx vitest run tests/simulation/turn_pipeline.test.ts tests/simulation/card_availability.test.ts tests/simulation/system_coupling_rules.test.ts tests/simulation/engine_shell.test.ts | pass (4 files, 36 tests) |
| S3 (boundary) | simulation architecture guardrail | strict grep import/API check in src/domains/simulation | pass (no code usage; one comment-only mention) |
| S4 | simulation services + audit docs | npx vitest run tests/simulation/engine_shell.test.ts tests/simulation/phase1_runner_contract.test.ts tests/simulation/content_audit_report_builder.test.ts tests/simulation/stakeholder_balance_audit.test.ts tests/simulation/structural_content_audit.test.ts tests/simulation/scenario_balance_targets_audit.test.ts | pass (6 files, 34 tests) |
| S5 | persistence + reporting docs | npx vitest run tests/persistence/persistence_export_import.test.ts tests/reporting/share_payload.test.ts | pass (2 files, 36 tests) |
| S6 (partial) | app/shared/types docs | npx vitest run tests/simulation/seeded_random.model.test.ts tests/simulation/model_runtime.test.ts | pass (2 files, 6 tests) |
| S6 (partial 2) | top UI view docs | npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts | pass (2 files, 32 tests) |
| S6 (partial 3) | additional high-impact UI docs | npx vitest run tests/reporting/share_payload.test.ts tests/simulation/turn_pipeline.test.ts | pass (2 files, 37 tests) |

## Session A File Coverage

| File | Status | Notes |
|---|---|---|
| src/domains/content/model/content_pack_manifest.ts | complete | added ownership/inventory/manifest contract docs |
| src/domains/content/model/content_types.ts | complete | clarified metadata identity, condition semantics, and boundary notes |
| src/domains/content/model/scenario_bundle.ts | complete | clarified authoritative bundle role and helper contracts |
| src/domains/content/model/tutorial_types.ts | complete | clarified tutorial metadata intent and UI ownership boundary |
| src/domains/content/model/version_ref.ts | complete | clarified identity semantics and parse limitations |
| src/domains/content/model/index.ts | complete | clarified barrel export responsibility |

## Session B File Coverage

| File | Status | Notes |
|---|---|---|
| src/domains/content/services/bundle_builder.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/content/services/bundle_validator.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/content/services/content_pack_manifest_urls.ts | complete | added deterministic merge/dedupe contract docs |
| src/domains/content/services/content_pack_registry.ts | complete | added registry precedence/resolution contract docs |
| src/domains/content/services/content_pack_validator.ts | complete | added validation report contract docs |
| src/domains/content/services/content_provider.ts | complete | clarified trust boundary and load contract docs |
| src/domains/content/services/manifest_loader.ts | complete | added fetch/parse/validate error contract docs |
| src/domains/content/services/manifest_validator.ts | complete | added strict schema/assertion boundary docs |
| src/domains/content/services/tutorial_content_provider.ts | complete | clarified tutorial script loading + metadata consistency docs |
| src/domains/content/services/index.ts | complete | clarified barrel responsibility |
| src/domains/content/index.ts | complete | clarified top-level content export docs |

## Session C File Coverage

| File | Status | Notes |
|---|---|---|
| src/domains/simulation/model/game_state.ts | complete | added state ownership/contracts/invariants docs |
| src/domains/simulation/model/turn_history_entry.ts | complete | clarified persisted archive boundary |
| src/domains/simulation/model/turn_resolution_context.ts | complete | clarified transient runtime boundary |
| src/domains/simulation/model/delayed_effect_instance.ts | complete | clarified deterministic instance-id semantics |
| src/domains/simulation/model/index.ts | complete | added barrel export docs |
| src/domains/simulation/rules/classify_run_outcome.ts | complete | documented outcome snapshot/tier/archetype contracts |
| src/domains/simulation/rules/resolve_action.ts | complete | documented action validation/resolution contracts |
| src/domains/simulation/rules/resolve_event.ts | complete | documented seeded event resolution contract |
| src/domains/simulation/rules/resolve_stakeholder_rules.ts | complete | documented deterministic rule ordering semantics |
| src/domains/simulation/rules/index.ts | complete | added barrel export docs |
| src/domains/simulation/rules/apply_score_changes.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/simulation/rules/apply_stakeholder_changes.ts | complete | added apply/clamp contract docs |
| src/domains/simulation/rules/build_turn_history_entry.ts | complete | documented persistence-oriented aggregation contracts |
| src/domains/simulation/rules/card_availability.ts | complete | documented availability reason and helper contracts |
| src/domains/simulation/rules/classify_outcome_archetype.ts | complete | documented classification input/metrics contracts |
| src/domains/simulation/rules/condition_evaluator.ts | complete | documented parse/evaluate condition contracts |
| src/domains/simulation/rules/resolve_architectural_aftershocks.ts | complete | documented deterministic aftershock ordering contract |
| src/domains/simulation/rules/select_event.ts | complete | documented eligibility and weighted selection contracts |

## Session D File Coverage

| File | Status | Notes |
|---|---|---|
| src/domains/simulation/services/engine.ts | complete | documented engine state ownership and API contracts |
| src/domains/simulation/services/create_run.ts | complete | documented deterministic run creation helpers/contracts |
| src/domains/simulation/services/play_turn.ts | complete | documented orchestration helper contracts |
| src/domains/simulation/services/get_turn_briefing.ts | complete | documented briefing snapshot contracts |
| src/domains/simulation/services/get_run_outcome.ts | complete | documented outcome snapshot contracts |
| src/domains/simulation/services/simulation_runner.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/simulation/services/content_audit_contract.ts | complete | documented audit contract taxonomy and report model |
| src/domains/simulation/services/index.ts | complete | added barrel export docs |
| src/domains/simulation/services/audit/content_audit_report_builder.ts | complete | documented report synthesis helper contracts |
| src/domains/simulation/services/audit/scenario_balance_targets_audit.ts | complete | documented target envelope audit contract |
| src/domains/simulation/services/audit/stakeholder_balance_audit.ts | complete | documented telemetry-based stakeholder audit contract |
| src/domains/simulation/services/audit/structural_content_audit.ts | complete | documented structural content audit contract |

## Session E File Coverage

| File | Status | Notes |
|---|---|---|
| src/domains/persistence/index.ts | complete | added domain barrel docs |
| src/domains/persistence/adapters/index.ts | complete | added adapter barrel docs |
| src/domains/persistence/adapters/local_storage_save_adapter.ts | complete | documented adapter contracts and storage resolution behavior |
| src/domains/persistence/services/index.ts | complete | added service barrel docs |
| src/domains/persistence/services/persistence_error.ts | complete | documented error taxonomy contract |
| src/domains/persistence/services/persistence_result.ts | complete | documented result union helpers |
| src/domains/persistence/services/serialize_save_file.ts | complete | documented save-file payload contract |
| src/domains/persistence/services/deserialize_save_file.ts | complete | documented save-file validation/deserialization contract |
| src/domains/persistence/services/serialize_exact_run.ts | complete | documented exact-run export and outcome snapshot contracts |
| src/domains/persistence/services/deserialize_exact_run.ts | complete | documented exact-run validation/deserialization contract |
| src/domains/persistence/services/validation.ts | complete | documented validation helper and type-guard contracts |
| src/domains/reporting/services/build_share_payload.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/reporting/services/share_payload.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/reporting/services/share_serialization.ts | complete | existing docs reviewed and retained as architecture-aligned |
| src/domains/reporting/services/index.ts | complete | reporting service export docs reviewed |

## Session F Partial File Coverage

| File | Status | Notes |
|---|---|---|
| src/app/router/index.ts | complete | documented router configuration and run-restore guard contract |
| src/shared/contracts/index.ts | complete | added shared contracts barrel docs |
| src/shared/contracts/simulation_runtime.ts | complete | documented runtime status/phase/change-record contracts |
| src/shared/random/seeded_random.ts | complete | clarified deterministic seeded RNG contract |
| src/types/spdx-expression-validate.d.ts | complete | documented ambient module declaration intent |
| src/ui/views/game_view.vue | complete | added view-level ownership and boundary docs |
| src/ui/views/end_of_run_view.vue | complete | added view-level ownership and boundary docs |
| src/ui/views/run_setup_view.vue | complete | added view-level ownership and boundary docs |
| src/ui/components/cards/action_card.vue | complete | added component ownership and boundary docs |
| src/ui/components/common/run_intro_splash.vue | complete | added component ownership and boundary docs |
| src/ui/components/cards/card_details_modal.vue | complete | added component ownership and boundary docs |
| src/ui/components/results/share_result_card.vue | complete | added component ownership docs |
| src/ui/components/surfaces/AppFrame.vue | complete | added component primitive ownership docs |

## Findings Backlog

| ID | Area | Finding | Evidence | Importance (1-5) | Effort (1-5) | Priority (I/E) | Risk | Bucket | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | ui | Large view file likely high cognitive load for maintenance | src/ui/views/game_view.vue | 4 | 4 | 1.00 | medium | schedule | unassigned | open |
| F-002 | simulation | Orchestration concentration in one service may reduce readability/testability | src/domains/simulation/services/simulation_runner.ts | 5 | 3 | 1.67 | medium | schedule | unassigned | open |
| F-003 | ui | Mixed component filename casing may reduce consistency | src/ui/components | 2 | 2 | 1.00 | low | watch | unassigned | open |
| F-004 | simulation | Repeated score/stakeholder change conversion helpers across rule files suggest shared utility opportunity | src/domains/simulation/rules/resolve_action.ts | 3 | 2 | 1.50 | low | watch | unassigned | open |

## Boundary Integrity Checks

| Check | Area | Result | Notes |
|---|---|---|---|
| simulation imports UI/browser APIs | simulation | pass | code usage check passed; only comment mention in engine.ts |
| UI contains gameplay rule logic | ui | pending | run in S6 |
| persistence modifies gameplay behavior | persistence | pass | persistence modules are serialization/validation/adapters only |
| reporting modifies simulation state | reporting | pass | reporting modules are payload building/encoding only |

## Terminology Consistency Checks

| Area | Checked Terms | Issues Found | Action |
|---|---|---|---|
| full codebase | playerClass, endingType, avatarRole | pending | run in S6 + final sweep |

## Next Actions

1. Execute Session F for app/shared/types and UI documentation pass
2. Prioritize largest UI files and store/composable boundaries first
3. Run targeted UI/domain integration tests and finish terminology sweep
