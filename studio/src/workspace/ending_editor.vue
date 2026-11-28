<template>
  <!--
    One of a topic's own endings (M4.18): what players read at the end, when
    it's chosen, and where it sits in the order the game tries endings. The
    rules (order, the fallback, plain words) are the domain's (endings.ts).
  -->
  <div v-if="ending" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Ending · {{ ownWord() }} · tried {{ position }} of {{ ordered.length }}</span>
        <h1 class="editor-title">{{ ending.name || 'Unnamed ending' }}</h1>
      </div>
      <div class="head-actions">
        <button v-if="!confirming" type="button" class="button button-danger" :disabled="!deletion.ok" @click="confirming = true">Delete</button>
      </div>
      <p v-if="!deletion.ok" class="field-hint head-confirm">{{ deletion.reason }}</p>
      <div v-if="confirming" class="head-confirm confirm" role="group" aria-label="Confirm">
        <p class="confirm-text">Delete “{{ ending.name || 'this ending' }}”? Runs that would have ended here end on the next one that fits.</p>
        <button type="button" class="button button-quiet" @click="confirming = false">Keep it</button>
        <button type="button" class="button button-danger" @click="remove">Delete</button>
      </div>
    </div>

    <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>

    <section class="editor-section" aria-labelledby="ending-words">
      <h2 id="ending-words" class="editor-section-title">What players read at the end</h2>
      <label class="field">Name
        <input data-field="name" :value="ending.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" />
        <span class="field-hint">What kind of leader the player was: "The Pager Paladin", "Firefighter".</span>
      </label>
      <label class="field">What it means, in a sentence
        <textarea data-field="description" :value="ending.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
      </label>
      <label class="field">Flavor (optional)
        <input data-field="flavor_text" :value="ending.flavor_text ?? ''" :maxlength="limits.text.flavor_text" @input="setFlavor(text($event))" />
      </label>
    </section>

    <section class="editor-section" aria-labelledby="ending-when">
      <h2 id="ending-when" class="editor-section-title">When it's chosen</h2>
      <template v-if="fallback">
        <p class="plain"><span class="plain-lead">In plain words:</span> {{ words }}.</p>
        <p class="field-hint">
          This is the fallback: it has no conditions, so it's tried last and every run that no other ending fits ends here.
          Every scenario needs exactly one. To end particular runs somewhere else, make another ending with conditions.
        </p>
      </template>
      <template v-else>
        <p class="field-hint">All of these must hold at the end of the run.</p>
        <EndingConditionEditor
          v-for="(condition, index) in ending.criteria!.when"
          :key="index"
          :condition="condition"
          :index="index"
          :draft="draft"
          :scoreOptions="scoreOptions"
          :memberOptions="memberOptions"
          :removable="ending.criteria!.when.length > 1"
          @change="(next) => setCondition(index, next)"
          @remove="removeCondition(index)"
        />
        <p v-if="ending.criteria!.when.length === 1" class="field-hint">An ending needs at least one condition; the fallback already catches every other run.</p>
        <button v-if="ending.criteria!.when.length < maxConditions" type="button" class="button button-quiet add" @click="addCondition">+ Add a condition</button>
        <p class="plain"><span class="plain-lead">In plain words:</span> chosen {{ words }}.</p>
      </template>
    </section>

    <section class="editor-section" aria-labelledby="ending-order">
      <h2 id="ending-order" class="editor-section-title">When it's tried</h2>
      <p class="field-hint">
        The game tries endings in order and picks the first that fits, so put the most particular ones first.
        <button type="button" class="link-button" @click="emit('open', { kind: 'endings' })">See them all in order</button>
      </p>
      <div v-if="!fallback" class="order-actions">
        <button type="button" class="button button-quiet" :disabled="position === 1" @click="move('earlier')">Try it earlier</button>
        <button type="button" class="button button-quiet" :disabled="position >= ordered.length - 1" @click="move('later')">Try it later</button>
      </div>
      <p v-else class="field-hint">It's the fallback, so it's always tried last.</p>
    </section>
  </div>
  <p v-else class="loading" role="status">That ending isn't in this pack.</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import {
  CONDITIONS_PER_ENDING,
  describeEnding,
  endingDeletion,
  endingsInOrder,
  isFallback,
  moveEnding,
  putContent,
  removeOwnEnding,
  setEndingConditions,
  startingEndingCondition,
  toFillIn,
  withOptionalText,
  type DraftPack,
} from '@/domains/authoring'
import type { EndingCondition, OutcomeArchetype } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import EndingConditionEditor from '@studio/workspace/ending_condition_editor.vue'
import type { Selection } from '@studio/workspace/selection'
import { ownWord } from '@studio/state/studio_state'

interface Option { id: string; name: string }

const props = defineProps<{ draft: DraftPack; endingId: string; scoreOptions: Option[]; memberOptions: Option[] }>()
const emit = defineEmits<{ change: [draft: DraftPack]; open: [selection: Selection]; removed: [] }>()

const limits = CONTENT_LIMITS
const maxConditions = CONDITIONS_PER_ENDING
const confirming = ref(false)
watch(() => props.endingId, () => {
  confirming.value = false
})

const ending = computed(() => props.draft.content.outcome_archetypes[props.endingId] as OutcomeArchetype | undefined)
const ordered = computed(() => endingsInOrder(props.draft))
const position = computed(() => ordered.value.findIndex((other) => other.id === props.endingId) + 1)
const fallback = computed(() => (ending.value ? isFallback(ending.value) : false))
const deletion = computed(() => endingDeletion(props.draft, props.endingId))
const names = computed(() => ({
  scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])),
  stakeholders: Object.fromEntries(props.memberOptions.map((option) => [option.id, option.name])),
}))
const words = computed(() => (ending.value ? describeEnding(ending.value, names.value) : ''))

/** What the domain says it still needs, in words (toFillIn). */
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((item) => item.section === 'outcome_archetypes' && item.ref.id === props.endingId)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of its own' : 'what it means, in a sentence'))
})

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function set(patch: Partial<OutcomeArchetype>) {
  if (!ending.value) return
  emit('change', putContent(props.draft, 'outcome_archetypes', { ...ending.value, ...patch }))
}

function setFlavor(value: string) {
  if (!ending.value) return
  emit('change', putContent(props.draft, 'outcome_archetypes', withOptionalText(ending.value, 'flavor_text', value)))
}

function conditions(): EndingCondition[] {
  return [...(ending.value?.criteria?.when ?? [])]
}

function setCondition(index: number, next: EndingCondition) {
  const when = conditions()
  when[index] = next
  emit('change', setEndingConditions(props.draft, props.endingId, when))
}

function removeCondition(index: number) {
  emit('change', setEndingConditions(props.draft, props.endingId, conditions().filter((_, i) => i !== index)))
}

function addCondition() {
  emit('change', setEndingConditions(props.draft, props.endingId, [...conditions(), startingEndingCondition(props.draft)]))
}

function move(direction: 'earlier' | 'later') {
  emit('change', moveEnding(props.draft, props.endingId, direction))
}

function remove() {
  emit('change', removeOwnEnding(props.draft, props.endingId))
  emit('removed')
}
</script>

<style scoped>
.add {
  align-self: flex-start;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
</style>
