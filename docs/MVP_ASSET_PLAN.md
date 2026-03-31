# MVP Asset Plan

Date: 2026-03-31
Status: Approved — pending art execution

This document specifies the initial hybrid asset batch required for the redesigned presentation system.
It is a concrete delivery checklist, not a design exploration.

Canonical companions:

- [docs/ARTWORK_PIPELINE.md](ARTWORK_PIPELINE.md) — authoring rules, format policy (raster vs SVG), sizing specs, naming, registry workflow
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md) — redesign phasing
- [docs/SCENE_VISUAL_DIRECTION.md](SCENE_VISUAL_DIRECTION.md) — canonical direction for scene composition, avatar role art direction, and anti-goals
- [docs/MVP_CONCEPT_ART_PACKET.md](MVP_CONCEPT_ART_PACKET.md) — required pre-implementation concept packet and approval checklist
- [AGENT.md](../AGENT.md) — work routing and required-reading policy

Implementation prerequisite:

- Complete and approve [docs/MVP_CONCEPT_ART_PACKET.md](MVP_CONCEPT_ART_PACKET.md) before starting final implementation assets in this plan.

---

## Scope and Constraints

**In scope for this plan:**
- Scenario scene backdrops (replaces the single `default_run_scene` placeholder)
- Event scene illustrations (production-quality pass on existing placeholders)
- Initial `avatarRole` bust set
- Minimal UI surface accent elements

**Not in scope:**
- `playerClass` portraits — these are already complete (5 of 5)
- `endingType` visuals — existing placeholders are sufficient as stubs until Phase 3 of the redesign
- Card action illustrations — existing placeholders are sufficient as stubs until Phase 2
- Tutorial assets

**Style direction summary:**
- Fantasy-tech and pixel-adventure-inspired
- Scene-based presentation (place/stage composition), not panel-style diagram composition
- Pixel-readable: clean enough to read at 80×80 or smaller; no detail that blurs to noise at small sizes
- Hybrid format strategy:
	- PNG/WebP for scenario/event scene backdrops and stakeholder `avatarRole` character/state art
	- SVG for UI surfaces, frames, icons, badges, reusable ornaments, and simple effect markers
- Dark substrate: `#0b0e1a` background, selective luminous accents
- Expressive at small sizes: strong silhouette, high contrast, recognisable form without labelling
- Clean enough for browser UI: no visual noise that competes with game information; artwork is always decorative chrome

---

## 1. Scenario Scene Backdrops

**Path:** `src/assets/presentation/scenes/scenario/`
**Canvas target:** `800x200`
**Format:** WebP preferred (`.png` fallback acceptable)
**Style:** Fantasy-tech environmental stage composition (see `docs/SCENE_VISUAL_DIRECTION.md`)

One scene per scenario atmosphere. Scenes are tagged by atmosphere type, not by scenario ID, so they remain reusable if new scenario JSON is added later.

The scene pool must cover all four shipped scenarios plus provide a generic fallback for unknown atmosphere tags.

### Scene catalog

| File                        | Atmosphere tag       | Used for scenario(s)        | Accent        | Description                                                                                             |
|-----------------------------|----------------------|-----------------------------|---------------|---------------------------------------------------------------------------------------------------------|
| `default_run_scene.webp`     | `generic`            | Fallback / any untagged     | Multi-accent  | Neutral fantasy-tech operations hall with modular structures and open staging space                     |
| `legacy_architecture.webp`   | `legacy`             | Monolith of Mild Despair    | `#d97706` amber | Ancient fortress-workshop built around one massive core structure and cramped passageways               |
| `distributed_chaos.webp`     | `distributed`        | Microservice Sprawl         | `#60a5fa` blue → `#f87171` red | Fragmented skybridge district with many small towers and unstable connective routes      |
| `hypergrowth_velocity.webp`  | `hypergrowth`        | Startup Hypergrowth         | `#f97316` orange | Vertical launch-yard skyline with overload pressure in motion through the environment                   |
| `compliance_pressure.webp`   | `compliance`         | Compliance Gauntlet         | `#fbbf24` gold | Inspection tribunal chamber with layered checkpoints and ceremonial scrutiny atmosphere                 |

`default_run_scene` exists as a placeholder concept — it gets a production-quality raster art pass as part of this batch.

### Scene authoring rules (all scenario scenes)

- Compositions must be readable and meaningful at 200px rendered height (full-bleed in ScenarioBanner)
- Keep left-center lightly detailed — it may be partially obscured by run summary text
- No text that duplicates UI labels; avoid text-heavy baked-in art
- Use the listed accent color as the primary luminous element; secondary elements use that color at 20–40% opacity
- Keep subject, midground, and ambient layers distinct in source art so later iteration remains safe

---

## 2. Event Scene Illustrations

**Path:** `src/assets/presentation/scenes/events/`
**Canvas target:** `320x180`
**Format:** WebP preferred (`.png` fallback acceptable)
**Style:** Fantasy-tech scene vignette (event as place/moment, not infographic)

The three existing event scene files are in placeholder state. This batch replaces them with production-quality art. A generic fallback scene is added for custom events.

### Event scene catalog

| File                    | Event type          | Status    | Accent              | Description                                                                                            |
|-------------------------|---------------------|-----------|---------------------|--------------------------------------------------------------------------------------------------------|
| `system_incident.webp`   | `system_incident`   | Replace   | `#f87171` red       | Breached control chamber with cascading hazard cues and emergency glow                                 |
| `audit_pressure.webp`    | `audit_pressure`    | Replace   | `#d97706` amber     | Formal inspection corridor with scrutiny devices and constrained movement paths                        |
| `scaling_crisis.webp`    | `scaling_crisis`    | Replace   | `#60a5fa` → `#f87171` | Overloaded transit nexus where throughput pressure is visible in the environment                    |
| `generic_disruption.webp`| `generic` / fallback| **New**  | `#a78bfa` muted purple | Neutral disturbance scene with interrupted energy flow and no domain-specific labeling                 |

### Event scene authoring rules

- Must be recognisable and readable at 90px rendered height (compact frame in CardDetailsModal)
- Subject should occupy the center-top 60% of the frame — card text appears below the image
- `generic_disruption.webp` must be visually neutral enough to not conflict with any event's color theme when shown as a fallback

---

## 3. Avatar Role Set

**Path:** `src/assets/presentation/avatars/stakeholder-avatar-roles/`
**Canvas target:** `80x80` (authoring source may be larger)
**Format:** WebP preferred (`.png` fallback acceptable)
**Style:** Pixel-character fantasy — bust/head-and-shoulders only

Avatar roles are UI-only visual identities assigned to stakeholders at runtime. They do not map 1:1 to named stakeholders. Multiple stakeholders may receive the same avatar role in one run if they share an archetype.

The five roles below cover all seven shipped stakeholders through loose assignment. Assignment logic lives in the UI layer and is not defined here.

### Role catalog

| Role ID       | Fantasy concept             | Accent              | Character description                                                                         | Covers (not binding)                       |
|---------------|-----------------------------|---------------------|-----------------------------------------------------------------------------------------------|--------------------------------------------|
| `oracle`      | Visionary seer              | `#9f7aea` purple    | Cowled figure with glowing crystal orb, seeing apparatus or multiple lenses, robes with rune trim  | `cto`                                  |
| `chronicler`  | Record-keeper               | `#fbbf24` gold      | Beret-like cap, small scroll/tablet held open, quill or stylus in hand, light travel cloak        | `vp_product`                           |
| `warden`      | System guardian             | `#60a5fa` blue      | Helm with visor, pauldron visible at shoulder, shield crest or emblem motif on chest               | `operations_manager`, `security_officer` |
| `artificer`   | Builder and craftsperson    | `#34d399` green     | Goggles pushed up on forehead, work apron, tool loops at chest, calibration ruler motif            | `lead_developer`, `tech_lead`          |
| `chancellor`  | Administrative authority    | `#fb923c` amber     | Tricorn-style formal hat, high collar, visible ledger or seal, one hand raised in authority gesture | `cfo`                                 |

### Variant coverage

**MVP requirement:** `default` state raster asset for all five roles.

**Priority state expansions** (add in the first art pass after `default` is validated):

| Role          | `_stressed` priority | Justification                                                        |
|---------------|----------------------|----------------------------------------------------------------------|
| `warden`      | High                 | Operations Manager and Security Officer both have explicit stress reactions in gameplay |
| `artificer`   | High                 | Lead Developer has a "threatens resignation" reaction — stressed state needed for dramatic readability |
| `oracle`      | Medium               | CTO has "frustrated by stagnation" — expressed via stressed state    |
| `chronicler`  | Low                  | VP Product reactions are growth/celebration-focused; stress less visible |
| `chancellor`  | Low                  | CFO appears in one scenario; stress state lower priority for MVP    |

**`_active` state** is deferred entirely past MVP. During gameplay, active reactions can be communicated through UI overlay rather than asset variants.

### Avatar role authoring rules

- Background: `#0b0e1a`, same as playerClass portraits
- Subtle grid overlay at 20px spacing, role accent color at 6% opacity
- Subject centered, head and shoulders occupying y=8 to y=60 region (leave y=0–8 and y=60–80 clear for circular-crop safety)
- Character silhouette must read clearly at 40×40px rendered (circular thumbnail in stakeholder sidebar)
- Non-descript gender design — use costume, tool, and posture to convey role; no gender-specific features
- Corner bracket marks at all four corners (same pattern as playerClass portraits)
- Single light source: top-centre (character is lit from above)
- Pixel element size: 2×2 blocks; features at the face level may use 1×1 for legibility

**`_stressed` variant rules:**
- Same pose/costume structure as `default`; distinct pixel changes only — do not re-author the base character
- Visible differences: furrowed brow (2px pixel shift on brow group), reduced glow on accents, stress indicator element (e.g., warden: cracked shield emblem; artificer: sparking tool; oracle: clouded orb)
- Do not change background, costume, or overall pose — identifiability at a glance must be preserved

---

## 4. UI Surface Assets

**Path:** `src/assets/presentation/ui-surfaces/`
**Style:** Arcane engineering blueprint — decorative, not figurative

UI surface assets are optional chrome elements that reinforce visual identity without carrying game information. Every component must remain fully readable if all surface assets are absent.

### MVP surface asset catalog

| File                     | Purpose                                                   | ViewBox       | Accent          |
|--------------------------|-----------------------------------------------------------|---------------|-----------------|
| `card_frame_corner.svg`  | Corner bracket accent for action/event card panel borders | `0 0 24 24`  | Neutral `#4b5563` with 1px glow |
| `panel_divider.svg`      | Horizontal rule between panel sections                    | `0 0 320 8`  | Neutral, dashed blueprint style |

Only these two surface assets are required for MVP. Both are micro-elements — they serve as repeatable decoration primitives, not standalone illustrations.

**`card_frame_corner.svg` authoring:**
- A right-angle bracket formed from two thin lines (1px stroke) plus a 3×3 accent dot at the vertex
- Designed to be rotated 90°/180°/270° via CSS `transform` for all four corners of a panel
- No fill, stroke only — inherits color via CSS `currentColor` where possible, or hardcoded to `#4b5563` at base

**`panel_divider.svg` authoring:**
- 1px dashed horizontal line spanning the full 320 unit width
- Blueprint tick marks at 0, 160, and 320 unit positions
- Small `×` annotation glyph at center (monospace, 5px cap height)
- No fill — stroke-only composition

---

## 5. Delivery Checklist

Tasks are ordered by dependency: scenes first (needed for scenario and event components), then avatar roles (needed for stakeholder sidebar), then surface accents (can be added last without blocking other UI work).

### Phase A — Scene backdrops (unblocks ScenarioBanner and EventCard production passes)

- [ ] `scenes/scenario/legacy_architecture.webp` — new
- [ ] `scenes/scenario/distributed_chaos.webp` — new
- [ ] `scenes/scenario/hypergrowth_velocity.webp` — new
- [ ] `scenes/scenario/compliance_pressure.webp` — new
- [ ] `scenes/scenario/default_run_scene.webp` — production-quality pass (replace placeholder)
- [ ] `scenes/events/system_incident.webp` — production-quality pass (replace placeholder)
- [ ] `scenes/events/audit_pressure.webp` — production-quality pass (replace placeholder)
- [ ] `scenes/events/scaling_crisis.webp` — production-quality pass (replace placeholder)
- [ ] `scenes/events/generic_disruption.webp` — new

### Phase B — Avatar role defaults (unblocks stakeholder UI and scene-model prototype)

- [ ] `avatars/stakeholder-avatar-roles/oracle.webp`
- [ ] `avatars/stakeholder-avatar-roles/chronicler.webp`
- [ ] `avatars/stakeholder-avatar-roles/warden.webp`
- [ ] `avatars/stakeholder-avatar-roles/artificer.webp`
- [ ] `avatars/stakeholder-avatar-roles/chancellor.webp`

### Phase C — Avatar role stressed variants (adds expressiveness after Phase B validates)

- [ ] `avatars/stakeholder-avatar-roles/warden_stressed.webp`
- [ ] `avatars/stakeholder-avatar-roles/artificer_stressed.webp`
- [ ] `avatars/stakeholder-avatar-roles/oracle_stressed.webp`

### Phase D — UI surface accents (final visual polish layer)

- [ ] `ui-surfaces/card_frame_corner.svg`
- [ ] `ui-surfaces/panel_divider.svg`

---

## 6. Registry and Code Changes Required

Each new asset added in this batch requires a corresponding update to the presentation registry.

Registry keys remain extension-agnostic (`default_run_scene`, `oracle`, etc.). The import path extension follows category format policy.

When all Phase A assets are complete:
- Update `SCENE_ASSETS.scenario` in `presentation_asset_registry.ts` with 4 new scenario keys
- Update `SCENE_ASSETS.events` with `generic_disruption`
- Add `ScenarioSceneAssetId` union type: `'default_run_scene' | 'legacy_architecture' | 'distributed_chaos' | 'hypergrowth_velocity' | 'compliance_pressure'`
- Add `EventSceneAssetId` entry for `'generic_disruption'`

When Phase B assets are complete:
- Populate `STAKEHOLDER_AVATAR_ROLE_ASSETS` with five role keys
- Add `AvatarRoleAssetId` union type: `'oracle' | 'chronicler' | 'warden' | 'artificer' | 'chancellor'`

When Phase C stressed variants are added:
- The registry does not need a separate key per variant — variants are resolved by composable logic (`{role_id}_stressed`) and `STAKEHOLDER_AVATAR_ROLE_ASSETS` remains an indexed lookup by base role ID
- Stressed variant resolution: composable appends `_stressed` to role ID and falls back to default if not present

When Phase D surface assets are complete:
- Populate `UI_SURFACE_ASSETS` with `card_frame_corner` and `panel_divider` keys

See [docs/ARTWORK_PIPELINE.md — How to Add a New Asset](ARTWORK_PIPELINE.md#how-to-add-a-new-asset) for the full procedure.

---

## 7. Atmosphere Tag Mapping (Reference)

This table shows how scenario IDs map to scene atmosphere tags at runtime. This mapping belongs in **UI-layer code** (`src/ui/config/` or a dedicated composable), not in content JSON.

| Scenario ID               | Atmosphere tag   | Scene file                  |
|---------------------------|------------------|-----------------------------|
| `monolith_of_mild_despair`| `legacy`         | `legacy_architecture.webp`   |
| `microservice_sprawl`     | `distributed`    | `distributed_chaos.webp`     |
| `startup_hypergrowth`     | `hypergrowth`    | `hypergrowth_velocity.webp`  |
| `compliance_gauntlet`     | `compliance`     | `compliance_pressure.webp`   |
| *(any unrecognised ID)*   | `generic`        | `default_run_scene.webp`     |

This mapping is UI-only. The simulation does not know about atmosphere tags. If new scenario JSON is added, the atmosphere tag mapping in the UI layer is updated independently of content authoring.

---

## 8. Future Expansion Notes

These items are explicitly out of scope for this MVP batch but should inform authoring decisions so new art is compatible:

- **Additional avatarRole `_active` variants** — reserved for post-MVP expressiveness work. Author the `default` busts in a neutral-to-slightly-positive expression. Do not lock the pose in a way that prevents a companion `_active` version from being authored later.
- **Additional `avatarRole` additions** — as custom content packs introduce new stakeholder types, new roles can be added to `stakeholder-avatar-roles/` and the registry independently. The 5 MVP roles are generic enough to be reassigned to new stakeholders via the UI mapping layer.
- **Additional scene atmosphere tags** — new scenario JSON may introduce tags not yet represented. The `default_run_scene.webp` fallback handles these gracefully. First-class scenes can be added to the pool on-demand.
- **Ending visual production pass** — ending visuals are currently placeholders and scheduled for production-quality art in Phase 3 of the redesign (not this batch).
