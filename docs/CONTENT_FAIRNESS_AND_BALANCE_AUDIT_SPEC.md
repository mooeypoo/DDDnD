# Content Fairness And Balance Audit Spec

Date: 2026-04-11
Status: Proposed
Scope: Reusable audit framework for authored content packs, scenario balance, fairness analysis, simulation telemetry, and diagnostic reporting

## 1. Purpose

DDDnD is expected to eventually support externally authored content packs containing scenarios, stakeholders, cards, events, delayed effects, and other gameplay content.

To support that future safely, the project needs a reusable audit toolchain that can evaluate:

1. correctness of authored gameplay behavior
2. scenario completeness
3. balance and fairness
4. reachability of recovery and success paths
5. volatility and randomness pressure
6. stakeholder behavior clarity and balance

The current `npm run simulate` runner already provides the seed of this capability. This spec expands that direction into a general content-audit framework.

## 2. Design Goals

1. Work across first-party and future external content packs.
2. Remain deterministic and domain-owned.
3. Separate simulation truth from UI presentation.
4. Detect both structural issues and experiential issues.
5. Produce outputs that help both designers and future content authors.
6. Support targeted audits such as stakeholder balance without being limited to them.

## 3. Non-Goals

1. No gameplay logic in UI.
2. No browser-specific tooling inside simulation services.
3. No automatic content mutation or self-healing.
4. No replacement of schema validation; this complements validation.
5. No promise that every balance issue can be judged from static checks alone.

## 4. Boundary Rules

This spec follows [AGENT.md](../AGENT.md) and [ARCHITECTURE.md](../ARCHITECTURE.md).

Domain ownership:

1. Content domain owns authored structures and validation.
2. Simulation domain owns behavioral execution and causal diagnostics.
3. Simulation runner owns multi-run telemetry and audit summaries.
4. UI may render audit results in internal tools later, but does not calculate them.
5. Reporting may summarize audit results, but does not influence gameplay.

## 5. Why A Holistic Audit Tool Is The Right Direction

A stakeholder-only balance fix would address the immediate symptom, but it would not solve the larger future problem of making content packs trustworthy and debuggable.

A holistic audit tool is better because it can answer broader questions such as:

1. Is the scenario too easy or too punishing?
2. Are success paths reachable with varied play styles?
3. Are random events overpowering player agency?
4. Do cards create dead ends or dominant strategies?
5. Are some stakeholders much harder to satisfy than intended?
6. Are some scores effectively irrelevant?
7. Are certain content pieces missing entirely for a scenario's design goals?

Stakeholder balance should therefore be treated as one audit dimension inside a general balance and fairness framework.

## 6. Audit Layers

The proposed framework should have four audit layers.

### 6.1 Structural audit

Purpose: detect missing or malformed authored support.

Examples:

1. scenario references missing content
2. stakeholders with no recovery path
3. scenarios lacking enough playable card variety
4. event pools that are too small or one-dimensional
5. cards that can never become playable
6. outcome tiers that are unreachable

### 6.2 Behavioral audit

Purpose: inspect actual simulation outcomes over many deterministic runs.

Examples:

1. win rate too low or too high
2. stakeholder recovery almost never occurs
3. one score collapses in most successful runs
4. one event dominates total pressure
5. one card sequence becomes overwhelmingly optimal

### 6.3 Causal audit

Purpose: explain why outcomes happened.

Examples:

1. which rules drove stakeholder decline
2. which event chains caused failure spikes
3. which aftershocks created delayed collapses
4. which cards correlated with recovery or collapse

### 6.4 Fairness audit

Purpose: judge whether pressure and recovery opportunities feel proportionate.

Examples:

1. negative triggers are much easier than positive recovery triggers
2. random events dominate outcomes over player decisions
3. feedback is too delayed to allow course correction
4. a stakeholder can enter Concerned but has no realistic way out

## 7. Core Audit Questions

For every scenario or external content pack, the audit framework should be able to answer:

1. Is the scenario structurally complete?
2. Is the scenario consistently playable?
3. What is the win-rate distribution under baseline play?
4. Which scores trend upward or downward across runs?
5. Which stakeholders are persistently dissatisfied?
6. What rules or events most often create failure states?
7. What rules or cards most often create recovery?
8. Are there obvious dominant strategies?
9. Are there dead or trap cards that look useful but rarely help?
10. Are there missing content pathways for recovery, mitigation, or explanation?

## 8. Proposed Tooling Model

The general framework should be built as a layered diagnostic system.

## 8A. Relationship To The Existing Simulation Runner

The general audit framework should not introduce a second dynamic execution system parallel to the current simulation runner.

### Decision

The audit framework should include and extend the current simulation runner, not replace it with a separate overlapping runtime.

### Reasoning

1. The current runner in [src/domains/simulation/services/simulation_runner.ts](../src/domains/simulation/services/simulation_runner.ts) already owns deterministic multi-run execution.
2. Dynamic balance auditing is fundamentally the same execution concern with richer telemetry and synthesized findings.
3. Creating a second system for multi-run gameplay would duplicate logic, increase drift risk, and make future external content-pack validation harder to trust.

### Architectural recommendation

Treat the current simulation runner as the canonical dynamic-execution core.

Build the broader audit system around it in three layers:

1. `simulation_runner` as the deterministic execution and telemetry producer
2. static content audit modules as non-simulation checks
3. audit synthesis modules that consume static checks plus runner telemetry and emit findings

### What should change over time

The runner should evolve from a pure telemetry utility into a reusable audit foundation.

That means extending it with:

1. richer per-turn telemetry
2. richer aggregate telemetry
3. machine-readable outputs designed for audit consumption

It should not gain UI concerns or content mutation behavior.

### CLI recommendation

The CLI should remain clear and non-duplicative.

Recommended future shape:

1. Keep `npm run simulate` as the low-level dynamic simulation command.
2. Add a higher-level audit entry point that uses the same runner internally and combines it with static checks.
3. Ensure both commands share the same dynamic execution path and telemetry contracts.

This keeps responsibilities clear:

1. `simulate` = raw deterministic run data and telemetry
2. `audit` = structural checks + simulation telemetry + synthesized findings

### Migration guidance

Do not rewrite the runner first.

Instead:

1. extend current runner contracts
2. keep existing CLI behavior working
3. layer the new audit report on top of runner outputs
4. only rename or reorganize internals later if the architecture becomes clearer after adoption

### 8.1 Static content audit

Runs without gameplay simulation.

Responsibilities:

1. check pack completeness
2. detect missing references
3. detect asymmetric authored support
4. identify reachability risks from raw thresholds and requirements

Example outputs:

1. stakeholder has 2 negative rules and no positive rules
2. scenario has 1 random event that can trigger every turn and no offsetting positive events
3. card requirements create late-game lockout for too many actions

### 8.2 Dynamic simulation audit

Runs many deterministic games using the simulation runner.

Responsibilities:

1. observe actual outcome distributions
2. track turn-by-turn score and stakeholder trajectories
3. collect trigger frequencies for events, reactions, and aftershocks
4. detect outlier volatility and stagnant states

### 8.3 Diagnosis synthesis

Consumes static and dynamic results and produces judgments.

Responsibilities:

1. severity classification
2. category classification
3. recommended fix surface

Fix surface categories:

1. content tuning
2. simulation semantics decision
3. runner telemetry gap
4. UI explainability gap

## 9. Audit Categories

The audit report should support category-specific findings.

### 9.1 Scenario difficulty

Metrics:

1. overall win rate
2. partial success rate
3. average turns survived
4. success variance across seeds

Potential flags:

1. too hard
2. too easy
3. overly swingy
4. heavily seed-dependent

### 9.2 Score balance

Metrics:

1. average score by turn
2. frequency of collapse per score
3. score recovery frequency
4. successful low-score rates

Potential flags:

1. score is irrelevant
2. score is impossible to stabilize
3. score dominates all losses

### 9.3 Stakeholder balance

Metrics:

1. average stakeholder satisfaction by turn
2. final stakeholder satisfaction distribution
3. recovery rate after entering Concerned or Critical
4. matched positive and negative rule frequencies
5. per-turn net stakeholder delta distribution

Potential flags:

1. recovery path too narrow
2. decline path too easy
3. stacked pressure too punishing
4. explanation gap in UI

### 9.4 Event fairness

Metrics:

1. event frequency
2. event impact distribution
3. conditional event trigger rate
4. failure correlation by event

Potential flags:

1. event pool too punishing
2. low-agency randomness
3. event repetition too frequent

### 9.5 Card ecosystem balance

Metrics:

1. usage frequency
2. contribution to successful runs
3. contribution to failed runs
4. opening sequence concentration
5. trap card indicators

Potential flags:

1. dominant strategy
2. trap card
3. insufficient strategic diversity
4. dead card due to requirements or low payoff

### 9.6 Aftershock fairness

Metrics:

1. delayed effect frequency
2. average delayed impact by source
3. collapse correlation after delayed effects

Potential flags:

1. delayed punishment too opaque
2. insufficient warning before severe impact
3. delayed effects dominate player agency

## 10. Audit Output Format

The long-term tool should produce both machine-readable and human-readable output.

## 10A. Phase 1 Contract: Runner vs Audit Responsibilities

Phase 1 should define the boundary between raw dynamic telemetry and higher-level synthesized audit findings.

This is necessary to keep the system clear as it grows.

### 10A.1 Canonical responsibility split

The split should be:

1. `simulate` produces deterministic execution data and telemetry.
2. `audit` consumes simulation telemetry plus static content checks and emits findings.

The audit layer may reformat, summarize, classify, and score. It must not become a second gameplay execution path.

### 10A.2 What belongs in simulation runner telemetry

The runner should own data that is directly observed from executing gameplay.

This includes existing metrics and the next expanded set.

#### Required baseline telemetry

Keep these in the runner:

1. outcome distribution inputs
2. turns completed
3. final scores
4. final stakeholder satisfaction
5. cards played
6. events triggered
7. reactions triggered
8. score snapshots by turn

#### Phase 1 telemetry additions

Add these to the runner first:

```ts
export interface StakeholderTurnTelemetry {
  turn_number: number
  satisfaction_by_stakeholder: Record<string, number>
  delta_by_stakeholder: Record<string, number>
  matched_reaction_rule_ids_by_stakeholder: Record<string, string[]>
}

export interface EventTurnTelemetry {
  turn_number: number
  triggered_event_id: string | null
  score_deltas: Record<string, number>
  stakeholder_deltas: Record<string, number>
}

export interface ActionTurnTelemetry {
  turn_number: number
  selected_card_id: string
  score_deltas: Record<string, number>
  stakeholder_deltas: Record<string, number>
}
```

Add to `PerRunTelemetry`:

```ts
stakeholder_telemetry_by_turn: StakeholderTurnTelemetry[]
event_telemetry_by_turn: EventTurnTelemetry[]
action_telemetry_by_turn: ActionTurnTelemetry[]
```

These are still telemetry, not findings.

### 10A.3 What should remain out of the runner

The runner should not directly emit high-level judgments like:

1. scenario is too hard
2. stakeholder recovery path is too narrow
3. card X is a trap
4. event pool is unfair

Those are audit findings and belong in the audit synthesis layer.

### 10A.4 What belongs in audit synthesis

Audit synthesis should own:

1. threshold interpretation
2. severity classification
3. category tagging
4. recommended fix routing
5. scenario-level fairness conclusions

Example:

1. runner says VP Product recovered from Concerned in only 2% of runs
2. audit says recovery path is too narrow and classifies this as a `warning` under `stakeholder_balance`

### 10A.5 What belongs in static audit checks

Static checks should own judgments that can be derived without simulation.

Examples:

1. stakeholder has no positive rule refs
2. scenario contains too few event refs
3. card requirements reference impossible thresholds
4. scenario lacks a plausible mitigation card for a key failure vector

### 10A.6 Phase 1 CLI shape

The command split should be explicit.

#### `npm run simulate`

Purpose:

1. low-level deterministic run telemetry
2. useful for designers and debugging
3. useful as an input for later audit layers

Expected outputs:

1. existing formatted summary output
2. existing JSON mode
3. expanded JSON telemetry fields in `--json`

No high-level fairness score or warnings should be required here.

#### Future `npm run audit`

Purpose:

1. content-pack validation and fairness assessment
2. combines static checks and simulation telemetry
3. emits findings, severity, and recommended fix surfaces

Expected outputs:

1. summary scorecard
2. findings by severity and category
3. optional detailed JSON report
4. links between findings and raw evidence

### 10A.7 Phase 1 machine-readable contract

The immediate path should avoid breaking consumers unexpectedly.

Recommended contract strategy:

1. preserve existing report keys from `simulate_runs`
2. add new telemetry fields as additive keys
3. keep synthesized findings out of `SimulationReport`
4. define a separate `ContentAuditReport` for the future audit command

This keeps the layering clean:

1. `SimulationReport` = observed telemetry
2. `ContentAuditReport` = static checks + telemetry + findings

### 10A.8 Phase 1 implementation sequence

Concrete first step order:

1. extend simulation turn outputs if needed to make telemetry extraction reliable
2. extend `simulation_runner.ts` per-run telemetry
3. extend aggregate telemetry conservatively
4. update `scripts/run-simulation.ts` JSON output to include new additive fields
5. do not add audit findings yet to `simulate`
6. after telemetry stabilizes, build audit synthesis on top

### 10A.9 Phase 1 test plan

Required tests for this contract:

1. runner telemetry stays deterministic for same seed and same content
2. additive telemetry fields match turn history and turn resolution outputs
3. `simulate` output remains backward-compatible for existing fields
4. audit synthesis tests operate on runner output fixtures rather than re-running custom gameplay logic

### 10A.10 Example future workflow

1. content author creates scenario pack
2. static checks validate structural completeness
3. `simulate` produces raw telemetry over many runs
4. `audit` ingests static checks and telemetry
5. audit emits findings such as:
   - stakeholder recovery too narrow
   - event pool over-dominates failures
   - scenario difficulty highly seed-sensitive
   - one card sequence is dominating successful runs

### 10.1 Machine-readable report

Proposed top-level shape:

```ts
export interface ContentAuditReport {
  content_pack_id: string
  scenario_id: string
  scenario_version: number
  structural_checks: StructuralAuditSection
  dynamic_metrics: DynamicAuditSection
  findings: AuditFinding[]
  summary: AuditSummary
}
```

### 10.2 Findings model

```ts
export interface AuditFinding {
  id: string
  severity: 'info' | 'warning' | 'critical'
  category:
    | 'scenario_difficulty'
    | 'score_balance'
    | 'stakeholder_balance'
    | 'event_fairness'
    | 'card_ecosystem'
    | 'aftershock_fairness'
    | 'ui_explainability'
    | 'content_completeness'
  title: string
  description: string
  evidence: string[]
  recommended_fix_surface: 'content' | 'simulation' | 'runner' | 'ui' | 'docs'
}
```

### 10.3 Human-readable CLI output

The CLI should eventually provide:

1. summary scorecard
2. top findings by severity
3. category sections
4. recommended next actions

## 11. Specific Stakeholder Diagnostics Within The General Framework

The stakeholder work already specified in [docs/STAKEHOLDER_DIAGNOSTICS_AND_EXPLAINABILITY_SPEC.md](./STAKEHOLDER_DIAGNOSTICS_AND_EXPLAINABILITY_SPEC.md) should become the first concrete module inside this broader framework.

That means:

1. stakeholder diagnostics are not a separate competing tool
2. stakeholder telemetry becomes one category in the general audit report
3. UI explainability for stakeholders remains a scenario-facing consumer of domain diagnostics

## 12. Recommended Implementation Plan

### Phase 1: Generalize the spec layer

1. Keep the stakeholder spec as the detailed module spec.
2. Introduce this higher-level fairness audit spec.
3. Define naming and boundaries for a general audit report.

### Phase 2: Expand the simulation runner into a balance-audit foundation

1. extend per-run telemetry beyond final-state summaries
2. add turn-by-turn stakeholder and score trajectories
3. add rule and event causal traces
4. expose machine-readable JSON intended for audit consumption
5. preserve the runner as the single dynamic execution path used by both `simulate` and future audit tooling

### Phase 3: Add static content checks

1. stakeholder recovery path checks
2. card requirement reachability checks
3. event-pool composition checks
4. scenario completeness and strategic coverage checks

### Phase 4: Add synthesized findings

1. severity classification
2. finding categories
3. recommended fix surfaces
4. summary scorecard for scenario fairness

### Phase 5: Use the framework to address the current stakeholder issue

1. implement stakeholder diagnostics first
2. run the audit on the current scenarios
3. confirm whether the stakeholder problem is primarily caused by content thresholds, stacking behavior, missing direct recovery paths, or UI opacity
4. apply the smallest justified fix in the correct layer

## 13. Test Strategy

### 13.1 Tests for the general audit framework

1. static checks correctly flag deliberately malformed or incomplete scenarios
2. runner telemetry remains deterministic for same seed and content
3. aggregate findings are reproducible
4. no audit component changes gameplay outcomes
5. audit CLI and simulate CLI share the same dynamic telemetry source rather than diverging implementations

### 13.2 Tests for stakeholder-specific diagnostics

1. diagnostics match actually applied rules
2. matched and unmatched rules are reported correctly
3. recovery-path warnings trigger when a stakeholder has unrealistic positive reachability

### 13.3 Tests for fairness heuristics

These should be advisory, not brittle.

Recommended pattern:

1. threshold-based warnings instead of strict pass/fail when possible
2. explicit curated fixtures for known unfair scenarios
3. deterministic scenario seeds for regression comparisons

## 14. Plan For Solving The Current Stakeholder Issue

### 14.1 Preferred approach

Yes, it is better to fix the stakeholder reaction balance through the broader high-level lens.

Reason:

1. it avoids solving one symptom in isolation
2. it gives reusable infrastructure for future content packs
3. it lets us separate authored imbalance from engine semantics and UI explainability

### 14.2 Practical sequencing

The immediate solution should still start with stakeholder diagnostics, because that is the current failing symptom and the best first slice of the general audit system.

Recommended order:

1. implement stakeholder diagnostics in simulation
2. extend runner telemetry with stakeholder-by-turn data
3. add audit findings for stakeholder imbalance
4. inspect results across current scenarios
5. tune content thresholds and deltas where justified
6. add UI stakeholder drivers surface after diagnostics exist

This sequence keeps business logic out of the UI and keeps the current issue connected to the future reusable framework.

## 15. Acceptance Criteria

This broader spec is successful when:

1. the project has a clear path from raw simulation telemetry to audit findings
2. future external content packs can be evaluated with the same toolchain
3. stakeholder balance is handled as one fairness dimension, not an isolated subsystem
4. fixes can be routed cleanly to content, simulation, runner, or UI
5. no audit logic requires moving gameplay rules into presentation layers
6. there is only one canonical dynamic multi-run execution path in the codebase
