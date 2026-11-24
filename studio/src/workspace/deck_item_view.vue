<template>
  <div v-if="item" class="editor">
    <div class="editor-head">
      <span class="editor-kicker">{{ section === 'cards' ? 'Card' : 'Event' }} · {{ own ? 'yours' : 'from the game' }}</span>
      <h1 class="editor-title">{{ item.name || (section === 'cards' ? 'Untitled card' : 'Untitled event') }}</h1>
    </div>

    <!-- The game's own: read-only, with "make my own version" (D7) -->
    <template v-if="!own">
      <section class="editor-section" aria-labelledby="item-summary">
        <h2 id="item-summary" class="editor-section-title">What players read</h2>
        <p class="read-text">{{ item.description }}</p>
        <p v-if="item.flavor_text" class="read-flavor">{{ item.flavor_text }}</p>
      </section>
      <section class="editor-section" aria-labelledby="item-effects-read">
        <h2 id="item-effects-read" class="editor-section-title">{{ section === 'cards' ? 'When played' : 'When it happens' }}</h2>
        <p class="plain"><span class="plain-lead">In plain words:</span> {{ section === 'cards' ? 'playing this' : 'this' }} {{ plainWords }}.</p>
        <p v-if="aftershockNames.length" class="plain">Later (aftershock): {{ aftershockNames.join(', ') }}.</p>
        <p v-if="triggerText" class="plain">Only when: {{ triggerText }}.</p>
      </section>
      <div class="actions">
        <button type="button" class="button button-primary" @click="makeOwnVersion">Make my own version</button>
        <button type="button" class="button button-quiet" @click="takeOut">Take it out of the deck</button>
      </div>
      <p class="field-hint">Your version replaces it in your scenario, under a new name only your pack uses. The game's original stays as it is.</p>
    </template>

    <!-- The draft's own: the editor -->
    <template v-else>
      <section class="editor-section" aria-labelledby="item-words">
        <h2 id="item-words" class="editor-section-title">What players read</h2>
        <label class="field">Name
          <input :value="item.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" @change="settleId" />
        </label>
        <label class="field">What it does, in a sentence
          <textarea :value="item.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
          <span class="field-hint">{{ section === 'cards' ? 'The move the team makes: what someone would actually propose in a meeting.' : 'What happens to the team, without warning.' }}</span>
        </label>
        <label class="field">Flavor (optional)
          <input :value="item.flavor_text ?? ''" :maxlength="limits.text.flavor_text" @input="setFlavor(text($event))" />
        </label>
      </section>

      <section class="editor-section" aria-labelledby="item-effects">
        <h2 id="item-effects" class="editor-section-title">{{ section === 'cards' ? 'When played' : 'When it happens' }}</h2>
        <EffectsEditor
          :scoreChanges="item.score_changes"
          :stakeholderChanges="item.stakeholder_changes ?? []"
          :scoreOptions="scoreOptions"
          :stakeholderOptions="stakeholderOptions"
          @change="setEffects"
        />
        <p class="plain"><span class="plain-lead">In plain words:</span> {{ section === 'cards' ? 'playing this' : 'this' }} {{ plainWords }}. It nets <strong>{{ signed(net) }}</strong>.</p>
        <p v-if="section === 'cards' && helpsOnly" class="nudge" role="note">
          <strong>This card only helps.</strong> Every move in DDDnD trades something away. What does it cost: some budget,
          a tired team, slower delivery for a while? Without a cost, players will play nothing else.
        </p>
        <p v-if="section === 'cards'" class="field-hint">For calibration: the base game's cards net about +11 to +12 on average, aftershocks included, with at least one score going down.</p>
        <p v-if="aftershockNames.length" class="field-hint">Later (aftershock): {{ aftershockNames.join(', ') }}. Editing aftershocks arrives in a later release.</p>
        <p v-if="triggerText" class="field-hint">Only when: {{ triggerText }}. Editing conditions arrives in a later release.</p>
      </section>

      <section v-if="section === 'cards'" class="editor-section" aria-labelledby="item-limits">
        <h2 id="item-limits" class="editor-section-title">How often it can be played</h2>
        <div class="inline-fields">
          <label class="field field-short">Times per game
            <input type="number" :min="limits.numbers.usage_limit.min" :max="limits.numbers.usage_limit.max" placeholder="Any" :value="card?.usage_limit ?? ''" @change="setUsage($event)" />
            <span class="field-hint">Empty: no limit.</span>
          </label>
          <label class="field field-short">Rest turns after playing
            <input type="number" :min="limits.numbers.cooldown_turns.min" :max="limits.numbers.cooldown_turns.max" :value="card?.cooldown_turns ?? 0" @change="setCooldown($event)" />
          </label>
        </div>
      </section>

      <section v-else class="editor-section" aria-labelledby="item-weight">
        <h2 id="item-weight" class="editor-section-title">How often it happens</h2>
        <label class="field field-short">Weight
          <input type="number" min="1" :max="limits.numbers.occurrence_weight.max" :value="event?.occurrence_weight ?? 3" @change="setWeight($event)" />
          <span class="field-hint">Compared with the other events: 6 comes up twice as often as 3. The game's events use 1 to 6.</span>
        </label>
      </section>

      <div class="actions">
        <button v-if="!confirmingRemoval" type="button" class="button button-quiet" @click="confirmingRemoval = true">Delete it</button>
        <template v-else>
          <span class="confirm-text">Delete “{{ item.name || 'this' }}”? It leaves your deck.</span>
          <button type="button" class="button button-quiet" @click="confirmingRemoval = false">Keep it</button>
          <button type="button" class="button button-danger" @click="takeOut">Delete</button>
        </template>
      </div>
    </template>
  </div>
  <p v-else class="loading" role="status">Loading…</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { copyToEdit, describeEffects, isOwn, netScoreChange, onlyHelps, putContent, removeFromDeck, resolveRef, settleNewItemId, withEffects, withOptionalText, type DeckSection, type DraftPack } from '@/domains/authoring'
import type { Card, Event, ScoreChange, StakeholderChange, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { loadFirstParty } from '@studio/content/first_party'
import EffectsEditor from '@studio/workspace/effects_editor.vue'

interface Option { id: string; name: string }

const props = defineProps<{
  section: DeckSection
  itemRef: VersionRef
  draft: DraftPack
  scoreOptions: Option[]
  stakeholderOptions: Option[]
}>()
const emit = defineEmits<{ change: [draft: DraftPack]; select: [ref: VersionRef | null] }>()

const limits = CONTENT_LIMITS
const confirmingRemoval = ref(false)
const own = computed(() => isOwn(props.draft, props.section, props.itemRef))
const baseItem = ref<Card | Event | null>(null)
const aftershockNames = ref<string[]>([])

const item = computed<Card | Event | null>(() =>
  own.value ? (props.draft.content[props.section][props.itemRef.id] as Card | Event) : baseItem.value)
const card = computed(() => (props.section === 'cards' ? (item.value as Card | null) : null))
const event = computed(() => (props.section === 'events' ? (item.value as Event | null) : null))

watch(() => [props.section, props.itemRef.id, props.itemRef.version, own.value], async () => {
  const wanted = `${props.section}/${props.itemRef.id}-v${props.itemRef.version}`
  confirmingRemoval.value = false
  baseItem.value = null
  if (own.value) return
  const { base } = await loadFirstParty()
  const loaded = props.section === 'cards' ? await base.loadCard(props.itemRef) : await base.loadEvent(props.itemRef)
  // The view is reused across items (so naming one keeps focus): a slow load for the last one mustn't land on this one
  if (`${props.section}/${props.itemRef.id}-v${props.itemRef.version}` === wanted) baseItem.value = loaded
}, { immediate: true })

let aftershockLoad = 0
watch(() => item.value?.delayed_effect_refs, async (refs) => {
  const load = ++aftershockLoad
  if (!refs?.length) {
    aftershockNames.value = []
    return
  }
  const { base } = await loadFirstParty()
  const loaded = await Promise.all(refs.map(async (ref) => (await resolveRef(props.draft, 'delayed_effects', ref, base))?.entity.name ?? ref.id))
  if (load === aftershockLoad) aftershockNames.value = loaded
}, { immediate: true })

const names = computed(() => ({
  scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])),
  stakeholders: Object.fromEntries(props.stakeholderOptions.map((option) => [option.id, option.name])),
}))
const plainWords = computed(() => (item.value ? describeEffects(item.value, names.value) : ''))
const net = computed(() => (item.value ? netScoreChange(item.value) : 0))
const helpsOnly = computed(() => (item.value ? onlyHelps(item.value) : false))
const triggerText = computed(() => (props.section === 'events' ? (item.value as Event | null)?.trigger_condition_description ?? '' : ''))

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value)
}

function text(event: globalThis.Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function save(next: Card | Event) {
  emit('change', putContent(props.draft, props.section, next as never))
}

function set(fields: Partial<Card & Event>) {
  if (item.value) save({ ...item.value, ...fields } as Card | Event)
}

function setFlavor(value: string) {
  if (item.value) save(withOptionalText(item.value, 'flavor_text', value))
}

function setEffects(effects: { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }) {
  if (item.value) save(withEffects(item.value, effects))
}

function wholeNumber(event: globalThis.Event): number | null {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function setUsage(event: globalThis.Event) {
  if (!card.value) return
  const value = wholeNumber(event)
  const next: Card = { ...card.value }
  // No limit is written as no field, as in the game's own cards
  if (value === null) delete next.usage_limit
  else next.usage_limit = Math.min(limits.numbers.usage_limit.max, Math.max(limits.numbers.usage_limit.min, value))
  save(next)
}

function setCooldown(event: globalThis.Event) {
  const value = wholeNumber(event)
  if (card.value && value !== null) save({ ...card.value, cooldown_turns: Math.min(limits.numbers.cooldown_turns.max, Math.max(0, value)) })
}

function setWeight(event: globalThis.Event) {
  const value = wholeNumber(event)
  if (props.section === 'events' && item.value && value !== null) {
    save({ ...(item.value as Event), occurrence_weight: Math.min(limits.numbers.occurrence_weight.max, Math.max(1, value)) })
  }
}

function makeOwnVersion() {
  if (!baseItem.value) return
  const copied = copyToEdit(props.draft, props.section, baseItem.value as never)
  emit('change', copied.draft)
  emit('select', { id: copied.id, version: 1 })
}

/** Once a new card or event is named, it gets the id of its name (ids show in the pack's files). */
function settleId() {
  const settled = settleNewItemId(props.draft, props.section, props.itemRef.id)
  if (settled.id === props.itemRef.id) return
  emit('change', settled.draft)
  emit('select', { id: settled.id, version: props.itemRef.version })
}

function takeOut() {
  emit('change', removeFromDeck(props.draft, props.section, props.itemRef))
  emit('select', null)
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.editor-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.editor-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--forge-gold);
}

.read-text {
  margin: 0;
  color: var(--forge-text-bright);
}

.read-flavor {
  margin: 0;
  font-style: italic;
}

.plain {
  margin: 0;
  padding: 0.75rem 0.875rem;
  border-radius: 0.5rem;
  background: var(--forge-ground);
}

.plain-lead {
  color: var(--forge-text-secondary);
}

.plain strong {
  color: var(--forge-text-bright);
}

.nudge {
  margin: 0;
  padding: 0.75rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(251, 191, 36, 0.45);
  background: rgba(251, 191, 36, 0.07);
  color: var(--forge-text-bright);
}

.inline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.field-short {
  max-width: 13rem;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.confirm-text {
  color: var(--forge-text-bright);
}

.loading {
  margin: 0;
}
</style>
