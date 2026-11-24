<template>
  <div v-if="draft" class="workspace">
    <div class="workspace-bar">
      <button type="button" class="button button-quiet" @click="$emit('leave')">‹ All drafts</button>
      <span class="bar-name">{{ draft.name || 'Untitled pack' }}</span>
      <span class="kind-pill" :class="draft.kind === 'retelling' ? 'pill-setting' : 'pill-topic'">
        {{ draft.kind === 'retelling' ? 'Retelling' : 'New topic' }}
      </span>
      <span class="bar-save" role="status" aria-live="polite">{{ saveText }}</span>
      <button
        type="button"
        class="button button-primary"
        :aria-current="selection.kind === 'release' ? 'page' : undefined"
        @click="select({ kind: 'release' })"
      >Export pack</button>
    </div>

    <div class="workspace-body">
      <nav class="contents" aria-label="Pack contents">
        <button type="button" class="contents-item" :aria-current="isSelected('details') ? 'page' : undefined" @click="select({ kind: 'details' })">
          Pack details
        </button>
        <span class="contents-group">Scenarios</span>
        <button
          v-for="scenario in scenarios"
          :key="scenario.id"
          type="button"
          class="contents-item contents-sub"
          :aria-current="isSelected('scenario', scenario.id) ? 'page' : undefined"
          @click="select({ kind: 'scenario', id: scenario.id })"
        >{{ scenario.name || 'Untitled scenario' }}</button>
        <button
          type="button"
          class="contents-item"
          :aria-current="isSelected('council') ? 'page' : undefined"
          @click="select({ kind: 'council' })"
        ><span>Council</span><span class="count">{{ councilRefs.length }}</span></button>
        <div class="deck-actions">
          <button type="button" class="deck-new" :disabled="councilRefs.length >= COUNCIL_SEATS" @click="createMember">+ New member</button>
        </div>
        <button
          v-for="memberRef in councilRefs"
          :key="memberRef.id"
          type="button"
          class="contents-item contents-sub"
          :aria-current="isSelectedMember(memberRef) ? 'page' : undefined"
          @click="select({ kind: 'member', ref: memberRef })"
        >
          <span class="item-name">{{ memberName(memberRef) }}</span>
          <span v-if="isOwnMember(draft, memberRef)" class="own-mark">yours</span>
        </button>
        <template v-for="deck in decks" :key="deck.section">
          <span class="contents-group">{{ deck.title }} <span class="count">{{ deck.refs.length }}</span></span>
          <div class="deck-actions">
            <button type="button" class="deck-new" @click="createNew(deck.section)">+ New {{ deck.singular }}</button>
            <button
              type="button"
              class="deck-new"
              :aria-current="isSelected('add', deck.section) ? 'page' : undefined"
              @click="select({ kind: 'add', section: deck.section })"
            >+ From the game</button>
          </div>
          <button
            v-for="itemRef in deck.refs"
            :key="`${itemRef.id}-v${itemRef.version}`"
            type="button"
            class="contents-item contents-sub"
            :aria-current="isSelectedItem(deck.section, itemRef) ? 'page' : undefined"
            @click="select({ kind: 'item', section: deck.section, ref: itemRef })"
          >
            <span class="item-name">{{ itemName(deck.section, itemRef) }}</span>
            <span v-if="isOwn(draft, deck.section, itemRef)" class="own-mark">yours</span>
          </button>
        </template>
      </nav>

      <main id="main" class="editor-area" tabindex="-1">
        <PackDetailsEditor v-if="selection.kind === 'details'" :draft="draft" @change="updateDraft" />
        <ScenarioEditor
          v-else-if="selection.kind === 'scenario' && selectedScenario"
          :scenario="selectedScenario"
          :scoreNames="names.scores"
          @change="(scenario) => updateDraft(putContent(draft!, 'scenarios', scenario))"
        />
        <CouncilView
          v-else-if="selection.kind === 'council'"
          :draft="draft"
          :councilRefs="councilRefs"
          :names="names.stakeholders"
          @change="updateDraft"
          @open="(memberRef) => select({ kind: 'member', ref: memberRef })"
          @createMember="createMember"
        />
        <MemberView
          v-else-if="selection.kind === 'member'"
          :key="'member'"
          :memberRef="selection.ref"
          :draft="draft"
          :scoreOptions="scoreOptions"
          :stakeholderOptions="stakeholderOptions"
          @change="updateDraft"
          @select="afterMemberChange"
        />
        <DeckItemView
          v-else-if="selection.kind === 'item'"
          :key="selection.section"
          :section="selection.section"
          :itemRef="selection.ref"
          :draft="draft"
          :scoreOptions="scoreOptions"
          :stakeholderOptions="stakeholderOptions"
          @change="updateDraft"
          @select="afterItemChange"
        />
        <DeckAddView v-else-if="selection.kind === 'add'" :section="selection.section" :draft="draft" @change="updateDraft" />
        <ReleaseView v-else-if="selection.kind === 'release'" :draft="draft" :checksClean="canExport" @export="exportPack" />
      </main>

      <div class="rail">
        <ChecksPanel :state="studio.check.state" :issues="studio.check.issues" @goTo="goTo" />
        <CouncilNotesPanel
          :notes="studio.notes"
          :full="councilRefs.length >= COUNCIL_SEATS"
          @seat="(memberRef) => updateDraft(addToCouncil(draft!, memberRef))"
          @removeChange="(change) => updateDraft(removeChangesTo(draft!, change.section, change.id, change.stakeholderId))"
          @goTo="goTo"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { addToCouncil, aftershockUsers, COUNCIL_SEATS, createOwnCard, createOwnEvent, createOwnMember, isOwn, isOwnMember, memberOfReaction, PLACEHOLDER_NAMES, putContent, removeChangesTo, resolveNames as resolveRefNames, scenarioRefs, type DeckSection } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import { loadFirstParty } from '@studio/content/first_party'
import { exportCurrentDraft, studio, updateDraft, type ExportFormat } from '@studio/state/studio_state'
import ChecksPanel, { type IssueTarget } from '@studio/workspace/checks_panel.vue'
import CouncilNotesPanel from '@studio/workspace/council_notes_panel.vue'
import CouncilView from '@studio/workspace/council_view.vue'
import DeckAddView from '@studio/workspace/deck_add_view.vue'
import DeckItemView from '@studio/workspace/deck_item_view.vue'
import MemberView from '@studio/workspace/member_view.vue'
import PackDetailsEditor from '@studio/workspace/pack_details_editor.vue'
import ReleaseView from '@studio/workspace/release_view.vue'
import ScenarioEditor from '@studio/workspace/scenario_editor.vue'

defineEmits<{ leave: [] }>()

type Selection =
  | { kind: 'details' }
  | { kind: 'scenario'; id: string }
  | { kind: 'council' }
  | { kind: 'member'; ref: VersionRef }
  | { kind: 'item'; section: DeckSection; ref: VersionRef }
  | { kind: 'add'; section: DeckSection }
  | { kind: 'release' }
type NameSection = 'scores' | 'stakeholders' | 'cards' | 'events'

const draft = computed(() => studio.current?.draft ?? null)
const scenarios = computed(() => Object.values(draft.value?.content.scenarios ?? {}))
const selection = ref<Selection>(scenarios.value[0] ? { kind: 'scenario', id: scenarios.value[0].id } : { kind: 'details' })
const selectedScenario = computed(() => (selection.value.kind === 'scenario' ? draft.value?.content.scenarios[selection.value.id] : undefined))

function select(next: Selection) {
  selection.value = next
}

/** A release can give the open card, event or member a new version (M4.7): stay on it. */
watch(() => draft.value?.content, (content) => {
  const current = selection.value
  if (!content || (current.kind !== 'item' && current.kind !== 'member')) return
  const own = (current.kind === 'item' ? content[current.section] : content.stakeholders)[current.ref.id]
  if (own && own.version !== current.ref.version) select({ ...current, ref: { id: own.id, version: own.version } })
})

/** "Go to it" from the Checks rail: open the editor, then move focus into it. */
async function goTo(target: IssueTarget) {
  if (target.kind === 'reaction') {
    // A reaction is edited on its member's page
    const owner = draft.value ? memberOfReaction(draft.value, target.id) : null
    select(owner ? { kind: 'member', ref: { id: owner.id, version: owner.version } } : { kind: 'council' })
  } else if (target.kind === 'aftershock') {
    // An aftershock is edited on a card or event that has it
    const user = draft.value ? aftershockUsers(draft.value, target.ref)[0] : undefined
    if (!user) return
    select({ kind: 'item', section: user.section, ref: { id: user.id, version: draft.value!.content[user.section][user.id].version } })
    await focusEditor('.aftershock input')
    return
  } else {
    select(target)
  }
  await focusEditor()
}

function isSelected(kind: Selection['kind'], key?: string) {
  const current = selection.value
  if (current.kind !== kind) return false
  if (key === undefined) return true
  return ('id' in current && current.id === key) || ('section' in current && current.section === key)
}

function isSelectedItem(section: DeckSection, ref: VersionRef) {
  const current = selection.value
  return current.kind === 'item' && current.section === section && current.ref.id === ref.id && current.ref.version === ref.version
}

function isSelectedMember(ref: VersionRef) {
  const current = selection.value
  return current.kind === 'member' && current.ref.id === ref.id
}

/** A council member's name: the draft's own (live as it's edited), else the game's. */
function memberName(ref: VersionRef): string {
  if (draft.value && isOwnMember(draft.value, ref)) return draft.value.content.stakeholders[ref.id].name || 'Unnamed council member'
  return names.stakeholders[ref.id] ?? ref.id
}

/** "+ New member": made, seated, and opened with its name ready to type. */
async function createMember() {
  if (!draft.value) return
  const made = createOwnMember(draft.value)
  updateDraft(made.draft)
  select({ kind: 'member', ref: { id: made.id, version: 1 } })
  await focusEditor()
  ;(document.activeElement as HTMLInputElement | null)?.select?.()
}

/** After a new member's id settles (stay on them) or they leave the table (back to the council). */
function afterMemberChange(ref: VersionRef | null) {
  select(ref ? { kind: 'member', ref } : { kind: 'council' })
}

/** A card's or event's name: the draft's own (live as it's edited), else the game's. */
function itemName(section: DeckSection, ref: VersionRef): string {
  const fallback = section === 'cards' ? 'Untitled card' : 'Untitled event'
  if (draft.value && isOwn(draft.value, section, ref)) return draft.value.content[section][ref.id].name || fallback
  return names[section][ref.id] ?? ref.id
}

async function focusEditor(selector = '.editor-area input, .editor-area textarea') {
  await nextTick()
  document.querySelector<HTMLElement>(selector)?.focus()
}

/** "+ New card" / "+ New event": made, added to the deck, and opened with its name ready to type. */
async function createNew(section: DeckSection) {
  if (!draft.value) return
  const made = section === 'cards' ? createOwnCard(draft.value, PLACEHOLDER_NAMES.cards) : createOwnEvent(draft.value, PLACEHOLDER_NAMES.events)
  updateDraft(made.draft)
  select({ kind: 'item', section, ref: { id: made.id, version: 1 } })
  await focusEditor()
  ;(document.activeElement as HTMLInputElement | null)?.select?.()
}

/** After "make my own version" (open the copy) or taking an item out (back to its group). */
function afterItemChange(ref: VersionRef | null) {
  const current = selection.value
  if (current.kind !== 'item') return
  select(ref ? { kind: 'item', section: current.section, ref } : { kind: 'add', section: current.section })
}

/** Display names for what the scenarios reference: the draft's own content first, then the game's. */
const names = reactive<Record<NameSection, Record<string, string>>>({ scores: {}, stakeholders: {}, cards: {}, events: {} })

async function resolveNames() {
  const current = draft.value
  if (!current) return
  const { base } = await loadFirstParty()
  const fields: Record<NameSection, 'score_refs' | 'stakeholder_refs' | 'card_refs' | 'event_refs'> = {
    scores: 'score_refs', stakeholders: 'stakeholder_refs', cards: 'card_refs', events: 'event_refs',
  }
  for (const section of Object.keys(fields) as NameSection[]) {
    names[section] = await resolveRefNames(current, section, scenarioRefs(current, fields[section]), base)
  }
}

watch(() => scenarios.value.map((scenario) => [scenario.score_refs, scenario.stakeholder_refs, scenario.card_refs, scenario.event_refs]), () => void resolveNames(), { immediate: true, deep: true })

/** The scenarios' council, cards and events, in deck order. */
function refsOf(field: 'stakeholder_refs' | 'card_refs' | 'event_refs'): VersionRef[] {
  return draft.value ? scenarioRefs(draft.value, field) : []
}
const councilRefs = computed(() => refsOf('stakeholder_refs'))
const decks = computed(() => [
  { section: 'cards' as const, title: 'Cards', singular: 'card', refs: refsOf('card_refs') },
  { section: 'events' as const, title: 'Events', singular: 'event', refs: refsOf('event_refs') },
])
const scoreOptions = computed(() => [...new Set(scenarios.value.flatMap((scenario) => scenario.score_refs.map((ref) => ref.id)))]
  .map((id) => ({ id, name: names.scores[id] ?? id })))
const stakeholderOptions = computed(() => councilRefs.value.map((ref) => ({ id: ref.id, name: memberName(ref) })))

const saveText = computed(() => {
  if (!studio.persistent) return 'Not kept: export to save'
  return { saved: 'Saved in this browser', saving: 'Saving…', unsaved: 'Saving…', failed: "Couldn't save" }[studio.save]
})

const canExport = computed(() => studio.check.state === 'done' && studio.check.issues.length === 0)

/** Download a release (M4.7); the release page says how it went. */
async function exportPack(version: string, format: ExportFormat, done: (ok: boolean) => void) {
  try {
    done((await exportCurrentDraft(version, format)).length === 0)
  } catch {
    done(false)
  }
}

</script>

<style scoped>
.workspace {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.workspace-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.875rem;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.bar-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.bar-save {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.kind-pill {
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pill-setting { color: var(--forge-gold); }
.pill-topic { color: var(--forge-teal); }

.workspace-body {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  min-height: 0;
}

.contents {
  flex: 1 1 15rem;
  max-width: 17rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.125rem 0.875rem;
  border-right: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.contents-group {
  margin: 0.75rem 0.75rem 0.25rem;
  font-size: 0.6875rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.contents-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  background: transparent;
  color: var(--forge-text);
  font-family: var(--forge-font-body);
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
}

.contents-sub {
  padding-left: 1.25rem;
}

.contents-item[aria-current='page'] {
  background: rgba(212, 184, 96, 0.12);
  color: var(--forge-text-bright);
  font-weight: 600;
}

.count {
  color: var(--forge-text-secondary);
}

.contents {
  overflow-y: auto;
}

.deck-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  padding: 0 0.5rem 0.25rem 1.25rem;
}

.deck-new {
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

.deck-new[aria-current='page'] {
  border-style: solid;
}

.item-name {
  min-width: 0;
  overflow-wrap: anywhere;
}

.own-mark {
  flex: none;
  align-self: center;
  padding: 0 0.4rem;
  border-radius: 999px;
  border: 1px solid var(--forge-ember-soft);
  color: var(--forge-ember-soft);
  font-size: 0.6875rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.editor-area {
  flex: 999 1 32rem;
  min-width: 0;
  padding: 1.75rem 2.25rem 2.5rem;
}

.editor-area:focus {
  outline: none;
}

.rail {
  flex: 1 1 18rem;
  max-width: 21rem;
  padding: 1.5rem 1.375rem;
  border-left: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

@media (max-width: 1100px) {
  .rail {
    max-width: none;
    border-left: none;
    border-top: 1px solid var(--forge-hairline);
  }
}
</style>
