# What Is The Audit?

The audit is DDDnD's game-design quality inspector. It runs a bunch of simulated playthroughs, watches what happens, and then reports where the game feels fair, spicy, swingy, or straight-up chaotic.

Think of it as a combination of:

- A balance test bench
- A fairness detector
- A "why did this scenario implode?" investigator

## Why This Exists

Card games are full of hidden interactions. Two cards plus one event plus one stakeholder rule can produce outcomes nobody intended.

The audit helps us catch problems before players do:

- Scenarios that are too punishing or too easy
- Stakeholders that spiral with no realistic recovery path
- Events that create low-agency "you lose because dice" moments
- Content combinations that dominate strategy and reduce variety

In short: the audit keeps challenge high without turning gameplay into frustration.

## How The Audit Runs

At a high level, the process is:

1. Load all authored content (scenarios, cards, events, stakeholders, rules).
2. Run deterministic simulations for each scenario over many seeded runs.
3. Aggregate outcomes (win rate, turns survived, trend metrics, severity counts).
4. Evaluate findings against fairness and balance rules.
5. Produce a structured report consumed by this dashboard.

Typical commands:

```bash
# Generate docs data with default run count
npm run docs:generate-data

# Run a higher-fidelity audit pass
AUDIT_RUNS=300 npm run docs:generate-data

# Enforce release gate (fails on critical findings)
npm run audit:gate
```

## What It Measures

The audit checks four practical dimensions:

- Structural health: are references valid and authored supports present?
- Behavioral balance: what happens over many runs (win rate, turns, outcome spread)?
- Causal signals: what systems appear to drive failure or recovery?
- Fairness and agency: do players have meaningful counterplay, or just bad luck?

## How To Read Severity

- Critical: severe issue, likely to make the scenario feel broken or unfair.
- Warning: meaningful imbalance or design risk worth tuning soon.
- Info: context signal, useful but not urgent.

## How To Read The Overview Page

On [Audit Overview](/dashboard/), read from top to bottom:

1. Scenario Health Snapshot: high-level status and win rate by scenario.
2. Balance Metrics: win rate and average turns to compare pacing and pressure.
3. Audit Findings: detailed, filterable issues with IDs and descriptions.

If you're triaging quickly, start with Critical findings, then inspect related scenario metrics to confirm whether a fix should target content tuning, reaction rules, or event pressure.

## Why It Matters

A good audit loop protects player trust. Players should feel challenged by hard decisions, not blindsided by invisible systems.

The audit gives us a repeatable way to make that true as content evolves.
