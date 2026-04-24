# Reading the Audit Report

The DDDnD audit report is a data-driven health check that runs hundreds of simulated playthroughs and synthesizes the results into structured findings. The [Audit Dashboard](/dashboard/) surfaces this data visually. This page explains what each section means and how to act on it.

## What the Audit Measures

The audit framework runs deterministic simulations across all scenarios and evaluates them across four layers:

| Layer | Purpose |
|---|---|
| **Structural** | Detect missing or malformed authored support (missing refs, unreachable outcome tiers, stakeholders with no recovery path) |
| **Behavioral** | Observe actual outcome distributions over many runs (win rate, score trajectories, stakeholder trends) |
| **Causal** | Explain why outcomes happened (which rules drove stakeholder decline, which event chains caused failure spikes) |
| **Fairness** | Judge whether pressure and recovery feel proportionate (negative triggers vs. positive recovery paths, player agency vs. randomness) |

## Finding Severity Levels

Every finding has a severity that indicates how urgently it should be addressed:

| Severity | Meaning |
|---|---|
| **Critical** | Severe balance or fairness issue that makes the scenario feel broken or unplayable. Should be fixed. |
| **Warning** | Moderate issue that may cause frustration or reduce strategic depth. Worth investigating. |
| **Info** | Informational observation for context. No immediate action required. |

## Finding Categories

Findings are grouped by the dimension they measure:

### Scenario Difficulty
Win rate and outcome distribution. Flags scenarios that are too easy, too hard, overly swingy, or heavily dependent on random seed.

Key metrics: overall win rate, partial success rate, average turns survived, success variance across seeds.

### Score Balance
How scores behave across runs. Flags scores that are irrelevant (never matter), impossible to stabilize (always collapse), or dominant (cause most losses alone).

Key metrics: average score by turn, frequency of collapse, score recovery frequency.

### Stakeholder Balance
Whether stakeholders feel fair. Flags stakeholders whose satisfaction almost never recovers, whose decline is too easy to trigger, or whose reaction rules stack pressure unfairly.

Key metrics: average satisfaction by turn, recovery rate after entering _Concerned_ or _Critical_, frequency of positive vs. negative rule triggers.

### Event Fairness
Whether random events feel proportionate. Flags event pools that are too punishing, create low-agency outcomes, or repeat too frequently.

Key metrics: event frequency, event impact distribution, failure correlation by event.

### Card Ecosystem Balance
Whether the card pool has strategic depth. Flags dominant strategies (one sequence wins most often), trap cards (look useful but rarely help), and dead cards (near-zero usage or near-zero impact).

Key metrics: usage frequency, contribution to successful vs. failed runs, opening sequence concentration.

### Aftershock Fairness
Whether delayed effects are legible and proportionate. Flags aftershocks that are too opaque, too severe without warning, or that dominate player agency over player decisions.

## The Audit Dashboard

The [Audit Dashboard](/dashboard/) shows:

- **Scenario Overview** — Pass/Warning/Critical status per scenario with win rate
- **Balance Metrics** — Win rate and average turns per scenario as bar charts
- **Findings Table** — All findings across all scenarios, filterable by severity and category

If you want a quick orientation before diving into data, read [What Is The Audit?](/dashboard/audit-intro).

### Overall Status

A scenario's `overall_status` is the worst severity of any of its findings:

- `pass` — No findings above Info
- `warning` — At least one Warning, no Critical
- `critical` — At least one Critical finding

## Acting on Findings

Each finding includes:

- **Title** — Short description of the issue
- **Description** — Explanation of what was observed
- **Evidence** — Supporting data from simulations
- **Recommended Fix Surface** — Where the fix belongs: content tuning, simulation semantics, runner telemetry gap, or UI explainability gap

Most balance issues are addressed through **content tuning** — adjusting threshold values, reaction rule conditions, card effects, or event probabilities in the authored JSON files. Refer to the [Content Authoring guide](/guide/content-authoring) for how to make those changes.

## Running the Audit Locally

```bash
# Quick check (10 runs per scenario)
AUDIT_RUNS=10 npm run docs:generate-data

# Full audit (100 runs, the default)
npm run docs:generate-data

# High-fidelity audit (300 runs, used for nightly CI)
AUDIT_RUNS=300 npm run docs:generate-data
```

The audit gate used in CI:

```bash
npm run audit:gate
```

This fails if any scenario has a Critical finding, enforcing a minimum content health bar before publishing.
