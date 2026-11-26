<template>
  <!--
    One of a topic's own challenges (challenge modifiers, M4.19): a harder
    start a player can choose at the table. It changes where scores start,
    can set every council member's starting satisfaction, and can add or
    take away turns. It's offered only where every score it changes is
    tracked (the game's rule). Words come from the domain (describeChallenge).
  -->
  <div v-if="challenge" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Challenge · yours</span>
        <h1 class="editor-title">{{ challenge.name || 'Unnamed challenge' }}</h1>
      </div>
      <div class="head-actions">
        <button v-if="!confirming" type="button" class="button button-danger" @click="confirming = true">Delete</button>
      </div>
      <div v-if="confirming" class="head-confirm confirm" role="group" aria-label="Confirm">
        <p class="confirm-text">Delete “{{ challenge.name || 'this challenge' }}”? Players can't choose it any more.</p>
        <button type="button" class="button button-quiet" @click="confirming = false">Keep it</button>
        <button type="button" class="button button-danger" @click="remove">Delete</button>
      </div>
    </div>

    <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>

    <section class="editor-section" aria-labelledby="challenge-words">
      <h2 id="challenge-words" class="editor-section-title">What players read</h2>
      <label class="field">Name
        <input :value="challenge.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" />
        <span class="field-hint">A situation that makes the run harder: "Launch Week", "Skeleton Crew".</span>
      </label>
      <label class="field">What it does, in a sentence
        <textarea :value="challenge.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
        <span class="field-hint">Players choose it by reading this, so say what changes: "Half the rotation is on leave. Rest starts 15 lower."</span>
      </label>
      <label class="field">Flavor (optional)
        <input :value="challenge.flavor_text ?? ''" :maxlength="limits.text.flavor_text" @input="emitChange(withOptionalText(challenge, 'flavor_text', text($event)))" />
      </label>
    </section>

    <section class="editor-section" aria-labelledby="challenge-effects">
      <h2 id="challenge-effects" class="editor-section-title">What it changes at the start</h2>
      <fieldset class="adjustments">
        <legend class="field">Where scores start, compared with the scenario (0: no change)</legend>
        <label v-for="option in scoreOptions" :key="option.id" class="field">{{ option.name }}
          <input type="number" min="-100" max="100" step="1" :value="challenge.score_adjustments?.[option.id] ?? 0" @change="setAdjustment(option.id, $event)" />
        </label>
      </fieldset>
      <div class="inline-fields">
        <label class="field field-short">Turns, more or fewer
          <input type="number" min="-20" max="20" step="1" :value="challenge.turn_adjustment ?? 0" @change="setTurns($event)" />
        </label>
        <label class="field field-short">Council starts at (satisfaction)
          <input type="number" min="0" max="100" step="1" placeholder="As usual" :value="challenge.stakeholder_satisfaction_override ?? ''" @change="setSatisfaction($event)" />
        </label>
      </div>
      <p class="plain"><span class="plain-lead">In plain words:</span> {{ describeChallenge(challenge, names) }}.</p>
    </section>
  </div>
  <p v-else class="loading" role="status">That challenge isn't in this pack.</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { describeChallenge, putContent, removeOwnChallenge, toFillIn, withOptionalText, type DraftPack } from '@/domains/authoring'
import type { ChallengeModifier } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'

interface Option { id: string; name: string }

const props = defineProps<{ draft: DraftPack; challengeId: string; scoreOptions: Option[] }>()
const emit = defineEmits<{ change: [draft: DraftPack]; removed: [] }>()

const limits = CONTENT_LIMITS
const confirming = ref(false)
watch(() => props.challengeId, () => {
  confirming.value = false
})

const challenge = computed(() => props.draft.content.challenge_modifiers[props.challengeId] as ChallengeModifier | undefined)
const names = computed(() => ({ scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])) }))
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((item) => item.section === 'challenge_modifiers' && item.ref.id === props.challengeId)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of its own' : 'what it does, in a sentence'))
})

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

/** A whole number within the game's limits as the author types; empty is null. */
function whole(event: Event, min: number, max: number): number | null {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : null
}

function emitChange(next: ChallengeModifier) {
  emit('change', putContent(props.draft, 'challenge_modifiers', next))
}

function set(patch: Partial<ChallengeModifier>) {
  if (challenge.value) emitChange({ ...challenge.value, ...patch })
}

/** 0 takes the score out: a challenge only changes what it names, and is offered only where those are tracked. */
function setAdjustment(scoreId: string, event: Event) {
  if (!challenge.value) return
  const value = whole(event, -100, 100) ?? 0
  const { [scoreId]: _old, ...rest } = challenge.value.score_adjustments ?? {}
  const adjustments = value === 0 ? rest : { ...rest, [scoreId]: value }
  const { score_adjustments: _all, ...base } = challenge.value
  emitChange(Object.keys(adjustments).length ? { ...base, score_adjustments: adjustments } : base)
}

function setTurns(event: Event) {
  if (!challenge.value) return
  const value = whole(event, -20, 20) ?? 0
  const { turn_adjustment: _old, ...base } = challenge.value
  emitChange(value === 0 ? base : { ...base, turn_adjustment: value })
}

function setSatisfaction(event: Event) {
  if (!challenge.value) return
  const value = whole(event, 0, 100)
  const { stakeholder_satisfaction_override: _old, ...base } = challenge.value
  emitChange(value === null ? base : { ...base, stakeholder_satisfaction_override: value })
}

function remove() {
  emit('change', removeOwnChallenge(props.draft, props.challengeId))
  emit('removed')
}
</script>

<style scoped>
.adjustments {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
  gap: 0.75rem;
}

.adjustments legend {
  grid-column: 1 / -1;
  margin-bottom: 0.25rem;
}

.inline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.field-short {
  max-width: 16rem;
}

.loading {
  margin: 0;
}
</style>
