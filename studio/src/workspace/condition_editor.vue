<template>
  <!--
    "When [Budget] [is below] [40]": a reaction's condition, or when an
    event can happen. The words in the file are written from it (domain).
  -->
  <fieldset class="condition">
    <legend class="condition-legend">{{ legend }}</legend>
    <label class="condition-field">
      <span class="visually-hidden">Score</span>
      <select :value="condition.target_id" @change="emit('change', { target_id: selectValue($event), target_type: 'score' })">
        <option v-for="option in scoreOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
      </select>
    </label>
    <label class="condition-field">
      <span class="visually-hidden">Comparison</span>
      <select :value="condition.operator" @change="emit('change', { operator: selectValue($event) as NumericCondition['operator'] })">
        <option v-for="(words, operator) in CONDITION_WORDS" :key="operator" :value="operator">{{ words }}</option>
      </select>
    </label>
    <label class="condition-field condition-amount">
      <span class="visually-hidden">Value, {{ PLAY_RANGE.min }} to {{ PLAY_RANGE.max }}</span>
      <input type="number" :min="PLAY_RANGE.min" :max="PLAY_RANGE.max" step="1" :value="condition.value" @change="setValue($event)" />
    </label>
  </fieldset>
</template>

<script setup lang="ts">
import { CONDITION_WORDS, PLAY_RANGE } from '@/domains/authoring'
import type { NumericCondition } from '@/domains/content/model'

interface Option { id: string; name: string }

withDefaults(defineProps<{ condition: NumericCondition; scoreOptions: Option[]; legend?: string }>(), { legend: 'When' })
const emit = defineEmits<{ change: [patch: Partial<NumericCondition>] }>()

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function setValue(event: Event) {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  if (Number.isFinite(parsed)) emit('change', { value: Math.min(PLAY_RANGE.max, Math.max(PLAY_RANGE.min, parsed)) })
}
</script>

<style scoped>
.condition {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  border: none;
}

.condition-legend {
  float: left;
  margin-right: 0.25rem;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.condition-field select,
.condition-field input {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-panel);
  color: var(--forge-text-bright);
  font-family: var(--forge-font-body);
  font-size: 1rem;
}

.condition-amount input {
  width: 5.5rem;
}
</style>
