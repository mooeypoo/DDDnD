# Artwork Pipeline

This document describes the visual identity system and illustration workflow for DDDnD.

---

## Style Direction

All DDDnD illustrations follow the **Arcane Engineering Blueprint** aesthetic.

**Core concept:** Software architecture visualized as magical systems.

The style should feel like:
- Technical schematics from a universe where code infrastructure is built from runes and sigils
- Arcane diagrams encoding structural relationships and decision flows  
- Blueprint-style engineering drawings with mystical overlays

**Visual vocabulary:**
- Fine grid backgrounds suggesting drafting paper or circuit substrates
- Thin, precise linework with subtle glow effects
- Dark backgrounds with selective color-coded accents
- Monospace annotation text resembling technical documentation
- Corner alignment marks suggesting a technical drawing frame
- Geometric primary shapes (hexagons for domains, circles for nodes, rectangles for modules)
- Dotted/dashed borders for unstable or temporary elements

**Color system (accent by content type):**

| Content type         | Accent color     | Semantic meaning                   |
|----------------------|------------------|------------------------------------|
| Archetype: Boundary Builder    | `#9f7aea` purple     | Domain structure, containment  |
| Archetype: Firefighter         | `#f97316` orange     | Emergency, reactive systems    |
| Archetype: System Stabilizer   | `#60a5fa` blue       | Balance, equilibrium           |
| Archetype: Stakeholder Whisperer | `#fbbf24` gold     | Communication, relationship    |
| Archetype: Runaway Refactorer  | `#34d399` green      | Transformation, improvement    |
| Event: System Incident         | `#f87171` red        | Fault, crisis, propagation     |
| Event: Audit Pressure          | `#d97706` amber      | Inspection, compliance         |
| Event: Scaling Crisis          | `#60a5fa` → `#f87171` | Load, overload transition     |
| Card: Refactor Action          | `#34d399` green      | Structural improvement         |
| Card: Infrastructure Investment | `#60a5fa` blue      | Platform, reliability          |
| Card: Quick Patch              | `#fb923c` orange     | Reactive fix, tech debt        |
| Scenario Hero                  | Multi-accent         | System overview                |

**Avoid:**
- Cartoon fantasy elements (dragons, wizards, swords)
- Bright or pastel color schemes
- Generic medieval imagery
- Decorative fills covering text content
- Full photographic realism

---

## Asset Organization

```
src/assets/artwork/
  archetypes/           ← archetype portrait illustrations (320x180 SVG)
    boundary_builder.svg
    firefighter.svg
    system_stabilizer.svg
    stakeholder_whisperer.svg
    runaway_refactorer.svg
  events/               ← event scene illustrations (320x180 SVG)
    system_incident.svg
    audit_pressure.svg
    scaling_crisis.svg
  cards/                ← card action illustrations (320x180 SVG)
    refactor_action.svg
    infrastructure_investment.svg
    quick_patch.svg
  scenarios/            ← scenario hero images (800x200 SVG, wider aspect)
    hero.svg
```

**Preferred format:** SVG for all vector-based illustration work.

**Raster assets:** If AI-generated raster images are used, target minimum 640×360px for card thumbnails and 1200×300px for scenario heroes. Use WebP format.

---

## Architecture Model

### ArtworkMeta Type

Artwork is passed to components as optional presentation data via the `ArtworkMeta` interface:

```typescript
// src/ui/types/artwork.ts
interface ArtworkMeta {
  illustration_url?: string   // URL to image asset
  icon_key?: string           // Symbolic icon key for icon maps
  artwork_variant?: string    // Render variant hint
  alt?: string                // Accessibility description
}
```

Artwork is always **optional**. Every component renders fully without artwork metadata.

### Component Integration

| Component         | Artwork prop     | Region                         | Behaviour when absent       |
|-------------------|------------------|---------------------------------|-----------------------------|
| `ActionCard`      | `artwork`        | Small thumbnail in card header  | Header shows title only     |
| `CardDetailsModal`| `artwork`        | Illustration frame (90px tall)  | Frame shows ambient gradient|
| `EventCard`       | `illustrationUrl`| Full-bleed scene above title    | Region collapses entirely   |
| `OutcomePanel`    | `portraitUrl`    | Archetype portrait frame        | Emoji icon shown instead    |
| `ScenarioBanner`  | `heroUrl`        | Full-bleed hero above content   | Region absent, no gap       |

The `EventCard` and `ScenarioBanner` use named CSS variables from the design token system:

```css
--artwork-bg:             /* empty frame background fill       */
--artwork-border:         /* lower boundary of artwork regions */
--artwork-min-height:     /* 140px — standard artwork frame    */
--artwork-min-height-sm:  /* 90px  — compact frame (modal, event) */
```

### Object Fit

All artwork images are rendered with `object-fit: cover` so any aspect ratio source
will fill the frame without distorting content. The image is treated as decorative
chrome — it never replaces text or game information.

---

## Generating Illustrations

### Prompt Template

Use this base prompt when generating artwork for DDDnD via AI image tools:

```
A technical blueprint schematic illustration for a dark-themed strategy game about 
software architecture. Style: arcane engineering diagram, blueprint-like, dark 
background (#0b0e1a), thin glowing linework, monospace annotation text, 
geometric shapes, subtle grid pattern, no text that would cover gameplay UI.

Subject: [SPECIFIC SUBJECT DESCRIPTION]

Accent color: [ACCENT FROM TABLE ABOVE]
```

### Subject descriptions by category

**Archetype portraits:**
- `boundary_builder`: Domain boundary diagram with interlocking context regions, separation walls, clean data flow arrows
- `firefighter`: Circuit breaker schematic with fault indicators and emergency response symbols
- `system_stabilizer`: Load balance diagram with equal weight distribution and equilibrium axis
- `stakeholder_whisperer`: Communication hub-and-spoke network with relationship flow indicators
- `runaway_refactorer`: Module evolution cascade showing progressive architectural refinement

**Event illustrations:**
- `system_incident`: Fault propagation stack trace, cascading failure map, error node blast pattern
- `audit_pressure`: Compliance inspection layering, stacked document review with inspection lens
- `scaling_crisis`: Traffic congestion network, load balancer at capacity, service overload indicators

**Card illustrations:**
- `refactor_action`: Before/after module transformation split-view, entropy reduction diagram
- `infrastructure_investment`: Platform layer stack with investment tier highlighted
- `quick_patch`: Circuit board with reactive bandage overlay, technical debt counter

**Scenario hero:**
- An epic wide-angle system architecture map showing 5 distinct domains, the monolith at center, interconnection lines, and incident indicators

---

## Integration with Storybook

Each component has dedicated stories demonstrating:

1. **Without artwork** — baseline state confirming readability without any assets
2. **With artwork** — full visual identity enabled

Story naming convention:
- Without: `BoundaryBuilder`, `ProductionIncident`, etc.
- With artwork: `BoundaryBuilder — With Portrait`, `System Incident — With Illustration`, etc.

Run Storybook to validate artwork integration visually:

```bash
npm run storybook
```

---

## Accessibility Requirements

- Artwork images must **never obscure text**
- All artwork images are `aria-hidden="true"` — they are decorative
- `alt` text in `ArtworkMeta.alt` is available for any future cases where the image communicates unique information not present in text
- Contrast ratios of all text must remain WCAG AA compliant regardless of artwork presence
- Components must remain fully readable when artwork fails to load or is absent

---

## Constraints

Per project architecture rules:

- Artwork metadata exists only in the **UI layer**
- Content JSON files (`/content/`) must **not** include artwork URLs or paths
- Simulation logic must **not** reference artwork
- Components must render correctly with and without artwork

---

## Current Asset Status

| Asset                              | Status      | Format |
|------------------------------------|-------------|--------|
| `archetypes/boundary_builder`      | Placeholder | SVG    |
| `archetypes/firefighter`           | Placeholder | SVG    |
| `archetypes/system_stabilizer`     | Placeholder | SVG    |
| `archetypes/stakeholder_whisperer` | Placeholder | SVG    |
| `archetypes/runaway_refactorer`    | Placeholder | SVG    |
| `events/system_incident`           | Placeholder | SVG    |
| `events/audit_pressure`            | Placeholder | SVG    |
| `events/scaling_crisis`            | Placeholder | SVG    |
| `cards/refactor_action`            | Placeholder | SVG    |
| `cards/infrastructure_investment`  | Placeholder | SVG    |
| `cards/quick_patch`                | Placeholder | SVG    |
| `scenarios/hero`                   | Placeholder | SVG    |

All current assets are hand-authored placeholder SVGs following the arcane engineering
blueprint style. They establish the visual identity and integration scaffolding.
Replace with generated artwork as assets are produced.
