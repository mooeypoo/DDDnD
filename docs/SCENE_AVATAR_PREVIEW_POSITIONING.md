# Scene Avatar Preview Positioning

Date: 2026-04-01
Status: UI-only preview positioning model

This document defines the floor placement assumptions used by the scene/avatar preview workbench.

## Slot Model

The preview uses four reusable placement slots:

- left
- center
- right
- far

Slots are defined in [src/ui/composables/scene_avatar_positioning.ts](../src/ui/composables/scene_avatar_positioning.ts).

Guardrails in this model:

- Duplicate slot selections are auto-resolved to unique slots.
- Actors receive subtle horizontal nudges to reduce overlap in the near floor band.

## Safe Floor Placement Assumptions

- Avatars anchor to the lower floor band of the scene to avoid covering upper focal subjects.
- The far slot uses smaller scale and a higher floor anchor to read as depth.
- Left/center/right stay in the lower third with larger scale for readability.
- Avatars should not be used to mask high-contrast scene focal points.

## Readability and Responsiveness

- Scene backgrounds render with object-fit: cover to avoid distortion.
- Avatar PNGs render with object-fit: contain to preserve silhouette integrity.
- Actor width scales with clamp() to remain legible on desktop and mobile.
- The surface uses a subtle floor gradient to maintain actor readability without baking text into backgrounds.

## Current Visual Constraints

- Strong central scene focal points can still compete with center-slot actors at high contrast.
- Far-slot actors can lose expression readability at narrow widths when combined with dark mood variants.
- This model is floor-safe for broad composition, but not yet scene-specific focal-avoidance aware.

## Future Adjustment Knobs

If future art direction or scenes require tuning, adjust in [src/ui/composables/scene_avatar_positioning.ts](../src/ui/composables/scene_avatar_positioning.ts):

- Slot anchor coordinates (`leftPercent`, `floorPercent`)
- Per-slot scale and depth layering (`scale`, `zIndex`)
- Slot fallback preference order (`SLOT_FALLBACK_ORDER`)
- Overlap nudge strength (`buildGuardrailedNudges` step values)

These knobs let us refine composition safety without changing engine/domain logic or component APIs.

## Non-Goals

- This preview is not gameplay UI and does not implement simulation logic.
- This preview does not move logic into engine/domain code.
- This preview is a developer tool for visual validation only.
