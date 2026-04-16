# Stakeholder Diagnostics And Explainability Spec

Date: 2026-04-11
Status: Proposed
Scope: Simulation diagnostics, content balancing workflow, simulation runner telemetry, and UI explainability

This is the stakeholder-focused module spec within the broader audit framework defined in [docs/CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md](./CONTENT_FAIRNESS_AND_BALANCE_AUDIT_SPEC.md).

## 1. Problem Statement

Players can observe stakeholder satisfaction dropping into Concerned or Critical states and may later improve overall scores without seeing the stakeholder recover.

This creates two distinct problems:

1. Balance ambiguity: it is not always clear whether recovery paths are sufficiently present and reachable in authored rules.
2. Explainability gap: the UI shows stakeholder status, but not the active reasons behind that status or what would improve it.

The current behavior is not necessarily a simulation bug. It appears to be a combination of authored rule strictness, rule stacking behavior, and limited player-facing explanation.

## 2. Goals

1. Preserve strict domain separation.
2. Make stakeholder causality inspectable without re-implementing rule logic in the UI.
3. Improve balancing workflow so stakeholder recovery paths are measurable.
4. Allow the simulation runner to report whether stakeholder reactions are sensible over many runs.
5. Provide players with a clear explanation of why a stakeholder is Concerned or Critical and what kinds of changes would improve that state.

## 3. Non-Goals

1. No UI-side condition evaluation.
2. No browser or Vue concerns in simulation.
3. No ad hoc hard-coded stakeholder heuristics in components.
4. No schema-breaking content changes in this phase unless explicitly approved later.

## 4. Architectural Constraints

This spec follows the repository rules in [AGENT.md](../AGENT.md) and [ARCHITECTURE.md](../ARCHITECTURE.md).

Required boundaries:

1. Simulation owns rule evaluation and causal diagnosis.
2. Content owns authored thresholds, deltas, and stakeholder intent.
3. The simulation runner owns automated telemetry for balancing and audits.
4. UI owns presentation of already-computed diagnostics.
5. Persistence and reporting remain non-authoritative and must not alter gameplay behavior.

## 5. Current Findings

### 5.1 Rule balance shape

The current stakeholder reaction content is directionally imbalanced.

Observed audit summary:

1. 20 stakeholder reaction rules total.
2. 13 rules have net-negative stakeholder satisfaction deltas.
3. 7 rules have net-positive stakeholder satisfaction deltas.
4. Most stakeholders have 1 positive rule and 2 negative rules.

### 5.2 Recovery path dependence

Current authored content does not use direct stakeholder_changes on cards or events in the main content pack.

Observed audit summary:

1. Cards with stakeholder_changes: 0 / 29.
2. Events with stakeholder_changes: 0 / 12.

This means stakeholder recovery depends almost entirely on stakeholder reaction rules.

### 5.3 Trigger strictness

Many positive rules use relatively high thresholds, while negative rules trigger earlier and more often.

Examples from current content:

1. `cto_wants_clarity` triggers at `Domain clarity < 40`.
2. `cto_celebrates_delivery` triggers at `Delivery confidence > 65`.
3. `vp_product_worried_about_users` triggers at `User trust < 45`.
4. `vp_product_celebrates_user_growth` triggers at `User trust > 70`.
5. `ops_manager_stressed_by_instability` triggers at `User trust < 40`.
6. `ops_manager_confident_in_stability` triggers at `User trust > 75`.

The effective player experience is often: preventing further decline is easier than earning recovery.

### 5.4 Rule stacking behavior

The stakeholder resolver in [src/domains/simulation/rules/resolve_stakeholder_rules.ts](../src/domains/simulation/rules/resolve_stakeholder_rules.ts) currently applies all matched rules for a stakeholder in a turn.

Priority only determines ordering in the reaction record. It does not currently suppress lower-priority matches.

This can create compounded downward movement when both mild and severe negative rules are simultaneously eligible.

### 5.5 UI explanation gap

The current UI surfaces show stakeholder satisfaction values and labels, but not the active drivers behind them.

Current surfaces:

1. [src/ui/components/stakeholders/stakeholder_hud.vue](../src/ui/components/stakeholders/stakeholder_hud.vue)
2. [src/ui/components/stakeholders/stakeholder_panel.vue](../src/ui/components/stakeholders/stakeholder_panel.vue)
3. [src/ui/components/common/game_hud_sidebar.vue](../src/ui/components/common/game_hud_sidebar.vue)

The turn-resolution panel shows triggered reactions for the last turn, but does not provide durable diagnostic context for current stakeholder state.

## 6. Proposed Strategy

The fix should be separated into four coordinated layers.

1. Simulation diagnostics
2. Content balancing and authored recovery paths
3. Simulation runner telemetry expansion
4. UI explainability surfaces

## 7. Simulation Diagnostics Spec

### 7.1 Purpose

Simulation must expose enough structured diagnostic data for the UI and the runner to explain stakeholder state without duplicating business logic.

### 7.2 New model additions

Add a new diagnostics model under `src/domains/simulation/model`.

Proposed interfaces:

```ts
export interface StakeholderRuleEvaluationRecord {
  rule_ref: VersionedContentRef
  stakeholder_id: string
  matched: boolean
  priority: number
  condition_description: string
  stakeholder_delta: number
  score_deltas: ScoreChangeRecord[]
}

export interface StakeholderInfluenceSummary {
  stakeholder_id: string
  starting_satisfaction: number
  ending_satisfaction: number
  net_delta: number
  matched_rule_refs: VersionedContentRef[]
  matched_rules: StakeholderRuleEvaluationRecord[]
  unmet_positive_rule_refs: VersionedContentRef[]
  unmet_negative_rule_refs: VersionedContentRef[]
}

export interface StakeholderResolutionDiagnostics {
  by_stakeholder: Record<string, StakeholderInfluenceSummary>
}
```

### 7.3 Placement

The diagnostics payload should be produced during stakeholder resolution in simulation and attached to turn-resolution outputs.

Suggested attachment points:

1. `TurnResolutionContext`
2. `TurnHistoryEntry`
3. Simulation runner per-turn telemetry derived from history

### 7.4 Rules for diagnostics generation

1. Diagnostics must be deterministic.
2. Diagnostics must use the same authored rules and condition evaluation logic as gameplay.
3. Diagnostics must not change gameplay state.
4. Diagnostics must distinguish matched vs unmatched rules.
5. Diagnostics must not rely on UI labels or presentation concerns.

### 7.5 Optional near-miss support

Near-miss diagnostics are useful but should be added only if they can be represented cleanly.

Potential future addition:

```ts
export interface RuleNearMissRecord {
  rule_ref: VersionedContentRef
  stakeholder_id: string
  target_type: 'score' | 'stakeholder'
  target_id: string
  operator: string
  expected_value: number
  actual_value: number
}
```

This is useful for UI messaging such as "Needs User Trust above 70".

## 8. Stakeholder Rule Semantics Decision

The current behavior applies all matched rules for a stakeholder each turn. This should become an explicit design choice.

### Option A: Keep stacking

Pros:

1. Reflects compounding organizational pressure.
2. Preserves current engine behavior.
3. Makes stakeholder states more dynamic and punishing.

Cons:

1. Can create unintuitive downward spikes.
2. Makes recovery harder unless content is carefully tuned.
3. Can feel unfair if not clearly explained.

### Option B: Highest-priority-only

Pros:

1. Easier to reason about.
2. Easier to balance.
3. Cleaner player explanations.

Cons:

1. Changes gameplay semantics.
2. Loses some sense of compound pressure.
3. Requires clear migration and retuning.

### Recommendation

Do not change semantics until diagnostics telemetry is added and a balance pass confirms whether stacking is the actual source of player confusion.

If stacking remains, diagnostics and UI must make stacked causes visible.

## 9. Content Balancing Spec

### 9.1 Objective

Ensure each stakeholder has realistic paths for both deterioration and recovery within a normal scenario run.

### 9.2 Content audit requirements

For each stakeholder in each scenario, assess:

1. Number of negative rules
2. Number of positive rules
3. Earliest likely turn for negative trigger
4. Earliest likely turn for positive trigger
5. Expected trigger frequency over automated runs
6. Maximum net negative swing per turn
7. Maximum net positive swing per turn

### 9.3 Balance targets

Initial proposed targets:

1. Every stakeholder must have at least one reachable positive recovery path in the scenario horizon.
2. Positive rules should be reachable in successful and partial-success runs, not only idealized runs.
3. Severe negative rules should be rare enough to feel exceptional.
4. If stacking remains, mild and severe rules for the same stakeholder should not routinely stack every turn.

### 9.4 Content-change rules

If authored thresholds or deltas change, follow [CONTENT_VERSIONING.md](../CONTENT_VERSIONING.md).

Gameplay-affecting changes require new content versions. Behavior changes should always be documented clearly.

### 9.5 Preferred content-level fixes

Preferred levers, in order:

1. Adjust positive trigger thresholds downward where recovery is too rare.
2. Reduce repeated negative trigger severity where decline is too sticky.
3. Add additional positive rules where a stakeholder has only one narrow path to recovery.
4. Add carefully chosen direct stakeholder_changes on cards or events only when design intent calls for immediate stakeholder reaction, not as a blanket fix.

## 10. Simulation Runner Telemetry Spec

### 10.1 Purpose

The runner should provide enough telemetry to answer whether stakeholder reactions make sense across many runs.

### 10.2 Current gap

Current per-run telemetry includes:

1. Final stakeholder satisfaction
2. Reaction frequency by applied rule id

This is not enough to analyze why stakeholders stay low or fail to recover.

### 10.3 New per-run telemetry

Extend `PerRunTelemetry` in [src/domains/simulation/services/simulation_runner.ts](../src/domains/simulation/services/simulation_runner.ts).

Proposed additions:

```ts
export interface StakeholderTurnTelemetry {
  turn_number: number
  satisfaction_by_stakeholder: Record<string, number>
  delta_by_stakeholder: Record<string, number>
  matched_reaction_rule_ids_by_stakeholder: Record<string, string[]>
}
```

Add to `PerRunTelemetry`:

```ts
stakeholder_telemetry_by_turn: StakeholderTurnTelemetry[]
```

### 10.4 New aggregate telemetry

Proposed additions:

```ts
average_stakeholder_satisfaction_by_turn: Record<string, number[]>
stakeholder_recovery_rate: Record<string, number>
stakeholder_decline_rate: Record<string, number>
rule_trigger_rate_by_stakeholder: Record<string, Record<string, number>>
```

### 10.5 CLI output additions

Enhance [scripts/run-simulation.ts](../scripts/run-simulation.ts) formatted output with:

1. Average stakeholder satisfaction by turn
2. Top negative rules by stakeholder
3. Top positive rules by stakeholder
4. Recovery trigger hit rate
5. Percentage of runs where a stakeholder ends below neutral despite successful outcome

## 11. UI Explainability Spec

### 11.1 Principle

UI must only render simulation-provided diagnostics. It must not independently infer rule eligibility.

### 11.2 Primary UI addition

Add a Stakeholder Drivers surface in the gameplay UI.

Possible placements:

1. Expandable section in the sidebar stakeholder panel
2. Detail modal or drawer from stakeholder HUD
3. Inline detail card under each stakeholder in desktop sidebar

### 11.3 Required fields to show

For each stakeholder:

1. Current satisfaction value and label
2. Net change this turn
3. Active matched rules affecting the stakeholder this turn
4. Human-readable reason text from authored rule name and description
5. Impacted metrics this turn
6. Optional next-step hint derived from unmet positive rules, if diagnostics include near-miss data

### 11.4 Example UI copy model

Presentation only. The simulation provides the facts.

Example display:

1. "Concerned because User Trust is still below the stability threshold"
2. "This turn: Ops Manager reacted to instability"
3. "Improvement path: raise User Trust above 75 to regain confidence"

The wording layer belongs in UI, but the underlying causes must come from simulation diagnostics.

### 11.5 Persistence of explanation

Stakeholder explanation should not be limited to the last-turn popup.

Players need a durable view of:

1. Why the stakeholder is in the current state now
2. What has changed recently
3. What would improve the relationship

## 12. Reporting And Share Surface

Reporting may later summarize stakeholder journey, but it must remain read-only.

Potential future additions:

1. End-of-run "hardest stakeholder to win back"
2. End-of-run "most improved stakeholder"
3. Reaction trend summaries over time

These should be derived from persisted turn history, not ad hoc UI state.

## 13. Proposed Implementation Sequence

### Phase 1: Diagnostics contract

1. Add stakeholder diagnostics types to simulation model.
2. Produce diagnostics in stakeholder resolution.
3. Attach diagnostics to turn resolution and turn history.
4. Add simulation tests covering diagnostics correctness.

### Phase 2: Runner telemetry

1. Extend per-run telemetry with stakeholder-by-turn detail.
2. Extend aggregate telemetry with stakeholder trend summaries.
3. Update simulation CLI formatting.
4. Add runner tests if present, or simulation service tests around telemetry generation.

### Phase 3: Content balance audit

1. Run telemetry across all scenarios.
2. Identify stakeholders with weak or unreachable recovery paths.
3. Tune content thresholds and deltas.
4. Version content as required by policy.

### Phase 4: UI explainability

1. Add stakeholder drivers presentation surface.
2. Show durable current-state explanation.
3. Show recent turn deltas and matched rules.
4. Avoid any UI-side condition evaluation.

## 14. Testing Requirements

### Simulation tests

1. Diagnostics payload matches the rules actually applied.
2. Diagnostics do not alter gameplay outputs.
3. Rule stacking semantics are explicitly tested.
4. Turn history preserves enough information for later reporting.

### Content tests

1. Every stakeholder has at least one positive rule in scenarios where long-term recovery is intended.
2. Positive rules parse correctly.
3. Severe and mild negative rules do not combine too frequently unless intentionally designed.

### UI tests

1. UI renders diagnostics without deriving its own logic.
2. Explanations remain stable across refreshes when state is unchanged.
3. Empty diagnostics states degrade gracefully.

## 15. Open Questions

1. Should stakeholder rules continue stacking or should priority become exclusive?
2. Should cards and events gain limited direct stakeholder_changes for clearer immediate feedback?
3. Is near-miss diagnostic support worth the added contract complexity in this phase?
4. Should stakeholder thresholds remain generic across UI labels, or become stakeholder-specific in presentation?

## 16. Acceptance Criteria

This spec is satisfied when:

1. A player can inspect why a stakeholder is Concerned or Critical without the UI re-evaluating rules.
2. Designers can run automated audits and identify which rules are driving decline or blocking recovery.
3. The simulation runner can report stakeholder trajectories and reaction drivers across many runs.
4. Any balance changes remain content-owned and version-aware.
5. No gameplay business logic is moved into the UI.
