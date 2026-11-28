<template>
  <div v-if="item" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">{{ section === 'cards' ? 'Card' : 'Event' }} · {{ own ? 'yours' : 'from the game' }}</span>
        <h1 class="editor-title">{{ item.name || (section === 'cards' ? 'Untitled card' : 'Untitled event') }}</h1>
      </div>
      <!-- The editor's actions, in the same place on every editor: change it, take it out, delete it -->
      <div v-if="!own" class="head-actions">
        <button type="button" class="button button-quiet" @click="makeOwnVersion">Make my own version</button>
        <button type="button" class="button button-quiet" @click="takeOut">Take out of this pack</button>
      </div>
      <div v-else class="head-actions">
        <button v-if="!confirmingRemoval" type="button" class="button button-danger" @click="confirmingRemoval = true">Delete</button>
      </div>
      <div v-if="own && confirmingRemoval" class="head-confirm confirm" role="group" aria-label="Confirm">
        <span class="confirm-text">Delete “{{ item.name || 'this' }}”? It's gone from your pack.</span>
        <button type="button" class="button button-quiet" @click="confirmingRemoval = false">Keep it</button>
        <button type="button" class="button button-danger" @click="takeOut">Delete</button>
      </div>
    </div>

    <!-- The game's own: read-only, with "make my own version" (D7) -->
    <template v-if="!own">
      <div class="locked-note" role="note">
        <p>It plays exactly as in DDDnD. To change it, make your own version.</p>
        <details class="why-more">
          <summary>Why?</summary>
          <p>The game's cards and events are shared by every pack, so they can't be edited here. Your version replaces this one in your scenario, under a new name only your pack uses. The game's original stays as it is.</p>
        </details>
      </div>
      <section class="editor-section" aria-labelledby="item-summary">
        <h2 id="item-summary" class="editor-section-title">What players read</h2>
        <p class="read-text">{{ item.description }}</p>
        <p v-if="item.flavor_text" class="read-flavor">{{ item.flavor_text }}</p>
      </section>
      <section class="editor-section" aria-labelledby="item-effects-read">
        <h2 id="item-effects-read" class="editor-section-title">{{ section === 'cards' ? 'When played' : 'When it happens' }}</h2>
        <p class="plain"><span class="plain-lead">In plain words:</span> {{ plainWords }}.</p>
        <p v-for="(entry, index) in aftershocks" :key="index" class="plain">
          <span class="plain-lead">Aftershock{{ entry.entity ? `, ${landingWords(entry.entity)}` : '' }}:</span>
          {{ entry.entity ? `${entry.entity.name}: ${describeEffects(entry.entity, names)}` : '…' }}.
        </p>
        <p v-if="conditionWords" class="plain"><span class="plain-lead">Only when:</span> {{ conditionWords }}.</p>
      </section>
      <section class="editor-section" :aria-labelledby="section === 'cards' ? 'item-limits-read' : 'item-weight-read'">
        <template v-if="section === 'cards'">
          <h2 id="item-limits-read" class="editor-section-title">How often it can be played</h2>
          <p class="read-text">{{ card?.usage_limit ? `${card.usage_limit} times a game` : 'No limit' }} · {{ card?.cooldown_turns ? `rests ${card.cooldown_turns} ${card.cooldown_turns === 1 ? 'turn' : 'turns'} after playing` : 'no rest after playing' }}</p>
        </template>
        <template v-else>
          <h2 id="item-weight-read" class="editor-section-title">How often it happens</h2>
          <p class="read-text">Weight {{ event?.occurrence_weight ?? 3 }}, on the game's scale of 1 to 6.</p>
        </template>
      </section>
    </template>

    <!-- The draft's own: the editor -->
    <template v-else>
      <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>
      <section class="editor-section" aria-labelledby="item-words">
        <h2 id="item-words" class="editor-section-title">What players read</h2>
        <label class="field">Name
          <input data-field="name" :value="item.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" @change="settleId" />
        </label>
        <label class="field">What it does, in a sentence
          <textarea data-field="description" :value="item.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
          <span class="field-hint">{{ section === 'cards' ? 'The move the team makes: what someone would actually propose in a meeting.' : 'What happens to the team, without warning.' }}</span>
        </label>
        <label class="field">Flavor (optional)
          <input data-field="flavor_text" :value="item.flavor_text ?? ''" :maxlength="limits.text.flavor_text" @input="setFlavor(text($event))" />
        </label>
      </section>

      <section class="editor-section" aria-labelledby="item-effects">
        <h2 id="item-effects" class="editor-section-title">{{ section === 'cards' ? 'When played' : 'When it happens' }}</h2>
        <EffectsEditor
          :scoreChanges="item.score_changes"
          :stakeholderChanges="item.stakeholder_changes ?? []"
          :scoreOptions="scoreOptions"
          :stakeholderOptions="stakeholderOptions"
          :gameMembers="gameMembers"
          :seatsLeft="seatsLeft"
          :canCreateScore="canAddScore(draft)"
          @createScore="(name) => connect(connectNewScore(draft, section, itemRef.id, name)?.draft)"
          @change="setEffects"
          @createMember="(name) => connect(connectNewMember(draft, section, itemRef.id, name)?.draft)"
          @seatMember="(memberRef) => connect(connectGameMember(draft, section, itemRef.id, memberRef))"
        />
        <p class="plain">
          <span class="plain-lead">In plain words:</span> {{ plainWords }}.
          It nets <strong>{{ signed(net) }}</strong><template v-if="aftershocks.length">, or <strong>{{ signed(netAll) }}</strong> with its aftershocks</template>.
        </p>
        <!-- Balance hints (D3): the domain's, about this card or event, and its deck beside the game's -->
        <p v-for="hint in itemHints" :key="hint.title" class="nudge" role="note"><strong>{{ hint.title }}</strong> {{ hint.text }}</p>
        <p v-if="deckLine" class="field-hint">{{ deckLine }}</p>
      </section>

      <AftershockEditor
        :draft="draft"
        :section="section"
        :itemId="itemRef.id"
        :aftershocks="aftershocks"
        :scoreOptions="scoreOptions"
        :stakeholderOptions="stakeholderOptions"
        :gameMembers="gameMembers"
        :seatsLeft="seatsLeft"
        @change="(next) => emit('change', next)"
        @settle="(next) => emit('settle', next)"
      />

      <section v-if="section === 'events' && event" class="editor-section" aria-labelledby="item-when">
        <h2 id="item-when" class="editor-section-title">When it can happen</h2>
        <div class="choice-pair" role="radiogroup" aria-labelledby="item-when">
          <label class="choice"><input type="radio" name="when" :checked="!event.trigger_condition" @change="setWhen(false)" /> Any turn</label>
          <label class="choice"><input type="radio" name="when" :checked="!!event.trigger_condition" :disabled="scoreOptions.length === 0" @change="setWhen(true)" /> Only while a score is past a line</label>
        </div>
        <template v-if="event.trigger_condition">
          <ConditionEditor :condition="event.trigger_condition" :scoreOptions="scoreOptions" legend="Only while" @change="setCondition" />
          <p class="plain"><span class="plain-lead">In plain words:</span> it can only happen while {{ conditionWords }}.</p>
        </template>
        <p class="field-hint">The game's events use this for pressure that builds: an outage only once trust is low, a reorg only when things go well.</p>
      </section>

      <section v-if="section === 'cards'" class="editor-section" aria-labelledby="item-limits">
        <h2 id="item-limits" class="editor-section-title">How often it can be played</h2>
        <div class="inline-fields">
          <label class="field field-short">Times per game
            <input data-field="usage_limit" type="number" :min="limits.numbers.usage_limit.min" :max="limits.numbers.usage_limit.max" placeholder="No limit" :value="card?.usage_limit ?? ''" @change="setUsage($event)" />
          </label>
          <label class="field field-short">Rest turns after playing
            <input data-field="cooldown_turns" type="number" :min="limits.numbers.cooldown_turns.min" :max="limits.numbers.cooldown_turns.max" :value="card?.cooldown_turns ?? 0" @change="setCooldown($event)" />
          </label>
        </div>
      </section>

      <section v-else class="editor-section" aria-labelledby="item-weight">
        <h2 id="item-weight" class="editor-section-title">How often it happens</h2>
        <label class="field field-short">Weight
          <input data-field="occurrence_weight" type="number" min="1" :max="limits.numbers.occurrence_weight.max" :value="event?.occurrence_weight ?? 3" aria-describedby="weight-hint" @change="setWeight($event)" />
        </label>
        <p id="weight-hint" class="field-hint">Compared with the other events: 6 comes up twice as often as 3. The game's events use 1 to 6.</p>
      </section>

    </template>
  </div>
  <p v-else class="loading" role="status">Loading…</p>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import {
  copyToEdit,
  describeCondition,
  canAddScore,
  connectGameMember,
  connectNewScore,
  connectNewMember,
  describeEffects,
  landingWords,
  toFillIn,
  isOwn,
  netScoreChange,
  netWithAftershocks,
  deckBalanceWords,
  deckHolding,
  describeBalanceHint,
  hintsAbout,
  ownEntity,
  putContent,
  removeFromDeck,
  resolveRef,
  setEventCondition,
  settleNewItemId,
  startingCondition,
  withEffects,
  withOptionalText,
  type BalanceHint,
  type DeckBalance,
  type DeckSection,
  type DraftPack,
  type GameBalance,
} from '@/domains/authoring'
import type { Card, DelayedEffect, Event, NumericCondition, ScoreChange, StakeholderChange, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { loadFirstParty } from '@studio/content/first_party'
import AftershockEditor, { type AftershockEntry } from '@studio/workspace/aftershock_editor.vue'
import ConditionEditor from '@studio/workspace/condition_editor.vue'
import EffectsEditor from '@studio/workspace/effects_editor.vue'

interface Option { id: string; name: string }

const props = defineProps<{
  section: DeckSection
  itemRef: VersionRef
  draft: DraftPack
  scoreOptions: Option[]
  stakeholderOptions: Option[]
  /** The game's members who aren't seated, and how many seats are free (slice 3b). */
  gameMembers: Array<{ ref: VersionRef; name: string }>
  seatsLeft: number
  /** The last check's balance numbers (D3); absent until a check has run. */
  balance?: { decks: DeckBalance[]; game: GameBalance | null; hints: BalanceHint[] }
}>()
/** `settle`: a new item's id follows its name, part of naming it rather than an edit of its own (undo, M4.24). */
const emit = defineEmits<{ change: [draft: DraftPack]; settle: [draft: DraftPack]; select: [ref: VersionRef | null] }>()

/** A connection made from the picker (the domain's connectNewMember / connectGameMember); null when there was no seat. */
function connect(next: DraftPack | null | undefined) {
  if (next) emit('change', next)
}

const limits = CONTENT_LIMITS
const confirmingRemoval = ref(false)
const own = computed(() => isOwn(props.draft, props.section, props.itemRef))
const baseItem = ref<Card | Event | null>(null)

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

/** The game's aftershocks this item names, loaded once each; the draft's own are read live. */
const gameAftershocks = reactive(new Map<string, DelayedEffect>())
const refKey = (ref: VersionRef) => `${ref.id}-v${ref.version}`
watch(() => item.value?.delayed_effect_refs, async (refs) => {
  const missing = (refs ?? []).filter((ref) => !ownEntity(props.draft, 'delayed_effects', ref) && !gameAftershocks.has(refKey(ref)))
  if (!missing.length) return
  const { base } = await loadFirstParty()
  for (const ref of missing) {
    const found = await resolveRef(props.draft, 'delayed_effects', ref, base)
    if (found && !found.own) gameAftershocks.set(refKey(ref), found.entity)
  }
}, { immediate: true })

const aftershocks = computed<AftershockEntry[]>(() => (item.value?.delayed_effect_refs ?? []).map((ref) => {
  const own = ownEntity(props.draft, 'delayed_effects', ref)
  return { ref, own: own !== null, entity: own ?? gameAftershocks.get(refKey(ref)) ?? null }
}))

const names = computed(() => ({
  scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])),
  stakeholders: Object.fromEntries(props.stakeholderOptions.map((option) => [option.id, option.name])),
}))
/** What the domain says this item still needs, in words (toFillIn). */
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((entry) => entry.section === props.section && entry.ref.id === props.itemRef.id)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of its own' : 'what it does, in a sentence'))
})

const plainWords = computed(() => (item.value ? describeEffects(item.value, names.value) : ''))
const net = computed(() => (item.value ? netScoreChange(item.value) : 0))
const netAll = computed(() => (item.value ? netWithAftershocks(item.value, aftershocks.value.flatMap((entry) => (entry.entity ? [entry.entity] : []))) : 0))
/** What's worth a look about this item, and its deck's numbers beside the game's, in the domain's words. */
const itemHints = computed(() => hintsAbout(props.balance?.hints ?? [], props.section, props.itemRef).map((hint) => describeBalanceHint(hint, props.draft)))
const deckLine = computed(() => {
  const deck = props.balance ? deckHolding(props.draft, props.balance.decks, props.section, props.itemRef) : null
  if (!deck) return ''
  return deckBalanceWords(deck, props.balance?.game ?? null)[props.section]
})
/** When the event can happen, in plain words, from its condition (not its stored text). */
const conditionWords = computed(() => {
  const condition = props.section === 'events' ? (item.value as Event | null)?.trigger_condition : undefined
  return condition ? describeCondition(condition, names.value.scores[condition.target_id] ?? condition.target_id) : ''
})

function setWhen(onlyWhen: boolean) {
  const score = props.scoreOptions[0]
  if (onlyWhen && !score) return
  emit('change', setEventCondition(props.draft, props.itemRef.id, onlyWhen ? startingCondition(score.id) : null, score?.name ?? ''))
}

function setCondition(patch: Partial<NumericCondition>) {
  const current = (item.value as Event | null)?.trigger_condition
  if (!current) return
  const condition = { ...current, ...patch }
  emit('change', setEventCondition(props.draft, props.itemRef.id, condition, names.value.scores[condition.target_id] ?? condition.target_id))
}

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
  emit('settle', settled.draft)
  emit('select', { id: settled.id, version: props.itemRef.version })
}

function takeOut() {
  emit('change', removeFromDeck(props.draft, props.section, props.itemRef))
  emit('select', null)
}
</script>

<style scoped>
.choice-pair {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
}

.choice {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  color: var(--forge-text-bright);
  cursor: pointer;
}

.choice input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--forge-gold);
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

.inline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.field-short {
  max-width: 13rem;
}

.loading {
  margin: 0;
}
</style>
