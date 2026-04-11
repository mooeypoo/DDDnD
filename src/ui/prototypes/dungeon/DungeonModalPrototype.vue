<template>
  <!--
    DungeonModalPrototype — elevated dialog surface in the dungeon-console family.

    Structural layers (outer → inner):

      1. dungeon-modal          outer shell — chamfered clip-path, heavy drop-shadow,
                                flex column with NO top padding (cap fills flush)

      2. dungeon-modal__cap     header cap — full-bleed dark plate at the SHELL level,
                                not inside the ring. Top brackets anchor here.
                                Bottom border is the bronze seam transition to the ring.
                                This is the key structural departure from the frame:
                                DungeonFramePrototype sandwiches the nameplate INSIDE
                                the ring padding. Here the cap rides OUTSIDE the ring,
                                edge-to-edge across the top of the shell.

      3. dungeon-modal__ring    bronze ring — margin: 0 3px 3px gives the three-sided
                                shell gap (dark strip on L/R/B). Wraps ONLY the content
                                zone (inset + action plate). Bottom brackets anchor here.

      4. dungeon-modal__inset   teal-dark content surface — same depth gradient, bloom,
                                and top-corner chamfers (clip-path + ::after shadow wedges)

      5. dungeon-modal__body    primary content region

      6. dungeon-modal__actions action plate — dark beveled plate on the ring surface,
                                OUTSIDE the inset, separated by the ring-gap bronze seam.
                                Same plate material as the cap. Creates the tri-zone read:
                                  [dark header cap] → [teal inset] → [dark action plate]
  -->
  <div
    class="dungeon-modal"
    :class="`variant-${variant}`"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="title ? titleId : undefined"
  >
    <!--
      Header cap: first child of the outer shell flex column.
      No shell gap above or on the sides — fills flush to the shell's inner walls.
      The outer shell's 1px border frames the cap on three edges (top/left/right).
      Bottom border is the prominent bronze-tinted seam where cap hands off to ring.
      Top brackets anchor inside the cap, marking the physical corners of the modal.
    -->
    <div class="dungeon-modal__cap">
      <span class="dungeon-bracket dungeon-bracket--tl" aria-hidden="true" />
      <span class="dungeon-bracket dungeon-bracket--tr" aria-hidden="true" />
      <div class="dungeon-modal__cap-text">
        <h2 v-if="title" :id="titleId" class="dungeon-modal__title">{{ title }}</h2>
        <p v-if="subtitle" class="dungeon-modal__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots['header-end']" class="dungeon-modal__header-end">
        <slot name="header-end" />
      </div>
    </div>

    <!--
      Bronze ring: margin 0 3px 3px creates the three-sided shell gap (L/R/B).
      No top margin: the cap fills the shell at the top; the ring's bronze face
      begins immediately below the cap's bottom seam.
      Bottom brackets anchor on the ring surface.
    -->
    <div class="dungeon-modal__ring">
      <span class="dungeon-bracket dungeon-bracket--bl" aria-hidden="true" />
      <span class="dungeon-bracket dungeon-bracket--br" aria-hidden="true" />

      <!-- Teal-dark inset: same depth gradient, bloom, and top-corner chamfers as DungeonFramePrototype -->
      <div class="dungeon-modal__inset">
        <div class="dungeon-modal__body">
          <slot />
        </div>
      </div>

      <!--
        Action plate: dark beveled plate on the ring surface, outside the inset.
        The ring-gap (--dng-ring-gap = 6px bronze bridge) separates it from the inset.
        Uses the same plate gradient + directional bevel borders as the cap above.
        The visual bookend: same dark-plate material top and bottom, teal inset centre.
      -->
      <footer v-if="$slots.actions" class="dungeon-modal__actions">
        <slot name="actions" />
      </footer>
    </div>

  </div>
</template>

<script setup lang="ts">
const titleId = `dng-modal-title-${Math.random().toString(36).slice(2, 9)}`

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
  Base --dng-* tokens are defined in ./dungeon-design-tokens.css.
  That file is loaded globally via .storybook/preview.ts (Storybook)
  and will be loaded via main.ts when app integration begins.
  Do NOT @import it here — an @import inside <style scoped> causes
  the imported rules to be injected as a separate global stylesheet
  after the scoped rules, which flattens the variant overrides.

  System tokens reused from production:
    --font-heading, --font-body, --text-primary, --text-secondary
    --space-sm, --space-md, --space-lg
    --text-xs, --text-sm, --text-base, --tracking-wide, --tracking-wider
    --font-semibold, --leading-tight, --leading-normal, --leading-relaxed
*/

/* ─────────────────────────────────────────────────────────────
   AGED VARIANT — quieter, older, lower visual energy
   ───────────────────────────────────────────────────────────── */
.dungeon-modal.variant-aged {
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
  --dng-panel-bottom:     #060f16;
  --dng-inset-bloom:      rgba(4, 10, 14, 0.18);
  --dng-inset-shimmer:    rgba(0, 4, 6, 0.10);

  --dng-divider:          rgba(100, 70, 16, 0.25);

  --dng-title-gold:       #9e8030;
  --dng-subtitle-warm:    #584e2c;

  --dng-bracket:          rgba(148, 112, 22, 0.52);
}

/* ─────────────────────────────────────────────────────────────
   ACCENT VARIANT — arcane resonance / active focused state

   Bronze ring stays warm and unchanged.
   Teal signal lives at the plate bevel edges, inset bloom,
   brackets, and panel boundary — same strategy as the frame.
   ───────────────────────────────────────────────────────────── */
.dungeon-modal.variant-accent {
  --dng-plate-top:        rgba(25, 180, 155, 0.45);
  --dng-plate-left:       rgba(20, 150, 128, 0.35);
  --dng-plate-right:      rgba( 0,   0,   0, 0.38);
  --dng-plate-bottom:     rgba(22, 175, 150, 0.60);
  --dng-plate-shimmer:    rgba(22, 190, 162, 0.32);

  --dng-inset-bloom:      rgba(10, 105, 115, 0.52);
  --dng-inset-shimmer:    rgba(38, 210, 185, 0.34);

  --dng-divider:          rgba(45, 212, 191, 0.48);
  --dng-panel-border:     rgba(30, 160, 142, 0.50);

  --dng-bracket:          rgba(38, 212, 188, 0.80);
}


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL

   flex column with NO padding — the header cap fills the top
   flush (no dark shell gap above it). The ring uses margin on
   three sides to produce the L/R/B shell gap.

   clip-path uses --dng-modal-chamfer (10px vs frame's 8px).
   filter: drop-shadow is heavier — the modal reads as physically
   elevated above the page; the frame reads as embedded within it.
   ───────────────────────────────────────────────────────────── */
.dungeon-modal {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--dng-shell-border);
  background: var(--dng-shell-bg);

  clip-path: polygon(
    var(--dng-modal-chamfer)                    0%,
    calc(100% - var(--dng-modal-chamfer))        0%,
    100%                                         var(--dng-modal-chamfer),
    100%                                         calc(100% - var(--dng-modal-chamfer)),
    calc(100% - var(--dng-modal-chamfer))        100%,
    var(--dng-modal-chamfer)                    100%,
    0%                                           calc(100% - var(--dng-modal-chamfer)),
    0%                                           var(--dng-modal-chamfer)
  );

  filter:
    drop-shadow(0 36px 90px rgba(0, 0, 0, 0.96))
    drop-shadow(0 12px 36px rgba(0, 0, 0, 0.82))
    drop-shadow(0  3px  8px rgba(0, 0, 0, 0.62));
}


/* ─────────────────────────────────────────────────────────────
   HEADER CAP

   The defining structural departure from DungeonFramePrototype.

   In the frame, the nameplate sits INSIDE the bronze ring —
   it is surrounded on all four sides by 12px of ring padding.
   The ring is the outer wrapping material; nameplate is interior.

   Here, the cap sits OUTSIDE the ring at the shell level —
   it fills edge-to-edge across the header zone, with no ring
   padding between it and the outer shell walls. The ring wraps
   only the content zone below.

   The outer shell's 1px border frames the cap on top and sides.
   The cap's bottom border (--dng-plate-bottom) is the seam where
   the shell hands off to the ring below (bronze tint, prominent).
   A thin shimmer (0 2px 0 plate-shimmer) bleeds into the gap
   between cap base and ring top.

   Top brackets anchor in the cap: they mark the physical corners
   of the entire modal, not just the ring face.
   ───────────────────────────────────────────────────────────── */
.dungeon-modal__cap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: 20px 24px 18px;

  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  26%,
    var(--dng-plate-bg-base) 100%
  );

  border-top:    1px solid var(--dng-plate-top);
  border-left:   2px solid var(--dng-plate-left);
  border-right:  2px solid var(--dng-plate-right);
  border-bottom: 3px solid var(--dng-plate-bottom);  /* bronze seam: cap → ring, 3px bridge */

  box-shadow:
    inset 0  1px 18px rgba(0, 0, 0, 0.75),   /* deep top recess — plate sits in cavity */
    inset 0 -1px  6px rgba(0, 0, 0, 0.40),   /* bottom: shadow collects toward seam */
    inset 2px  0  6px rgba(0, 0, 0, 0.30),   /* left face panel recess */
    inset -2px 0  6px rgba(0, 0, 0, 0.30),   /* right face panel recess */
    0 2px 0 var(--dng-plate-shimmer);         /* shimmer blooms into ring zone */
}

.dungeon-modal__cap-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.dungeon-modal__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-tight);
}

.dungeon-modal__subtitle {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--dng-subtitle-warm);
  letter-spacing: var(--tracking-wide);
  line-height: var(--leading-normal);
}

.dungeon-modal__header-end {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}


/* ─────────────────────────────────────────────────────────────
   RING — cast bronze frame material

   margin: 0 var(--dng-shell-gap) var(--dng-shell-gap)
   produces a dark shell gap on the left, right, and bottom only.
   No top margin: the ring's bronze face begins immediately below
   the cap's bottom seam — no dark gap at the transition.
   This makes the cap read as the cap OF the ring, not a separate
   floating element above it.

   The ring wraps only the inset + action plate. The frame's ring
   wraps nameplate + inset + footer together. The modal ring is
   a narrower bracket around the content zone only.

   gap: --dng-ring-gap creates the bronze seam bridge between
   inset and action plate, same as the seam between nameplate
   and inset in the frame.
   ───────────────────────────────────────────────────────────── */
.dungeon-modal__ring {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--dng-ring-gap);
  margin: 0 var(--dng-shell-gap) var(--dng-shell-gap);

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

  padding: var(--dng-modal-ring-padding);
  border: 1px solid var(--dng-frame-outer);

  box-shadow:
    inset 0 2px 0 var(--dng-ring-bevel-top),
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),
    inset 1px  0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   CORNER L-BRACKETS

   Top brackets anchor in the cap — marking the outer corners of
   the entire modal shell. Bottom brackets anchor in the ring —
   marking the lower corners of the content zone.

   The split bracket placement is the visible sign of the
   two-layer structure (cap + ring), not just ornament.
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
   INSET — recessed teal-dark content surface

   Mirrors DungeonFramePrototype __inset:
   same radial teal bloom at top, linear depth gradient, inset shadows.
   Top-corner chamfers (clip-path polygon) match the frame's inner chamfer,
   revealing bronze ring material at each slope. ::after shadow wedges
   deepen the sense of a recessed cavity at TL/TR corners.
   ───────────────────────────────────────────────────────────── */
.dungeon-modal__inset {
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
    inset 0 3px 20px rgba(0, 0, 0, 0.78),
    inset 0 0   0  1px rgba(0, 0, 0, 0.20),
    inset 0 1px 0 var(--dng-inset-shimmer);

  /* Top-corner chamfers — echoes the outer octagonal clip-path and the   */
  /* frame inset's inner chamfer, revealing bronze ring at each slope.    */
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
.dungeon-modal__inset::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
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
.dungeon-modal__body {
  padding: var(--space-lg);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}


/* ─────────────────────────────────────────────────────────────
   ACTION PLATE — dark beveled plate on the ring surface

   Positioned outside the inset, on the ring surface. The ring-gap
   (6px) creates a visible bronze seam bridge between inset and
   action plate — the same seam type that separates the nameplate
   from the inset in the frame.

   Uses the same dark-plate gradient and directional bevel borders
   as the header cap. The result is a deliberate top/bottom bookend:

       [dark header cap]  ← same plate material →  [dark action plate]
       [         teal inset body in between         ]

   This tri-zone composition is the clearest structural difference
   from DungeonFramePrototype, which has a flat two-zone read:
   nameplate (inside the ring) → inset+footer (inside the ring).
   ───────────────────────────────────────────────────────────── */
.dungeon-modal__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: 11px var(--space-lg);

  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-base) 100%
  );

  border-top:    1px solid var(--dng-plate-top);
  border-left:   1px solid var(--dng-plate-left);
  border-right:  1px solid var(--dng-plate-right);
  border-bottom: 1px solid var(--dng-plate-bottom);

  box-shadow:
    inset 0 1px 6px rgba(0, 0, 0, 0.55),
    inset 2px  0 3px rgba(0, 0, 0, 0.22),
    inset -2px 0 3px rgba(0, 0, 0, 0.22);
}
</style>
