<template>
  <!--
    AppInput — dungeon-console styled text input in the dungeon-console family.

    Renders a native <input type="text"> inside an inset-panel surface that
    matches the dungeon's recessed teal-dark panel aesthetic. Focus state
    surfaces the teal shimmer border (same teal-glow as the focus-visible ring).

    The label (if provided) renders above the input using the dungeon gold token,
    matching nameplate titling conventions.

    Structural layers (outer → inner):
      1. .dungeon-input         root wrapper (no clip-path — inset surface style)
      2. <label>                optional label in dungeon gold (font-heading)
      3. .dungeon-input__well   inset panel surface — teal-dark fill, shimmer top edge
      4. <input>                native text input — fully transparent fill
  -->
  <div class="dungeon-input" :class="{ 'is-disabled': disabled }">
    <label v-if="label" class="dungeon-input__label" :for="inputId">
      {{ label }}
    </label>
    <div class="dungeon-input__well">
      <input
        :id="inputId"
        class="dungeon-input__native"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :disabled="disabled"
        v-bind="$attrs"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'

/**
 * Dungeon-styled text input wrapper that preserves native input semantics and
 * stable label/input association.
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string
    label?: string
    placeholder?: string
    maxlength?: number
    disabled?: boolean
    id?: string
  }>(),
  {
    modelValue: '',
    label: undefined,
    placeholder: undefined,
    maxlength: undefined,
    disabled: false,
    id: undefined,
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const generatedId = `dungeon-input-${getCurrentInstance()?.uid ?? 'fallback'}`
const inputId = computed(() => props.id ?? generatedId)
</script>

<style scoped>
/*
  Tokens from src/ui/prototypes/dungeon/dungeon-design-tokens.css (global).
  Surface uses --dng-panel-* tokens — the same teal-dark inset used inside
  AppFrame's content area. This grounds the input visually as a "console field".
*/


/* ─────────────────────────────────────────────────────────────
   ROOT WRAPPER
   ───────────────────────────────────────────────────────────── */
.dungeon-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.dungeon-input.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.dungeon-input.is-disabled .dungeon-input__native {
  pointer-events: none;
}


/* ─────────────────────────────────────────────────────────────
   LABEL — dungeon gold Cinzel heading style
   ───────────────────────────────────────────────────────────── */
.dungeon-input__label {
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  line-height: 1;
  user-select: none;
}


/* ─────────────────────────────────────────────────────────────
   INSET WELL — recessed dark panel surface
   ───────────────────────────────────────────────────────────── */
.dungeon-input__well {
  position: relative;

  background: linear-gradient(
    to bottom,
    var(--dng-panel-top)     0%,
    var(--dng-panel-surface) 20%,
    var(--dng-panel-bottom) 100%
  );

  border: 1px solid var(--dng-panel-border);
  border-radius: var(--radius-md);

  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.55),
    inset 0 1px 0  var(--dng-inset-shimmer);

  transition: box-shadow var(--transition-fast);
}

/* Focus ring: teal shimmer surfaces to top border */
.dungeon-input__well:focus-within {
  border-color: rgba(38, 212, 185, 0.55);
  box-shadow:
    inset 0 2px 8px rgba(0, 0, 0, 0.55),
    inset 0 1px 0  rgba(38, 212, 185, 0.35),
    0 0 0 1px rgba(38, 212, 185, 0.22);
}


/* ─────────────────────────────────────────────────────────────
   NATIVE INPUT — transparent fill, dungeon text styles
   ───────────────────────────────────────────────────────────── */
.dungeon-input__native {
  /* Reset browser chrome */
  appearance: none;
  -webkit-appearance: none;
  border: none;
  outline: none;
  background: transparent;
  display: block;
  width: 100%;

  padding: var(--space-md) var(--space-lg);

  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: var(--text-primary);
  line-height: var(--leading-normal);
}

.dungeon-input__native::placeholder {
  color: var(--dng-subtitle-warm);
  opacity: 0.7;
}
</style>
