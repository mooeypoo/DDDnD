<template>
  <!--
    One of a topic's own coupling rules (M4.19): while one score is below a
    line, gains to others are cut. Players see its name and description while
    it's active. Words come from the domain (describeCoupling).
  -->
  <div v-if="rule" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Coupling rule · yours</span>
        <h1 class="editor-title">{{ rule.name || 'Unnamed coupling rule' }}</h1>
      </div>
      <div class="head-actions">
        <button v-if="!confirming" type="button" class="button button-danger" @click="confirming = true">Delete</button>
      </div>
      <div v-if="confirming" class="head-confirm confirm" role="group" aria-label="Confirm">
        <p class="confirm-text">Delete “{{ rule.name || 'this rule' }}”? No score drags others down this way any more.</p>
        <button type="button" class="button button-quiet" @click="confirming = false">Keep it</button>
        <button type="button" class="button button-danger" @click="remove">Delete</button>
      </div>
    </div>

    <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>

    <section class="editor-section" aria-labelledby="coupling-words">
      <h2 id="coupling-words" class="editor-section-title">What players read while it's active</h2>
      <label class="field">Name
        <input data-field="name" :value="rule.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" />
        <span class="field-hint">What's happening: "Burnout Spiral", "Flying Blind".</span>
      </label>
      <label class="field">What it means, in a sentence
        <textarea data-field="description" :value="rule.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
        <span class="field-hint">"Exhausted on-call: improvements to uptime are less effective."</span>
      </label>
    </section>

    <section class="editor-section" aria-labelledby="coupling-how">
      <h2 id="coupling-how" class="editor-section-title">How it works</h2>
      <div class="inline-fields">
        <label class="field field-short">While this score
          <select data-field="trigger_score_id" :value="rule.trigger_score_id" @change="set({ trigger_score_id: ($event.target as HTMLSelectElement).value })">
            <option v-for="option in scoreOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
          </select>
        </label>
        <label class="field field-short">is below
          <input data-field="threshold" type="number" min="0" max="100" step="1" :value="rule.threshold" @change="setThreshold($event)" />
        </label>
        <label class="field field-short">gains are cut to (%)
          <input data-field="gain_multiplier" type="number" min="10" max="100" step="5" :value="Math.round(rule.gain_multiplier * 100)" @change="setPercent($event)" />
        </label>
      </div>
      <div class="choice-list" role="group" aria-label="Gains to these scores are cut">
        <span class="field-hint">Gains to these scores are cut:</span>
        <label v-for="option in scoreOptions" :key="option.id" class="choice">
          <input type="checkbox" :checked="rule.affected_score_ids.includes(option.id)" @change="toggle(option.id)" /> {{ option.name }}
        </label>
      </div>
      <p class="plain"><span class="plain-lead">In plain words:</span> {{ describeCoupling(rule, names) }}</p>
    </section>
  </div>
  <p v-else class="loading" role="status">That coupling rule isn't in this pack.</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { describeCoupling, putContent, removeOwnCoupling, toFillIn, type DraftPack } from '@/domains/authoring'
import type { CouplingRule } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'

interface Option { id: string; name: string }

const props = defineProps<{ draft: DraftPack; couplingId: string; scoreOptions: Option[] }>()
const emit = defineEmits<{ change: [draft: DraftPack]; removed: [] }>()

const limits = CONTENT_LIMITS
const confirming = ref(false)
watch(() => props.couplingId, () => {
  confirming.value = false
})

const rule = computed(() => props.draft.content.coupling_rules[props.couplingId] as CouplingRule | undefined)
const names = computed(() => ({ scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])) }))
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((item) => item.section === 'coupling_rules' && item.ref.id === props.couplingId)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of its own' : 'what it means, in a sentence'))
})

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function set(patch: Partial<CouplingRule>) {
  if (rule.value) emit('change', putContent(props.draft, 'coupling_rules', { ...rule.value, ...patch }))
}

function setThreshold(event: Event) {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  if (Number.isFinite(parsed)) set({ threshold: Math.min(100, Math.max(0, parsed)) })
}

/** As a percentage for people; the game's multiplier is 0.1 to 1. */
function setPercent(event: Event) {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  if (Number.isFinite(parsed)) set({ gain_multiplier: Math.min(100, Math.max(10, parsed)) / 100 })
}

/** The game needs at least one score to cut: the last one stays ticked. */
function toggle(id: string) {
  if (!rule.value) return
  const ids = rule.value.affected_score_ids.includes(id) ? rule.value.affected_score_ids.filter((other) => other !== id) : [...rule.value.affected_score_ids, id]
  if (ids.length > 0) set({ affected_score_ids: ids })
}

function remove() {
  emit('change', removeOwnCoupling(props.draft, props.couplingId))
  emit('removed')
}
</script>

<style scoped>
.inline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.field-short {
  max-width: 14rem;
}

.field-short select {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-ground);
  color: var(--forge-text-bright);
  font: inherit;
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

.loading {
  margin: 0;
}
</style>
