<script setup lang="ts">
/**
 * AppCard
 *
 * Structural position in the dungeon family
 * ──────────────────────────────────────────
 * Card is a lightweight subordinate to AppFrame.
 * It uses the same material vocabulary (bronze ring → teal inset) at
 * explicitly reduced depth and ceremony. Where Frame is a mounted panel
 * that organises content, Card is a token or item the player picks up.
 *
 * How it is lighter than Frame — six structural decisions:
 *
 *   1. Smaller shell geometry: 6px chamfer (vs 8px) and 2px gap (vs 3px).
 *      Corner cuts are present but less emphatic. Lighter drop-shadow.
 *
 *   2. Thinner, flat-faced ring: 6px/10px padding (vs 12px uniform),
 *      3-stop gradient hint only (vs 7-stop symmetric bevel gradient),
 *      NO inset bevel box-shadow. The ring face is flat — it identifies
 *      the material family without sculpting a full-depth mounting face.
 *
 *   3. Label header, not a nameplate plate: title sits directly on the
 *      bronze ring surface. No background gradient, no wall-to-wall bleed,
 *      no 4-edge bevel borders, no shimmer line. A single border-bottom
 *      (--dng-divider) is the only structural line on the header.
 *      Title is text-xs, sentence-case, tracking-wide — a label, not a
 *      proclamation.  (Frame uses text-sm, uppercase, tracking-wider.)
 *
 *   4. Small inset chamfers: 4px top-corner cuts (vs 14px on Frame).
 *      The sunken-panel read is present in the family but not emphatic.
 *      No ::after shadow wedges — large chamfers are a Frame signature.
 *
 *   5. Bottom brackets only: bl/br corner mounts, tl/tr omitted.
 *      The card rests on two anchors; a mounted panel holds all four.
 *      Matches card.svg bottom-corner ornament language.
 *
 *   6. Content-forward default padding: body defaults to --space-sm,
 *      footer padding is tighter. Dense gameplay text is the primary use.
 *
 * Semantic accent variants — gameplay impact / state
 * ──────────────────────────────────────────
 * neutral, positive, warning, and danger override only the accent
 * areas of the card: header divider, inset bloom+shimmer, bottom
 * bracket color, inset border, footer background, and footer text.
 *
 * The bronze ring (gradient, padding, flat face) and the text colors
 * on the ring are completely unchanged across all semantic variants.
 * Gameplay meaning lives at the interface layers (inset top edge,
 * divider line, corner brackets, footer tint) — not in the body.
 *
 *   neutral  — cool slate gray; no-impact, no-state signal.
 *   positive — emerald green; gains, resolutions, improvements.
 *   warning  — orange; cost attention, caution, resource pressure.
 *   danger   — crimson; threats, eliminations, urgent failures.
 */
withDefaults(defineProps<{
  /** Card name displayed as a label on the bronze ring. */
  title?: string
  /** Secondary descriptor shown below the title. */
  subtitle?: string
  /** Visual material or semantic impact of the card.
   *  Material: default | aged | accent
   *  Semantic: neutral | positive | warning | danger */
  variant?: 'default' | 'aged' | 'accent' | 'neutral' | 'positive' | 'warning' | 'danger'
  /** Compact density: reduces ring and body padding for dense layouts. */
  compact?: boolean
}>(), {
  variant: 'default',
  compact: false,
})
</script>

<template>
  <article
    class="dungeon-card"
    :class="[`variant-${variant}`, { 'is-compact': compact }]"
  >
    <div class="dungeon-card__ring">
      <!-- Bottom-only L-bracket mount points — card rests, it does not anchor -->
      <span class="dungeon-bracket dungeon-bracket--bl" aria-hidden="true" />
      <span class="dungeon-bracket dungeon-bracket--br" aria-hidden="true" />

      <!-- Header: title label on the bronze ring face — no background plate -->
      <header
        v-if="title || subtitle || $slots['header-actions']"
        class="dungeon-card__header"
      >
        <div v-if="title || subtitle" class="dungeon-card__header-text">
          <p class="dungeon-card__title">{{ title }}</p>
          <p v-if="subtitle" class="dungeon-card__subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots['header-actions']" class="dungeon-card__header-actions">
          <slot name="header-actions" />
        </div>
      </header>

      <!-- Inset: recessed teal-dark content surface -->
      <div class="dungeon-card__inset">
        <div class="dungeon-card__body">
          <slot />
        </div>
        <footer v-if="$slots['footer']" class="dungeon-card__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </article>
</template>

<style scoped>
/*
  Base --dng-* tokens are defined in src/ui/prototypes/dungeon/dungeon-design-tokens.css.
  That file is loaded globally via src/ui/styles/design-system.css → src/App.vue (production)
  and via .storybook/preview.ts (Storybook).
  Do NOT @import it here — an @import inside <style scoped> injects
  the rules as a separate global stylesheet after the scoped rules,
  which flattens variant token overrides.

  Card-local tokens (--dng-card-*) are defined on .dungeon-card so variant
  and compact mode only need to patch them, not the shared global tokens.
*/

/* ─────────────────────────────────────────────────────────────
   CARD-LOCAL TOKENS
   ───────────────────────────────────────────────────────────── */
.dungeon-card {
  --dng-card-chamfer:       6px;   /* smaller than Frame's 8px */
  --dng-card-shell-gap:     2px;   /* thinner than Frame's 3px */
  --dng-card-ring-v:        6px;   /* vertical ring padding */
  --dng-card-ring-h:        10px;  /* horizontal ring padding */
  --dng-card-inset-chamfer: 4px;   /* smaller than Frame's 14px */
  --dng-card-body-padding:  var(--space-sm);

  /* Title and subtitle render on the bronze ring face (no dark nameplate behind
     them). Use dark brown values so they contrast against the gold-bronze gradient.
     Global --dng-title-gold is tuned for dark charcoal surfaces — override here. */
  --dng-title-gold:         #1e1306;   /* deep warm-black — high contrast on bronze */
  --dng-subtitle-warm:      #3a2a0a;   /* dark warm-brown — readable secondary */
}


/* ─────────────────────────────────────────────────────────────
   AGED VARIANT — quieter, older, lower visual energy

   Darker bronze gradient, desaturated inset, no teal bloom,
   dimmer text and brackets. No --dng-plate-* or --dng-ring-bevel-*
   overrides — this card has no nameplate and no ring bevel.
   ───────────────────────────────────────────────────────────── */
.dungeon-card.variant-aged {
  /* Flatter, darker bronze ring gradient */
  --dng-bronze-hi:        #967014;
  --dng-bronze-mid:       #7a5810;
  --dng-bronze-deep:      #5a400a;
  --dng-bronze-low:       #4c3608;
  --dng-frame-outer:      #100a00;

  /* Darker outer shell */
  --dng-shell-bg:         #090704;
  --dng-shell-border:     #060402;

  /* Desaturated inset — no teal bloom, near-invisible shimmer */
  --dng-panel-surface:    #08141c;
  --dng-panel-top:        #0a1a24;
  --dng-panel-bottom:     #060f16;
  --dng-panel-footer:     #070e18;
  --dng-inset-bloom:      rgba(4, 10, 14, 0.18);
  --dng-inset-shimmer:    rgba(0, 4, 6, 0.10);

  /* Muted header divider and footer */
  --dng-divider:          rgba(100, 70, 16, 0.25);

  /* Dimmer text — dark values still contrast on the darker aged bronze ring */
  --dng-title-gold:       #1a1105;
  --dng-subtitle-warm:    #2e2008;
  --dng-footer-muted:     #3c4e52;

  /* Low-opacity bracket */
  --dng-bracket:          rgba(148, 112, 22, 0.52);
}


/* ─────────────────────────────────────────────────────────────
   ACCENT VARIANT — arcane resonance / active focused state

   Teal signal at the header divider, inset surface, bottom brackets,
   panel border, and footer. Bronze ring stays warm and unchanged.
   No --dng-plate-* overrides — card has no nameplate plate.
   ───────────────────────────────────────────────────────────── */
.dungeon-card.variant-accent {
  /* Stronger teal inset bloom + sharp teal top edge */
  --dng-inset-bloom:      rgba(10, 105, 115, 0.52);
  --dng-inset-shimmer:    rgba(38, 210, 185, 0.34);

  /* Teal header divider and panel boundary */
  --dng-divider:          rgba(45, 212, 191, 0.48);
  --dng-panel-border:     rgba(30, 160, 142, 0.50);

  /* Teal-tinted footer */
  --dng-panel-footer:     #081e22;
  --dng-footer-muted:     #4a9490;

  /* Teal bottom bracket mounts */
  --dng-bracket:          rgba(38, 212, 188, 0.80);
}


/* ─────────────────────────────────────────────────────────────
   SEMANTIC ACCENT VARIANTS

   neutral / positive / warning / danger

   Each overrides only the accent-area tokens: divider, bloom,
   shimmer, bracket, panel-border, panel-footer, footer-muted.
   The bronze ring (gradient, padding, flat face) and the header
   text colors are unchanged across all semantic variants.

   The same seven tokens the 'accent' variant already uses are the
   exact surface available for semantic signal — no new tokens.
   ───────────────────────────────────────────────────────────── */

/* NEUTRAL — cool slate; explicitly no-impact, no semantic color */
.dungeon-card.variant-neutral {
  --dng-divider:          rgba(120, 135, 155, 0.28);
  --dng-inset-bloom:      rgba(20, 30, 45, 0.20);
  --dng-inset-shimmer:    rgba(180, 195, 215, 0.12);
  --dng-bracket:          rgba(140, 155, 170, 0.45);
  --dng-panel-border:     rgba(90, 110, 130, 0.28);
  --dng-panel-footer:     #090c0f;
  --dng-footer-muted:     #525a66;
}

/* POSITIVE — emerald green; gain, resolution, improvement */
.dungeon-card.variant-positive {
  --dng-divider:          rgba(34, 197, 94, 0.45);
  --dng-inset-bloom:      rgba(16, 100, 50, 0.48);
  --dng-inset-shimmer:    rgba(74, 222, 128, 0.28);
  --dng-bracket:          rgba(34, 197, 94, 0.72);
  --dng-panel-border:     rgba(22, 163, 74, 0.44);
  --dng-panel-footer:     #061509;
  --dng-footer-muted:     #2e7a48;
}

/* WARNING — orange; cost pressure, caution, resource drain */
.dungeon-card.variant-warning {
  --dng-divider:          rgba(249, 115, 22, 0.55);
  --dng-inset-bloom:      rgba(180, 65, 8, 0.45);
  --dng-inset-shimmer:    rgba(253, 186, 116, 0.28);
  --dng-bracket:          rgba(249, 115, 22, 0.80);
  --dng-panel-border:     rgba(194, 90, 10, 0.44);
  --dng-panel-footer:     #1a0d02;
  --dng-footer-muted:     #9a5520;
}

/* DANGER — crimson; threat, elimination, urgent failure */
.dungeon-card.variant-danger {
  --dng-divider:          rgba(239, 68, 68, 0.52);
  --dng-inset-bloom:      rgba(185, 20, 20, 0.48);
  --dng-inset-shimmer:    rgba(252, 165, 165, 0.26);
  --dng-bracket:          rgba(239, 68, 68, 0.78);
  --dng-panel-border:     rgba(185, 28, 28, 0.44);
  --dng-panel-footer:     #180404;
  --dng-footer-muted:     #b94040;
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL

   6px chamfer (vs 8px on Frame) — cut corners are present but
   less emphatic, less architectural. 2px gap (vs 3px) — thinner
   dark groove before the ring face.

   Drop shadow is intentionally quieter: two stops, ~6px blur max.
   Frame uses three stops up to 40px blur; the card sits, the frame
   commands.
   ───────────────────────────────────────────────────────────── */
.dungeon-card {
  display: block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-card-shell-gap);
  background: var(--dng-shell-bg);

  clip-path: polygon(
    var(--dng-card-chamfer)                        0%,
    calc(100% - var(--dng-card-chamfer))           0%,
    100%   var(--dng-card-chamfer),
    100%   calc(100% - var(--dng-card-chamfer)),
    calc(100% - var(--dng-card-chamfer))           100%,
    var(--dng-card-chamfer)                        100%,
    0%     calc(100% - var(--dng-card-chamfer)),
    0%     var(--dng-card-chamfer)
  );

  filter:
    drop-shadow(0 5px 16px rgba(0, 0, 0, 0.76))
    drop-shadow(0 2px  5px rgba(0, 0, 0, 0.52));
}


/* ─────────────────────────────────────────────────────────────
   RING — bronze material hint

   3-stop linear gradient (vs 7-stop symmetric bevel on Frame).
   Top is slightly brighter; bottom darker. Implies bronze material
   without sculpting a full directional face.

   No inset box-shadow bevel. This is the most visible structural
   difference from Frame: the ring is flat-faced. The Frame's bevel
   gives the impression of a thick cast mounting ring; the card's
   flat ring reads as a thin border of the same family material.

   Padding is asymmetric: 6px vertical, 10px horizontal — matching
   the card.svg proportion where side walls are narrow bronze rails.
   ───────────────────────────────────────────────────────────── */
.dungeon-card__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);

  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi)    0%,
    var(--dng-bronze-mid)  45%,
    var(--dng-bronze-deep) 100%
  );

  padding: var(--dng-card-ring-v) var(--dng-card-ring-h);
  border: 1px solid var(--dng-frame-outer);
}


/* ─────────────────────────────────────────────────────────────
   BOTTOM-ONLY L-BRACKETS

   bl/br only — the card rests on two bottom anchors.
   Frame and Modal hold all four corners; that is a mounting-panel
   gesture. The card rests.
   ───────────────────────────────────────────────────────────── */
.dungeon-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.dungeon-bracket::before,
.dungeon-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.dungeon-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.dungeon-bracket::after  { width: var(--dng-bracket-weight);  height: var(--dng-bracket-size); }

.dungeon-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-bracket--bl::before { bottom: 0; left: 0; }
.dungeon-bracket--bl::after  { bottom: 0; left: 0; }

.dungeon-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-bracket--br::before { bottom: 0; right: 0; }
.dungeon-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   HEADER — title label on bronze ring face

   The title sits directly on the bronze ring material — no
   background plate, no wall-to-wall bleed, no 4-edge bevel borders,
   no shimmer line. None of the nameplate ceremony from Frame.

   A single border-bottom (--dng-divider) is the only structural mark.
   The ring shows behind the text. The label reads as engraved into
   the face, not mounted on top of it.
   ───────────────────────────────────────────────────────────── */
.dungeon-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding-bottom: 5px;
  border-bottom: 1px solid var(--dng-divider);
}

.dungeon-card__header-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dungeon-card__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xs);         /* vs text-sm on Frame */
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wide);   /* vs tracking-wider on Frame */
  /* no text-transform: uppercase — label, not a proclamation */
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dungeon-card__subtitle {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--dng-subtitle-warm);
  line-height: var(--leading-normal);
  opacity: 0.85;
}

.dungeon-card__header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}


/* ─────────────────────────────────────────────────────────────
   INSET — recessed teal-dark content surface

   4px top-corner chamfers (vs 14px on Frame). The sunken-panel
   read is present — bronze ring material shows at the tiny corner
   cuts — but not theatrical. No ::after shadow wedges: those were
   sized to serve the 14px cuts; at 4px they would be invisible.

   Bloom ellipse is flatter (60% × 25% vs 85% × 45% on Frame) and
   quieter. Shadow is shallower (2px 10px vs 3px 20px).
   ───────────────────────────────────────────────────────────── */
.dungeon-card__inset {
  background:
    radial-gradient(
      ellipse 60% 25% at 50% 0%,
      var(--dng-inset-bloom) 0%,
      transparent            100%
    ),
    linear-gradient(
      to bottom,
      var(--dng-panel-top)     0%,
      var(--dng-panel-surface) 28%,
      var(--dng-panel-bottom) 100%
    );
  border: 1px solid var(--dng-panel-border);
  overflow: hidden;
  box-shadow:
    inset 0 2px 10px rgba(0, 0, 0, 0.62),
    inset 0 0   0  1px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 var(--dng-inset-shimmer);

  clip-path: polygon(
    var(--dng-card-inset-chamfer)                0%,
    calc(100% - var(--dng-card-inset-chamfer))   0%,
    100%   var(--dng-card-inset-chamfer),
    100%   100%,
    0%     100%,
    0%     var(--dng-card-inset-chamfer)
  );
}


/* ─────────────────────────────────────────────────────────────
   BODY — content region
   ───────────────────────────────────────────────────────────── */
.dungeon-card__body {
  padding: var(--dng-card-body-padding);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}


/* ─────────────────────────────────────────────────────────────
   FOOTER — status readout band
   ───────────────────────────────────────────────────────────── */
.dungeon-card__footer {
  border-top: 1px solid var(--dng-divider);
  padding: 4px var(--dng-card-body-padding);
  background: var(--dng-panel-footer);
  color: var(--dng-footer-muted);
  font-size: var(--text-xs);
  font-family: var(--font-body);
  letter-spacing: var(--tracking-wide);
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.22);
}


/* ─────────────────────────────────────────────────────────────
   COMPACT DENSITY — further reduced bronze and body padding
   ───────────────────────────────────────────────────────────── */
.dungeon-card.is-compact {
  --dng-card-ring-v:       4px;
  --dng-card-ring-h:       7px;
  --dng-card-body-padding: 8px;
}
</style>
