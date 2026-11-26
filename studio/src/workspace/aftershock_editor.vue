<template>
  <!--
    Aftershocks on one of the draft's own cards or events (M4.6). The game's
    are shared between its cards, so they're shown as they are, with "make my
    own version" for this card only; the draft's own are edited here.
  -->
  <section class="editor-section" aria-labelledby="aftershocks-title">
    <h2 id="aftershocks-title" class="editor-section-title">
      Aftershocks <span class="count">{{ aftershocks.length }} of {{ AFTERSHOCKS_PER_ITEM }}</span>
    </h2>
    <p class="field-hint">
      Something that follows {{ section === 'cards' ? 'playing this card' : 'this event' }} some turns later, when the room
      has forgotten why. The game's cards use them for slow payoffs and slow costs.
    </p>

    <!-- Keyed by place, not id: naming one settles its id, and the fields must stay put (focus) -->
    <article v-for="(entry, index) in aftershocks" :key="index" class="aftershock" :aria-labelledby="`aftershock-${index}`">
      <template v-if="entry.entity">
        <div class="aftershock-head">
          <h3 :id="`aftershock-${index}`" class="aftershock-title">{{ entry.entity.name || 'Unnamed aftershock' }}</h3>
          <span class="mark" :class="entry.own ? 'mark-own' : 'mark-game'">{{ entry.own ? 'yours' : 'from the game' }}</span>
        </div>

        <template v-if="entry.own">
          <label class="field">Name
            <input :value="entry.entity.name" :maxlength="limits.text.name" @input="set(entry.entity, { name: text($event) })" @change="settle(entry.entity.id)" />
          </label>
          <label class="field">What players read when it lands
            <input :value="entry.entity.description" :maxlength="limits.text.description" @input="set(entry.entity, { description: text($event) })" />
          </label>
          <label class="field field-short">Turns later
            <input
              type="number"
              :min="limits.numbers.turns_until_resolution.min"
              :max="limits.numbers.turns_until_resolution.max"
              :value="entry.entity.turns_until_resolution"
              @change="setTurns(entry.entity, $event)"
            />
            <span class="field-hint">The game's land 1 to 3 turns later.</span>
          </label>
          <EffectsEditor
            :scoreChanges="entry.entity.score_changes"
            :stakeholderChanges="entry.entity.stakeholder_changes ?? []"
            :scoreOptions="scoreOptions"
            :stakeholderOptions="stakeholderOptions"
            @change="(effects) => set(entry.entity!, effects, true)"
          />
          <p class="plain"><span class="plain-lead">In plain words:</span> {{ landingWords(entry.entity) }}, {{ describe(entry.entity) }}.</p>
          <p v-if="alsoOn(entry).length" class="field-hint">Also on {{ alsoOn(entry).join(', ') }}: changing it changes it there too.</p>
        </template>

        <template v-else>
          <p class="plain"><span class="plain-lead">In plain words:</span> {{ landingWords(entry.entity) }}, {{ describe(entry.entity) }}.</p>
          <p class="field-hint">The game's cards share it, so it can't be changed here. Your own version replaces it on this {{ section === 'cards' ? 'card' : 'event' }} only.</p>
        </template>

        <div class="aftershock-actions">
          <button v-if="!entry.own" type="button" class="button button-quiet" @click="makeOwn(entry.entity)">Make my own version</button>
          <button type="button" class="link-button" @click="takeOff(entry.ref)">Remove from this {{ section === 'cards' ? 'card' : 'event' }}</button>
        </div>
      </template>
      <p v-else class="loading" role="status">Loading…</p>
    </article>

    <div v-if="!full" class="add-row">
      <button type="button" class="button button-quiet" @click="addNew">+ New aftershock</button>
      <label class="field add-game">
        <span class="visually-hidden">One of the game's aftershocks</span>
        <select v-model="chosen" :disabled="!gameChoices.length">
          <option value="">{{ gameChoices.length ? 'Or one of the game\'s…' : 'Loading the game\'s…' }}</option>
          <option v-for="choice in gameChoices" :key="choice.key" :value="choice.key">{{ choice.name }}</option>
        </select>
      </label>
      <button type="button" class="button button-quiet" :disabled="!chosen" @click="addGame">Add it</button>
    </div>
    <p v-else class="field-hint">That's the most the game allows on one {{ section === 'cards' ? 'card' : 'event' }}.</p>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import {
  addNewAftershock,
  AFTERSHOCKS_PER_ITEM,
  aftershockUsers,
  attachAftershock,
  copyAftershockToEdit,
  describeEffects,
  detachAftershock,
  landingWords,
  putContent,
  settleNewAftershockId,
  withEffects,
  type DeckSection,
  type DraftPack,
} from '@/domains/authoring'
import type { DelayedEffect, ScoreChange, StakeholderChange, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { listBaseRefs, loadFirstParty } from '@studio/content/first_party'
import EffectsEditor from '@studio/workspace/effects_editor.vue'

interface Option { id: string; name: string }
export interface AftershockEntry { ref: VersionRef; own: boolean; entity: DelayedEffect | null }

const props = defineProps<{
  draft: DraftPack
  section: DeckSection
  itemId: string
  aftershocks: AftershockEntry[]
  scoreOptions: Option[]
  stakeholderOptions: Option[]
}>()
const emit = defineEmits<{ change: [draft: DraftPack] }>()

const limits = CONTENT_LIMITS
const full = computed(() => props.aftershocks.length >= AFTERSHOCKS_PER_ITEM)
const names = computed(() => ({
  scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])),
  stakeholders: Object.fromEntries(props.stakeholderOptions.map((option) => [option.id, option.name])),
}))

/** The game's aftershocks, by name, for "Or one of the game's…". */
const gameAftershocks = ref<Array<{ key: string; ref: VersionRef; name: string }>>([])
void (async () => {
  const [{ base }, refs] = await Promise.all([loadFirstParty(), listBaseRefs('delayed_effects')])
  const loaded = await Promise.all(refs.map(async (ref) => ({ key: `${ref.id}-v${ref.version}`, ref, name: (await base.loadDelayedEffect(ref)).name })))
  gameAftershocks.value = loaded.sort((a, b) => a.name.localeCompare(b.name))
})()
const gameChoices = computed(() => {
  const attached = new Set(props.aftershocks.map((entry) => `${entry.ref.id}-v${entry.ref.version}`))
  return gameAftershocks.value.filter((choice) => !attached.has(choice.key))
})
const chosen = ref('')
watch(() => props.itemId, () => {
  chosen.value = ''
})

function text(event: Event): string {
  return (event.target as HTMLInputElement).value
}

function describe(effect: DelayedEffect): string {
  return describeEffects(effect, names.value)
}

/** The draft's other cards and events with this aftershock, by name. */
function alsoOn(entry: AftershockEntry): string[] {
  return aftershockUsers(props.draft, entry.ref).filter((user) => user.id !== props.itemId).map((user) => user.name || 'an unnamed one')
}

function set(effect: DelayedEffect, fields: Partial<DelayedEffect> | { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }, effects = false) {
  const next = effects
    ? withEffects(effect, fields as { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] })
    : { ...effect, ...fields }
  emit('change', putContent(props.draft, 'delayed_effects', next as DelayedEffect))
}

function setTurns(effect: DelayedEffect, event: Event) {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  const range = limits.numbers.turns_until_resolution
  if (Number.isFinite(parsed)) set(effect, { turns_until_resolution: Math.min(range.max, Math.max(range.min, parsed)) })
}

function settle(id: string) {
  const settled = settleNewAftershockId(props.draft, id)
  if (settled.id !== id) emit('change', settled.draft)
}

async function addNew() {
  emit('change', addNewAftershock(props.draft, props.section, props.itemId).draft)
  await nextTick()
  const input = document.querySelector<HTMLInputElement>('.aftershock:last-of-type .field input')
  input?.focus()
  input?.select()
}

function addGame() {
  const choice = gameAftershocks.value.find((candidate) => candidate.key === chosen.value)
  if (!choice) return
  emit('change', attachAftershock(props.draft, props.section, props.itemId, choice.ref))
  chosen.value = ''
}

function makeOwn(effect: DelayedEffect) {
  emit('change', copyAftershockToEdit(props.draft, props.section, props.itemId, effect).draft)
}

function takeOff(ref: VersionRef) {
  emit('change', detachAftershock(props.draft, props.section, props.itemId, ref))
}
</script>

<style scoped>
.count {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--forge-text-secondary);
}

.aftershock {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-ground);
}

.aftershock-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
}

.aftershock-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.mark {
  padding: 0 0.4rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mark-own { color: var(--forge-ember-soft); }
.mark-game { color: var(--forge-text-secondary); }

.plain {
  margin: 0;
  padding: 0.75rem 0.875rem;
  border-radius: 0.5rem;
  background: var(--forge-panel);
}

.plain-lead {
  color: var(--forge-text-secondary);
}

.field-short {
  max-width: 10rem;
}

.aftershock-actions,
.add-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.add-game {
  min-width: 14rem;
}

.add-game select {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-panel);
  color: var(--forge-text-bright);
  font-family: var(--forge-font-body);
  font-size: 1rem;
}

.link-button {
  min-height: 2.25rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-text-secondary);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}

.loading {
  margin: 0;
}
</style>
