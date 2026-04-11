<template>
  <!--
    AppSelect — dungeon-console styled dropdown in the dungeon-console family.

    Wraps a native <select> for full accessibility (keyboard, screen reader,
    mobile OS pickers) while applying the same bronze ring material as AppButton.

    Structural layers (outer → inner):
      1. .dungeon-select      outer shell — chamfered clip-path, dark shell
      2. .dungeon-select__ring  bronze ring — cast-metal gradient
      3. .dungeon-select-bracket × 4  L-bracket corner ornaments
      4. .dungeon-select__face  dark plate — directional bevel borders
      5. <select>             native select — fully transparent, fills face
      6. .dungeon-select__caret  custom caret arrow in dungeon gold
  -->
  <div
    class="dungeon-select"
    :class="{ 'is-disabled': disabled }"
  >
    <span class="dungeon-select__ring">
      <span class="dungeon-select-bracket dungeon-select-bracket--tl" aria-hidden="true" />
      <span class="dungeon-select-bracket dungeon-select-bracket--tr" aria-hidden="true" />
      <span class="dungeon-select-bracket dungeon-select-bracket--bl" aria-hidden="true" />
      <span class="dungeon-select-bracket dungeon-select-bracket--br" aria-hidden="true" />

      <span class="dungeon-select__face">
        <select
          class="dungeon-select__native"
          :value="modelValue"
          :disabled="disabled"
          @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
        >
          <option v-if="placeholder" value="" disabled :selected="!modelValue">
            {{ placeholder }}
          </option>
          <option
            v-for="option in options"
            :key="option.value"
            :value="option.value"
          >{{ option.label }}</option>
        </select>
        <span class="dungeon-select__caret" aria-hidden="true">▾</span>
      </span>
    </span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string
    options: { value: string; label: string }[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: undefined,
    disabled: false,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style scoped>
/*
  Tokens from src/ui/prototypes/dungeon/dungeon-design-tokens.css (global).
  Reuses button-geometry tokens (--dng-btn-*) — same scale as AppButton.
*/


/* ─────────────────────────────────────────────────────────────
   OUTER SHELL
   ───────────────────────────────────────────────────────────── */
.dungeon-select {
  display: inline-flex;
  align-items: stretch;

  padding: var(--dng-shell-gap);
  background: var(--dng-shell-bg);
  border: 1px solid var(--dng-shell-border);

  clip-path: polygon(
    var(--dng-btn-chamfer)                   0%,
    calc(100% - var(--dng-btn-chamfer))       0%,
    100%                                      var(--dng-btn-chamfer),
    100%                                      calc(100% - var(--dng-btn-chamfer)),
    calc(100% - var(--dng-btn-chamfer))       100%,
    var(--dng-btn-chamfer)                   100%,
    0%                                        calc(100% - var(--dng-btn-chamfer)),
    0%                                        var(--dng-btn-chamfer)
  );

  filter:
    drop-shadow(0 4px 10px rgba(0, 0, 0, 0.70))
    drop-shadow(0 1px  3px rgba(0, 0, 0, 0.50));

  transition: filter 120ms ease-out;
}

.dungeon-select:not(.is-disabled):focus-within {
  filter:
    drop-shadow(0 6px 16px rgba(0, 0, 0, 0.78))
    drop-shadow(0 0    0  3px rgba(38, 210, 185, 0.70));
}

.dungeon-select.is-disabled {
  opacity: 0.42;
  cursor: not-allowed;
  pointer-events: none;

  --dng-bronze-hi:    #846010;
  --dng-bronze-mid:   #6a4c0c;
  --dng-bronze-deep:  #4e3808;
  --dng-bronze-low:   #3e2c06;
  --dng-bracket:      rgba(100, 76, 14, 0.38);
}


/* ─────────────────────────────────────────────────────────────
   BRONZE RING
   ───────────────────────────────────────────────────────────── */
.dungeon-select__ring {
  position: relative;
  display: flex;
  align-items: stretch;
  flex: 1;

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

  padding: var(--dng-btn-ring-v) var(--dng-btn-ring-h);
  border: 1px solid var(--dng-frame-outer);

  box-shadow:
    inset 0  2px 0 var(--dng-ring-bevel-top),
    inset 0 -2px 0 rgba(0, 0, 0, 0.55),
    inset 1px  0 0 var(--dng-ring-bevel-left),
    inset -1px 0 0 rgba(0, 0, 0, 0.32);
}


/* ─────────────────────────────────────────────────────────────
   L-BRACKET CORNER ORNAMENTS
   ───────────────────────────────────────────────────────────── */
.dungeon-select-bracket {
  position: absolute;
  width: var(--dng-btn-bracket-size);
  height: var(--dng-btn-bracket-size);
  z-index: 2;
  pointer-events: none;
}

.dungeon-select-bracket::before,
.dungeon-select-bracket::after {
  content: '';
  position: absolute;
  background: var(--dng-bracket);
}

.dungeon-select-bracket::before { height: var(--dng-btn-bracket-weight); width: var(--dng-btn-bracket-size); }
.dungeon-select-bracket::after  { width: var(--dng-btn-bracket-weight);  height: var(--dng-btn-bracket-size); }

.dungeon-select-bracket--tl { top: var(--dng-btn-bracket-inset); left: var(--dng-btn-bracket-inset); }
.dungeon-select-bracket--tl::before { top: 0; left: 0; }
.dungeon-select-bracket--tl::after  { top: 0; left: 0; }

.dungeon-select-bracket--tr { top: var(--dng-btn-bracket-inset); right: var(--dng-btn-bracket-inset); }
.dungeon-select-bracket--tr::before { top: 0; right: 0; }
.dungeon-select-bracket--tr::after  { top: 0; right: 0; }

.dungeon-select-bracket--bl { bottom: var(--dng-btn-bracket-inset); left: var(--dng-btn-bracket-inset); }
.dungeon-select-bracket--bl::before { bottom: 0; left: 0; }
.dungeon-select-bracket--bl::after  { bottom: 0; left: 0; }

.dungeon-select-bracket--br { bottom: var(--dng-btn-bracket-inset); right: var(--dng-btn-bracket-inset); }
.dungeon-select-bracket--br::before { bottom: 0; right: 0; }
.dungeon-select-bracket--br::after  { bottom: 0; right: 0; }


/* ─────────────────────────────────────────────────────────────
   FACE PLATE
   ───────────────────────────────────────────────────────────── */
.dungeon-select__face {
  display: flex;
  align-items: center;
  flex: 1;
  position: relative;

  background: linear-gradient(
    to bottom,
    var(--dng-plate-bg-hi)    0%,
    var(--dng-plate-bg-mid)  24%,
    var(--dng-plate-bg-base) 100%
  );

  border-top:    1px solid var(--dng-plate-top);
  border-left:   2px solid var(--dng-plate-left);
  border-right:  2px solid var(--dng-plate-right);
  border-bottom: 1px solid var(--dng-plate-bottom);

  box-shadow:
    inset 0 1px 5px rgba(0, 0, 0, 0.62),
    0 1px 0 var(--dng-plate-shimmer);
}


/* ─────────────────────────────────────────────────────────────
   NATIVE SELECT — transparent, fills the face plate
   ───────────────────────────────────────────────────────────── */
.dungeon-select__native {
  /* Reset browser chrome */
  appearance: none;
  -webkit-appearance: none;
  border: none;
  outline: none;
  background: transparent;
  cursor: pointer;

  /* Fill the face plate */
  width: 100%;
  padding: 7px 32px 7px 12px; /* right pad leaves room for caret */

  font-family: var(--font-heading);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  line-height: 1;

  /* Provide z-index so it sits above the caret span */
  position: relative;
  z-index: 1;
}

/* Tint the option list (limited browser support, best-effort) */
.dungeon-select__native option {
  background: var(--surface-panel);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  text-transform: none;
  letter-spacing: normal;
}


/* ─────────────────────────────────────────────────────────────
   CUSTOM CARET — dungeon gold triangle
   ───────────────────────────────────────────────────────────── */
.dungeon-select__caret {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dng-title-gold);
  font-size: var(--text-xs);
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
</style>
