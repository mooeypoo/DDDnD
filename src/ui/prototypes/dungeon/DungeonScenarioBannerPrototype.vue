<template>
  <!--
    DungeonScenarioBannerPrototype — wide broadcast panel in the dungeon-console family.

    Design concept: The Situation Dossier
    ──────────────────────────────────────
    A full-width panel that opens every active session — the "mission briefing board"
    mounted above the command deck. Unlike AppFrame (a general-purpose container) or
    AppCard (an item token), the Situation Dossier is a BROADCAST surface: it announces
    the current quest and tracks campaign progress at a glance.

    What makes the Dossier compositionally distinct from AppFrame
    ─────────────────────────────────────────────────────────────
    1. SPLIT-PLATE HEADER — instead of a single full-bleed nameplate, the header carries
       two functional zones separated by a bronze vertical pillar column:
         ┌───────────────────────────────────────────┬─────┬──────────┐
         │  ◎  SCENARIO              Title text       │ ▐▐▐ │  03      │
         │                                            │     │  of 8    │
         └───────────────────────────────────────────┴─────┴──────────┘
       The left zone: mission crest glyph + eyebrow label + scenario title.
       The bronze pillar: a full-height vertical column using the ring bronze gradient —
       a literal structural divider, rendered as a narrow independent element (not a border).
       The right zone: a mechanical turn counter — current turn in large Cinzel gold,
       "of N" denominator in muted text below.

    2. MISSION CREST SVG — a unique inline SVG glyph appearing in the left header zone.
       Visually: an architectural targeting reticle / compass bearing marker.
       Structure:
         · Outer octagonal ring (mirrors the component's own octagonal clip-path)
         · Inscribed rotated diamond (cardinal compass)
         · Four crosshair axes (N/S/E/W lines reaching the octagon)
         · Four cardinal tick marks (short, thick, at the octagon boundary)
         · Center tracking ring (the "target lock" ring)
         · Center filled lock-point dot
       Renders in color: currentColor → scoped to --dng-title-gold.
       This specific glyph does not appear in any other dungeon component.

    3. CAMPAIGN PROGRESS RIBBON — a 3px amber fill bar at the very lip of the inset
       opening (just below the inner chamfer line), between the header and the summary
       text. It is not a labeled meter — it's a decorative status mark that shows
       campaign completeness at a glance. Uses amber tones (--dng-bronze-mid direction)
       rather than teal because it represents TIME in the campaign, not a gameplay
       metric score.

    4. OPTIONAL HERO ARTWORK ZONE — when heroUrl is supplied, a fixed-height strip
       inside the inset shows the scene artwork. A bottom vignette gradient bleeds
       the artwork back into the teal panel surface, preventing a hard edge.
       The artwork is decorative (aria-hidden) and collapses completely when absent.

    Structural layers (outer → inner):

      1. scenario-board  (outer shell)
                          Octagonal clip-path at --dng-chamfer (8px). Near-black warm
                          charcoal shell. Ambient drop-shadow follows the octagon.

      2. scenario-board__ring  (bronze ring)
                          Standard 7-stop vertical bronze gradient + horizontal tint
                          overlay = top-lit directional cast-bronze read. Four L-bracket
                          corner mounts at ring corners. Ring padding: --dng-ring-padding.

      3. scenario-board__header  (split nameplate)
                          Full-bleed plate spanning ring interior edge-to-edge
                          (same negative-margin bleed strategy as AppFrame nameplate).
                          Three flex children:
                            · .header-mission  — crest glyph + title text zone (flex: 1)
                            · .header-pillar   — standalone bronze column element (10px)
                            · .header-turns    — mechanical turn counter zone (88px)
                          Same directional bevel borders + dark gradient background as
                          standard nameplate. Shimmer bleeds into the bronze seam below.

      4. scenario-board__inset  (recessed teal-dark content surface)
                          Identical radial bloom + linear depth gradient to AppFrame inset.
                          Top-corner chamfer (--dng-inner-chamfer) reveals bronze ring slopes.
                          Full inset box-shadow stack for sunken-panel depth.

      5. inset-artwork  (optional illustration strip — conditional on heroUrl prop)
                          120px fixed height inside the inset. Object-fit: cover image.
                          Bottom vignette gradient bleeds to teal surface.

      6. scenario-board__body  (content area)
                          3px amber campaign ribbon at the lip (progress bar, decorative).
                          Summary paragraph. Expand button + full description (collapsible).

    Variant strategy:
      No variant prop — the ScenarioBanner is always the primary active-campaign display.
      It inherits the default bronze ring and teal panel from the family base tokens.

    Token surface:
      Uses only --dng-* tokens + --text-* / --space-* production tokens.
      Does NOT @import dungeon-design-tokens.css — tokens are global via design-system.css.
  -->
  <article
    class="scenario-board"
    :class="{ 'has-artwork': heroUrl }"
    aria-label="`Scenario: ${title}`"
  >
    <div class="scenario-board__ring">

      <!-- ── Corner L-bracket mounts ── -->
      <span class="sb-bracket sb-bracket--tl" aria-hidden="true" />
      <span class="sb-bracket sb-bracket--tr" aria-hidden="true" />
      <span class="sb-bracket sb-bracket--bl" aria-hidden="true" />
      <span class="sb-bracket sb-bracket--br" aria-hidden="true" />

      <!-- ── Split-plate header ─────────────────────────────────────────────── -->
      <!--
        Three flex children: [title zone(flex:1)] [bronze pillar(10px)] [turn counter(88px)]
        The title zone carries the mission crest SVG + scenario name.
        The bronze pillar is a standalone element, not a CSS border — it carries the
        full 7-stop ring gradient and its own directional bevel.
        The turn counter zone shows the mechanical CURRENT / MAX display.
      -->
      <div class="scenario-board__header">

        <!-- Left: mission crest + scenario title zone -->
        <div class="header-mission">

          <!--
            MISSION CREST SVG — architectural targeting reticle / compass bearing marker.

            Design rationale:
              An octagonal outer frame (echoing the component's own clip-path silhouette)
              with an inscribed diamond indicating cardinal directions. Four crosshair
              axes read as coordinate lines on a tactical display map. Short thick tick
              marks at the cardinal points on the octagon and a center targeting ring + lock
              dot complete the "bearing acquired" / "mission coordinates locked" read.

            This glyph is unique to the ScenarioBanner. It does not appear in any
            other dungeon prototype component. It renders as 36×36px in the header plate.
            color: currentColor → scoped to --dng-title-gold by the .mission-crest class.
          -->
          <svg
            class="mission-crest"
            viewBox="0 0 40 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
          >
            <!-- Outer octagonal frame — 8 sides, matches component clip-path shape -->
            <polygon
              points="13,2 27,2 38,13 38,27 27,38 13,38 2,27 2,13"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              opacity="0.70"
            />
            <!-- Inscribed diamond (rotated square) — cardinal compass indicator -->
            <path
              d="M20,8 L32,20 L20,32 L8,20 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="0.9"
              opacity="0.40"
            />
            <!-- Crosshair axes — coordinate reference lines -->
            <line x1="20" y1="2"  x2="20" y2="14" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <line x1="20" y1="26" x2="20" y2="38" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <line x1="2"  y1="20" x2="14" y2="20" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <line x1="26" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="0.9" opacity="0.45" />
            <!-- Cardinal tick marks — thick, short, at octagon boundary -->
            <line x1="20" y1="2"  x2="20" y2="6"  stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <line x1="20" y1="34" x2="20" y2="38" stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <line x1="2"  y1="20" x2="6"  y2="20" stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <line x1="34" y1="20" x2="38" y2="20" stroke="currentColor" stroke-width="2.2" opacity="0.90" stroke-linecap="round" />
            <!-- Center targeting ring — the lock-on radius -->
            <circle cx="20" cy="20" r="5.5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.88" />
            <!-- Center lock-point dot — bearing acquired -->
            <circle cx="20" cy="20" r="2.2" fill="currentColor" opacity="0.96" />
          </svg>

          <div class="mission-text">
            <span class="mission-eyebrow">Scenario</span>
            <h1 class="mission-title">{{ title }}</h1>
          </div>
        </div>

        <!-- Bronze vertical pillar — standalone structural divider column -->
        <!--
          A 10px-wide element with the full ring bronze gradient applied vertically.
          Directional bevel box-shadow (inset left highlight, inset right shadow)
          mirrors the ring face treatment. This renders as a real structural column
          carved into the nameplate material — an architectural ridge, not a CSS border.
        -->
        <div class="header-pillar" aria-hidden="true" />

        <!-- Right: mechanical turn counter zone -->
        <!--
          Displays CURRENT TURN in large gold Cinzel numerals, with "of N" denominator
          below in muted warm text. Reads as a physical odometer/counter window.
          The padding-left compensates for the adjacent pillar element.
        -->
        <div class="header-turns">
          <span class="turns-label">Turn</span>
          <span class="turns-current">{{ paddedTurn }}</span>
          <div class="turns-denom">
            <span class="turns-of">of</span>
            <span class="turns-total">{{ maxTurns }}</span>
          </div>
        </div>

      </div><!-- /scenario-board__header -->


      <!-- ── Main inset panel ───────────────────────────────────────────────── -->
      <div class="scenario-board__inset">

        <!-- Optional hero artwork strip — collapses when heroUrl absent -->
        <div v-if="heroUrl" class="inset-artwork" aria-hidden="true">
          <img :src="heroUrl" alt="" class="inset-artwork__img" />
          <!-- Bottom vignette: blends artwork back into teal panel surface -->
          <div class="inset-artwork__vignette" />
        </div>

        <div class="scenario-board__body">

          <!-- Campaign progress ribbon — amber fill bar at the inset lip -->
          <!--
            A 3px decorative status mark, not a labeled meter. Amber tones (warm bronze
            family) to signal TIME rather than score. Width = currentTurn / maxTurns × 100%.
            Sits at the very top of the body, tight to the inset opening — reads as
            the campaign timestrip running along the mission panel's top edge.
          -->
          <div class="mission-ribbon" aria-hidden="true">
            <div
              class="mission-ribbon__fill"
              :style="{ width: `${turnProgress}%` }"
            />
          </div>

          <!-- Summary text -->
          <p class="mission-summary">{{ shortDescription }}</p>

          <!-- Full briefing — collapsible -->
          <template v-if="description">
            <button
              class="expand-btn"
              type="button"
              :aria-expanded="isExpanded"
              @click="isExpanded = !isExpanded"
            >
              <span class="expand-btn__chevron" :class="{ 'is-open': isExpanded }">▸</span>
              {{ isExpanded ? 'Hide briefing' : 'Full briefing' }}
            </button>
            <p v-if="isExpanded" class="mission-description">{{ description }}</p>
          </template>

        </div>
      </div><!-- /scenario-board__inset -->

    </div><!-- /scenario-board__ring -->
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  title: string
  shortDescription: string
  description?: string
  currentTurn: number
  maxTurns: number
  /** Optional scene illustration URL. Renders as a fixed-height bleed at top of inset. */
  heroUrl?: string
}>()

const isExpanded = ref(false)

/** Current turn zero-padded to two digits for the mechanical counter display. */
const paddedTurn = computed(() => String(props.currentTurn).padStart(2, '0'))

/** Campaign progress 0–100 for the amber ribbon fill. */
const turnProgress = computed(() =>
  props.maxTurns > 0
    ? Math.min(100, Math.round((props.currentTurn / props.maxTurns) * 100))
    : 0
)
</script>

<style scoped>
/*
  Token imports note:
  All --dng-* tokens are global via dungeon-design-tokens.css → design-system.css → App.vue.
  Do NOT @import here — scoped @imports inject a separate global stylesheet that
  breaks variant CSS-variable overrides.

  Production tokens consumed: --space-*, --text-*, --font-*, --leading-*, --tracking-*,
  --border-focus (focus ring only), --text-primary, --text-secondary.
*/


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL
   Octagonal clip-path + near-black warm shell. Ambient drop-shadow
   follows the chamfered silhouette via filter: drop-shadow().
   ───────────────────────────────────────────────────────────── */
.scenario-board {
  display: block;
  border: 1px solid var(--dng-shell-border);
  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);
  clip-path: polygon(
    var(--dng-chamfer)                       0%,
    calc(100% - var(--dng-chamfer))          0%,
    100%                  var(--dng-chamfer),
    100%     calc(100% - var(--dng-chamfer)),
    calc(100% - var(--dng-chamfer))         100%,
    var(--dng-chamfer)                      100%,
    0%       calc(100% - var(--dng-chamfer)),
    0%                    var(--dng-chamfer)
  );
  filter:
    drop-shadow(0 16px 52px rgba(0, 0, 0, 0.90))
    drop-shadow(0  5px 18px rgba(0, 0, 0, 0.68))
    drop-shadow(0  1px  4px rgba(0, 0, 0, 0.48));
}


/* ─────────────────────────────────────────────────────────────
   BRONZE RING
   Same seven-stop vertical bevel gradient + horizontal tint overlay
   as AppFrame. Four L-bracket mounts at ring corners via .sb-bracket.
   ───────────────────────────────────────────────────────────── */
.scenario-board__ring {
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
    inset 0  2px 0 var(--dng-ring-bevel-top),
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),
    inset  1px 0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   CORNER L-BRACKETS
   Identical to AppFrame bracket system. sb- prefix avoids
   selector collisions when this component is nested inside AppFrame.
   ───────────────────────────────────────────────────────────── */
.sb-bracket {
  position: absolute;
  width: var(--dng-bracket-size);
  height: var(--dng-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.sb-bracket::before,
.sb-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.sb-bracket::before { height: var(--dng-bracket-weight); width: var(--dng-bracket-size); }
.sb-bracket::after  { width:  var(--dng-bracket-weight); height: var(--dng-bracket-size); }

.sb-bracket--tl { top: var(--dng-bracket-inset); left: var(--dng-bracket-inset);   }
.sb-bracket--tl::before { top: 0; left: 0; }
.sb-bracket--tl::after  { top: 0; left: 0; }

.sb-bracket--tr { top: var(--dng-bracket-inset); right: var(--dng-bracket-inset);  }
.sb-bracket--tr::before { top: 0; right: 0; }
.sb-bracket--tr::after  { top: 0; right: 0; }

.sb-bracket--bl { bottom: var(--dng-bracket-inset); left: var(--dng-bracket-inset); }
.sb-bracket--bl::before { bottom: 0; left: 0; }
.sb-bracket--bl::after  { bottom: 0; left: 0; }

.sb-bracket--br { bottom: var(--dng-bracket-inset); right: var(--dng-bracket-inset); }
.sb-bracket--br::before { bottom: 0; right: 0; }
.sb-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   SPLIT-PLATE HEADER
   Full-bleed nameplate using the same wall-to-wall negative-margin
   bleed strategy as AppFrame, with three children:

     [.header-mission (flex:1)] [.header-pillar (10px)] [.header-turns (88px)]

   All three children stretch to the full header height via align-items:stretch.
   The dark gradient plate background, directional bevel borders, and box-shadow
   stack are identical to the standard AppFrame nameplate treatment.
   ───────────────────────────────────────────────────────────── */
.scenario-board__header {
  display: flex;
  align-items: stretch;
  /* Full-bleed: span the full ring interior width */
  width: calc(100% + 2 * var(--dng-ring-padding));
  margin-left: calc(-1 * var(--dng-ring-padding));

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
    inset 0 1px 8px rgba(0, 0, 0, 0.65),
    0 1px 0 var(--dng-plate-shimmer);
}

/* Left zone: mission crest SVG + scenario title */
.header-mission {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 10px calc(var(--dng-ring-padding) + 4px) 10px calc(var(--dng-ring-padding) + 12px);
  min-width: 0;
  overflow: hidden;
}

/* ─── Mission Crest SVG ───────────────────────────────────────
   Architectural targeting reticle. Unique to ScenarioBanner.
   Renders in --dng-title-gold (set via color: on the element).
   36×36px, non-interactive, non-shrinking decoration.
   ─────────────────────────────────────────────────────────── */
.mission-crest {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  color: var(--dng-title-gold);
  opacity: 0.82;
}

/* Scenario label + title text stack */
.mission-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mission-eyebrow {
  display: block;
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--dng-subtitle-warm);
  line-height: 1;
}

.mission-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  line-height: var(--leading-tight);
  /* Allow line-wrap — the scenario name is the primary identifier, never truncate */
  white-space: normal;
}

/* ─── Bronze Vertical Pillar ──────────────────────────────────
   A standalone 10px-wide structural column element between the
   title zone and the turn counter. Carries the full 7-stop ring
   bronze gradient vertically. Directional bevel inset box-shadow
   mirrors the ring face treatment.

   This is intentionally a real DOM element rather than a border or
   ::pseudo — it is a structural member of the header, with its own
   depth. The full bronze gradient makes it read as a physical ridge
   pressed between the two nameplate zones, not a CSS separator line.
   ─────────────────────────────────────────────────────────── */
.header-pillar {
  flex-shrink: 0;
  width: 10px;
  align-self: stretch;
  background: linear-gradient(
    to bottom,
    var(--dng-bronze-hi)    0%,
    var(--dng-bronze-mid)  11%,
    var(--dng-bronze-deep) 28%,
    var(--dng-bronze-low)  50%,
    var(--dng-bronze-deep) 72%,
    var(--dng-bronze-mid)  89%,
    var(--dng-bronze-hi)  100%
  );
  box-shadow:
    inset  1px 0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.58);
  /* Top and bottom overflow the plate borders so the column reads as
     a physical structure that penetrates through the plate layers */
  margin-top:    -1px;
  margin-bottom: -1px;
}

/* ─── Mechanical Turn Counter ─────────────────────────────────
   Two-line display: large Cinzel number above / "of N" below.
   The fixed 88px width keeps the turn counter compact so the
   title zone gets the majority of the header width.
   ─────────────────────────────────────────────────────────── */
.header-turns {
  flex-shrink: 0;
  width: 88px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  gap: 1px;
}

.turns-label {
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--dng-subtitle-warm);
  line-height: 1;
}

/* The large current-turn numeral — primary read in the turn zone */
.turns-current {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--dng-title-gold);
  line-height: 1;
  letter-spacing: 0.05em;
}

.turns-denom {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.turns-of {
  font-family: var(--font-body);
  font-size: var(--text-2xs);
  color: var(--dng-subtitle-warm);
  font-style: italic;
}

.turns-total {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  color: var(--dng-subtitle-warm);
  letter-spacing: 0.03em;
}


/* ─────────────────────────────────────────────────────────────
   INSET — recessed teal-dark content surface
   Identical to AppFrame inset: radial bloom + linear depth gradient,
   top-corner chamfer (--dng-inner-chamfer), full box-shadow stack,
   and ::after shadow wedges at chamfered corners.
   ───────────────────────────────────────────────────────────── */
.scenario-board__inset {
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
  clip-path: polygon(
    var(--dng-inner-chamfer)              0%,
    calc(100% - var(--dng-inner-chamfer)) 0%,
    100%  var(--dng-inner-chamfer),
    100%  100%,
    0%    100%,
    0%    var(--dng-inner-chamfer)
  );
}

/* Shadow wedges cast by the chamfered corner walls into the content well */
.scenario-board__inset::after {
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
  z-index: 1;
}


/* ─────────────────────────────────────────────────────────────
   HERO ARTWORK STRIP (optional)
   Fixed-height image zone inside the inset that collapses when
   heroUrl is absent. The bottom vignette gradient blends the
   artwork back into the teal panel surface, preventing a hard edge.
   ───────────────────────────────────────────────────────────── */
.inset-artwork {
  position: relative;
  height: 110px;
  overflow: hidden;
  flex-shrink: 0;
}

.inset-artwork__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  display: block;
  opacity: 0.72;
}

.inset-artwork__vignette {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent            50%,
    var(--dng-panel-surface) 100%
  );
  z-index: 1;
}


/* ─────────────────────────────────────────────────────────────
   BODY — summary + collapsible full description
   ───────────────────────────────────────────────────────────── */
.scenario-board__body {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg) var(--space-lg);
}

/* ─── Campaign Progress Ribbon ────────────────────────────────
   A 3px amber-gold horizontal fill bar at the top of the body
   region, just inside the inset opening. This is a purely
   decorative temporal marker — not a labeled metric. It reads as
   a mission timestrip.

   Amber-gold tones (bronze → gold family) signal TIME (turns elapsed)
   rather than score — teal signals would imply a live metric readout.
   Width = (currentTurn / maxTurns) × 100%, driven inline.
   ─────────────────────────────────────────────────────────── */
.mission-ribbon {
  height: 3px;
  background: rgba(0, 0, 0, 0.42);
  border-radius: 1px;
  overflow: hidden;
  margin-bottom: var(--space-xs);
}

.mission-ribbon__fill {
  height: 100%;
  background: linear-gradient(
    to right,
    rgba(168, 120, 28, 0.65)  0%,
    rgba(212, 184, 96, 0.90) 100%
  );
  border-radius: 1px;
  transition: width 0.5s ease-out;
}

/* Summary paragraph — italic body text, the main dossier read */
.mission-summary {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  font-style: italic;
}

/* Expand / collapse toggle button */
.expand-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--dng-subtitle-warm);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  align-self: flex-start;
  transition: color var(--transition-fast);
}

.expand-btn:hover  { color: var(--dng-title-gold); }

.expand-btn:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Chevron rotates 90° when briefing is expanded */
.expand-btn__chevron {
  display: inline-block;
  font-style: normal;
  transition: transform var(--transition-fast);
}

.expand-btn__chevron.is-open { transform: rotate(90deg); }

/* Full dossier text (revealed on expand) */
.mission-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  padding-left: var(--space-md);
  border-left: 2px solid var(--dng-divider);
}


/* ─────────────────────────────────────────────────────────────
   RESPONSIVE
   At narrow viewport: shrink crest, collapse title text, reduce
   turn counter width so the header remains compact.
   ───────────────────────────────────────────────────────────── */
@media (max-width: 600px) {
  .mission-crest {
    width: 26px;
    height: 26px;
  }

  .mission-title {
    font-size: var(--text-xs);
  }

  .header-turns {
    width: 72px;
    padding: 8px 10px;
  }

  .turns-current {
    font-size: var(--text-xl);
  }
}
</style>
