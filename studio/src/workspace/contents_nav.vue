<template>
  <!--
    The pack's contents (the UI/UX audit, D23): everything in the pack at
    once, in groups that collapse, with your own items first and the game's
    under their own heading. A filter finds anything by name. Whose an item
    is comes from the authoring domain (isOwn, isOwnMember).
  -->
  <nav ref="root" class="contents" aria-label="Pack contents">
    <label class="filter">
      <span class="visually-hidden">Filter this pack by name</span>
      <svg class="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input v-model="filter" type="search" placeholder="Filter this pack" spellcheck="false" @keydown.escape="filter = ''" />
    </label>

    <template v-if="query">
      <p v-if="matches.length === 0" class="empty" role="status">Nothing called “{{ filter.trim() }}” in this pack.</p>
      <ul v-else class="items" :aria-label="`Matches for ${filter.trim()}`">
        <li v-for="match in matches" :key="match.key">
          <button type="button" class="item" :aria-current="current(match.target) ? 'page' : undefined" @click="$emit('select', match.target)">
            <span class="item-name">{{ match.name }}</span>
            <span class="item-kind">{{ match.kind }}</span>
          </button>
        </li>
      </ul>
    </template>

    <template v-else>
      <div class="group">
        <button type="button" class="group-toggle" :aria-expanded="open.pack" @click="open.pack = !open.pack">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>Pack
        </button>
        <ul v-if="open.pack" class="items">
          <li><button type="button" class="item" :aria-current="current({ kind: 'details' }) ? 'page' : undefined" @click="$emit('select', { kind: 'details' })">Pack details</button></li>
          <li v-for="scenario in scenarios" :key="scenario.id">
            <button type="button" class="item" :aria-current="current({ kind: 'scenario', id: scenario.id }) ? 'page' : undefined" @click="$emit('select', { kind: 'scenario', id: scenario.id })">
              <span class="item-name">{{ scenario.name || 'Untitled scenario' }}</span>
            </button>
          </li>
        </ul>
      </div>

      <div class="group">
        <button type="button" class="group-toggle" :aria-expanded="open.council" @click="open.council = !open.council">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>Council <span class="count">{{ councilRefs.length }} of {{ seats }}</span>
        </button>
        <template v-if="open.council">
          <div class="actions">
            <button type="button" class="action" :disabled="councilRefs.length >= seats" @click="$emit('createMember')">+ New member</button>
            <button type="button" class="action" :aria-current="current({ kind: 'council' }) ? 'page' : undefined" @click="$emit('select', { kind: 'council' })">All seats</button>
          </div>
          <ul class="items">
            <li v-for="memberRef in councilOrdered" :key="memberRef.id">
              <button type="button" class="item" :aria-current="current({ kind: 'member', ref: memberRef }) ? 'page' : undefined" @click="$emit('select', { kind: 'member', ref: memberRef })">
                <span class="item-name"><span v-if="pending('stakeholders', memberRef)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ nameOf('stakeholders', memberRef) }}</span>
                <span class="item-marks">
                  <span v-if="changeCounts[memberRef.id]" class="change-count" :title="`${changeCounts[memberRef.id]} things change their satisfaction`"><span class="visually-hidden">, changed by </span>{{ changeCounts[memberRef.id] }}</span>
                  <span v-if="isOwnMember(draft, memberRef)" class="own-mark">yours</span>
                </span>
              </button>
            </li>
          </ul>
        </template>
      </div>

      <div v-for="deck in decks" :key="deck.section" class="group">
        <button type="button" class="group-toggle" :aria-expanded="open[deck.section]" @click="open[deck.section] = !open[deck.section]">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>{{ deck.title }} <span class="count">{{ deck.refs.length }}</span>
        </button>
        <template v-if="open[deck.section]">
          <div class="actions">
            <button type="button" class="action" @click="$emit('createNew', deck.section)">+ New {{ deck.singular }}</button>
            <button type="button" class="action" :aria-current="current({ kind: 'add', section: deck.section }) ? 'page' : undefined" @click="$emit('select', { kind: 'add', section: deck.section })">+ From the game</button>
          </div>
          <ul class="items">
            <li v-for="itemRef in own(deck)" :key="`${itemRef.id}-v${itemRef.version}`">
              <button type="button" class="item" :aria-current="current({ kind: 'item', section: deck.section, ref: itemRef }) ? 'page' : undefined" @click="$emit('select', { kind: 'item', section: deck.section, ref: itemRef })">
                <span class="item-name"><span v-if="pending(deck.section, itemRef)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ nameOf(deck.section, itemRef) }}</span>
                <span class="own-mark">yours</span>
              </button>
            </li>
          </ul>
          <template v-if="games(deck).length > 0">
            <button type="button" class="subgroup-toggle" :aria-expanded="openGame[deck.section]" @click="openGame[deck.section] = !openGame[deck.section]">
              <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>From the game <span class="count">{{ games(deck).length }}</span>
            </button>
            <ul v-if="openGame[deck.section]" class="items">
              <li v-for="itemRef in games(deck)" :key="`${itemRef.id}-v${itemRef.version}`">
                <button type="button" class="item" :aria-current="current({ kind: 'item', section: deck.section, ref: itemRef }) ? 'page' : undefined" @click="$emit('select', { kind: 'item', section: deck.section, ref: itemRef })">
                  <span class="item-name">{{ nameOf(deck.section, itemRef) }}</span>
                </button>
              </li>
            </ul>
          </template>
        </template>
      </div>
    </template>
  </nav>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { isOwn, isOwnMember, type DeckSection, type DraftPack } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import { isSelected, type Selection } from '@studio/workspace/selection'

type Deck = { section: DeckSection; title: string; singular: string; refs: VersionRef[] }

const props = defineProps<{
  draft: DraftPack
  selection: Selection
  councilRefs: VersionRef[]
  decks: Deck[]
  seats: number
  /** An item's name, as the workspace shows it everywhere. */
  nameOf: (section: 'stakeholders' | DeckSection, ref: VersionRef) => string
  /** The author's own items still to fill in ("cards/<id>"), from the domain's toFillIn. */
  toFillIn: ReadonlySet<string>
  /** How many things change each member's satisfaction. */
  changeCounts: Readonly<Record<string, number>>
}>()

const pending = (section: string, ref: VersionRef) => props.toFillIn.has(`${section}/${ref.id}`)
defineEmits<{ select: [selection: Selection]; createMember: []; createNew: [section: DeckSection] }>()

const root = ref<HTMLElement | null>(null)
const open = reactive({ pack: true, council: true, cards: true, events: true })
const openGame = reactive<Record<DeckSection, boolean>>({ cards: false, events: false })
const filter = ref('')
const query = computed(() => filter.value.trim().toLocaleLowerCase())

const scenarios = computed(() => Object.values(props.draft.content.scenarios))
const current = (target: Selection) => isSelected(props.selection, target)

/** Your own members first, then the game's, each in seating order. */
const councilOrdered = computed(() => [
  ...props.councilRefs.filter((memberRef) => isOwnMember(props.draft, memberRef)),
  ...props.councilRefs.filter((memberRef) => !isOwnMember(props.draft, memberRef)),
])
const own = (deck: Deck) => deck.refs.filter((itemRef) => isOwn(props.draft, deck.section, itemRef))
const games = (deck: Deck) => deck.refs.filter((itemRef) => !isOwn(props.draft, deck.section, itemRef))

/** Everything in the pack whose name contains the filter, in sidebar order. */
const matches = computed(() => {
  const found: Array<{ key: string; name: string; kind: string; target: Selection }> = []
  const hit = (name: string) => name.toLocaleLowerCase().includes(query.value)
  for (const scenario of scenarios.value) {
    const name = scenario.name || 'Untitled scenario'
    if (hit(name)) found.push({ key: `scenario/${scenario.id}`, name, kind: 'scenario', target: { kind: 'scenario', id: scenario.id } })
  }
  for (const memberRef of councilOrdered.value) {
    const name = props.nameOf('stakeholders', memberRef)
    if (hit(name)) found.push({ key: `member/${memberRef.id}`, name, kind: 'council', target: { kind: 'member', ref: memberRef } })
  }
  for (const deck of props.decks) {
    for (const itemRef of [...own(deck), ...games(deck)]) {
      const name = props.nameOf(deck.section, itemRef)
      if (hit(name)) found.push({ key: `${deck.section}/${itemRef.id}`, name, kind: deck.singular, target: { kind: 'item', section: deck.section, ref: itemRef } })
    }
  }
  return found
})

/** Whatever opens (from a check, a link or a new item) is shown: its group opens, and it scrolls into view. */
watch(() => props.selection, async (selection) => {
  if (selection.kind === 'details' || selection.kind === 'scenario') open.pack = true
  if (selection.kind === 'council' || selection.kind === 'member') open.council = true
  if (selection.kind === 'item' || selection.kind === 'add') open[selection.section] = true
  if (selection.kind === 'item' && !isOwn(props.draft, selection.section, selection.ref)) openGame[selection.section] = true
  await nextTick()
  root.value?.querySelector('[aria-current="page"]')?.scrollIntoView?.({ block: 'nearest' })
}, { immediate: true })
</script>

<style scoped>
.contents {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem 0.75rem 1.5rem;
}

.filter {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.filter-icon {
  position: absolute;
  left: 0.625rem;
  color: var(--forge-text-secondary);
  pointer-events: none;
}

.filter input {
  width: 100%;
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem 0.375rem 2rem;
  border-radius: 0.5rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-ground);
  color: var(--forge-text-bright);
  font: inherit;
  font-size: 0.875rem;
}

.group {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.group-toggle,
.subgroup-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0 0.375rem;
  border: none;
  border-radius: 0.375rem;
  background: transparent;
  color: var(--forge-text-bright);
  font-family: var(--forge-font-body);
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.subgroup-toggle {
  margin-left: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--forge-text-secondary);
}

.chevron {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  transition: transform 0.12s ease;
}

[aria-expanded='true'] > .chevron {
  transform: rotate(90deg);
}

@media (prefers-reduced-motion: reduce) {
  .chevron { transition: none; }
}

.count {
  font-weight: 400;
  color: var(--forge-text-secondary);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding: 0.125rem 0 0.25rem 1.25rem;
}

.action {
  min-height: 2rem;
  padding: 0 0.625rem;
  border-radius: 0.375rem;
  border: 1px dashed rgba(224, 128, 58, 0.6);
  background: transparent;
  color: var(--forge-ember-soft);
  font-family: var(--forge-font-body);
  font-size: 0.8125rem;
  cursor: pointer;
}

.action[aria-current='page'] {
  border-style: solid;
}

.action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.items {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.25rem;
  padding: 0.375rem 0.625rem 0.375rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--forge-text);
  font-family: var(--forge-font-body);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
}

.item[aria-current='page'] {
  background: rgba(212, 184, 96, 0.12);
  color: var(--forge-text-bright);
  font-weight: 600;
}

.item-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.item-kind {
  flex: none;
  font-size: 0.75rem;
  color: var(--forge-text-secondary);
}

.item-marks {
  flex: none;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.change-count {
  font-size: 0.75rem;
  color: var(--forge-text-secondary);
}

/* An amber ring before the name: still to fill in (shape, not colour alone) */
.fill-dot {
  display: inline-block;
  width: 0.5625rem;
  height: 0.5625rem;
  margin-right: 0.5rem;
  border-radius: 50%;
  border: 2px solid var(--forge-warning);
  vertical-align: 0.05em;
}

.own-mark {
  flex: none;
  padding: 0 0.4rem;
  border-radius: 999px;
  border: 1px solid var(--forge-ember-soft);
  color: var(--forge-ember-soft);
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.empty {
  margin: 0.5rem 0.375rem;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}
</style>
