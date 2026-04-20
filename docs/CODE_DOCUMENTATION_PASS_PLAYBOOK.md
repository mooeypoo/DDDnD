# Code Documentation Pass Playbook

Purpose: run a documentation-only pass across the codebase with no behavior changes.

Scope: all domains in architecture order, plus UI, app/shared, and tests.

## Non-Negotiable Rules

1. Do not change runtime behavior.
2. Do not rename symbols, move files, or alter exports in this pass.
3. Keep comments factual, concise, and architecture-aligned.
4. If a comment needs code changes to be true, log a finding instead of changing code.
5. Keep determinism and domain boundaries explicit.

## Source of Truth

Read before each session:

1. AGENT.md
2. ARCHITECTURE.md
3. GAME_DESIGN.md
4. CONTENT_SCHEMA.md
5. CONTENT_VERSIONING.md

## Documentation Standards

### Module Header (for each non-trivial file)

Document:

- responsibility (what this file owns)
- boundary (what this file must not own)
- key inputs/outputs
- invariants and assumptions

### Exported Function/Method Docs

Document:

- intent
- parameters and expected shape/range
- return contract
- side effects
- error/failure behavior
- determinism assumptions where relevant

### Type/Interface Docs

Document:

- semantic meaning of fields
- optionality rationale
- units/ranges for numeric values
- whether data is transient or persisted

### Inline Comments

Use only for non-obvious logic, ordering constraints, or architecture-sensitive decisions.

## Per-File Review Checklist

1. What layer owns this file?
2. Does the file cross a forbidden boundary?
3. Are public contracts documented?
4. Are invariants documented?
5. Are error paths documented?
6. Are comments consistent with actual behavior?
7. Are terms aligned with architecture guidance?

## Pass Order

1. src/domains/content
2. src/domains/simulation (models -> rules -> services)
3. src/domains/persistence
4. src/domains/reporting
5. src/shared, src/app, src/types
6. src/ui
7. tests

## Quality Gates Per Session

1. Documentation-only diff.
2. Tests for touched scope pass.
3. No contradictions against AGENT.md or ARCHITECTURE.md.
4. Findings logged in tracker with importance and effort.

## Finding Severity and Effort

Importance:

- 5 = determinism, correctness, or boundary risk
- 4 = high maintainability or defect-proneness risk
- 3 = moderate complexity/readability risk
- 2 = low consistency debt
- 1 = cosmetic

Effort:

- 1 = under half day
- 2 = half to one day
- 3 = one to three days
- 4 = three to five days
- 5 = over one week or cross-domain

Priority index: importance / effort

## Decision Buckets

- Do now
- Schedule
- Watch
- Ignore for now

## End-of-Pass Deliverables

1. Updated code comments/docstrings.
2. Completed tracker.
3. Ranked cleanup/simplification/refactor report.
4. Decision-ready next-step list.
