# Scene Visual Direction

Date: 2026-03-31
Status: Canonical direction for gameplay scene composition and stakeholder avatar art direction
Scope: Presentation redesign visual language only (no simulation/domain changes)

This document locks the intended visual direction for the redesigned gameplay presentation.
It exists to prevent another failed asset batch caused by mixed style assumptions.

Canonical companions:

- [AGENT.md](../AGENT.md)
- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md)
- [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md)
- [docs/MVP_ASSET_PLAN.md](MVP_ASSET_PLAN.md)
- [docs/MVP_CONCEPT_ART_PACKET.md](MVP_CONCEPT_ART_PACKET.md)

---

## 1. Purpose

Use this document when creating or reviewing:

- scenario scene backgrounds
- event scene backgrounds
- stakeholder avatar role artwork
- scene composition guidance for gameplay overlays

This is a durable instruction document for future agents and human contributors.
If scene/avatar art guidance conflicts with older docs, this document takes priority for visual direction.

---

## 2. Visual Direction (Required)

The redesigned gameplay presentation is:

- fantasy-tech
- pixel-adventure-inspired
- scene-based, not panel-based
- readable in browser UI at gameplay sizes
- expressive and legible at small sizes
- suitable for dynamic actor placement

Format direction (required):

- Scene backdrops and stakeholder `avatarRole` character/state art use raster deliverables (PNG/WebP) in the presentation pipeline.
- SVG remains the preferred format for reusable interface/chrome elements (frames, icons, badges, ornaments, simple effect markers).
- Choose format by purpose: atmosphere/composition-heavy illustration uses raster; reusable structural UI assets use SVG.

The scene should feel like a place the player is currently in, not a chart they are inspecting.

### Distinction from the previous style

The previous style leaned futuristic, corporate, and diagrammatic.
The redesigned style deliberately moves away from that.

New direction:

- environmental stage composition over dashboard composition
- character-led readability over abstract topology
- atmosphere and mood over interface-like infographics
- sparse, intentional detail that supports game UI overlays

---

## 3. Core Art Principle: Place or Stage, Not Infographic

Every scene asset must depict a place, stage, or playable backdrop.
It must not read as a standalone explainer graphic.

Good mental model:

- "Where are the actors standing right now?"
- "What environment frames the current tension?"

Bad mental model:

- "What architecture concept diagram can I draw here?"

Scene art can include fantasy-tech motifs, but those motifs must support a world-space composition.

---

## 4. Scene Background Direction

### Composition

- Build scenes with a clear foreground, midground, and background.
- Reserve a stable "overlay-safe" region where UI text/cards can sit without visual conflict.
- Avoid uniform detail density. Use negative space intentionally.
- Keep major silhouette shapes broad and readable before adding accents.

### Atmosphere

- Shared mood: mystical systems world, adventurous but tense, not sterile enterprise tooling.
- Use light, fog, runic glow, dust, banners, machinery, or terrain cues to establish location.
- Keep atmosphere coherent across scenarios so screens feel like one game world.

### Browser readability

- Prefer clean shape stacks and restrained line complexity.
- Limit tiny decorative strokes that collapse at small render sizes.
- Ensure visual hierarchy survives at compact UI sizes and mobile widths.

---

## 5. Stakeholder Avatar Role Direction

Stakeholder visuals are generic fantasy `avatarRole` representations.
They are not domain-specific business-role illustrations.

Required interpretation:

- roles are reusable visual archetypes in the UI layer
- roles are not literal portraits of named stakeholders
- roles should communicate attitude, posture, and emotional readability first

Do not draw office-job caricatures (for example: "CFO with spreadsheet").
Translate role intent into fantasy-tech persona silhouettes that remain reusable.

### Role clarity at small sizes

- Each avatar must be identifiable at thumbnail scale.
- Prioritize strong head/shoulder silhouette and one signature prop.
- Keep facial features simple but expressive.

---

## 6. Posture and Expression States

Posture and expression must communicate gameplay mood quickly.
State changes should be visible even when the avatar renders small.

Required baseline states for direction work:

- neutral/default: attentive, readable, calm
- active: engaged posture, forward intent, heightened focus
- stressed: tension visible in shoulders, brow, and mouth shape

State design rules:

- preserve role identity across states (same character role, different emotion)
- change expression and pose first; avoid swapping costume identity
- use contrast and silhouette shifts, not tiny facial micro-detail

---

## 7. Composition and Negative Space Rules for UI Overlays

Scene artwork must be built as a presentation substrate for dynamic overlays.

Required composition rules:

- include predictable low-detail regions for cards, labels, and meters
- avoid placing focal faces or crucial props where overlays are likely to appear
- frame key scene subjects away from overlay-heavy zones
- maintain enough empty visual breathing room to keep text readable

A scene is successful only if gameplay UI remains primary and effortless to read.

---

## 8. Shared Visual Atmosphere Across Scene and Avatars

Scene backgrounds and avatar roles must feel authored for the same world.

Consistency anchors:

- similar lighting logic and value contrast
- compatible texture density (not noisy scenes with ultra-flat avatars)
- aligned fantasy-tech motifs (runes, relic machinery, magical infrastructure)
- cohesive color behavior that supports, not overwhelms, gameplay information

---

## 9. Explicit Anti-Goals

Do not produce assets in these directions:

- not corporate dashboard graphics
- not abstract neon topology diagrams
- not text-heavy baked-in artwork
- not observability-style interface art
- not tiny unreadable character illustrations

Additional anti-goals:

- not scene art that functions as a labeled process diagram
- not avatar art dependent on domain-specific office props for meaning
- not dense detail fields that destroy overlay readability

---

## 10. Practical Delivery Checklist for Agents

Before delivering any scene/avatar asset proposal, verify:

1. The piece reads as a place/stage, not an infographic.
2. The style feels fantasy-tech and pixel-adventure-inspired.
3. Overlay-safe negative space exists and is intentional.
4. Avatar roles are generic `avatarRole` visuals, not business-role portraits.
5. Expressions/postures are legible at small sizes.
6. Rendering remains clean and readable at gameplay sizes in browser UI.
7. Anti-goals are not violated.

If any check fails, revise before implementation.

---

## 11. Non-Goals of This Document

This document does not:

- define simulation behavior
- define stakeholder domain schema
- authorize content/schema changes
- require immediate SVG production in this step

This phase is direction lock only.
No asset batch should start until this direction is accepted and referenced by planning docs.
