<template>
  <!--
    "Who or what does it change?" (the UI/UX audit, slice 3b): one picker for
    a new change, so connecting never means leaving the editor. It offers the
    scenario's scores and the members at the table, and it can create what
    it picks: a new council member from the name typed, or one of the game's
    members, seated on the way. An ARIA combobox with a listbox popup
    (§10): arrows move, Enter picks, Escape closes.
  -->
  <div class="picker" @keydown.escape.stop="$emit('cancel')">
    <label class="picker-label" :for="inputId">Who or what does it change?</label>
    <input
      :id="inputId"
      ref="input"
      v-model="query"
      class="picker-input"
      type="text"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded="true"
      :aria-controls="listId"
      :aria-activedescendant="active ? optionId(active) : undefined"
      placeholder="A score, or someone at the table"
      autocomplete="off"
      spellcheck="false"
      @keydown.down.prevent="move(1)"
      @keydown.up.prevent="move(-1)"
      @keydown.enter.prevent="active && choose(active)"
    />
    <ul :id="listId" class="picker-list" role="listbox" aria-label="Who or what it changes">
      <template v-for="group in groups" :key="group.title">
        <li class="picker-group" role="presentation">{{ group.title }}</li>
        <li
          v-for="option in group.options"
          :id="optionId(option)"
          :key="option.key"
          class="picker-option"
          :class="{ 'is-active': active?.key === option.key }"
          role="option"
          :aria-selected="active?.key === option.key"
          @pointerdown.prevent
          @click="choose(option)"
          @pointermove="activeKey = option.key"
        >
          <span class="option-name">{{ option.label }}</span>
          <span v-if="option.hint" class="option-hint">{{ option.hint }}</span>
        </li>
      </template>
      <li v-if="flat.length === 0" class="picker-empty" role="presentation">
        {{ query.trim() ? `Nothing called “${query.trim()}”.` : 'It already changes every score and everyone at the table.' }}
        <template v-if="!canSeat"> Every seat is taken, so nobody new can join.</template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import type { VersionRef } from '@/domains/content/model'

interface Option { id: string; name: string }
type Choice =
  | { kind: 'score'; key: string; label: string; hint?: string; id: string }
  | { kind: 'member'; key: string; label: string; hint?: string; id: string }
  | { kind: 'create'; key: string; label: string; hint?: string; name: string }
  | { kind: 'seat'; key: string; label: string; hint?: string; ref: VersionRef }

const props = defineProps<{
  /** Scores this item doesn't change yet. */
  scores: Option[]
  /** Members at the table this item doesn't change yet. */
  members: Option[]
  /** The game's members who aren't seated. */
  gameMembers: Array<{ ref: VersionRef; name: string }>
  /** Every member's name, seated or not, so a typed name that already exists isn't offered as new. */
  knownNames: string[]
  /** False when every seat is taken. */
  canSeat: boolean
  seatsLeft: number
}>()
const emit = defineEmits<{
  score: [id: string]
  member: [id: string]
  create: [name: string]
  seat: [ref: VersionRef]
  cancel: []
}>()

const uid = Math.random().toString(36).slice(2, 8)
const inputId = `change-target-${uid}`
const listId = `change-targets-${uid}`
const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const activeKey = ref<string | null>(null)

const matches = (name: string) => name.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())

const groups = computed(() => {
  const typed = query.value.trim()
  const exists = props.knownNames.some((name) => name.toLocaleLowerCase() === typed.toLocaleLowerCase())
  const seatHint = props.seatsLeft === 1 ? 'seats them: the last free seat' : `seats them, ${props.seatsLeft} seats free`
  const out: Array<{ title: string; options: Choice[] }> = [
    { title: 'Scores', options: props.scores.filter((option) => matches(option.name)).map((option) => ({ kind: 'score', key: `score/${option.id}`, label: option.name, id: option.id })) },
    { title: 'At the table', options: props.members.filter((option) => matches(option.name)).map((option) => ({ kind: 'member', key: `member/${option.id}`, label: option.name, hint: 'satisfaction', id: option.id })) },
    { title: "The game's, not seated", options: props.canSeat ? props.gameMembers.filter((option) => matches(option.name)).map((option) => ({ kind: 'seat', key: `seat/${option.ref.id}`, label: option.name, hint: seatHint, ref: option.ref })) : [] },
    // Someone new comes last: what already exists is found first
    { title: 'Someone new', options: typed && !exists && props.canSeat ? [{ kind: 'create', key: 'create', label: `+ “${typed}” as a new council member`, hint: seatHint, name: typed }] : [] },
  ]
  return out.filter((group) => group.options.length > 0)
})

const flat = computed(() => groups.value.flatMap((group) => group.options))
const active = computed(() => flat.value.find((option) => option.key === activeKey.value) ?? flat.value[0] ?? null)
const optionId = (option: Choice) => `${listId}-${option.key.replace(/[^\w-]/g, '_')}`

// A new search starts at its first match
watch(query, () => {
  activeKey.value = null
})

function move(step: number) {
  const list = flat.value
  if (list.length === 0) return
  const index = active.value ? list.findIndex((option) => option.key === active.value!.key) : -1
  activeKey.value = list[(index + step + list.length) % list.length].key
  void nextTick(() => document.getElementById(optionId(active.value!))?.scrollIntoView?.({ block: 'nearest' }))
}

function choose(option: Choice) {
  if (option.kind === 'score') emit('score', option.id)
  else if (option.kind === 'member') emit('member', option.id)
  else if (option.kind === 'create') emit('create', option.name)
  else emit('seat', option.ref)
}

onMounted(() => input.value?.focus())
</script>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-width: 30rem;
  padding: 0.75rem;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-ground);
}

.picker-label {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.picker-input {
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--forge-gold);
  background: var(--forge-panel);
  color: var(--forge-text-bright);
  font: inherit;
}

.picker-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 16rem;
  overflow-y: auto;
}

.picker-group {
  padding: 0.5rem 0.625rem 0.25rem;
  font-size: 0.6875rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.picker-option {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem;
  border-radius: 0.375rem;
  color: var(--forge-text);
  cursor: pointer;
}

.picker-option.is-active {
  background: rgba(212, 184, 96, 0.16);
  color: var(--forge-text-bright);
}

.option-hint {
  flex: none;
  font-size: 0.75rem;
  color: var(--forge-text-secondary);
}

.picker-empty {
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}
</style>
