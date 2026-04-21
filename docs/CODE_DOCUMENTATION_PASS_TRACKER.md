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
| 2026-04-20 | S6 | app/shared/types + ui + tests | 100+ files | 100+ files | complete; app/shared and UI surfaces fully documented including leaf components and prototypes |

## Domain Progress

| Domain | File Count | Status | Notes |
|---|---:|---|---|
| content | 17 | complete | model and services documentation pass complete |
| simulation | 31 | complete | model, rules, and services documentation pass complete |
| persistence | 11 | complete | adapters and services documentation pass complete |
| reporting | 4 | complete | share payload and serialization docs complete |
| ui | 100 | complete | major and leaf surfaces documented; prototypes and ui service layer reviewed |

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
| S6 (partial 4) | UI/store high-impact docs | npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts tests/simulation/turn_pipeline.test.ts | pass (3 files, 42 tests) |
| S6 (partial 5) | UI composables/config/types docs | npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts tests/simulation/strategy_fingerprint_telemetry.test.ts | pass (3 files, 54 tests) |
| S6 (partial 6) | UI boundary + regression check | grep rule-import check in src/ui/src/app; npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts tests/simulation/turn_pipeline.test.ts tests/simulation/strategy_fingerprint_telemetry.test.ts | pass (type-only imports only; 4 files, 64 tests) |
| S6 (partial 7) | additional gameplay/result UI docs | npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts tests/simulation/turn_pipeline.test.ts tests/simulation/strategy_fingerprint_telemetry.test.ts | pass (4 files, 64 tests) |
| S6 (final) | leaf UI + icon + prototype completion | npx vitest run tests/reporting/share_payload.test.ts tests/simulation/engine_shell.test.ts tests/simulation/turn_pipeline.test.ts tests/simulation/strategy_fingerprint_telemetry.test.ts; final UI boundary/terminology grep sweep | pass (4 files, 64 tests; boundary and terminology sweeps clean) |

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
| src/ui/stores/game_store.ts | complete | added store-level orchestration ownership docs |
| src/ui/components/scenario/scenario_banner.vue | complete | added component ownership docs |
| src/ui/components/common/game_hud_sidebar.vue | complete | added component ownership and boundary docs |
| src/ui/components/surfaces/surface_modal_panel.vue | complete | added component ownership docs |
| src/ui/components/cards/quest_card.vue | complete | added component ownership docs |
| src/ui/composables/gameplay_stage_presentation.ts | complete | documented presentation-only actor/scene helper contracts |
| src/ui/composables/presentation_asset_lookup.ts | complete | documented asset lookup helper contracts |
| src/ui/composables/stakeholder_presentation.ts | complete | documented stakeholder display-name helper contracts |
| src/ui/composables/system_coupling.ts | complete | documented presentation-only coupling adapter boundary |
| src/ui/composables/tutorial_state.ts | complete | clarified module-scoped tutorial UI state ownership |
| src/ui/composables/card_filter_sort.ts | complete | clarified UI-only filtering/sorting ownership |
| src/ui/composables/category_presentation.ts | complete | reviewed shared category presentation docs |
| src/ui/composables/class_artwork.ts | complete | reviewed class artwork helper docs |
| src/ui/composables/metric_presentation.ts | complete | documented metric display contract |
| src/ui/composables/scenario_presentation.ts | complete | documented compact scenario copy helper |
| src/ui/composables/scene_avatar_positioning.ts | complete | documented preview/placement guardrail contracts |
| src/ui/composables/stakeholder_drivers.ts | complete | documented stakeholder driver row mapping |
| src/ui/composables/stakeholder_reaction_bubbles.ts | complete | documented deterministic speech bubble helper contracts |
| src/ui/config/presentation_asset_registry.ts | complete | documented central UI asset registry intent |
| src/ui/config/presentation_asset_types.ts | complete | documented presentation-only asset ids/types |
| src/ui/config/presentation_avatar_registry.ts | complete | documented avatar asset registry and fallback contracts |
| src/ui/config/presentation_scene_registry.ts | complete | documented scene asset registry and fallback contracts |
| src/ui/config/scene_avatar_preview_config.ts | complete | documented preview config types/options |
| src/ui/config/stakeholder_reaction_bubble_language.ts | complete | documented speech-bubble tone registry |
| src/ui/types/artwork.ts | complete | reviewed existing artwork metadata docs and retained them |
| src/ui/types/quest_display_model.ts | complete | reviewed existing quest display model docs and retained them |
| src/ui/views/share_view.vue | complete | documented share-link decode/fallback ownership |
| src/ui/views/welcome_view.vue | complete | documented landing-page navigation and modal boundary |
| src/ui/components/results/outcome_panel.vue | complete | documented outcome presentation-only role |
| src/ui/components/scores/score_panel.vue | complete | documented system-health panel derivation rules |
| src/ui/components/stakeholders/stakeholder_panel.vue | complete | documented stakeholder snapshot display ownership |
| src/ui/components/preview/scene_avatar_preview_surface.vue | complete | documented preview-surface guardrail ownership |
| src/ui/components/turn/turn_briefing_panel.vue | complete | documented current-turn briefing and urgency cues |
| src/ui/components/turn/turn_resolution_panel.vue | complete | documented resolved-turn rendering boundary |
| src/ui/components/scores/score_hud.vue | complete | documented compact score HUD and detail popover |
| src/ui/components/stakeholders/stakeholder_hud.vue | complete | documented compact stakeholder HUD ownership |
| src/ui/components/preview/scene_avatar_preview_workbench.vue | complete | documented preview workbench as presentation tooling |
| src/ui/components/gameplay/scene_stage.vue | complete | documented live stage rendering boundary |
| src/ui/components/stakeholders/StakeholderDriversPanel.vue | complete | documented stakeholder reaction row presentation |
| src/ui/components/scores/system_coupling_warnings.vue | complete | documented coupling warning adapter ownership |
| src/ui/components/common/game_hud_bar.vue | complete | documented persistent HUD aggregation role |
| src/ui/components/events/event_card.vue | complete | documented event card presentation contract |
| src/ui/components/events/event_details_modal.vue | complete | documented informational event-inspection modal |
| src/ui/components/common/AppSelect.vue | complete | documented native-select wrapper ownership |
| src/ui/components/common/AppInput.vue | complete | documented native-input wrapper ownership |
| src/ui/components/common/about_modal.vue | complete | documented informational modal ownership |
| src/ui/components/tutorial/tutorial_hint_panel.vue | complete | documented inline tutorial hint ownership |
| src/ui/components/branding/game_logo.vue | complete | documented brand lockup ownership |
| src/ui/components/branding/game_masthead.vue | complete | documented top-level masthead ownership |
| src/ui/components/branding/logo_sigil.vue | complete | documented sigil primitive ownership |
| src/ui/components/cards/card_satchel_drawer.vue | complete | documented satchel drawer ownership |
| src/ui/components/cards/class_card.vue | complete | documented class selection tile ownership |
| src/ui/components/cards/satchel_toggle_button.vue | complete | documented satchel launcher ownership |
| src/ui/components/cards/satchel_toolbar.vue | complete | documented satchel filter/sort toolbar ownership |
| src/ui/components/common/class_portrait.vue | complete | documented portrait primitive ownership |
| src/ui/components/common/dungeon_master_modal.vue | complete | documented creator links modal ownership |
| src/ui/components/common/mobile_notice.vue | complete | documented mobile notice lifecycle ownership |
| src/ui/components/common/rules_modal.vue | complete | documented rules modal ownership |
| src/ui/components/common/site_footer.vue | complete | documented site footer intent |
| src/ui/components/common/social_links_panel.vue | complete | documented social-links panel ownership |
| src/ui/components/icons/IconBarChart.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconGroup.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconLightning.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconMegaphone.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconSatchel.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconScroll.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconSpell.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconSwords.vue | complete | documented icon primitive ownership |
| src/ui/components/icons/IconTarget.vue | complete | documented icon primitive ownership |
| src/ui/components/surfaces/surface_drawer_panel.vue | complete | documented drawer surface primitive ownership |
| src/ui/components/surfaces/surface_frame_container.vue | complete | documented frame container primitive ownership |
| src/ui/components/surfaces/surface_side_panel.vue | complete | documented side-panel primitive ownership |
| src/ui/components/tutorial/tutorial_complete_splash.vue | complete | documented tutorial completion splash ownership |
| src/ui/components/tutorial/tutorial_exit_bar.vue | complete | documented tutorial exit bar ownership |
| src/ui/components/tutorial/tutorial_pointer_arrow.vue | complete | documented tutorial pointer ownership |
| src/ui/components/cards/AppCard.vue | complete | reviewed existing docs and retained them |
| src/ui/components/common/AppBadge.vue | complete | reviewed existing docs and retained them |
| src/ui/components/common/AppButton.vue | complete | reviewed existing docs and retained them |
| src/ui/components/common/AppProgress.vue | complete | reviewed existing docs and retained them |
| src/ui/components/common/AppTabs.vue | complete | reviewed existing docs and retained them |
| src/ui/components/common/CompactButton.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonActionCardPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonBadgePrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonButtonPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonCardPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonEventCardPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonFramePrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonModalPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonProgressPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonScenarioBannerPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/prototypes/dungeon/DungeonTabsPrototype.vue | complete | reviewed existing docs and retained them |
| src/ui/services/quest_loader.ts | complete | reviewed existing docs and retained them |

## Findings Backlog

| ID | Area | Finding | Evidence | Importance (1-5) | Effort (1-5) | Priority (I/E) | Risk | Bucket | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | ui | Large view file likely high cognitive load for maintenance | src/ui/views/game_view.vue | 4 | 4 | 1.00 | medium | schedule | unassigned | open |
| F-002 | simulation | Orchestration concentration in one service may reduce readability/testability | src/domains/simulation/services/simulation_runner.ts | 5 | 3 | 1.67 | medium | schedule | unassigned | open |
| F-003 | ui | Mixed component filename casing may reduce consistency | src/ui/components | 2 | 2 | 1.00 | low | watch | unassigned | open |
| F-004 | simulation | Repeated score/stakeholder change conversion helpers across rule files suggest shared utility opportunity | src/domains/simulation/rules/resolve_action.ts | 3 | 2 | 1.50 | low | watch | unassigned | open |
| F-005 | ui | UI imports outcome archetype types from simulation rule modules, suggesting contract leakage that could be moved to a shared reporting/runtime type surface | src/ui/components/results/share_result_card.vue | 3 | 2 | 1.50 | low | watch | unassigned | open |
| F-006 | ui | Main game store centralizes many concerns (content loading, run lifecycle, persistence, tutorial triggers, modal state), increasing maintenance cost | src/ui/stores/game_store.ts | 4 | 3 | 1.33 | medium | schedule | unassigned | open |

## Boundary Integrity Checks

| Check | Area | Result | Notes |
|---|---|---|---|
| simulation imports UI/browser APIs | simulation | pass | code usage check passed; only comment mention in engine.ts |
| UI contains gameplay rule logic | ui | pass | final sweep confirms no direct rule execution; only limited type-only imports from simulation rule modules |
| persistence modifies gameplay behavior | persistence | pass | persistence modules are serialization/validation/adapters only |
| reporting modifies simulation state | reporting | pass | reporting modules are payload building/encoding only |

## Terminology Consistency Checks

| Area | Checked Terms | Issues Found | Action |
|---|---|---|---|
| full codebase | playerClass, endingType, avatarRole | 0 blocking issues | final S6 sweep remains clean; uses are expected naming/state references |

## Next Actions

1. Prepare interim ranked findings update from accumulated tracker entries
2. Produce final cleanup/refactor analysis from template using evidence in this tracker
