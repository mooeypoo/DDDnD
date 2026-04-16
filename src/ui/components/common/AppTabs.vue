<template>
  <!--
    AppTabs — horizontal segmented tab strip in the dungeon-console family.

    Structural layers (outer → inner):

      1. dungeon-tabs (outer shell div)
                              Same clip-path octagon + dark shell + ambient
                              drop-shadow as AppFrame. Uses --dng-chamfer
                              (8px). Direct architectural sibling to the frame, modal,
                              and button shells — no new outer-shell invention.

      2. dungeon-tabs__ring   Cast-bronze ring — identical gradient + directional
                              bevel box-shadow to all other family rings.
                              Reduced padding (--dng-tab-ring-v/-h: 8px each) to
                              keep the strip compact: bronze visible as a top and
                              bottom band framing the tab row, with side padding
                              containing the L-bracket anchors.
                              Four L-bracket mounts at ring corners, same 16px/3px/6px
                              geometry as AppFrame.

      3. dungeon-tabs__strip  Horizontal flex row. Spans the ring interior full-width
                              via the negative-margin bleed strategy from the
                              AppFrame nameplate — bronze visible only
                              at top and bottom (vertical padding).
                              Hard ring-inner borders (--dng-frame-outer) at left and
                              right edges close the structural gap where the strip
                              bleeds to the ring boundary.

      4. dungeon-tab-item     Each clickable tab zone. Fills the strip's full height.

                              Inactive state:
                                · --dng-panel-surface background — same recessed teal-dark
                                  as the main inset on AppFrame. Reads as
                                  physically below the ring level, not projecting outward.
                                · Near-invisible top/bottom borders flush with the ring.
                                · Muted --dng-subtitle-warm label.
                                · 1px --dng-divider inter-tab separator on right edge
                                  (last item omits right separator).

                              Active state (.is-active):
                                · Same plate gradient (bg-hi → bg-mid → bg-base) as the
                                  AppButton face plate and the AppFrame
                                  nameplate. The raised-plate read comes from the lighter
                                  background + bright directional bevel — no height change.
                                · Directional bevel borders (plate-top / plate-bottom) at
                                  full brightness, plate-shimmer into the ring gap below.
                                · --dng-title-gold label — high-contrast engraved read.

    Structural relationship to the family:
      · Outer shell clip-path and drop-shadow are identical to AppFrame.
      · Ring material, bevel box-shadow, and bracket ornaments use the same shared
        token vocabulary and spatial strategy as the frame ring.
      · Active tab face reuses the plate gradient + bevel border strategy from
        AppButton's face plate — no new structural invention.
      · Inactive tab surface uses --dng-panel-surface, the same token used in the
        frame's recessed content inset — a consistent depth signal.
      · The full-bleed strip technique (negative margin on the strip) mirrors the
        AppFrame nameplate strategy exactly.
      · Variant token-override blocks mirror the frame's aged/accent pattern:
        aged flattens the bronze, accent tightens the active tab signal to teal.

    New geometry tokens used (§13 of dungeon-design-tokens.css):
      --dng-tab-ring-v: 8px      vertical ring padding for the strip container
      --dng-tab-ring-h: 8px      horizontal ring padding for the strip container
      --dng-tab-item-py: 9px     vertical padding within each tab face plate
      --dng-tab-item-px: 16px    horizontal padding within each tab face plate
  -->
  <div class="dungeon-tabs" :class="`variant-${variant}`">
    <div class="dungeon-tabs__ring">
      <span class="dungeon-tab-bracket dungeon-tab-bracket--tl" aria-hidden="true" />
      <span class="dungeon-tab-bracket dungeon-tab-bracket--tr" aria-hidden="true" />
      <span class="dungeon-tab-bracket dungeon-tab-bracket--bl" aria-hidden="true" />
      <span class="dungeon-tab-bracket dungeon-tab-bracket--br" aria-hidden="true" />

      <div class="dungeon-tabs__strip" role="tablist">
        <button
          v-for="(tab, i) in tabs"
          :key="i"
          class="dungeon-tab-item"
          :class="{ 'is-active': i === modelValue }"
          role="tab"
          :aria-selected="i === modelValue"
          :tabindex="i === modelValue ? 0 : -1"
          type="button"
          @click="$emit('update:modelValue', i)"
          @keydown="onTabKeydown($event, i)"
        >
          <span class="dungeon-tab-item__label">{{ tab }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    /** Array of tab label strings rendered in order. */
    tabs: string[]
    /** Index of the currently active tab (0-based). */
    modelValue?: number
    /**
     * default  — standard worn-bronze ring, recessed panel inactive tabs
     * aged     — darker patina ring, lower visual energy across all tabs
     * accent   — teal plate bevel on active tab + teal bracket mounts
     */
    variant?: 'default' | 'aged' | 'accent'
  }>(),
  { modelValue: 0, variant: 'default' }
)

const emit = defineEmits<{ (e: 'update:modelValue', value: number): void }>()

function onTabKeydown(event: KeyboardEvent, index: number) {
  if (props.tabs.length === 0) {
    return
  }

  let nextIndex: number | null = null
  if (event.key === 'ArrowRight') {
    nextIndex = (index + 1) % props.tabs.length
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (index - 1 + props.tabs.length) % props.tabs.length
  } else if (event.key === 'Home') {
    nextIndex = 0
  } else if (event.key === 'End') {
    nextIndex = props.tabs.length - 1
  }

  if (nextIndex !== null) {
    event.preventDefault()
    emit('update:modelValue', nextIndex)
  }
}
</script>

<style scoped>
/*
  Base --dng-* tokens are defined in src/ui/prototypes/dungeon/dungeon-design-tokens.css.
  That file is loaded globally via src/ui/styles/design-system.css → src/App.vue (production)
  and via .storybook/preview.ts (Storybook).
  Do NOT @import it here — an @import inside <style scoped> injects
  the rules as a separate global stylesheet after the scoped rules,
  which flattens variant token overrides.

  System tokens reused from production:
    --font-heading, --font-body
    --text-sm, --tracking-wider
    --font-semibold
*/


/* ─────────────────────────────────────────────────────────────
   AGED VARIANT — lower visual energy

   Same strategy as AppFrame.variant-aged:
   darker bronze gradient, weaker bevel face highlights,
   flatter plate borders, desaturated panel, dimmer text + brackets.
   ───────────────────────────────────────────────────────────── */
.dungeon-tabs.variant-aged {
  --dng-bronze-hi:        #967014;
  --dng-bronze-mid:       #7a5810;
  --dng-bronze-deep:      #5a400a;
  --dng-bronze-low:       #4c3608;
  --dng-frame-outer:      #100a00;
  --dng-ring-bevel-top:   rgba(120, 88, 16, 0.22);
  --dng-ring-bevel-left:  rgba(100, 74, 12, 0.12);
  --dng-shell-bg:         #090704;
  --dng-shell-border:     #060402;
  --dng-plate-top:        rgba(90, 64, 10, 0.28);
  --dng-plate-left:       rgba(78, 56,  8, 0.22);
  --dng-plate-right:      rgba( 0,  0,  0, 0.28);
  --dng-plate-bottom:     rgba(68, 48,  8, 0.40);
  --dng-plate-shimmer:    rgba(56, 40,  6, 0.08);
  --dng-panel-surface:    #08141c;
  --dng-panel-top:        #0a1a24;
  --dng-divider:          rgba(100, 70, 16, 0.25);
  --dng-title-gold:       #9e8030;
  --dng-subtitle-warm:    #584e2c;
  --dng-bracket:          rgba(148, 112, 22, 0.52);
}


/* ─────────────────────────────────────────────────────────────
   ACCENT VARIANT — teal signal at active tab edges + brackets

   Bronze ring stays warm — it is still a bronze frame.
   The teal signal lives at the active tab's plate bevel edges
   (same layer as AppButton primary variant and the AppFrame accent
   variant nameplate bevel) plus the four bracket mount points.
   ───────────────────────────────────────────────────────────── */
.dungeon-tabs.variant-accent {
  --dng-plate-top:     rgba(25, 180, 155, 0.45);
  --dng-plate-left:    rgba(20, 150, 128, 0.35);
  --dng-plate-right:   rgba( 0,   0,   0, 0.38);
  --dng-plate-bottom:  rgba(22, 175, 150, 0.60);
  --dng-plate-shimmer: rgba(22, 190, 162, 0.32);
  --dng-divider:       rgba(45, 212, 191, 0.48);
  --dng-bracket:       rgba(38, 212, 188, 0.80);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the architectural outer skin

   Identical to AppFrame .dungeon-frame:
   · --dng-chamfer (8px) octagonal clip-path
   · --dng-shell-gap (3px) padding = visible dark strip between
     shell border and bronze ring
   · drop-shadow follows the clip-path octagonal silhouette
   ───────────────────────────────────────────────────────────── */
.dungeon-tabs {
  display: inline-block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);

  clip-path: polygon(
    var(--dng-chamfer)                    0%,
    calc(100% - var(--dng-chamfer))        0%,
    100%                                   var(--dng-chamfer),
    100%                                   calc(100% - var(--dng-chamfer)),
    calc(100% - var(--dng-chamfer))        100%,
    var(--dng-chamfer)                    100%,
    0%                                     calc(100% - var(--dng-chamfer)),
    0%                                     var(--dng-chamfer)
  );

  filter:
    drop-shadow(0 10px 32px rgba(0, 0, 0, 0.85))
    drop-shadow(0  3px  8px rgba(0, 0, 0, 0.65))
    drop-shadow(0  1px  2px rgba(0, 0, 0, 0.48));
}


/* ─────────────────────────────────────────────────────────────
   RING — cast-bronze frame surface

   Same gradient + bevel box-shadow strategy as all family rings.
   padding: --dng-tab-ring-v (8px) vertical / --dng-tab-ring-h (8px)
   horizontal — tighter than the frame's 12px to suit a strip.
   The 8px padding is just enough to contain the 6px bracket anchors
   (--dng-bracket-inset) on all four sides.
   Strip bleeds to full width so bronze reads only top and bottom.
   ───────────────────────────────────────────────────────────── */
.dungeon-tabs__ring {
  position: relative;
  display: flex;
  flex-direction: column;

  background:
    linear-gradient(
      to right,
      rgba(200, 152, 30, 0.18)  0%,
      transparent                50%,
      rgba(0, 0, 0, 0.18)       100%
    ),
    linear-gradient(
      to bottom,
      var(--dng-bronze-hi)    0%,
      var(--dng-bronze-mid)  11%,
      var(--dng-bronze-deep) 28%,
      var(--dng-bronze-low)  50%,
      var(--dng-bronze-deep) 72%,
      var(--dng-bronze-mid)  89%,
      var(--dng-bronze-hi)  100%
    );

  padding: var(--dng-tab-ring-v) var(--dng-tab-ring-h);
  border: 1px solid var(--dng-frame-outer);

  box-shadow:
    inset 0  2px 0 var(--dng-ring-bevel-top),
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),
    inset 1px  0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   CORNER L-BRACKETS — structural mount points

   Same 16px/3px/6px geometry as AppFrame brackets.
   Sits at z-index 2 to layer above the full-bleed tab strip.
   ───────────────────────────────────────────────────────────── */
.dungeon-tab-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.dungeon-tab-bracket::before,
.dungeon-tab-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.dungeon-tab-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.dungeon-tab-bracket::after  { width:  var(--dng-bracket-weight); height: var(--dng-bracket-size); }

.dungeon-tab-bracket--tl { top: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-tab-bracket--tl::before { top: 0; left: 0; }
.dungeon-tab-bracket--tl::after  { top: 0; left: 0; }

.dungeon-tab-bracket--tr { top: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-tab-bracket--tr::before { top: 0; right: 0; }
.dungeon-tab-bracket--tr::after  { top: 0; right: 0; }

.dungeon-tab-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-tab-bracket--bl::before { bottom: 0; left: 0; }
.dungeon-tab-bracket--bl::after  { bottom: 0; left: 0; }

.dungeon-tab-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-tab-bracket--br::before { bottom: 0; right: 0; }
.dungeon-tab-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   TAB STRIP — horizontal container for all tab items

   Full-bleed on width: negative horizontal margin bleeds the strip
   to the ring's inner boundary edges, mirroring the AppFrame
   nameplate bleed strategy exactly. Hard border lines at left/right
   edges close the structural gap at the ring boundary.

   Bronze remains visible only at the top and bottom of the ring
   (--dng-tab-ring-v: 8px above and below the strip).
   ───────────────────────────────────────────────────────────── */
.dungeon-tabs__strip {
  display: flex;
  align-items: stretch;
  width: calc(100% + 2 * var(--dng-tab-ring-h));
  margin-left: calc(-1 * var(--dng-tab-ring-h));
  border-left:  1px solid var(--dng-frame-outer);
  border-right: 1px solid var(--dng-frame-outer);
}


/* ─────────────────────────────────────────────────────────────
   TAB ITEM — individual selectable tab face

   Inactive (default):
     · --dng-panel-surface background — same recessed teal-dark used
       as AppFrame's content inset surface. Reads as set below the
       ring plane, not projecting outward.
     · Near-invisible top/bottom borders — face is flush with the
       ring surroundings; the plate does not assert itself.
     · Muted --dng-subtitle-warm label.
     · 1px --dng-divider inter-tab separator on right edge.
       Last item omits the right separator.

   Active (.is-active):
     · Full plate gradient (bg-hi → bg-mid → bg-base) — same as
       AppButton face plate. Raised-plate appearance comes from the
       lighter background + bright directional bevel alone — no
       physical height change.
     · Directional bevel borders: plate-top / plate-bottom at full
       brightness; plate-shimmer bleeds downward into the ring gap.
     · --dng-title-gold label.

   Hover on inactive:
     · Slight lift to --dng-panel-top (lighter than surface).

   Focus-visible:
     · Teal inset ring matching the button family's focus style.
   ───────────────────────────────────────────────────────────── */
.dungeon-tab-item {
  /* Browser reset */
  appearance: none;
  -webkit-appearance: none;
  border: none;
  margin: 0;
  font: inherit;
  outline: none;
  cursor: pointer;

  /* Layout */
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--dng-tab-item-py) var(--dng-tab-item-px);
  white-space: nowrap;

  /* Inactive surface — recessed panel */
  background: var(--dng-panel-surface);
  border-top:    1px solid var(--dng-panel-border);
  border-bottom: 1px solid var(--dng-panel-border);
  border-left:   none;
  border-right:  1px solid var(--dng-divider);

  transition: background 100ms ease-out;
}

/* Last tab: no right divider */
.dungeon-tab-item:last-child {
  border-right: none;
}

/* Active tab — raised plate treatment */
.dungeon-tab-item.is-active {
  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  24%,
    var(--dng-plate-bg-base) 100%
  );
  border-top:    1px solid var(--dng-plate-top);
  border-bottom: 1px solid var(--dng-plate-bottom);
  border-right:  1px solid var(--dng-divider);
  box-shadow:
    inset 0 1px 5px rgba(0, 0, 0, 0.55),
    0 1px 0 var(--dng-plate-shimmer);
}

.dungeon-tab-item.is-active:last-child {
  border-right: none;
}

/* Hover on inactive tabs */
.dungeon-tab-item:not(.is-active):hover {
  background: var(--dng-panel-top);
}

/* Focus-visible ring — teal glow via inset shadow (no border-radius required) */
.dungeon-tab-item:focus-visible {
  outline: none;
  box-shadow:
    inset 0 0 0 2px rgba(38, 210, 185, 0.55);
}

.dungeon-tab-item.is-active:focus-visible {
  box-shadow:
    inset 0 1px 5px rgba(0, 0, 0, 0.55),
    0 1px 0 var(--dng-plate-shimmer),
    inset 0 0 0 2px rgba(38, 210, 185, 0.55);
}


/* ─────────────────────────────────────────────────────────────
   LABEL — text on each tab face
   ───────────────────────────────────────────────────────────── */
.dungeon-tab-item__label {
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  line-height: 1;
  user-select: none;
  color: var(--dng-subtitle-warm);
  transition: color 100ms ease-out;
}

.dungeon-tab-item.is-active .dungeon-tab-item__label {
  color: var(--dng-title-gold);
}
</style>
