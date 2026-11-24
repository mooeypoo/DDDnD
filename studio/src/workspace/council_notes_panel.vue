<template>
  <!--
    Council notes (M4.5a): someone who isn't seated is still changed by a card,
    event, aftershock or reaction. Allowed, and ignored by the game, so this
    never blocks export: it says what's happening and offers the fixes.
  -->
  <section v-if="notes.length > 0" class="notes" aria-labelledby="notes-title">
    <h2 id="notes-title" class="notes-title">Notes <span class="notes-sub">These don't block export</span></h2>
    <article v-for="note in notes" :key="`${note.scenario_id}/${note.stakeholder_id}`" class="note">
      <h3 class="note-head">{{ note.name }} isn't seated</h3>
      <p class="note-text">
        {{ summary(note) }} change how they feel. The game ignores changes to people who aren't at the table, so
        {{ note.sources.length === 1 ? 'it does' : 'they do' }} nothing.
      </p>
      <p class="note-text">Seat them, or change {{ note.sources.length === 1 ? 'it' : 'those' }} so {{ note.sources.length === 1 ? 'it doesn\'t' : 'they don\'t' }} name them.</p>
      <div class="note-actions">
        <button v-if="note.seat" type="button" class="button button-quiet" :disabled="full" @click="$emit('seat', note.seat)">Seat {{ note.name }}</button>
        <button type="button" class="note-toggle" :aria-expanded="isOpen(note)" @click="toggle(note)">
          {{ isOpen(note) ? 'Hide' : 'Show' }} what changes them
        </button>
      </div>
      <p v-if="note.seat && full" class="note-hint">Every seat is taken: take someone out to seat them.</p>
      <ul v-if="isOpen(note)" class="source-list">
        <li v-for="source in note.sources" :key="`${source.section}/${source.ref.id}`" class="source">
          <span class="source-kind">{{ kindLabel(source) }} · {{ source.own ? 'yours' : 'from the game' }}</span>
          <span class="source-name">{{ source.name }} <span class="source-delta">({{ source.delta > 0 ? `+${source.delta}` : source.delta }})</span></span>
          <span v-if="source.via" class="source-via">{{ viaLabel(source) }}</span>
          <span class="source-actions">
            <button v-if="goTarget(source)" type="button" class="source-link" @click="$emit('goTo', goTarget(source)!)">Go to it ›</button>
            <button v-if="source.own" type="button" class="source-link" @click="$emit('removeChange', { section: source.section, id: source.ref.id, stakeholderId: note.stakeholder_id })">Remove the change</button>
          </span>
          <span v-if="!source.own && (source.section === 'cards' || source.section === 'events')" class="source-hint">To change it, open it and make your own version.</span>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { NoteSection, UnseatedSource } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import type { CouncilNote } from '@studio/state/studio_state'
import type { IssueTarget } from '@studio/workspace/checks_panel.vue'

defineProps<{ notes: CouncilNote[]; full: boolean }>()
defineEmits<{
  seat: [ref: VersionRef]
  goTo: [target: IssueTarget]
  removeChange: [change: { section: NoteSection; id: string; stakeholderId: string }]
}>()

const open = ref(new Set<string>())
const keyOf = (note: CouncilNote) => `${note.scenario_id}/${note.stakeholder_id}`
const isOpen = (note: CouncilNote) => open.value.has(keyOf(note))
function toggle(note: CouncilNote) {
  const next = new Set(open.value)
  if (!next.delete(keyOf(note))) next.add(keyOf(note))
  open.value = next
}

const WORDS: Record<NoteSection, [string, string]> = {
  cards: ['card', 'cards'],
  events: ['event', 'events'],
  delayed_effects: ['aftershock', 'aftershocks'],
  stakeholder_reaction_rules: ['reaction', 'reactions'],
}

/** "9 cards, 2 events and 1 aftershock" */
function summary(note: CouncilNote): string {
  const parts = (Object.keys(WORDS) as NoteSection[])
    .map((section) => [section, note.sources.filter((source) => source.section === section).length] as const)
    .filter(([, count]) => count > 0)
    .map(([section, count]) => `${count} ${WORDS[section][count === 1 ? 0 : 1]}`)
  const listed = parts.length <= 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  return listed.charAt(0).toUpperCase() + listed.slice(1)
}

function kindLabel(source: UnseatedSource): string {
  const word = WORDS[source.section][0]
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function viaLabel(source: UnseatedSource): string {
  if (!source.via) return ''
  if (source.via.section === 'stakeholders') return `${source.via.name}'s reaction`
  return `Aftershock of ${source.via.name}`
}

/** Cards and events open their own page; aftershocks their card or event; reactions their member. */
function goTarget(source: UnseatedSource): IssueTarget | null {
  if (source.section === 'cards' || source.section === 'events') return { kind: 'item', section: source.section, ref: source.ref }
  if (source.via?.section === 'cards' || source.via?.section === 'events') return { kind: 'item', section: source.via.section, ref: source.via.ref }
  if (source.via?.section === 'stakeholders') return { kind: 'member', ref: source.via.ref }
  return null
}
</script>

<style scoped>
.notes {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.notes-title {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.notes-sub {
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--forge-text-secondary);
}

.note {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(251, 191, 36, 0.45);
  background: rgba(251, 191, 36, 0.06);
}

.note-head {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.note-text,
.note-hint {
  margin: 0;
  font-size: 0.875rem;
}

.note-hint {
  color: var(--forge-text-secondary);
}

.note-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
}

.note-toggle,
.source-link {
  min-height: 2rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-gold);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}

.source-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.source {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  background: var(--forge-ground);
}

.source-kind {
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.source-name {
  color: var(--forge-text-bright);
  font-size: 0.875rem;
}

.source-delta,
.source-via,
.source-hint {
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}

.source-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
