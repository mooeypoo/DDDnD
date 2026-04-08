<template>
  <Transition name="surface-fade">
    <div
      v-if="isOpen"
      class="surface-overlay"
      @click="handleBackdropClick"
    >
      <!--
        Dungeon modal shell. Structural layers (outer → inner):
          1. dungeon-modal        outer shell — chamfered clip-path, heavy drop-shadow
          2. dungeon-modal__cap   header cap — full-bleed dark plate at the SHELL level,
                                  outside the ring. Top brackets anchor here.
          3. dungeon-modal__ring  bronze ring — margin: 0 3px 3px (L/R/B shell gap).
                                  Wraps only the content zone. Bottom brackets anchor here.
          4. dungeon-modal__inset teal-dark content surface
          5. dungeon-modal__body  primary content region (default slot)
          6. dungeon-modal__actions action plate — dark beveled plate outside the inset,
                                  separated by the ring-gap bronze seam. (footer slot)

        Tokens come from dungeon-design-tokens.css, loaded globally via
        src/ui/styles/design-system.css. Do NOT @import it here.
      -->
      <div
        class="dungeon-modal"
        :class="[`variant-${variant}`, `size-${size}`]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.stop
      >
        <!-- Header cap: top brackets + title + close button -->
        <div class="dungeon-modal__cap">
          <span class="dungeon-bracket dungeon-bracket--tl" aria-hidden="true" />
          <span class="dungeon-bracket dungeon-bracket--tr" aria-hidden="true" />
          <div class="dungeon-modal__cap-text">
            <h2 :id="titleId" class="dungeon-modal__title">{{ title }}</h2>
          </div>
          <div class="dungeon-modal__header-end">
            <button
              class="dungeon-modal__close"
              type="button"
              :aria-label="closeLabel"
              @click="emit('close')"
            >×</button>
          </div>
        </div>

        <!-- Bronze ring -->
        <div class="dungeon-modal__ring">
          <span class="dungeon-bracket dungeon-bracket--bl" aria-hidden="true" />
          <span class="dungeon-bracket dungeon-bracket--br" aria-hidden="true" />

          <!-- Teal-dark inset: default slot content -->
          <div class="dungeon-modal__inset">
            <div class="dungeon-modal__body">
              <slot />
            </div>
          </div>

          <!-- Action plate: footer slot (dark bookend plate, outside the inset) -->
          <footer v-if="$slots.footer" class="dungeon-modal__actions">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    size?: 'sm' | 'md' | 'lg'
    closeOnBackdrop?: boolean
    closeLabel?: string
    variant?: 'default' | 'aged' | 'accent'
  }>(),
  {
    size: 'md',
    closeOnBackdrop: true,
    closeLabel: 'Close panel',
    variant: 'default',
  }
)

const emit = defineEmits<{
  close: []
}>()

const titleId = computed(() => `surface-modal-title-${props.title.toLowerCase().replace(/\s+/g, '-')}`)

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.isOpen && event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
/*
  Base --dng-* tokens are defined in dungeon-design-tokens.css.
  That file is loaded globally via src/ui/styles/design-system.css (production)
  and .storybook/preview.ts (Storybook).
  Do NOT @import it here — an @import inside <style scoped> causes the imported
  rules to be injected as a separate global stylesheet after the scoped rules,
  which flattens the variant overrides.
*/

/* ─────────────────────────────────────────────────────────────
   OVERLAY — fixed backdrop, centers the modal shell
   ───────────────────────────────────────────────────────────── */
.surface-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--surface-overlay);
  backdrop-filter: blur(4px);
}

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

   Flex column with NO padding — the header cap fills top flush.
   The ring uses margin on three sides to produce the L/R/B shell gap.
   clip-path uses --dng-modal-chamfer (10px, heavier than frame's 8px).
   filter: drop-shadow is heavier — the modal reads as physically
   elevated above the page.
   ───────────────────────────────────────────────────────────── */
.dungeon-modal {
  display: flex;
  flex-direction: column;
  width: min(100%, 720px);      /* default = md */
  max-height: 92vh;
  overflow: auto;
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

.dungeon-modal.size-sm { width: min(100%, 520px); }
.dungeon-modal.size-lg { width: min(100%, 900px); }

/* ─────────────────────────────────────────────────────────────
   HEADER CAP

   Sits OUTSIDE the bronze ring at the shell level — fills edge-
   to-edge across the header zone, no ring padding above it.
   The outer shell's 1px border frames it on top and sides.
   Bottom border (--dng-plate-bottom) is the bronze seam where
   the shell hands off to the ring below.
   Top brackets anchor here, marking the outer corners of the modal.
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
  border-bottom: 3px solid var(--dng-plate-bottom);

  box-shadow:
    inset 0  1px 18px rgba(0, 0, 0, 0.75),
    inset 0 -1px  6px rgba(0, 0, 0, 0.40),
    inset 2px  0  6px rgba(0, 0, 0, 0.30),
    inset -2px 0  6px rgba(0, 0, 0, 0.30),
    0 2px 0 var(--dng-plate-shimmer);
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

.dungeon-modal__header-end {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-shrink: 0;
}

/* Close button — minimal dark-plate capsule matching cap material */
.dungeon-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--dng-plate-bottom);
  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-base) 100%
  );
  color: var(--dng-subtitle-warm);
  cursor: pointer;
  font-size: var(--text-base);
  line-height: 1;
  clip-path: polygon(
    3px 0%, calc(100% - 3px) 0%, 100% 3px,
    100% calc(100% - 3px), calc(100% - 3px) 100%,
    3px 100%, 0% calc(100% - 3px), 0% 3px
  );

  box-shadow:
    inset 0 1px 4px rgba(0, 0, 0, 0.55),
    inset 1px 0 2px rgba(0, 0, 0, 0.22),
    inset -1px 0 2px rgba(0, 0, 0, 0.22);
}

.dungeon-modal__close:hover {
  color: var(--dng-title-gold);
  border-color: var(--dng-plate-top);
}

/* ─────────────────────────────────────────────────────────────
   RING — cast bronze frame material

   margin: 0 var(--dng-shell-gap) var(--dng-shell-gap) produces
   a dark shell gap on L/R/B only. No top gap: the ring's bronze
   face begins immediately below the cap's bottom seam.
   gap: --dng-ring-gap creates the bronze seam bridge between
   inset and action plate.
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

   Top brackets anchor in the cap (outer modal corners).
   Bottom brackets anchor in the ring (lower content zone corners).
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

  clip-path: polygon(
    var(--dng-inner-chamfer)                 0%,
    calc(100% - var(--dng-inner-chamfer))    0%,
    100%   var(--dng-inner-chamfer),
    100%   100%,
    0%     100%,
    0%     var(--dng-inner-chamfer)
  );
}

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
   ACTION PLATE (footer slot) — dark beveled plate on ring surface

   Same plate gradient as the header cap — creates the tri-zone read:
     [dark header cap] → [teal inset] → [dark action plate]
   The --dng-ring-gap bronze seam bridges inset and action plate.
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

/* ─────────────────────────────────────────────────────────────
   TRANSITION — overlay fade
   ───────────────────────────────────────────────────────────── */
.surface-fade-enter-active,
.surface-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}

.surface-fade-enter-from,
.surface-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .surface-overlay {
    padding: var(--space-md);
  }
}
</style>
