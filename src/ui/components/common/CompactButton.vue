<template>
  <!--
    CompactButton — etched chip-form action button for HUD, toolbar, and mobile contexts.

    Design intent:
      Retains the dungeon-console material language (dark plate, chamfered corners,
      directional bevel borders, Cinzel label) but without the bronze ring / bracket
      structure of AppButton. The result is a compact single-layer chip: thin chamfered
      border treated with directional bevel shadows, an optional icon well, and a Cinzel
      label at 12px scale.

    Key differences from AppButton:
      — No bronze ring layer. The plate surface is the single visual body.
      — 4px chamfer (vs 5px on AppButton) — octagon proportionally smaller.
      — Icon well: accepts emoji / glyph text via `icon` prop, or inline SVG via `#icon` slot.
        A hairline divider separates the icon well from the label zone.
      — Variant signal via inset bevel (top/bottom box-shadow color) — no bracket ornaments.
      — Label: Cinzel 12px (--text-xs) vs AppButton's 14px (--text-sm).
      — Height: ~26px vs AppButton's ~48px.

    Structural layers (outer → inner):
      1. .compact-btn            outer shell — 4px chamfer clip-path, dark plate bg,
                                 hairline border, directional inset bevel, drop-shadow filter.
      2. .compact-btn__icon      (conditional) icon well — slightly darker inset zone,
                                 hairline right-edge divider. Accepts emoji or SVG.
      3. .compact-btn__label     label text — or default slot for rich content.

    Props:
      icon     — emoji or short glyph string rendered in the icon well.
                 Override with the `#icon` slot for inline SVG.
      label    — fallback label text (used when no default slot content).
      variant  — primary | secondary | subtle | warning
      disabled — sets the native HTML disabled attribute; suppresses all interaction.

    Slots:
      default  — replaces the label text zone.
      icon     — replaces the icon prop content; use for inline <svg>.

    Variant legend:
      primary   — teal inset bevel + teal icon tint     (affirm / proceed)
      secondary — warm bronze bevel + gold label        (supporting / neutral)
      subtle    — flat dim bevel + muted label          (lowest priority)
      warning   — amber inset bevel + amber icon/label  (caution / destructive)
  -->
  <button
    class="compact-btn"
    :class="[`variant-${variant}`]"
    :disabled="disabled"
    type="button"
  >
    <span v-if="hasIcon" class="compact-btn__icon" aria-hidden="true">
      <slot name="icon">{{ icon }}</slot>
    </span>
    <span class="compact-btn__label">
      <slot>{{ label }}</slot>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useSlots, computed } from 'vue'

const slots = useSlots()

const props = withDefaults(
  defineProps<{
    /** Emoji or short glyph string for the icon well. Override via `#icon` slot for SVG. */
    icon?: string
    /** Button label text. Used when no default slot content is provided. */
    label?: string
    /**
     * Visual priority variant.
     * primary   — teal bevel, teal icon (affirm/proceed).
     * secondary — warm bronze bevel, gold label (supporting).
     * subtle    — flat dim bevel, muted label (low-priority).
     * warning   — amber bevel, amber label (caution/destructive).
     */
    variant?: 'primary' | 'secondary' | 'subtle' | 'warning'
    /**
     * Disables the button. Sets the native HTML disabled attribute and applies
     * the unavailable visual state (flat bevel, opacity 0.42, no interaction).
     */
    disabled?: boolean
  }>(),
  {
    variant: 'primary',
    disabled: false,
  }
)

const hasIcon = computed(() => props.icon !== undefined || !!slots.icon)
</script>

<style scoped>
/*
  Base --dng-* tokens come from src/ui/prototypes/dungeon/dungeon-design-tokens.css,
  loaded globally. Do NOT @import it here — see AppFrame.vue for the reason.
*/

/* ─────────────────────────────────────────────────────────────
   VARIANT DEFAULT TOKENS — secondary / warm bronze baseline

   These are overridden per variant below. Defined here on base
   so the secondary variant (which is the warm-bronze baseline)
   requires no extra rule.
   ───────────────────────────────────────────────────────────── */
.compact-btn {
  --compact-bevel-top:    rgba(100, 72, 10, 0.52);   /* warm bronze lit top */
  --compact-bevel-bottom: rgba( 60, 42,  6, 0.72);   /* warm bronze shadow bottom */
  --compact-bevel-left:   rgba( 80, 58,  8, 0.28);   /* mild highlight left */
  --compact-label-color:  var(--dng-title-gold);
  --compact-icon-color:   var(--dng-title-gold);
  --compact-divider:      rgba(80, 55, 8, 0.30);
}


/* ─────────────────────────────────────────────────────────────
   PRIMARY VARIANT — affirm / proceed

   Teal bevel replaces the warm-bronze bevel at top and bottom.
   Icon and divider take on the teal family tint.
   ───────────────────────────────────────────────────────────── */
.compact-btn.variant-primary {
  --compact-bevel-top:    rgba(25, 180, 155, 0.52);
  --compact-bevel-bottom: rgba(22, 175, 150, 0.68);
  --compact-bevel-left:   rgba(20, 150, 128, 0.30);
  --compact-icon-color:   rgba(38, 212, 188, 0.90);
  --compact-divider:      rgba(20, 150, 120, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   SECONDARY VARIANT — supporting / neutral

   Inherits the warm-bronze bevel baseline from .compact-btn.
   Label uses the brighter title-gold explicitly (same as default,
   but stated for clarity and future override surface).
   ───────────────────────────────────────────────────────────── */
.compact-btn.variant-secondary {
  --compact-label-color: var(--dng-title-gold);
}


/* ─────────────────────────────────────────────────────────────
   SUBTLE VARIANT — lowest priority / tertiary action

   Flattened bevel, near-invisible depth. Muted ochre label.
   Reads as physically inert — present but not demanding attention.
   ───────────────────────────────────────────────────────────── */
.compact-btn.variant-subtle {
  --compact-bevel-top:    rgba(70, 50,  7, 0.22);
  --compact-bevel-bottom: rgba(48, 34,  5, 0.36);
  --compact-bevel-left:   rgba(60, 42,  6, 0.14);
  --compact-label-color:  var(--dng-subtitle-warm);
  --compact-icon-color:   var(--dng-subtitle-warm);
  --compact-divider:      rgba(60, 42, 6, 0.20);
}


/* ─────────────────────────────────────────────────────────────
   WARNING VARIANT — caution / destructive

   Amber bevel signal. Matches the AppButton warning token family.
   ───────────────────────────────────────────────────────────── */
.compact-btn.variant-warning {
  --compact-bevel-top:    var(--dng-warning-plate-top);
  --compact-bevel-bottom: var(--dng-warning-plate-bottom);
  --compact-bevel-left:   var(--dng-warning-plate-left);
  --compact-label-color:  var(--dng-warning-label);
  --compact-icon-color:   var(--dng-warning-label);
  --compact-divider:      rgba(160, 80, 10, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   DISABLED STATE — driven by the native HTML :disabled attribute
   ───────────────────────────────────────────────────────────── */
.compact-btn:disabled {
  opacity: 0.42;
  cursor: not-allowed;
  pointer-events: none;
  --compact-bevel-top:    rgba(60, 42, 6, 0.18);
  --compact-bevel-bottom: rgba(40, 28, 4, 0.28);
  --compact-bevel-left:   rgba(50, 36, 5, 0.12);
  --compact-label-color:  var(--dng-subtitle-warm);
  --compact-icon-color:   var(--dng-subtitle-warm);
  --compact-divider:      rgba(48, 34, 5, 0.18);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the <button> element is the plate body

   Single-layer: no separate ring. The chamfered clip-path combined
   with the inset box-shadow bevel and drop-shadow filter creates
   enough material depth without a second structural layer.

   clip-path: 4px chamfer — slightly smaller than AppButton (5px)
   to suit the reduced scale.

   box-shadow inset layers:
     1. top edge bevel    — directional variant tint (lit from above)
     2. bottom edge bevel — shadow tint (darker trough, same direction)
     3. left edge bevel   — mild left face highlight
     4. right edge shadow — hard right shadow (same light source)
     5. inner depth well  — radial shadow to suggest plate inset depth

   filter: drop-shadow follows the chamfered octagon silhouette.
   ───────────────────────────────────────────────────────────── */
.compact-btn {
  /* Browser reset */
  appearance: none;
  -webkit-appearance: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  outline: none;
  cursor: pointer;
  background: none;

  /* Layout */
  display: inline-flex;
  align-items: stretch;

  /* Dark plate body — same gradient family as AppButton's face plate */
  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)   0%,
    var(--dng-plate-bg-base) 100%
  );

  /* Hairline outer edge — near-black shell line */
  border: 1px solid rgba(8, 5, 2, 0.90);

  /* 4px chamfer polygon — octagon corners */
  clip-path: polygon(
    4px                   0%,
    calc(100% - 4px)       0%,
    100%                   4px,
    100%                   calc(100% - 4px),
    calc(100% - 4px)       100%,
    4px                   100%,
    0%                     calc(100% - 4px),
    0%                     4px
  );

  /* Directional bevel + inner depth */
  box-shadow:
    inset 0  1px 0 var(--compact-bevel-top),
    inset 0 -1px 0 var(--compact-bevel-bottom),
    inset 1px  0 0 var(--compact-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.48),
    inset 0  3px 6px rgba(0, 0, 0, 0.28);

  /* Drop-shadow follows clip-path silhouette */
  filter:
    drop-shadow(0 2px 6px rgba(0, 0, 0, 0.72))
    drop-shadow(0 1px 2px rgba(0, 0, 0, 0.50));

  transition:
    filter   100ms ease-out,
    transform 60ms ease-out;
}


/* ─── HOVER (enabled only) ───────────────────────────────────── */
.compact-btn:not(:disabled):hover {
  filter:
    drop-shadow(0 3px 8px rgba(0, 0, 0, 0.78))
    drop-shadow(0 1px 3px rgba(0, 0, 0, 0.54))
    brightness(1.10);
}

/* Primary — teal glow on hover */
.compact-btn.variant-primary:not(:disabled):hover {
  filter:
    drop-shadow(0 3px 8px rgba(0, 0, 0, 0.78))
    drop-shadow(0 0   5px rgba(38, 210, 185, 0.28))
    brightness(1.08);
}

/* Warning — amber glow on hover */
.compact-btn.variant-warning:not(:disabled):hover {
  filter:
    drop-shadow(0 3px 8px rgba(0, 0, 0, 0.78))
    drop-shadow(0 0   5px rgba(200, 128, 24, 0.32))
    brightness(1.08);
}


/* ─── ACTIVE / PRESSED ───────────────────────────────────────── */
.compact-btn:not(:disabled):active {
  transform: translateY(1px);
  filter:
    drop-shadow(0 1px 3px rgba(0, 0, 0, 0.62))
    drop-shadow(0 1px 1px rgba(0, 0, 0, 0.44));
}


/* ─── FOCUS-VISIBLE — teal ring (follows clip-path via filter) ── */
.compact-btn:not(:disabled):focus-visible {
  filter:
    drop-shadow(0 2px 6px rgba(0, 0, 0, 0.72))
    drop-shadow(0 0   0 2px rgba(38, 210, 185, 0.72));
}


/* ─────────────────────────────────────────────────────────────
   ICON WELL

   Fixed-width zone left of the label. Slightly darker than the
   plate to create a subtle inset recession that frames the icon.
   The hairline right-edge divider uses the same directional tint
   as the plate bevel — it reads as a channel cut in the metal.

   Accepts: emoji text (via `icon` prop), or inline <svg> (via slot).
   SVG rules below ensure consistent sizing regardless of source.
   ───────────────────────────────────────────────────────────── */
.compact-btn__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  padding: 0 5px;
  flex-shrink: 0;

  background: rgba(0, 0, 0, 0.24);
  border-right: 1px solid var(--compact-divider);

  font-size: 13px;
  line-height: 1;
  color: var(--compact-icon-color);
}

/* Keep inline SVGs at a predictable icon size */
.compact-btn__icon :deep(svg) {
  width: 14px;
  height: 14px;
  display: block;
  fill: currentColor;
}


/* ─────────────────────────────────────────────────────────────
   LABEL TEXT

   Cinzel at 12px — one step below AppButton's 14px. Uppercase and
   modestly tracked — matching the AppButton engraving language but
   scaled for tight contexts. Padding is uniform so the label reads
   centred against the icon well height.
   ───────────────────────────────────────────────────────────── */
.compact-btn__label {
  display: flex;
  align-items: center;
  padding: 5px 10px;

  font-family: var(--font-heading);
  font-size: var(--text-xs);        /* 12px */
  font-weight: var(--font-semibold);
  color: var(--compact-label-color);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  line-height: 1;
  user-select: none;
  white-space: nowrap;
}

/* Tighter left padding when an icon well precedes the label */
.compact-btn__icon + .compact-btn__label {
  padding-left: 8px;
}
</style>
