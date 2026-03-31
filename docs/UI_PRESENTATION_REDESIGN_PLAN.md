# UI Presentation Redesign Plan

Date: 2026-03-31
Status: Planning only (no implementation in this document)

## 1) Purpose and Goals

The current UI is being replaced to establish a clearer, more coherent presentation layer across the full player journey (setup, gameplay, overlays/modals, and results), while preserving the existing deterministic simulation behavior.

Primary goals:

- Improve readability and information hierarchy during runs.
- Present stronger visual identity consistency across screens.
- Separate presentation concerns from domain/simulation concerns with stricter boundaries.
- Create a scalable art and SVG asset pipeline that supports ongoing content growth.
- Ensure desktop and mobile experiences are both first-class.

Why replace the current UI presentation:

- Existing presentation patterns were delivered incrementally and now need a unified redesign pass.
- Current visual and interaction patterns are not yet consistent enough across gameplay and surrounding screens.
- Asset handling needs cleanup and a simpler, more maintainable SVG workflow.
- Upcoming scene-based presentation requires explicit UI-layer modeling that does not alter simulation/domain entities.

## 2) Approved Terminology (Required for New Work)

Use these terms consistently in new UI and documentation work:

- playerClass = player-selected class at scenario start
- endingType = end-of-run outcome classification
- avatarRole = UI-only fantasy visual role assigned to stakeholders

Terminology policy:

- Generic use of the word archetype is retired for new work.
- Legacy references may still exist in older content/code/docs; do not expand that naming in new implementation.
- New presentation and product-facing language must use endingType and avatarRole where applicable.

## 3) Presentation Model (Target)

The redesign adopts the following model:

- One scene per scenario run.
- Scene selected from a tagged scene pool.
- Stakeholders remain content/domain entities loaded from JSON.
- Avatar roles are assigned in the UI layer only.
- No presentation logic may leak into simulation/domain logic.

Implications:

- Scene and avatar role selection are view-model concerns, not simulation rules.
- Scenario bundle and stakeholder semantics remain unchanged by presentation assignment.
- Any role/scene mapping logic must live in UI modules/services/stores only.

## 4) Scope of Redesign

In scope:

- Gameplay screen redesign.
- Broader UI redesign for surrounding screens and modals.
- Asset cleanup and SVG pipeline rewrite.
- Desktop and mobile support.

Planned later phase (not in initial execution scope):

- Tutorial redesign.

Out of scope for this plan document:

- Any simulation/domain rule changes.
- Any persistence schema changes unless separately approved.
- Immediate code implementation in this document.

## 5) Architecture Guardrails (Canonical References)

This plan inherits and must comply with existing canonical rules:

- AGENT.md: simulation/UI separation and non-negotiable domain boundaries.
- ARCHITECTURE.md: domain responsibilities and UI role.
- GAME_DESIGN.md: gameplay intent and UX requirements.
- docs/ARTWORK_PIPELINE.md: visual identity and asset constraints.
- docs/QUEST_SELECTION_IMPLEMENTATION.md: UI-owned configuration and transformation patterns.
- docs/LOGO_AND_MASTHEAD_IMPLEMENTATION.md: current branding/navigation integration patterns.

This plan does not redefine those rules; it applies them to a coordinated redesign.

### Permanent Rule Homes

Use this plan as the coordinator and phased roadmap.

Stable rules should live in canonical docs:

- Architecture and domain separation: [ARCHITECTURE.md](../ARCHITECTURE.md)
- Required-reading and routing expectations: [AGENT.md](../AGENT.md)
- Storybook workflow boundaries: [docs/STORYBOOK.md](STORYBOOK.md)
- Artwork/SVG constraints and asset policy: [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md)

## 6) Phased Implementation Plan

### Phase 0: Alignment and Vocabulary Freeze

- Publish this terminology set across active UI workstreams.
- Add a short naming note to relevant implementation docs when touched.
- Confirm that new tasks avoid introducing new generic archetype usage.

Exit criteria:

- Redesign tickets and specs use playerClass, endingType, and avatarRole consistently.

### Phase 1: Presentation Model Foundation

- Define UI view-model contracts for:
  - run scene selection from tagged pool
  - stakeholder to avatarRole assignment
  - endingType-facing display mapping
- Implement at UI boundary only (no simulation imports beyond existing typed outputs).

Exit criteria:

- Scene and avatar role assignment function in UI prototypes without domain changes.
- Clear tests verify no simulation behavior dependency on presentation assignment.

### Phase 2: Gameplay Screen Redesign

- Redesign core gameplay layout, hierarchy, and turn-surface readability.
- Integrate scene presentation for the active run.
- Apply avatarRole visual treatment to stakeholder UI components.
- Preserve existing action/event/stakeholder flow behavior.

Exit criteria:

- Gameplay screen ships with new presentation model on desktop and mobile.
- No gameplay regression in engine behavior.

### Phase 3: Surrounding UI and Modal Redesign

- Redesign run setup, intro, overlays, and results-adjacent modals for consistency.
- Align navigation/masthead/branding surfaces with updated visual language.
- Ensure endingType naming and display are consistent in end-of-run surfaces.

Exit criteria:

- Surrounding screens/modals match gameplay redesign language and interaction patterns.
- Accessibility and responsive behavior validated for core flows.

### Phase 4: Asset Cleanup and SVG Pipeline Rewrite

- Consolidate and normalize SVG assets and naming conventions.
- Refactor asset-loading paths for clarity and maintainability.
- Update artwork pipeline documentation where implementation details change.

Exit criteria:

- Asset inventory is clean, predictable, and documented.
- SVG flow supports ongoing scene/avatar expansion without ad hoc additions.

### Phase 5: Tutorial Redesign (Later)

- Redesign tutorial presentation after main game presentation is stabilized.
- Keep tutorial content isolation and existing architecture boundaries intact.

Exit criteria:

- Tutorial reflects the new UI language without breaking tutorial content isolation.

## 7) Delivery Notes

- Prioritize behavioral safety: presentation changes must not alter deterministic simulation outcomes.
- Favor incremental release slices per phase with focused validation.
- Keep Storybook and mock-driven iteration as presentation development tools, not gameplay logic sources.

## 8) Success Criteria Summary

The redesign is successful when:

- New terminology is consistently used in active UI work.
- Scene and avatarRole presentation model is fully UI-owned.
- Gameplay and surrounding screens are coherently redesigned for desktop and mobile.
- Asset and SVG workflows are cleaned up and maintainable.
- Tutorial redesign follows in a controlled later phase.
- Simulation/domain behavior remains unchanged unless explicitly planned elsewhere.
