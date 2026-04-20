# Code Documentation Pass Tracker Template

Use one row per reviewed file or coherent file group.

## Session Log

| Date | Session | Scope | Planned | Done | Notes |
|---|---|---|---|---|---|
| YYYY-MM-DD | S1 | src/domains/content/model | 8 files | 0 files | |

## File-Level Tracking

| Area | File | Doc Status | Contract Docs | Invariants Docs | Boundary Notes | Tests Run | Findings IDs |
|---|---|---|---|---|---|---|---|
| content | src/domains/content/model/scenario_bundle.ts | not started | no | no | | not run | |

Doc Status values:

- not started
- in progress
- complete
- blocked

## Findings Backlog

| ID | Area | Finding | Evidence | Importance (1-5) | Effort (1-5) | Priority (I/E) | Risk | Bucket | Owner | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| F-001 | simulation | | src/domains/simulation/services/simulation_runner.ts | 5 | 3 | 1.67 | medium | schedule | | open |

Risk values:

- low
- medium
- high

Bucket values:

- do now
- schedule
- watch
- ignore for now

Status values:

- open
- triaged
- accepted
- deferred
- done

## Terminology Consistency Checks

| Area | Checked Terms | Issues Found | Action |
|---|---|---|---|
| reporting | playerClass, endingType, avatarRole | 0 | none |

## Boundary Integrity Checks

| Check | Area | Result | Notes |
|---|---|---|---|
| simulation imports UI/browser APIs | simulation | pass | |
| UI contains gameplay rule logic | ui | pass | |
| persistence modifies gameplay behavior | persistence | pass | |
| reporting modifies simulation state | reporting | pass | |
