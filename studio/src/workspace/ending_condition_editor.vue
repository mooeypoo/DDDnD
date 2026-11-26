<template>
  <!--
    One thing an ending checks at the end of a run (M4.18): what it measures,
    of which scores or members, a comparison and a number. The plain words
    beside it come from the domain (describeEndingCondition), so they always
    agree with what the game reads.
  -->
  <fieldset class="ending-condition">
    <legend class="visually-hidden">Condition {{ index + 1 }}</legend>
    <div class="condition-row">
      <label class="field">Measure
        <select :value="condition.measure" @change="switchMeasure(($event.target as HTMLSelectElement).value as EndingCondition['measure'])">
          <option v-for="(words, measure) in ENDING_MEASURES" :key="measure" :value="measure">{{ words }}</option>
        </select>
      </label>

      <label v-if="condition.measure === 'final_score'" class="field">Score
        <select :value="condition.score_id" @change="patch({ score_id: ($event.target as HTMLSelectElement).value })">
          <option v-for="option in scoreOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
        </select>
      </label>

      <label class="field field-op">{{ condition.measure === 'final_score' ? 'Ends' : 'By' }}
        <select :value="condition.operator" @change="patch({ operator: ($event.target as HTMLSelectElement).value as EndingOperator })">
          <option v-for="(words, operator) in operatorWords" :key="operator" :value="operator">{{ words }}</option>
        </select>
      </label>

      <label class="field field-value">Value
        <input type="number" :step="condition.measure === 'pressure_per_turn' ? 0.1 : 1" :min="-1000" :max="1000" :value="condition.value" @change="setValue($event)" />
      </label>

      <button type="button" class="link-button remove" :aria-label="`Remove condition ${index + 1}`" @click="$emit('remove')">Remove</button>
    </div>

    <div v-if="condition.measure === 'score_change'" class="choice-list" role="group" aria-label="Which scores, added together">
      <span class="field-hint">Which scores, added together:</span>
      <label v-for="option in scoreOptions" :key="option.id" class="choice">
        <input type="checkbox" :checked="condition.score_ids.includes(option.id)" @change="toggleScore(option.id)" /> {{ option.name }}
      </label>
    </div>
    <div v-if="condition.measure === 'stakeholder_change'" class="choice-list" role="group" aria-label="Whose satisfaction">
      <span class="field-hint">Whose satisfaction (none ticked: the whole council):</span>
      <label v-for="option in memberOptions" :key="option.id" class="choice">
        <input type="checkbox" :checked="condition.stakeholder_ids?.includes(option.id) ?? false" @change="toggleMember(option.id)" /> {{ option.name }}
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { ENDING_MEASURES, endingConditionOf, endingOperatorChoices, type DraftPack } from '@/domains/authoring'
import type { EndingCondition, EndingOperator } from '@/domains/content/model'

interface Option { id: string; name: string }

const props = defineProps<{ condition: EndingCondition; index: number; draft: DraftPack; scoreOptions: Option[]; memberOptions: Option[] }>()
const emit = defineEmits<{ change: [condition: EndingCondition]; remove: [] }>()

/** The comparison, in the words that fit what's measured (the domain's endingOperatorChoices). */
const operatorWords = computed(() => endingOperatorChoices(props.condition.measure))

function patch(changes: Partial<EndingCondition>) {
  emit('change', { ...props.condition, ...changes } as EndingCondition)
}

/** Another kind of measure starts from the domain's blank for it, keeping the comparison. */
function switchMeasure(measure: EndingCondition['measure']) {
  emit('change', { ...endingConditionOf(measure, props.draft), operator: props.condition.operator })
}

function setValue(event: Event) {
  const raw = Number.parseFloat((event.target as HTMLInputElement).value)
  if (!Number.isFinite(raw)) return
  const value = Math.min(1000, Math.max(-1000, props.condition.measure === 'pressure_per_turn' ? Math.round(raw * 10) / 10 : Math.round(raw)))
  patch({ value })
}

function toggleScore(id: string) {
  if (props.condition.measure !== 'score_change') return
  const ids = props.condition.score_ids.includes(id) ? props.condition.score_ids.filter((other) => other !== id) : [...props.condition.score_ids, id]
  // The game needs at least one: keep the last one ticked
  if (ids.length > 0) patch({ score_ids: ids })
}

function toggleMember(id: string) {
  if (props.condition.measure !== 'stakeholder_change') return
  const current = props.condition.stakeholder_ids ?? []
  const ids = current.includes(id) ? current.filter((other) => other !== id) : [...current, id]
  if (ids.length === 0) {
    const { stakeholder_ids: _all, ...everyone } = props.condition
    emit('change', everyone)
  } else {
    patch({ stakeholder_ids: ids })
  }
}
</script>

<style scoped>
.ending-condition {
  margin: 0;
  padding: 0.75rem 0.875rem;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-ground);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.condition-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.625rem;
}

.condition-row select,
.condition-row input {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-panel);
  color: var(--forge-text-bright);
  font: inherit;
}

.field-value input {
  width: 6rem;
}

.remove {
  margin-left: auto;
  min-height: 2.5rem;
}

.link-button {
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-text-secondary);
  font: inherit;
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}

.choice-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 1rem;
}

.choice {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--forge-text-bright);
}
</style>
