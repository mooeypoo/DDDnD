<template>
  <!--
    The pack's contents (the UI/UX audit, D23): everything in the pack at
    once, in groups that collapse, with your own items first and the game's
    under their own heading. A filter finds anything by name. Whose an item
    is comes from the authoring domain (isOwn, isOwnMember).
  -->
  <nav ref="root" class="contents" aria-label="Pack contents">
    <label class="filter">
      <span class="visually-hidden">Find in this pack, by name or by your words</span>
      <svg class="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input
        ref="filterInput"
        v-model="filter"
        type="search"
        :placeholder="`Find in this pack (${shortcut} K)`"
        :aria-keyshortcuts="shortcutKeys"
        spellcheck="false"
        @keydown.escape="filter = ''"
        @keydown.enter.prevent="matches[0] && openMatch(matches[0])"
      />
    </label>

    <template v-if="query">
      <p v-if="matches.length === 0" class="empty" role="status">Nothing called “{{ filter.trim() }}” in this pack.</p>
      <ul v-else class="items" :aria-label="`Matches for ${filter.trim()}`">
        <li v-for="match in matches" :key="match.key">
          <button type="button" class="item" :aria-current="match.target && current(match.target) ? 'page' : undefined" @click="openMatch(match)">
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

      <!-- A topic's own scores (M4.17): what it trades off, first, since everything else changes them -->
      <div v-if="showScores" class="group">
        <button type="button" class="group-toggle" :aria-expanded="open.scores" @click="open.scores = !open.scores">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>Scores <span class="count">{{ scores.length }}</span>
        </button>
        <template v-if="open.scores">
          <div class="actions">
            <button v-if="!viewOnly" type="button" class="action" :disabled="scores.length >= maxScores" @click="$emit('createScore')">+ New score</button>
          </div>
          <ul class="items">
            <li v-for="score in scores" :key="score.id">
              <button type="button" class="item" :aria-current="current({ kind: 'score', id: score.id }) ? 'page' : undefined" @click="$emit('select', { kind: 'score', id: score.id })">
                <span class="item-name"><span v-if="toFillIn.has(`scores/${score.id}`)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ score.name || 'Unnamed score' }}</span>
                <span class="own-mark">{{ ownWord() }}</span>
              </button>
            </li>
          </ul>
        </template>
      </div>

      <!-- A topic's own endings (M4.18), in the order the game tries them -->
      <div v-if="showEndings" class="group">
        <button type="button" class="group-toggle" :aria-expanded="open.endings" @click="open.endings = !open.endings">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>Endings <span class="count">{{ endings?.length ?? 0 }}</span>
        </button>
        <template v-if="open.endings">
          <div class="actions">
            <button v-if="!viewOnly" type="button" class="action" :disabled="!canAddEnding" @click="$emit('createEnding')">+ New ending</button>
            <button type="button" class="action" :aria-current="current({ kind: 'endings' }) ? 'page' : undefined" @click="$emit('select', { kind: 'endings' })">Order</button>
          </div>
          <ul class="items">
            <li v-for="ending in endings ?? []" :key="ending.id">
              <button type="button" class="item" :aria-current="current({ kind: 'ending', id: ending.id }) ? 'page' : undefined" @click="$emit('select', { kind: 'ending', id: ending.id })">
                <span class="item-name"><span v-if="toFillIn.has(`outcome_archetypes/${ending.id}`)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ ending.name || 'Unnamed ending' }}</span>
                <span v-if="ending.fallback" class="item-kind">every run</span>
              </button>
            </li>
          </ul>
        </template>
      </div>

      <!-- A topic's rules of play (M4.19): who you can be, the challenges you can choose, how scores drag each other down -->
      <div v-if="showRules" class="group">
        <button type="button" class="group-toggle" :aria-expanded="open.rules" @click="open.rules = !open.rules">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>Rules of play <span class="count">{{ rules?.length ?? 0 }}</span>
        </button>
        <template v-if="open.rules">
          <div class="actions">
            <button v-if="!viewOnly" type="button" class="action" @click="$emit('createRule', 'class')">+ Class</button>
            <button v-if="!viewOnly" type="button" class="action" @click="$emit('createRule', 'challenge')">+ Challenge</button>
            <button v-if="!viewOnly" type="button" class="action" :disabled="!canAddCoupling" @click="$emit('createRule', 'coupling')">+ Coupling rule</button>
          </div>
          <ul class="items">
            <li v-for="rule in rules ?? []" :key="`${rule.kind}/${rule.id}`">
              <button type="button" class="item" :aria-current="current({ kind: rule.kind, id: rule.id }) ? 'page' : undefined" @click="$emit('select', { kind: rule.kind, id: rule.id })">
                <span class="item-name"><span v-if="toFillIn.has(`${RULE_SECTIONS[rule.kind]}/${rule.id}`)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ rule.name || RULE_WORDS[rule.kind].unnamed }}</span>
                <span class="item-kind">{{ RULE_WORDS[rule.kind].kind }}</span>
              </button>
            </li>
          </ul>
        </template>
      </div>

      <div class="group">
        <button type="button" class="group-toggle" :aria-expanded="open.council" @click="open.council = !open.council">
          <svg class="chevron" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>Council <span class="count">{{ councilRefs.length }} of {{ seats }}</span>
        </button>
        <template v-if="open.council">
          <div class="actions">
            <button v-if="!viewOnly" type="button" class="action" :disabled="councilRefs.length >= seats" @click="$emit('createMember')">+ New member</button>
            <button type="button" class="action" :aria-current="current({ kind: 'council' }) ? 'page' : undefined" @click="$emit('select', { kind: 'council' })">All seats</button>
          </div>
          <ul class="items">
            <li v-for="memberRef in councilOrdered" :key="memberRef.id">
              <button type="button" class="item" :aria-current="current({ kind: 'member', ref: memberRef }) ? 'page' : undefined" @click="$emit('select', { kind: 'member', ref: memberRef })">
                <span class="item-name"><span v-if="pending('stakeholders', memberRef)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ nameOf('stakeholders', memberRef) }}</span>
                <span class="item-marks">
                  <span v-if="changeCounts[memberRef.id]" class="change-count" :title="`${changeCounts[memberRef.id]} things change their satisfaction`"><span class="visually-hidden">, changed by </span>{{ changeCounts[memberRef.id] }}</span>
                  <span v-if="isOwnMember(draft, memberRef)" class="own-mark">{{ ownWord() }}</span>
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
            <button v-if="!viewOnly" type="button" class="action" @click="$emit('createNew', deck.section)">+ New {{ deck.singular }}</button>
            <button v-if="usesGameContent(draft) && !viewOnly" type="button" class="action" :aria-current="current({ kind: 'add', section: deck.section }) ? 'page' : undefined" @click="$emit('select', { kind: 'add', section: deck.section })">+ From the game</button>
          </div>
          <ul class="items">
            <li v-for="itemRef in own(deck)" :key="`${itemRef.id}-v${itemRef.version}`">
              <button type="button" class="item" :aria-current="current({ kind: 'item', section: deck.section, ref: itemRef }) ? 'page' : undefined" @click="$emit('select', { kind: 'item', section: deck.section, ref: itemRef })">
                <span class="item-name"><span v-if="pending(deck.section, itemRef)" class="fill-dot" title="To fill in"><span class="visually-hidden">To fill in: </span></span>{{ nameOf(deck.section, itemRef) }}</span>
                <span class="own-mark">{{ ownWord() }}</span>
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

import { isOwn, isOwnMember, searchOwnContent, usesGameContent, type DeckSection, type DraftPack, type DraftSection, type PackMatch } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import type { IssueTarget } from '@studio/workspace/checks_panel.vue'
import { isSelected, type Selection } from '@studio/workspace/selection'
import { ownWord } from '@studio/state/studio_state'

type Deck = { section: DeckSection; title: string; singular: string; refs: VersionRef[] }

const props = defineProps<{
  draft: DraftPack
  /** An example pack (M4.29): look, don't make. No "+ New …" or "+ From the game". */
  viewOnly?: boolean
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
  /** The pack's own scores (a topic's, M4.17), and whether to show the group at all. */
  scores: Array<{ id: string; name: string }>
  showScores: boolean
  maxScores: number
  /** A topic's own endings in the order they're tried (M4.18), and whether to show the group. */
  endings?: Array<{ id: string; name: string; fallback: boolean }>
  showEndings?: boolean
  canAddEnding?: boolean
  /** A topic's own classes, challenges and coupling rules (M4.19), and whether to show the group. */
  rules?: Array<{ kind: RuleKind; id: string; name: string }>
  showRules?: boolean
  canAddCoupling?: boolean
  /** How the find shortcut is written here ("Ctrl" or "⌘"), and its keys for assistive technology. */
  shortcut?: string
  shortcutKeys?: string
}>()

type RuleKind = 'class' | 'challenge' | 'coupling'
const RULE_SECTIONS: Record<RuleKind, string> = { class: 'classes', challenge: 'challenge_modifiers', coupling: 'coupling_rules' }
const RULE_WORDS: Record<RuleKind, { kind: string; unnamed: string }> = {
  class: { kind: 'class', unnamed: 'Unnamed class' },
  challenge: { kind: 'challenge', unnamed: 'Unnamed challenge' },
  coupling: { kind: 'coupling', unnamed: 'Unnamed coupling rule' },
}

const pending = (section: string, ref: VersionRef) => props.toFillIn.has(`${section}/${ref.id}`)
const emit = defineEmits<{ select: [selection: Selection]; goTo: [target: IssueTarget]; createMember: []; createNew: [section: DeckSection]; createScore: []; createEnding: []; createRule: [kind: RuleKind] }>()

const filterInput = ref<HTMLInputElement | null>(null)
/** "Find" (M4.24): the shortcut lands here, with what was typed before selected. */
function focusFilter() {
  filterInput.value?.focus()
  filterInput.value?.select()
}
defineExpose({ focusFilter })

const root = ref<HTMLElement | null>(null)
const open = reactive({ pack: true, scores: true, endings: true, rules: true, council: true, cards: true, events: true })
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

type Match = { key: string; name: string; kind: string; target?: Selection; go?: IssueTarget }

/** A match opens its page; one found by the domain opens at the field it was found in. */
function openMatch(match: Match) {
  if (match.go) emit('goTo', match.go)
  else if (match.target) emit('select', match.target)
}

/** How a section reads in the list of matches. */
const SECTION_WORDS: Partial<Record<DraftSection, string>> = {
  scenarios: 'scenario', scores: 'score', outcome_archetypes: 'ending', classes: 'class', challenge_modifiers: 'challenge',
  coupling_rules: 'coupling rule', stakeholders: 'council', stakeholder_reaction_rules: 'reaction', cards: 'card', events: 'event', delayed_effects: 'aftershock',
}
const FIELD_WORDS: Record<Exclude<PackMatch['found_in'], 'name'>, string> = {
  short_name: 'its short name', short_description: 'its summary', description: 'its description', flavor_text: 'its flavor',
}

/** Where "Go to it" takes a domain match: its editor, or the page it's edited on, at the field it was found in. */
function goFor(match: PackMatch): IssueTarget | null {
  const field = { field: match.found_in }
  const { section, ref } = match
  if (section === 'scenarios') return { kind: 'scenario', id: ref.id, field }
  if (section === 'scores') return { kind: 'score', id: ref.id, field }
  if (section === 'outcome_archetypes') return { kind: 'ending', id: ref.id, field }
  if (section === 'classes') return { kind: 'class', id: ref.id, field }
  if (section === 'challenge_modifiers') return { kind: 'challenge', id: ref.id, field }
  if (section === 'coupling_rules') return { kind: 'coupling', id: ref.id, field }
  if (section === 'stakeholders') return { kind: 'member', ref, field }
  if (section === 'stakeholder_reaction_rules') return { kind: 'reaction', id: ref.id, field }
  if (section === 'cards' || section === 'events') return { kind: 'item', section, ref, field }
  if (section === 'delayed_effects') return { kind: 'aftershock', ref, field }
  return null
}

/**
 * Everything the filter finds: the sidebar's items by name, in sidebar order;
 * then from the domain, reactions and aftershocks by name (each with whose
 * it is), and anything of the author's own by their words.
 */
const matches = computed(() => {
  const found: Match[] = []
  const hit = (name: string) => name.toLocaleLowerCase().includes(query.value)
  for (const scenario of scenarios.value) {
    const name = scenario.name || 'Untitled scenario'
    if (hit(name)) found.push({ key: `scenario/${scenario.id}`, name, kind: 'scenario', target: { kind: 'scenario', id: scenario.id } })
  }
  for (const score of props.scores) {
    const name = score.name || 'Unnamed score'
    if (hit(name)) found.push({ key: `score/${score.id}`, name, kind: 'score', target: { kind: 'score', id: score.id } })
  }
  for (const ending of props.endings ?? []) {
    const name = ending.name || 'Unnamed ending'
    if (hit(name)) found.push({ key: `ending/${ending.id}`, name, kind: 'ending', target: { kind: 'ending', id: ending.id } })
  }
  for (const rule of props.rules ?? []) {
    const name = rule.name || RULE_WORDS[rule.kind].unnamed
    if (hit(name)) found.push({ key: `${rule.kind}/${rule.id}`, name, kind: RULE_WORDS[rule.kind].kind, target: { kind: rule.kind, id: rule.id } })
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
  for (const match of searchOwnContent(props.draft, query.value)) {
    // Things the sidebar lists were found above, by name
    const inside = match.section === 'stakeholder_reaction_rules' || match.section === 'delayed_effects'
    if (match.found_in === 'name' && !inside) continue
    const go = goFor(match)
    if (!go) continue
    const kind = [SECTION_WORDS[match.section] ?? 'item', match.on ? `on ${match.on.name || 'an unnamed one'}` : '', match.found_in === 'name' ? '' : `in ${FIELD_WORDS[match.found_in]}`].filter(Boolean).join(' · ')
    found.push({ key: `${match.section}/${match.ref.id}/${match.found_in}`, name: match.name || 'Unnamed', kind, go })
  }
  return found
})

/** Whatever opens (from a check, a link or a new item) is shown: its group opens, and it scrolls into view. */
watch(() => props.selection, async (selection) => {
  if (selection.kind === 'details' || selection.kind === 'scenario') open.pack = true
  if (selection.kind === 'score') open.scores = true
  if (selection.kind === 'ending' || selection.kind === 'endings') open.endings = true
  if (selection.kind === 'class' || selection.kind === 'challenge' || selection.kind === 'coupling') open.rules = true
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

.actions:empty {
  display: none;
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
