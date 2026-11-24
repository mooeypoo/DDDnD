<template>
  <section class="editor" aria-labelledby="council-title">
    <div class="editor-head">
      <span class="editor-kicker">In your scenario</span>
      <h1 id="council-title" class="editor-title">Council</h1>
    </div>

    <div class="explain">
      <p>
        <strong>You can't edit the base game's council members,</strong> because the game's cards and events refer to them.
        You can create new members, or copy a base member and edit the copy. The base game's cards and events don't
        affect your new members; only your own cards and events do.
      </p>
      <p>
        Only the members seated here take part in the game. If you don't want one of the base game's members, take them
        out of the scenario.
      </p>
    </div>

    <section class="editor-section" aria-labelledby="council-seated">
      <h2 id="council-seated" class="editor-section-title">At the table <span class="seats">{{ seated.length }} of {{ COUNCIL_SEATS }} seats</span></h2>
      <ul class="member-list">
        <li v-for="member in seated" :key="member.ref.id">
          <button type="button" class="member" @click="$emit('open', member.ref)">
            <span class="member-name">{{ member.name }}</span>
            <span class="member-summary">{{ member.summary }}</span>
            <span class="member-mark" :class="member.own ? 'mark-own' : 'mark-game'">{{ member.own ? 'yours' : 'from the game' }}</span>
          </button>
        </li>
      </ul>
      <button type="button" class="button button-primary seat-own" :disabled="full" @click="$emit('createMember')">+ Seat your own member</button>
      <p v-if="full" class="field-hint">Every seat is taken: the game seats at most {{ COUNCIL_SEATS }}. Take someone out to make room.</p>
    </section>

    <section class="editor-section" aria-labelledby="council-game">
      <h2 id="council-game" class="editor-section-title">The game's council members</h2>
      <p class="field-hint">Seated as they are: they react exactly as in the game.</p>
      <p v-if="!available" class="loading" role="status">Loading the game's council…</p>
      <p v-else-if="available.length === 0" class="field-hint">Every one of them is already at your table.</p>
      <ul v-else class="choice-list">
        <li v-for="choice in available" :key="choice.ref.id" class="choice-row">
          <span class="choice-text">
            <span class="choice-name">{{ choice.name }}</span>
            <span class="choice-summary">{{ choice.summary }}</span>
          </span>
          <button type="button" class="button button-quiet" :disabled="full" :aria-label="`Seat ${choice.name}`" @click="seat(choice.ref)">Seat them</button>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import { addToCouncil, COUNCIL_SEATS, ownEntity, type DraftPack } from '@/domains/authoring'
import type { Stakeholder, VersionRef } from '@/domains/content/model'
import { listBaseRefs, loadFirstParty } from '@studio/content/first_party'

const props = defineProps<{ draft: DraftPack; councilRefs: VersionRef[]; names: Record<string, string> }>()
const emit = defineEmits<{ change: [draft: DraftPack]; open: [ref: VersionRef]; createMember: [] }>()

interface Choice { ref: VersionRef; name: string; summary: string }

const gameMembers = ref<Stakeholder[] | null>(null)
void (async () => {
  const [{ base }, refs] = await Promise.all([loadFirstParty(), listBaseRefs('stakeholders')])
  const loaded = await Promise.all(refs.map((ref) => base.loadStakeholder(ref)))
  gameMembers.value = loaded.sort((a, b) => a.name.localeCompare(b.name))
})()

const seated = computed(() => props.councilRefs.map((ref) => {
  const ownMember = ownEntity(props.draft, 'stakeholders', ref)
  const own = ownMember !== null
  const entity = ownMember ?? gameMembers.value?.find((member) => member.id === ref.id)
  return {
    ref,
    own,
    name: (own ? entity?.name || 'Unnamed council member' : props.names[ref.id]) ?? ref.id,
    summary: entity ? entity.short_description ?? entity.description : '',
  }
}))

const full = computed(() => props.councilRefs.length >= COUNCIL_SEATS)

const available = computed<Choice[] | null>(() => {
  if (!gameMembers.value) return null
  const seatedIds = new Set(props.councilRefs.map((ref) => ref.id))
  return gameMembers.value
    .filter((member) => !seatedIds.has(member.id))
    .map((member) => ({ ref: { id: member.id, version: member.version }, name: member.name, summary: member.short_description ?? member.description }))
})

function seat(ref: VersionRef) {
  emit('change', addToCouncil(props.draft, ref))
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

.explain {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 46rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(108, 199, 187, 0.45);
  background: rgba(108, 199, 187, 0.06);
}

.explain p {
  margin: 0;
}

.explain strong {
  color: var(--forge-text-bright);
}

.seats {
  margin-left: 0.5rem;
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--forge-text-secondary);
}

.member-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 0.625rem;
}

.member {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.75rem 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
  color: var(--forge-text);
  font-family: var(--forge-font-body);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
}

.member:hover {
  border-color: rgba(212, 184, 96, 0.6);
}

.member-name {
  color: var(--forge-text-bright);
  font-weight: 600;
}

.member-summary {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.member-mark {
  margin-top: auto;
  padding: 0 0.4rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mark-own { color: var(--forge-ember-soft); }
.mark-game { color: var(--forge-text-secondary); }

.seat-own {
  align-self: flex-start;
}

.loading {
  margin: 0;
}

.choice-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-panel);
}

.choice-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.875rem;
  border-bottom: 1px solid rgba(160, 112, 24, 0.2);
}

.choice-row:last-child {
  border-bottom: none;
}

.choice-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
  flex: 1 1 16rem;
}

.choice-name {
  color: var(--forge-text-bright);
  font-weight: 500;
}

.choice-summary {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}
</style>
