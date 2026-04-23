<template>
  <div class="dungeon-frame" :class="`variant-${variant}`">
    <!--
      The ring IS the bronze material. padding creates the visible frame thickness.
      display:flex + column + gap produces a thin bronze seam between nameplate and inset.
    -->
    <div class="dungeon-frame__ring">
      <!-- L-bracket corner ornaments — structural mounts on the frame face -->
      <span class="dungeon-bracket dungeon-bracket--tl" aria-hidden="true" />
      <span class="dungeon-bracket dungeon-bracket--tr" aria-hidden="true" />
      <span class="dungeon-bracket dungeon-bracket--bl" aria-hidden="true" />
      <span class="dungeon-bracket dungeon-bracket--br" aria-hidden="true" />

      <!--
        Nameplate: sits ON the bronze ring surface above the inset.
        Title/subtitle are frame-level labels, not panel-level content.
        Full-width strip: bleeds to ring edges (wall-to-wall across the ring
        interior), leaving only side bronze visible below at the inset level.
        Background is near-black warm charcoal — reads as an engraved plate
        set into the bronze, not a header strip inside a dark panel.
      -->
      <div
        v-if="title || subtitle || $slots['header-actions'] || $slots.icon"
        class="dungeon-frame__nameplate"
      >
        <div class="dungeon-frame__nameplate-text">
          <h3 v-if="title || $slots.icon" class="dungeon-frame__title">
            <span v-if="$slots.icon" class="dungeon-frame__title-icon"><slot name="icon" /></span>{{ title }}
          </h3>
          <p v-if="subtitle" class="dungeon-frame__subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots['header-actions']" class="dungeon-frame__nameplate-actions">
          <slot name="header-actions" />
        </div>
      </div>

      <!-- Recessed inset: teal-dark content surface, visually below the ring.
           Top corners chamfered at --dng-inner-chamfer, revealing bronze ring
           material at the slopes — the 「sunken panel」 read from the SVG reference. -->
      <div class="dungeon-frame__inset">
        <div class="dungeon-frame__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="dungeon-frame__footer">
          <slot name="footer" />
        </footer>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Reusable frame surface primitive for major UI sections.
 */
withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    /**
     * default  — standard worn-bronze ring, muted teal panel
     * aged     — darker patina, lower-priority or legacy contexts
     * accent   — teal-tinted dividers signal active / focused state
     */
    variant?: 'default' | 'aged' | 'accent'
  }>(),
  { variant: 'default' }
)
</script>

<style scoped>
/*
  Base --dng-* tokens are defined in src/ui/prototypes/dungeon/dungeon-design-tokens.css.
  That file is loaded globally via src/ui/styles/design-system.css, which is
  imported in App.vue. Storybook also loads it via .storybook/preview.ts.
  Do NOT @import it here — an @import inside <style scoped> causes
  the imported rules to be injected as a separate global stylesheet
  after the scoped rules, which flattens the variant overrides.

  System tokens reused from production:
    --font-heading, --font-body, --text-primary, --text-secondary
    --space-sm, --space-md, --space-lg
    --text-xs, --text-sm, --tracking-wide, --tracking-wider
    --font-semibold, --leading-tight, --leading-normal, --leading-relaxed
*/

/* ─────────────────────────────────────────────────────────────
   AGED VARIANT — quieter, older, lower visual energy

   Strategy:
   - Flatten the bronze ring: darker stops, weaker bevel face highlights
   - Desaturate the inset: suppressed bloom, near-invisible top shimmer
   - Kill the nameplate shimmer and weaken its border bevel
   - Lower bracket opacity
   - Reduce title warmth, deepen subtitle
   The result reads as physically dimmer — less reflective metal,
   less interior depth — without changing any structural shapes.
   ───────────────────────────────────────────────────────────── */
.dungeon-frame.variant-aged {
  /* Flatter, darker bronze */
  --dng-bronze-hi:        #967014;
  --dng-bronze-mid:       #7a5810;
  --dng-bronze-deep:      #5a400a;
  --dng-bronze-low:       #4c3608;
  --dng-frame-outer:      #100a00;

  /* Near-flat ring face — almost no directional highlight */
  --dng-ring-bevel-top:   rgba(120, 88, 16, 0.22);
  --dng-ring-bevel-left:  rgba(100, 74, 12, 0.12);

  /* Darker outer shell */
  --dng-shell-bg:         #090704;
  --dng-shell-border:     #060402;

  /* Dimmer nameplate bevel — all four borders weaker */
  --dng-plate-top:        rgba(90, 64, 10, 0.28);
  --dng-plate-left:       rgba(78, 56,  8, 0.22);
  --dng-plate-right:      rgba( 0,  0,  0, 0.28);
  --dng-plate-bottom:     rgba(68, 48,  8, 0.40);
  --dng-plate-shimmer:    rgba(56, 40,  6, 0.08);

  /* Desaturated inset — no teal bloom, no top shimmer */
  --dng-panel-surface:    #08141c;
  --dng-panel-top:        #0a1a24;
  --dng-panel-bottom:     #060f16;
  --dng-panel-footer:     #070e18;
  --dng-inset-bloom:      rgba(4, 10, 14, 0.18);    /* near-black, no teal */
  --dng-inset-shimmer:    rgba(0, 4, 6, 0.10);      /* near-invisible */

  /* Muted divider, near-invisible */
  --dng-divider:          rgba(100, 70, 16, 0.25);

  /* Dimmer text */
  --dng-title-gold:       #9e8030;
  --dng-subtitle-warm:    #584e2c;
  --dng-footer-muted:     #3c4e52;

  /* Low-opacity bracket — fasteners barely catching light */
  --dng-bracket:          rgba(148, 112, 22, 0.52);
}

/* ─────────────────────────────────────────────────────────────
   ACCENT VARIANT — arcane resonance / active focused state

   Strategy:
   - Bronze ring face stays warm — it's still a bronze frame,
     not a teal frame. The TEAL signal lives at the interface
     layers: nameplate seam, inset surface, brackets, divider.
   - Nameplate top and bottom borders shift teal — the plate
     reads as illuminated at its edges by the active state.
   - Plate shimmer below nameplate is teal — bleeds into seam.
   - Inset bloom is stronger and distinctly teal-cyan — the panel
     interior feels alive and open.
   - Inset top edge shimmer is a real teal stripe.
   - Bracket color shifts to teal — four corner mount points glow.
   - Divider and panel border are strongly teal.
   - Footer text and background shift teal-ward.
   ───────────────────────────────────────────────────────────── */
.dungeon-frame.variant-accent {
  /* Teal nameplate perimeter — active-state plate edges */
  --dng-plate-top:        rgba(25, 180, 155, 0.45);
  --dng-plate-left:       rgba(20, 150, 128, 0.35);
  --dng-plate-right:      rgba( 0,   0,   0, 0.38);
  --dng-plate-bottom:     rgba(22, 175, 150, 0.60);
  --dng-plate-shimmer:    rgba(22, 190, 162, 0.32);  /* teal shimmer into bronze seam */

  /* Stronger, more teal inset bloom + sharp teal top edge */
  --dng-inset-bloom:      rgba(10, 105, 115, 0.52);
  --dng-inset-shimmer:    rgba(38, 210, 185, 0.34);

  /* Active teal dividers and panel boundary */
  --dng-divider:          rgba(45, 212, 191, 0.48);
  --dng-panel-border:     rgba(30, 160, 142, 0.50);

  /* Teal-tinted footer zone */
  --dng-panel-footer:     #081e22;
  --dng-footer-muted:     #4a9490;

  /* Teal bracket mounts — four active corner points */
  --dng-bracket:          rgba(38, 212, 188, 0.80);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL — the architectural outer skin

   This is the first visible layer: a near-black border + a 3px
   dark gap between it and the bronze ring. The gap shows through
   as --dng-shell-bg.

   clip-path: polygon(...) cuts all four corners at 45° × 8px —
   an octagonal clip that immediately breaks the "rectangular
   software panel" silhouette. No rounded corners.

   filter: drop-shadow() is used instead of box-shadow on the ring
   because drop-shadow follows the clip-path shape. The ambient
   depth cast by the component will also be octagonal.
   ───────────────────────────────────────────────────────────── */
.dungeon-frame {
  display: block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);

  /* Chamfered corners — cut at --dng-chamfer × 45° at each corner */
  clip-path: polygon(
    var(--dng-chamfer)  0%,
    calc(100% - var(--dng-chamfer))  0%,
    100%  var(--dng-chamfer),
    100%  calc(100% - var(--dng-chamfer)),
    calc(100% - var(--dng-chamfer))  100%,
    var(--dng-chamfer)  100%,
    0%  calc(100% - var(--dng-chamfer)),
    0%  var(--dng-chamfer)
  );

  /* Ambient depth follows the chamfer silhouette */
  filter:
    drop-shadow(0 20px 64px rgba(0, 0, 0, 0.90))
    drop-shadow(0  5px 20px rgba(0, 0, 0, 0.70))
    drop-shadow(0  2px  4px rgba(0, 0, 0, 0.52));
}


/* ─────────────────────────────────────────────────────────────
   RING — cast bronze frame material

   Sits inside the 3px dark gap produced by the outer shell.
   The dark-gap → bronze-face transition is the main two-layer read.

   Two stacked gradients:
     · horizontal tint overlay — left slightly brighter, right darker
     · vertical bevel           — top-bright → deep-mid → top-bright

   padding: 12px → visible bronze thickness on all four sides.

   gap: 6px → wider bronze seam between nameplate and inset,
   clearly visible as a bronze horizontal bridge between the two zones.

   box-shadow carries the face bevel only — ambient drops are
   on the outer shell's filter (they'd be clipped by clip-path otherwise).
   ───────────────────────────────────────────────────────────── */
.dungeon-frame__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);

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

  padding: var(--dng-ring-padding);
  border: 1px solid var(--dng-frame-outer);

  box-shadow:
    inset 0 2px 0 var(--dng-ring-bevel-top),       /* top face highlight */
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),             /* bottom face shadow */
    inset 1px  0 0 var(--dng-ring-bevel-left),      /* left face highlight */
    inset -1px 0 0 rgba(0, 0, 0, 0.32);             /* right face shadow */
}


/* ─────────────────────────────────────────────────────────────
   CORNER L-BRACKETS — structural mount points on the ring face

   16×16 anchors, 6px from each ring edge (within the padding zone).
   ::before = horizontal arm, ::after = vertical arm, 3px thick.
   The extra arm weight (vs 2px) reads as a real structural fastener.

   Arms are tinted slightly lighter on left-bracket / darker on
   right-bracket to match the ring's top-lit bevel direction.
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

.dungeon-bracket--tl { top: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-bracket--tl::before { top: 0; left: 0; }
.dungeon-bracket--tl::after  { top: 0; left: 0; }

.dungeon-bracket--tr { top: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-bracket--tr::before { top: 0; right: 0; }
.dungeon-bracket--tr::after  { top: 0; right: 0; }

.dungeon-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.dungeon-bracket--bl::before { bottom: 0; left: 0; }
.dungeon-bracket--bl::after  { bottom: 0; left: 0; }

.dungeon-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.dungeon-bracket--br::before { bottom: 0; right: 0; }
.dungeon-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   NAMEPLATE — full-width header strip spanning the ring interior

   SVG structural reference: the title band is wall-to-wall across
   the ring face — no side bronze visible at the header level.
   Achieved with a negative horizontal margin equal to ring-padding,
   and padding restored inside to maintain text clearance.

   Dark background (charcoal) against bronze ring = engraved-plate read.
   Borders are directional — matching the ring's top-lit bevel:
     top → bronze tint (ring-adjacent, catches light)
     left/right → edge separators at ring boundary (subtle bevel)
     bottom → prominent seam where plate meets the visible bronze bridge

   The gold shimmer bleeds into the 8px bronze seam (ring-gap) below
   the plate, which is now clearly legible as a horizontal bridge.
   ───────────────────────────────────────────────────────────── */
.dungeon-frame__nameplate {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);

  /* Full-width: nameplate spans ring interior edge-to-edge           */
  /* Negative margin bleeds into ring padding; padding restores text  */
  /* clearance and keeps labels aligned with body content below.      */
  width: calc(100% + 2 * var(--dng-ring-padding));
  margin-left: calc(-1 * var(--dng-ring-padding));
  padding: 10px calc(var(--dng-ring-padding) + 12px) 9px calc(var(--dng-ring-padding) + 14px);

  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  20%,
    var(--dng-plate-bg-base) 100%
  );
  border-top:    1px solid var(--dng-plate-top);
  border-left:   2px solid var(--dng-plate-left);
  border-right:  2px solid var(--dng-plate-right);
  border-bottom: 1px solid var(--dng-plate-bottom);
  box-shadow:
    inset 0 1px 6px rgba(0, 0, 0, 0.60),    /* top recess */
    0 1px 0 var(--dng-plate-shimmer);        /* shimmer into bronze seam below */
}

.dungeon-frame__nameplate-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.dungeon-frame__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  line-height: var(--leading-tight);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 0.4em;
}

.dungeon-frame__title-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  opacity: 0.85;
}

.dungeon-frame__subtitle {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--dng-subtitle-warm);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-normal);
}

.dungeon-frame__nameplate-actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}


/* ─────────────────────────────────────────────────────────────
   INSET — recessed teal-dark content surface

   Background is a two-layer gradient:
     · Radial top bloom: teal-tinted ellipse at center-top,
       simulating the open space of a carved interior catching ambient
       teal light from above before falling into shadow.
     · Linear depth: lighter at top, settles, darker at bottom.
   Together they read as a surface with depth and interior volume,
   not a flat colored rectangle.

   SVG STRUCTURAL REFINEMENT — inner corner chamfers:
   clip-path mirrors the outer octagonal silhouette at the inset opening.
   Top-left and top-right corners are cut at 45° × --dng-inner-chamfer.
   Bottom corners remain square (SVG shows square base of content well).
   The chamfer gaps reveal the bronze ring material behind, reading as
   the visible frame slope descending into the content well — the
   「sunken panel」effect central to the SVG reference language.

   ::after adds matching shadow wedges at the chamfered corners,
   simulating the shadow cast by the angled bronze walls above the
   inset opening. pointer-events: none so content remains interactive.

   The near-black border (--dng-panel-border) is the single clearest
   structural edge in the hierarchy: frame vs panel.
   The teal-tinted top inner shimmer is a 1px edge that gives the
   inset its own material identity at the opening.
   ───────────────────────────────────────────────────────────── */
.dungeon-frame__inset {
  position: relative;
  background:
    radial-gradient(
      ellipse 85% 45% at 50% 0%,
      var(--dng-inset-bloom) 0%,
      transparent            80%
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
    inset 0 3px 20px rgba(0, 0, 0, 0.78),    /* recessed top shadow */
    inset 0 0   0  1px rgba(0, 0, 0, 0.20),  /* inner-edge definition */
    inset 0 1px 0 var(--dng-inset-shimmer);  /* top-edge material shimmer */

  /* Top-corner chamfers — echoes the outer octagonal clip-path         */
  /* at the inset mouth, revealing bronze ring material at each slope.  */
  clip-path: polygon(
    var(--dng-inner-chamfer)                 0%,
    calc(100% - var(--dng-inner-chamfer))    0%,
    100%   var(--dng-inner-chamfer),
    100%   100%,
    0%     100%,
    0%     var(--dng-inner-chamfer)
  );
}

/* Shadow wedges cast by the chamfered corner walls into the content well */
.dungeon-frame__inset::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  /* Diagonal gradients anchored at TL and TR — fade quickly toward center */
  background:
    linear-gradient(135deg, rgba(0, 0, 0, 0.62) 0%, transparent 100%),
    linear-gradient(225deg, rgba(0, 0, 0, 0.62) 0%, transparent 100%);
  background-size: 44px 44px, 44px 44px;
  background-position: 0 0, 100% 0;
  background-repeat: no-repeat;
}


/* ─────────────────────────────────────────────────────────────
   BODY — primary content region
   ───────────────────────────────────────────────────────────── */
.dungeon-frame__body {
  padding: var(--space-lg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}


/* ─────────────────────────────────────────────────────────────
   FOOTER — status readout band at bottom of inset
   ───────────────────────────────────────────────────────────── */
.dungeon-frame__footer {
  border-top: 1px solid var(--dng-divider);
  padding: var(--space-sm) var(--space-lg);
  background: var(--dng-panel-footer);
  color: var(--dng-footer-muted);
  font-size: var(--text-xs);
  font-family: var(--font-body);
  letter-spacing: var(--tracking-wide);
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.28);
}
</style>
