# Dungeon Prototype Promotion & Migration Plan

Date: 2026-04-07  
Status: Planning only — no migration performed yet  
Branch: ui-redesign

This document is the canonical plan for promoting the approved dungeon prototype family
into the real reusable UI system. It covers component readiness, promotion strategy,
migration order, token migration, risks, and the recommended first real migration target.

---

## Audit Baseline

### What exists in the prototype layer

| Prototype | File | Visual completeness | Variants |
|---|---|---|---|
| `DungeonFramePrototype` | `src/ui/prototypes/dungeon/DungeonFramePrototype.vue` | Full | default / aged / accent |
| `DungeonModalPrototype` | `src/ui/prototypes/dungeon/DungeonModalPrototype.vue` | Full | default / aged / accent |
| `DungeonButtonPrototype` | `src/ui/prototypes/dungeon/DungeonButtonPrototype.vue` | Full | primary / secondary / subtle / warning / disabled |
| `DungeonBadgePrototype` | `src/ui/prototypes/dungeon/DungeonBadgePrototype.vue` | Full | info / success / warning / alert / locked / help × sm / md |
| `DungeonTabsPrototype` | `src/ui/prototypes/dungeon/DungeonTabsPrototype.vue` | Full | default / aged / accent |
| `DungeonProgressPrototype` | `src/ui/prototypes/dungeon/DungeonProgressPrototype.vue` | Full | default / success / warning / alert |
| `DungeonCardPrototype` | `src/ui/prototypes/dungeon/DungeonCardPrototype.vue` | Full | default / aged / accent / neutral / positive / warning / danger |

All prototypes have Storybook stories under `stories/prototypes/dungeon/`.  
All prototypes consume shared `dungeon-design-tokens.css` which is loaded globally in Storybook via `.storybook/preview.ts`.  
The token file is **not yet imported in the production app** — only Storybook loads it.

### What exists in the production layer

| Production component | File | Callers in production |
|---|---|---|
| `surface_frame_container` | `src/ui/components/surfaces/surface_frame_container.vue` | **0** (only Storybook) |
| `surface_modal_panel` | `src/ui/components/surfaces/surface_modal_panel.vue` | 3: `about_modal`, `dungeon_master_modal`, `rules_modal` |
| `surface_side_panel` | `src/ui/components/surfaces/surface_side_panel.vue` | 0 in production (only Storybook) |
| `surface_drawer_panel` | `src/ui/components/surfaces/surface_drawer_panel.vue` | 0 in production (only Storybook) |
| `action_card` | `src/ui/components/cards/action_card.vue` | 1: `game_view` (heavy use) |
| `score_hud` | `src/ui/components/scores/score_hud.vue` | 1: `game_hud_bar` |
| `score_panel` | `src/ui/components/scores/score_panel.vue` | Separate panel view |
| `turn_briefing_panel` | `src/ui/components/turn/turn_briefing_panel.vue` | Likely `game_view` |
| No `AppButton` | — | — All raw `<button>` elements |
| No `AppBadge` / semantic badge | — | — Inline emoji badges in `turn_briefing_panel`, `action_card` |
| No `AppTabs` | — | — No tab navigation in production |

---

## 1. Component-by-Component Promotion Recommendation

### `DungeonFramePrototype` → Ready for promotion

**Readiness:** High.

**Target:** Use as the basis for a new canonical `AppFrame.vue` under `src/ui/components/surfaces/`.

**Strategy:** Create a new component — do not replace `surface_frame_container.vue` internals yet.  
`surface_frame_container.vue` has no production callers; it can be deprecated-in-place once
`AppFrame.vue` exists and any future callers use it directly.

**Structural gaps:** None significant. The prototype API (`title`, `subtitle`, `variant`, slots
`default` / `header-actions` / `footer`) is clean and complete. Slot name convention differs from
the production surface (`headerActions` vs `header-actions`), but since there are no production
callers to migrate, use the prototype's kebab-case slot names in the official component.

**Action required before promotion:**
- Register `dungeon-design-tokens.css` in the production app (see token section below).
- Strip the `Prototype` suffix from the component name and re-file in `components/surfaces/`.
- Keep the Storybook story for visual regression coverage.

---

### `DungeonModalPrototype` → Requires behavioral wrapper before promotion

**Readiness:** Medium. The visual layer is complete. It is missing the behavioral contract that
production modals must satisfy.

**Target:** Replace the internals of `surface_modal_panel.vue`, preserving its external API.

**Strategy:** Replace internals — keep the `surface_modal_panel.vue` file and its external prop
contract (`isOpen`, `title`, `size`, `closeOnBackdrop`, `closeLabel`, `close` emit) so the 3
callers (`about_modal`, `dungeon_master_modal`, `rules_modal`) require no changes.

Wrap the `DungeonModalPrototype` visual layer inside a behavioral outer shell that owns:
- `isOpen` prop → `v-if` or `v-show` show/hide
- Backdrop overlay + click-to-close
- Escape key handler (`onMounted` / `onUnmounted`)
- `close` emit
- `aria-modal` + `role="dialog"` (already in prototype, keep them)

**Structural gaps:**
- `DungeonModalPrototype` has no `isOpen` prop — it always renders.
- `DungeonModalPrototype` has no backdrop, no close button, no `close` emit.
- The prototype identifies `title` as `h2` + `titleId` for `aria-labelledby` — identical intent to
  the production modal, but titleId generation differs (prototype uses random suffix, production
  derives from title string). Align: using title-derived ID is slightly safer for determinism.
- The production modal has a `size` prop (`sm` / `md` / `lg`) that controls max-width. The
  prototype has no size prop. Add a `size` prop to the promoted version that overrides
  `max-width` via a CSS custom property on the host element (e.g. `--modal-max-width`).

**Action required before promotion:**
- Design the wrapper composition: `surface_modal_panel.vue` owns behavior; dungeon visual layer
  renders inside it as a presentational slot-fed child, or internals are merged into one file.
- The cleaner path is a single-file merge: `surface_modal_panel.vue` retains the prop/emit
  contract and adds the dungeon visual markup inline, removing the old generic markup.

---

### `DungeonButtonPrototype` → Ready to promote as a new component

**Readiness:** High for isolated creation. Zero production risk.

**Target:** New `src/ui/components/common/AppButton.vue`.

**Strategy:** Create new — no existing production button component to replace or migrate.  
Production views use raw `<button>` elements with ad-hoc styling. Do not migrate those yet;
let `AppButton.vue` exist in parallel until a screen-level migration step absorbs them.

**Structural gaps:** None significant for standalone creation.  
The prototype's slot + `label` prop pattern is flexible. The `disabled` state using
`variant="disabled"` is slightly non-standard (conventionally a `disabled` HTML attr drives
state). Prefer promoting with a `disabled` boolean prop that sets both `:disabled` attr and adds
the variant class, rather than relying on `variant="disabled"` as the only disabled pathway.

---

### `DungeonBadgePrototype` → Ready to promote as a new component

**Readiness:** High for isolated creation. Zero production risk.

**Target:** New `src/ui/components/common/AppBadge.vue`.

**Strategy:** Create new. Production indicator badges are currently inline emoji spans in
`turn_briefing_panel.vue` and `action_card.vue`. Those callers are not migration targets yet.

**Structural gaps:** None significant for standalone creation. The SVG glyph approach replaces
emoji badges — the semantic signal contract is clearly defined across 6 variants.

**Note:** The `role="img"` + `aria-label` pattern is correct. The `label` prop (for custom aria)
is a good addition. Promote as-is.

---

### `DungeonTabsPrototype` → Ready to promote as a new component

**Readiness:** High for isolated creation. No production equivalent exists.

**Target:** New `src/ui/components/common/AppTabs.vue`.

**Strategy:** Create new. No tab navigation exists in production today. This component will be
adopted by new layout work rather than replacing an existing component.

**Structural gaps:** None for standalone creation. The `tabs` prop (array of `{ id, label }`)
and `modelValue` / `update:modelValue` pattern is idiomatic Vue. Confirm this is the
final prop interface before promotion (verify in `DungeonTabsPrototype.vue` script setup).

---

### `DungeonProgressPrototype` → Ready to promote as a new component; existing callers are deferred

**Readiness:** High for standalone creation. Medium for caller integration.

**Target:** New `src/ui/components/common/AppProgress.vue`.

**Strategy:** Create new, parallel to existing `score_hud.vue` and `score_panel.vue`.  
The production score HUD has compound behavior (expandable/collapsible, click-outside-close,
overall health summary, full metric list) that `DungeonProgressPrototype` does not replicate.
Do not replace `score_hud.vue` internals yet — add `AppProgress.vue` as an atomic meter
component that the score HUD may eventually consume per-metric row.

**Structural gaps:**
- `DungeonProgressPrototype` includes an optional `nameplate` header zone (via `label` prop)
  which roughly matches a labeled meter. The score HUD uses emoji icons as metric labels;
  those can be fed through the `label` prop or a label slot.
- The progress `value` prop (0–100) maps directly to the score range already used in
  `score_hud.vue` and `score_panel.vue`. No data transformation needed.
- The prototype's semantic variant (`success` / `warning` / `alert`) maps cleanly to the
  production token system's `--effect-positive`, `--effect-warning`, `--effect-negative`.

---

### `DungeonCardPrototype` → Promote as structural shell; action_card migration is deferred

**Readiness:** High for standalone creation. Low for absorption into `action_card.vue`.

**Target:** New `src/ui/components/cards/AppCard.vue` as a structural shell/layout layer.

**Strategy:** Create the structural card component now. Do not attempt to migrate `action_card.vue`
internals yet. `action_card.vue` is the most complex component in the production layer —
it owns: effect chips, tooltip previews, tutorial state overlays, artwork thumbnails, stakeholder
indicators, and card metadata display. `DungeonCardPrototype` provides only the visual
material frame (bronze ring, teal inset, header label, footer, semantic variant).

Future migration path: `action_card.vue` adopts `AppCard.vue` as its outer structural wrapper
while keeping all its interior content logic intact. That is a separate migration step.

**Structural gaps:**
- `DungeonCardPrototype` has a `compact` prop for reduced padding — relevant for the card
  grid layout in `card_satchel_drawer.vue`.
- The semantic variants (`neutral` / `positive` / `warning` / `danger`) map to game effect
  valence, which `action_card.vue` expresses today via category color strips. The mapping
  is different in approach (color strip vs inset signal) but compatible in intent.
- `action_card.vue` has no structural slot system — it renders a fixed layout. Promotion
  requires decoupling the content layout from the material shell, which is the larger migration.

---

## 2. Recommended Migration Order

Order from safest to most complex. Each step is independently releasable.

### Step 1 — Register the token layer in production (prerequisite for all steps)

**Action:** Import `dungeon-design-tokens.css` into the production app.

Safest integration point: add an `@import` at the bottom of
`src/ui/styles/design-system.css`. This is already loaded globally via `App.vue`.
The `dungeon-design-tokens.css` file defines only `:root` custom properties under the
`--dng-` namespace, which does not conflict with any existing `--bg-*`, `--surface-*`,
`--text-*`, `--border-*`, or `--metric-*` tokens.

**Risk level:** Minimal. Pure CSS variable additions, no selector rules, no layout changes.

---

### Step 2 — Promote `DungeonFramePrototype` → `AppFrame.vue`

**Action:** Copy `DungeonFramePrototype.vue` to `src/ui/components/surfaces/AppFrame.vue`.
Rename classes from `dungeon-frame*` to `app-frame*` (or keep `dungeon-frame*` and
accept that as the canonical component class namespace — both are defensible).

Add a Storybook story under `stories/foundations/` or `stories/game/` covering all variants.

`surface_frame_container.vue` can remain untouched as a deprecated keep-for-now.

**Risk level:** None. New file, zero callers.

---

### Step 3 — Promote `DungeonButtonPrototype` → `AppButton.vue`

**Action:** Create `src/ui/components/common/AppButton.vue`.

Apply the `disabled` prop fix described above (boolean prop → sets HTML `disabled` attr +
variant class, rather than `variant="disabled"` as the only path).

Add a Storybook story covering all variants + disabled state + slot/label usage.

**Risk level:** None. New file, zero callers.

---

### Step 4 — Promote `DungeonBadgePrototype` → `AppBadge.vue`

**Action:** Create `src/ui/components/common/AppBadge.vue`.

**Risk level:** None. New file, zero callers.

---

### Step 5 — Promote `DungeonTabsPrototype` → `AppTabs.vue`

**Action:** Create `src/ui/components/common/AppTabs.vue`.
Confirm the `tabs` prop shape and modelValue contract before promotion.

**Risk level:** None. New file, zero callers.

---

### Step 6 — Promote `DungeonProgressPrototype` → `AppProgress.vue`

**Action:** Create `src/ui/components/common/AppProgress.vue`.

No caller migrations yet — `score_hud.vue` and `score_panel.vue` continue to run their own
internal progress bars until a dedicated score HUD reskin step.

**Risk level:** None for creation. Low for future caller integration.

---

### Step 7 — Promote `DungeonCardPrototype` → `AppCard.vue`

**Action:** Create `src/ui/components/cards/AppCard.vue` as a structural shell.

No caller migrations yet — `action_card.vue` continues to own its content logic.

**Risk level:** None for creation. The `action_card.vue` integration is the high-risk step
deferred to a later screen-migration phase.

---

### Step 8 — Integrate `DungeonModalPrototype` into `surface_modal_panel.vue`

**Action:** Replace the visual internals of `surface_modal_panel.vue` with the dungeon modal
markup, preserving the external prop/emit contract. The 3 callers (`about_modal`,
`dungeon_master_modal`, `rules_modal`) require no prop changes if the contract is preserved.

This is the only **replace-internals** step in the plan; all others are new-component creations.

**Risk level:** Medium. Three callers. Requires visual regression testing across all three modals
before merging. Behavioral contract (isOpen, close, escape, backdrop) must be verified.

---

## 3. Token / Design-System Migration Recommendation

### What should move now

**`dungeon-design-tokens.css` → integrate into `design-system.css` import chain.**

Specific recommendation: add `@import '../prototypes/dungeon/dungeon-design-tokens.css';` at
the bottom of `src/ui/styles/design-system.css`. Do not inline the tokens into
`design-tokens.css` yet — keep the files separate until the token naming conventions are
finalized (the `--dng-` prefix is prototype-scoped; it may be promoted to `--frame-` or
`--console-` names later if scope expands beyond dungeon components).

**Rationale for keeping separate:** The `--dng-` tokens are highly specific to the bronze
ring / teal inset material language. They are not generic enough to merge into the semantic
token system (which uses `--surface-*`, `--border-*`, `--metric-*` semantics). They belong
in a parallel material-layer file imported after the semantic layer.

### What should stay in the prototype location for now

- The **variant override blocks** inside each component's `<style scoped>` (aged/accent).
  These are component-internal CSS variable overrides, not shared tokens.  
- **Component-specific geometry constants** like `--dng-btn-*`, `--dng-badge-*`,
  `--dng-tab-*`, `--dng-progress-*` can stay in `dungeon-design-tokens.css` as companion
  geometry documentation — do not split the file by component yet.

### Tokens that may eventually graduate to the production token system

These values are duplicates or near-duplicates of production semantic values and should be
reviewed for consolidation when the material language is fully adopted:

| Dungeon token | Production equivalent | Recommendation |
|---|---|---|
| `--dng-title-gold`: `#d4b860` | `--text-bright`: `#edf0f7` | Keep separate — gold is intentional warm departure |
| `--dng-subtitle-warm`: `#7a6c44` | `--text-secondary`: `#7a8aa4` | Keep separate — warm vs cool intentional |
| `--dng-footer-muted`: `#5c7078` | `--text-muted`: `#4d5b72` | Very close — candidate for aliasing |
| `--dng-inset-bloom` teal | `--metric-domain-clarity`: `#2dd4bf` | Different usage, keep separate |
| `--dng-success-glyph`: `#2ddc82` | `--effect-positive`: `#34d399` | Near match — review at screen migration time |
| `--dng-alert-glyph`: `#e86060` | `--effect-negative`: `#f87171` | Near match — review at screen migration time |

No immediate consolidation required. Flag for review when `AppBadge` and `AppProgress` are
adopted by actual screens.

---

## 4. Risks and Structural Divergences

### Risk A — Modal behavioral gap (medium risk)

`DungeonModalPrototype` renders unconditionally. It has no `isOpen`, no `close` emit, no escape
handler, no backdrop. `surface_modal_panel.vue` callers depend on all of these.

The behavioral wrapper layer must be tested independently of the visual redesign. Do not merge
the internals replacement until a story exists that exercises the behavioral contract
(open/close/escape/backdrop) specifically.

### Risk B — Token load order in production (low risk)

`dungeon-design-tokens.css` is currently only loaded in Storybook. When it is added to
`design-system.css`, verify there are no `:root` variable name collisions with the
production token set. A grep for `--dng-` in `design-tokens.css` should confirm no conflicts.
The namespacing convention (`--dng-`) was chosen to prevent this.

### Risk C — `action_card.vue` structural depth (high risk, deferred)

`action_card.vue` is not a structural container — it is a complex domain-connected component
with its own layout and display logic baked in. `DungeonCardPrototype` provides the material
frame but nothing else. The migration path requires separating the structural card shell from
the card content layout, which touches `game_view.vue` rendering logic. This is a screen-level
migration, not a component-level swap, and belongs in a separate PR.

### Risk D — BEM class namespace collision (low risk)

Promoted components will carry `dungeon-frame`, `dungeon-modal`, `dungeon-btn`, etc. class names
into production. These are scoped CSS so collision is not a functional risk, but the naming
signals "prototype origin" to future developers. After all 7 promotions are stable, consider a
coordinated rename to `app-frame`, `app-modal`, `app-btn` etc. — but not in the same step as
promotion.

### Risk E — `disabled` API on `DungeonButtonPrototype` (low risk, fixable now)

`variant="disabled"` as the disabled state mechanism does not set the native HTML `disabled`
attribute, so keyboard-accessible button state (no-click, no-focus) must be enforced manually.
Fix this during promotion (Step 3), not in the prototype. The prototype can remain as-is for
visual reference.

### Risk F — `titleId` randomness in `DungeonModalPrototype` (low risk)

`Math.random().toString(36).slice(2, 9)` produces non-deterministic IDs which makes
server-side rendering and testing fragile. Replace with a title-derived ID (same strategy as
`surface_modal_panel.vue`) during the internal replacement step (Step 8).

---

## 5. Best First Real Migration Target

**Recommended first target: Step 1 + Step 2 together — register tokens, then promote `DungeonFramePrototype` as `AppFrame.vue`.**

Rationale:

1. `surface_frame_container.vue` has **zero production callers** — there is no migration risk,
   no caller churn, and no behavioral contract to preserve.
2. Token registration is a pure CSS addition. It enables all subsequent promotion steps.
3. `AppFrame.vue` is the structural anchor of the dungeon material language. Having it in
   the official component layer first makes all subsequent components legible: they build
   outward from the same ring/inset vocabulary now living in a canonical location.
4. The Frame prototype is visually complete, has clean slot/prop API, and has three working
   variant states with Storybook stories already present.
5. It can be reviewed as a standalone PR with clear before/after: no production behavior
   changes, one new component file, one `@import` line added, and an updated Storybook story
   category path.

The single concrete action to begin: open `DungeonFramePrototype.vue`, confirm the API is
exactly what you want in `AppFrame.vue` (slot names, variant names, prop types), then file
the component at `src/ui/components/surfaces/AppFrame.vue` with `dungeon-design-tokens.css`
registered in `design-system.css`.

---

## Appendix: Production callers of `surface_modal_panel.vue` (for Step 8)

| Caller | File |
|---|---|
| `about_modal.vue` | `src/ui/components/common/about_modal.vue` |
| `dungeon_master_modal.vue` | `src/ui/components/common/dungeon_master_modal.vue` |
| `rules_modal.vue` | `src/ui/components/common/rules_modal.vue` |

All three should be visually verified in Storybook before and after the internals swap.
