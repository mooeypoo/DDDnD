# Artwork Pipeline

This document is the canonical reference for SVG authoring, asset organization, naming, and runtime integration in DDDnD.

Canonical companions:

- [AGENT.md](../AGENT.md) — work routing, architecture rules, and required-reading policy
- [ARCHITECTURE.md](../ARCHITECTURE.md) — domain separation and UI ownership boundaries
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md) — redesign phasing and presentation coordination
- [docs/STORYBOOK.md](STORYBOOK.md) — UI prototyping workflow boundaries

---

## Terminology Reference

Three distinct visual identity types exist in the presentation system. Use these terms precisely in all new work.

### `playerClass`

The class the player selects at scenario start. Each `playerClass` maps to exactly one portrait SVG in `src/assets/presentation/avatars/player-classes/`.

- File key format: `{class_id}.svg` — e.g., `boundary_mage.svg`
- Resolved at runtime via `PLAYER_CLASS_ASSETS` from `presentation_asset_registry.ts`
- Pixel-character style (see Style Exception below)
- One SVG per class; no state variants
- TypeScript ID type: `PlayerClassAssetId`

### `endingType`

The end-of-run outcome classification shown on the results screen. Each `endingType` maps to exactly one ending visual SVG in `src/assets/presentation/ending-visuals/`.

- File key format: `{ending_id}.svg` — e.g., `boundary_builder.svg`
- Resolved at runtime via `ENDING_VISUAL_ASSETS` from `presentation_asset_registry.ts`
- Arcane engineering blueprint style (wide schematic composition, 320×180)
- TypeScript ID type: `EndingVisualId`
- Legacy type alias: `ArchetypeArtworkKey` — do not use this name in new work

### `avatarRole`

A UI-only fantasy visual role assigned to a stakeholder by the presentation layer. Avatar roles are not domain entities; they are view-model concerns only.

- File key format: `{role_id}.svg` — e.g., `tech_lead.svg` (future)
- Resolved at runtime via `STAKEHOLDER_AVATAR_ROLE_ASSETS` from `presentation_asset_registry.ts`
- No one-to-one mapping to named stakeholders
- Stakeholder content JSON must not reference `avatarRole` IDs
- State variant files are optional and additive (see Avatar Role Conventions)
- TypeScript ID type: `AvatarRoleAssetId` (to be defined when first assets are added)

**Do not use `archetype` in new work.** Legacy references may remain in existing code but must not be expanded.

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
| Ending Type: Boundary Builder    | `#9f7aea` purple     | Domain structure, containment  |
| Ending Type: Firefighter         | `#f97316` orange     | Emergency, reactive systems    |
| Ending Type: System Stabilizer   | `#60a5fa` blue       | Balance, equilibrium           |
| Ending Type: Stakeholder Whisperer | `#fbbf24` gold     | Communication, relationship    |
| Ending Type: Runaway Refactorer  | `#34d399` green      | Transformation, improvement    |
| Event: System Incident         | `#f87171` red        | Fault, crisis, propagation     |
| Event: Audit Pressure          | `#d97706` amber      | Inspection, compliance         |
| Event: Scaling Crisis          | `#60a5fa` → `#f87171` | Load, overload transition     |
| Card: Refactor Action          | `#34d399` green      | Structural improvement         |
| Card: Infrastructure Investment | `#60a5fa` blue      | Platform, reliability          |
| Card: Quick Patch              | `#fb923c` orange     | Reactive fix, tech debt        |
| Scenario Hero                  | Multi-accent         | System overview                |
| Class: Boundary Mage           | `#9f7aea` purple     | Domain boundaries, context mapping |
| Class: Stakeholder Bard        | `#fbbf24` gold       | Communication, diplomacy       |
| Class: Reliability Cleric      | `#60a5fa` blue       | System stability, healing      |
| Class: Legacy Ranger           | `#34d399` green      | Ancient codebases, navigation  |
| Class: Delivery Rogue          | `#f97316` orange     | Speed, agility, shipping       |

**Avoid (general rule):**
- Cartoon fantasy elements (dragons, wizards, swords)
- Bright or pastel color schemes
- Generic medieval imagery
- Decorative fills covering text content
- Full photographic realism

**Exception — Player Class Portraits:**
Player class artwork uses **pixel-character fantasy-style** character representations.
This is an intentional style exception for class portraits only. The pixel art style
connects to the D&D fantasy theming of the game while remaining distinct from the
technical blueprint aesthetic used elsewhere. Class portraits render at 120x120 SVG
viewBox and use the same dark background (`#0b0e1a`), grid lines, corner marks,
and accent color system as the rest of the artwork pipeline, but depict recognizable
fantasy character silhouettes (hooded mages, armored clerics, cloaked rangers, etc.)
rather than abstract schematics. Characters use non-descript gender design.

---

## Asset Organization

### Directory Structure

Canonical presentation asset root (new work):

```
src/assets/presentation/
  branding/
    logo_mark.svg
  ui-surfaces/
  scenes/
    scenario/
      default_run_scene.svg
    events/
      system_incident.svg
      audit_pressure.svg
      scaling_crisis.svg
  avatars/
    player-classes/
      boundary_mage.svg
      stakeholder_bard.svg
      reliability_cleric.svg
      legacy_ranger.svg
      delivery_rogue.svg
    stakeholder-avatar-roles/
  action-effect-icons/
    cards/
      refactor_action.svg
      infrastructure_investment.svg
      quick_patch.svg
  ending-visuals/
    boundary_builder.svg
    firefighter.svg
    system_stabilizer.svg
    stakeholder_whisperer.svg
    runaway_refactorer.svg
```

Legacy compatibility root (transition period):

```
src/assets/artwork/
  archetypes/           ← legacy folder for ending-type portrait illustrations (320x180 SVG)
  classes/              ← player class pixel-character portraits (120x120 SVG)
  events/               ← event scene illustrations (320x180 SVG)
  cards/                ← card action illustrations (320x180 SVG)
  scenarios/            ← scenario hero images (800x200 SVG, wider aspect)
```

During migration, keep legacy files until all references are moved and validated.

### Naming Conventions

- All asset filenames use `snake_case` with no separators other than underscores.
- The filename (without extension) must exactly match the registry key used in `presentation_asset_registry.ts`.
- Category is encoded by directory — do not add category prefixes to filenames.
- Use descriptive names that match game content identifiers where applicable.
- Avatar role state variants append a suffix: `{role_id}_active.svg`, `{role_id}_stressed.svg`.

| Good                         | Bad                          | Reason                          |
|------------------------------|------------------------------|---------------------------------|
| `boundary_mage.svg`          | `playerClass_boundaryMage.svg` | No category prefix, no camelCase |
| `system_incident.svg`        | `SystemIncident.svg`         | No PascalCase                   |
| `boundary_builder.svg`       | `archetype_boundaryBuilder.svg` | No legacy terminology         |
| `tech_lead_active.svg`       | `techLead-active.svg`        | Underscore prefix, no hyphens   |

**Preferred format:** SVG for all vector-based illustration work.

**Raster assets:** If AI-generated raster images are used, target minimum 640×360px for card thumbnails and 1200×300px for scenario heroes. Use WebP format.

---

## SVG Authoring Requirements

### Export Requirements

All SVGs must meet these criteria before being added to the repository:

- Format: SVG 1.1 with `xmlns="http://www.w3.org/2000/svg"`.
- The `fill` attribute on the root `<svg>` element must be `none` (fill per element, not inherited).
- No embedded fonts. Use pixel-art rendering only or no text at all. If annotation text is required, use a monospace stack: `font-family: monospace` with no `@font-face` declarations.
- No Inkscape or Illustrator metadata (`<sodipodi:`, `<inkscape:`, `<rdf:`, `<dc:`, `<cc:` namespaces). Strip these before committing.
- No external `href` references to stylesheets or scripts.
- No `<script>` elements. SVGs are static.
- No `width` or `height` attributes on the root `<svg>` (use `viewBox` only so CSS sizing controls render dimensions).
- Empty `<defs>` blocks should be removed. Non-empty `<defs>` must contain only referenced definitions (filters, patterns, gradients actually used in the file).
- Readable whitespace formatting is preferred (do not minify). Version-control readability matters.
- All `id` attributes must be unique within the file. When copying patterns between files, rename IDs to prevent collisions if files are ever inlined together.

### viewBox and Dimension Specifications

| Category                  | viewBox          | Aspect ratio | Notes                                         |
|---------------------------|------------------|--------------|-----------------------------------------------|
| Player class portrait     | `0 0 120 120`    | 1:1          | Square; rendered in circular crop context     |
| Ending visual             | `0 0 320 180`    | 16:9         | Wide composition; ending results screen       |
| Event scene               | `0 0 320 180`    | 16:9         | Wide composition; above EventCard content     |
| Card action illustration  | `0 0 320 180`    | 16:9         | Wide composition; ActionCard thumbnail frame  |
| Scenario hero / backdrop  | `0 0 800 200`    | 4:1          | Very wide; ScenarioBanner full-bleed          |
| Avatar role bust (future) | `0 0 80 80`      | 1:1          | Small circular-crop-safe bust; stakeholder UI |
| Logo mark                 | `0 0 [natural]`  | Varies       | Follow the natural glyph proportions          |
| UI surface elements       | `0 0 [natural]`  | Varies       | Size to intended panel or frame use           |

Do not deviate from these viewBox values for existing categories. If a new category is introduced, define its viewBox specification here before authoring assets.

### Layer and Group Naming

Use HTML comments as section headers to name logical groups within SVG files. This makes files readable and editable without an SVG editor.

Required comment labels (use exactly these strings):

```svg
<!-- Background -->
<!-- Grid -->
<!-- Corner marks -->
<!-- [Subject-specific label, e.g. "PIXEL CHARACTER: Boundary Mage"] -->
<!-- Glow effects / overlays -->
<!-- Annotations -->
```

Use `id` attributes on groups when the group is a logical animation or interaction target:

```svg
<g id="character-body">       <!-- class portrait: all body geometry -->
<g id="character-accessory">  <!-- class portrait: held items, hat, details -->
<g id="scene-subject">        <!-- scene/event SVG: primary focal element -->
<g id="scene-ambient">        <!-- scene/event SVG: background/atmosphere -->
<g id="scene-annotations">    <!-- scene/event SVG: label text if any -->
<g id="ending-subject">       <!-- ending visual: main schematic composition -->
```

IDs use `kebab-case`. Do not add IDs to purely structural grouping elements (groups that exist only for transform or style inheritance).

### Animation-Safe Grouping

SVGs in this project are currently static. However, authoring them in an animation-safe way allows future CSS or GSAP animation without SVG surgery:

- Background layer (`<rect>` fills and grid patterns) must be a sibling of the character/subject group — not nested inside it.
- The primary subject must be the only element in its named `<g id="...">` group (no mixed background+subject nesting).
- Filters (`<filter>`, `<feGaussianBlur>`) must be declared in `<defs>` and referenced by `filter="url(#...)"`. Do not inline filter attributes on individual elements.
- Avoid `transform` on the root `<svg>` element itself.
- For class portraits: wrap all pixel tiles for the character body in `<g id="character-body">` so position transitions are possible. Accessories and held items go in a separate `<g id="character-accessory">`.
- For scene SVGs: wrap the primary schematic subject in `<g id="scene-subject">` so it can fade or translate independently of the background grid.

---

## Asset Categories and Conventions

### Scene Assets

Path: `src/assets/presentation/scenes/`
ViewBox: `0 0 320 180`

Scene types:
- `scenario/` — one per scenario; represents the backdrop of the run. Used in `ScenarioBanner` as a full-bleed hero. Wider compositions exist at `0 0 800 200`.
- `events/` — one per event type; rendered as an illustration frame above `EventCard` content.

Authoring conventions:
- Compositions should be wide-format blueprint schematics (see Style Direction).
- Represent the conceptual "space" of the theme — not a literal moment or character.
- Keep the center-left region visually light (no dense detail) — it may be partially obscured by card text in some layouts.
- Must be recognizable and readable at 90px rendered height (compact frame in modals).
- No text in the image that directly duplicates card UI labels. Background annotations (monospace technical labels) are acceptable as stylistic elements.
- Use the accent color for the event domain (see Color System table) as the primary highlight element.

### Player Class Portrait Conventions

Path: `src/assets/presentation/avatars/player-classes/`
ViewBox: `0 0 120 120`

Player class portraits use **pixel-character fantasy style** — the single style exception in the pipeline. See Style Exception in Style Direction.

Authoring conventions:
- Dark background: `#0b0e1a`
- Subtle grid overlay at 20px spacing, accent color at ~6% opacity
- Arcane circle ring at ~cx=60, cy=62, r=38 level (outer) and r=30 (inner) as character frame
- Character occupies roughly the center 60% of the frame; head at approximately y=22–40
- Corner bracket marks at all four corners (`0,0`, `10,0`, `0,10` / `110,0`, etc.)
- Class accent color drives hat/staff/glow color (see Color System table)
- Pixel element size: 2×2 or 3×3 pixel blocks
- Characters use non-descript gender design
- `<g id="character-body">` wraps all body tiles; `<g id="character-accessory">` wraps held items and hat

One SVG per class. No state variants exist for `playerClass` portraits.

### Avatar Role Conventions

Path: `src/assets/presentation/avatars/stakeholder-avatar-roles/`
ViewBox: `0 0 80 80`

Avatar roles are UI-only. They are assigned by the presentation layer at runtime and do not map to named stakeholders. Content JSON must never reference avatar role IDs.

Authoring conventions:
- Subject centered in frame; head occupying the upper half (y=0 to y=40 region)
- Design must be safe for circular clip-path (`border-radius: 50%`) — keep subject 6px clear of all edges
- Single consistent lighting source: top-left
- One SVG per role for default/neutral state
- Do not encode identifying features that would imply a specific named character

**Posture and expression state variants** (additive, not required until roles are defined):

| State key   | Filename suffix  | When used                                               |
|-------------|------------------|---------------------------------------------------------|
| default     | *(none)*         | Standard gameplay display                               |
| active      | `_active`        | Stakeholder is actively reacting to the current turn    |
| stressed    | `_stressed`      | Stakeholder mood score is critically low                |

File example: `tech_lead.svg`, `tech_lead_active.svg`, `tech_lead_stressed.svg`

Only the default (no suffix) variant is required. State variants may be added independently without modifying the registry structure — the registry key remains the role ID; state resolution is handled by the component or composable.

### Ending Visual Conventions

Path: `src/assets/presentation/ending-visuals/`
ViewBox: `0 0 320 180`

Ending visuals represent the `endingType` outcome shown on the results screen.

Authoring conventions:
- Classic arcane engineering blueprint style (no pixel-art)
- Composition should convey the thematic meaning of the ending (see Subject Descriptions section)
- Accent color matches the ending type's entry in the Color System table
- Must be legible as a 180px-tall full-width panel
- `<g id="ending-subject">` wraps the primary schematic

### Action and Effect Icon Conventions

Path: `src/assets/presentation/action-effect-icons/`
ViewBox: `0 0 320 180`

Currently only `cards/` is populated. `effects/` and `icons/` are reserved for future iconography.

Card illustration conventions:
- Blueprint schematic representing the card's conceptual mechanism (see Subject Descriptions)
- Readable as a small thumbnail (~60×34px rendered)
- Primary subject in the left-center of the frame

### Branding Asset Conventions

Path: `src/assets/presentation/branding/`
File: `logo_mark.svg`

- Do not modify `logo_mark.svg` without dedicated branding review
- The logo mark is rendered inline by `logo_sigil.vue` — it is not imported via the registry; direct inline use is intentional for this file only
- Canonical path for documentation and any new registry references: `src/assets/presentation/branding/logo_mark.svg`
- See [docs/LOGO_AND_MASTHEAD_IMPLEMENTATION.md](LOGO_AND_MASTHEAD_IMPLEMENTATION.md) for rendering context

---

## Registry-Based Runtime Asset Usage

Runtime and Storybook code must resolve asset URLs through the centralized registry.

Registry file: `src/ui/config/presentation_asset_registry.ts`

**Do not add new direct per-component imports** from SVG file paths when a registry key exists or can be added.

### How to Add a New Asset

1. Create the SVG file in the correct canonical directory under `src/assets/presentation/`. Follow the naming, viewBox, and authoring requirements above.
2. Open `src/ui/config/presentation_asset_registry.ts`.
3. Add a Vite URL import at the top of the file:
   ```typescript
   import myNewAssetUrl from '@/assets/presentation/category/my_new_asset.svg?url'
   ```
4. Add the key to the appropriate typed record or `as const` object in the registry:
   ```typescript
   export const MY_CATEGORY_ASSETS = {
     // ...existing keys...
     my_new_asset: myNewAssetUrl,
   } as const
   ```
5. If a new TypeScript ID type is needed, add a union type export alongside the existing `PlayerClassAssetId`, `EndingVisualId`, etc.
6. Add an entry to the **Current Asset Status** table at the bottom of this document.
7. If the asset belongs to a new category not yet in the registry, also update `PRESENTATION_ASSET_REGISTRY` to include the new sub-map.
8. Run `npm run type-check` to confirm no TypeScript errors.
9. Add a Storybook story variant that renders the new asset (see Integration with Storybook).

### How to Modify an Asset

1. Replace the SVG file at its canonical path in `src/assets/presentation/`.
2. Do not rename the file. Renaming requires a registry key update and is treated the same as removing and re-adding.
3. Confirm the viewBox dimension has not changed. If it has, check all components that consume this asset for layout impact.
4. Run Storybook visually to confirm the asset renders correctly in its component context.
5. Update the **Current Asset Status** table (change `Placeholder` to `Complete` if applicable).

### How to Remove an Asset

Only remove an asset when all of the following are true:
- No imports from the asset file path remain in `src/` or `stories/` (run: `grep -r 'presentation/path/to/asset' src stories`).
- No registry key references the asset.
- The **Current Asset Status** table entry is marked for removal.
- The asset is confirmed absent from Storybook story arguments.

Steps:
1. Remove the import line from `presentation_asset_registry.ts`.
2. Remove the key from the relevant registry record.
3. Remove the SVG file from `src/assets/presentation/`.
4. Remove the row from the **Current Asset Status** table.
5. Run `npm run type-check` to confirm no TypeScript errors.

### Legacy Asset Cleanup

The legacy tree at `src/assets/artwork/` is transitional. Do not add new assets there.

Safe deletion gate for `src/assets/artwork/`:
- Zero remaining imports from `src/assets/artwork/` in `src/` or `stories/` (verify with grep)
- Storybook visual stories have been run and pass visual inspection
- All affected component renders match expected output

Safe deletion gate for `src/assets/logo.svg`:
- `logo_sigil.vue` and all branding components reference only `src/assets/presentation/branding/logo_mark.svg` (or use inline SVG)
- No remaining direct imports of `src/assets/logo.svg` in any file

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
| `OutcomePanel`    | `portraitUrl`    | Ending-type portrait frame      | Emoji icon shown instead    |
| `ScenarioBanner`  | `heroUrl`        | Full-bleed hero above content   | Region absent, no gap       |
| `ClassPortrait`   | `classId`        | Circular pixel-art portrait     | First letter fallback       |
| `RunSetupView`    | via `ClassPortrait` | Class selection card visual  | First letter fallback       |
| `RunIntroSplash`  | `playerClassId`  | Portrait above welcome heading  | No portrait shown           |
| `GameHudSidebar`  | `playerClassId`  | Player identity section at top  | Section hidden              |
| `ShareResultCard` | via `payload.cls`| Inline portrait in player info  | First letter fallback       |

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

**Ending visuals (legacy IDs retained):**
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

**Player class portraits** (pixel-character style — see Style Exception above):
- `boundary_mage`: Robed mage with pointed hat, staff with glowing crystal, boundary partition lines flanking the character. Purple accent. Casting rune fragments from one hand.
- `stakeholder_bard`: Elegant bard with feathered beret, lute, and flowing cape. Gold accent. Musical notes floating from gesturing hand. Doublet with ornate buttons.
- `reliability_cleric`: Hooded cleric with circlet/halo, shield with cross emblem, and healing radiance from raised hand. Blue accent. Light chest plate over vestments.
- `legacy_ranger`: Hooded ranger with bow, quiver, belt pouches, and tattered cloak. Green accent. Scar across face (veteran). Map scroll at hip. Ancient code trace lines in background.
- `delivery_rogue`: Cowled rogue with dual daggers, cross-body straps, tool-laden belt. Orange accent. Speed lines and sprint particles. CI/CD pipeline trace in background.

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

Scene selection and stakeholder `avatarRole` assignment are UI presentation concerns and must not be implemented in simulation/domain logic.

Asset reference policy:

- Prefer registry-based references over direct file imports. See Registry-Based Runtime Asset Usage.
- New assets must be added under `src/assets/presentation/` and registered in `presentation_asset_registry.ts`.
- Legacy `src/assets/artwork/` paths are transitional and must be retired before legacy cleanup.
- `avatarRole` IDs must never appear in content JSON, simulation code, or domain logic.

---

## Current Asset Status

### Canonical Presentation Assets (`src/assets/presentation/`)

| Category            | Asset key                      | File                                               | Status      |
|---------------------|--------------------------------|-----------------------------------------------------|-------------|
| branding            | `logo_mark`                    | `branding/logo_mark.svg`                           | Complete    |
| scenes / scenario   | `default_run_scene`            | `scenes/scenario/default_run_scene.svg`            | Placeholder |
| scenes / events     | `system_incident`              | `scenes/events/system_incident.svg`                | Placeholder |
| scenes / events     | `audit_pressure`               | `scenes/events/audit_pressure.svg`                 | Placeholder |
| scenes / events     | `scaling_crisis`               | `scenes/events/scaling_crisis.svg`                 | Placeholder |
| avatars / classes   | `boundary_mage`                | `avatars/player-classes/boundary_mage.svg`         | Complete    |
| avatars / classes   | `stakeholder_bard`             | `avatars/player-classes/stakeholder_bard.svg`      | Complete    |
| avatars / classes   | `reliability_cleric`           | `avatars/player-classes/reliability_cleric.svg`    | Complete    |
| avatars / classes   | `legacy_ranger`                | `avatars/player-classes/legacy_ranger.svg`         | Complete    |
| avatars / classes   | `delivery_rogue`               | `avatars/player-classes/delivery_rogue.svg`        | Complete    |
| avatars / roles     | *(none yet)*                   | `avatars/stakeholder-avatar-roles/`                | Reserved    |
| action icons / cards| `refactor_action`              | `action-effect-icons/cards/refactor_action.svg`    | Placeholder |
| action icons / cards| `infrastructure_investment`    | `action-effect-icons/cards/infrastructure_investment.svg` | Placeholder |
| action icons / cards| `quick_patch`                  | `action-effect-icons/cards/quick_patch.svg`        | Placeholder |
| ending visuals      | `boundary_builder`             | `ending-visuals/boundary_builder.svg`              | Placeholder |
| ending visuals      | `firefighter`                  | `ending-visuals/firefighter.svg`                   | Placeholder |
| ending visuals      | `system_stabilizer`            | `ending-visuals/system_stabilizer.svg`             | Placeholder |
| ending visuals      | `stakeholder_whisperer`        | `ending-visuals/stakeholder_whisperer.svg`         | Placeholder |
| ending visuals      | `runaway_refactorer`           | `ending-visuals/runaway_refactorer.svg`            | Placeholder |
| ui-surfaces         | *(none yet)*                   | `ui-surfaces/`                                     | Reserved    |

Replace `Placeholder` entries with `Complete` once a production-quality asset is authored and validated in Storybook.

### Legacy Assets (`src/assets/artwork/`) — Transitional

These files are preserved during migration. Do not add new assets here. See Registry-Based Runtime Asset Usage for deletion gate criteria.

| Legacy path                            | Canonical equivalent                                                  | Status      |
|----------------------------------------|-----------------------------------------------------------------------|-------------|
| `archetypes/boundary_builder.svg`      | `ending-visuals/boundary_builder.svg`                                 | Transitional |
| `archetypes/firefighter.svg`           | `ending-visuals/firefighter.svg`                                      | Transitional |
| `archetypes/system_stabilizer.svg`     | `ending-visuals/system_stabilizer.svg`                                | Transitional |
| `archetypes/stakeholder_whisperer.svg` | `ending-visuals/stakeholder_whisperer.svg`                            | Transitional |
| `archetypes/runaway_refactorer.svg`    | `ending-visuals/runaway_refactorer.svg`                               | Transitional |
| `classes/boundary_mage.svg`            | `avatars/player-classes/boundary_mage.svg`                            | Transitional |
| `classes/stakeholder_bard.svg`         | `avatars/player-classes/stakeholder_bard.svg`                         | Transitional |
| `classes/reliability_cleric.svg`       | `avatars/player-classes/reliability_cleric.svg`                       | Transitional |
| `classes/legacy_ranger.svg`            | `avatars/player-classes/legacy_ranger.svg`                            | Transitional |
| `classes/delivery_rogue.svg`           | `avatars/player-classes/delivery_rogue.svg`                           | Transitional |
| `events/system_incident.svg`           | `scenes/events/system_incident.svg`                                   | Transitional |
| `events/audit_pressure.svg`            | `scenes/events/audit_pressure.svg`                                    | Transitional |
| `events/scaling_crisis.svg`            | `scenes/events/scaling_crisis.svg`                                    | Transitional |
| `cards/refactor_action.svg`            | `action-effect-icons/cards/refactor_action.svg`                       | Transitional |
| `cards/infrastructure_investment.svg`  | `action-effect-icons/cards/infrastructure_investment.svg`             | Transitional |
| `cards/quick_patch.svg`                | `action-effect-icons/cards/quick_patch.svg`                           | Transitional |
| `scenarios/hero.svg`                   | `scenes/scenario/default_run_scene.svg`                               | Transitional |
