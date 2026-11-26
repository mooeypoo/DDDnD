<template>
  <div v-if="draft" class="workspace">
    <div class="workspace-bar">
      <button type="button" class="button button-quiet" @click="$emit('leave')">‹ Your packs</button>
      <span class="bar-name">{{ draft.name || 'Untitled pack' }}</span>
      <span class="kind-pill" :class="draft.kind === 'retelling' ? 'pill-setting' : 'pill-topic'">
        {{ draft.kind === 'retelling' ? 'Retelling' : 'New topic' }}
      </span>
      <span class="bar-save" role="status" aria-live="polite">{{ saveText }}</span>
      <div class="view-switch" role="group" aria-label="View">
        <button type="button" class="view-option" :aria-pressed="selection.kind === 'summary'" @click="select({ kind: 'summary' })">Summary</button>
        <button type="button" class="view-option" :aria-pressed="selection.kind !== 'summary'" @click="select(lastEdit)">Edit</button>
      </div>
      <div class="bar-tools">
        <ChecksButton
          :state="studio.check.state"
          :issues="studio.check.issues"
          :notes="studio.notes"
          :full="councilRefs.length >= COUNCIL_SEATS"
          @goTo="goTo"
          @seat="(memberRef) => updateDraft(addToCouncil(draft!, memberRef))"
          @removeChange="(change) => updateDraft(removeChangesTo(draft!, change.section, change.id, change.stakeholderId))"
        />
        <!-- "Play it" (D15, §9.1): quiet, beside Export; its state shows here, not on a page -->
        <span v-if="playText" class="bar-play-status" role="status">{{ playText }}</span>
        <button
          type="button"
          class="button button-quiet"
          :disabled="!PLAY_IT_LIVE || playing"
          :title="PLAY_IT_LIVE ? 'Play this pack in the game, in a tab of its own. Nothing is saved.' : 'Play it arrives with the Studio\'s launch.'"
          @click="playIt"
        >▶ Play it</button>
        <!-- The one ember action (§9); on the export page itself, the download is -->
        <button
          type="button"
          class="button"
          :class="selection.kind === 'release' ? 'button-quiet' : 'button-primary'"
          :aria-current="selection.kind === 'release' ? 'page' : undefined"
          @click="select({ kind: 'release' })"
        >Export pack</button>
      </div>
    </div>

    <div class="workspace-body">
      <ContentsNav
        class="contents"
        :draft="draft"
        :selection="selection"
        :councilRefs="councilRefs"
        :decks="decks"
        :seats="COUNCIL_SEATS"
        :nameOf="nameOf"
        :toFillIn="fillIn"
        :changeCounts="changeCounts"
        :scores="ownScores"
        :showScores="draft.kind === 'new_topic' || ownScores.length > 0"
        :maxScores="SCORES_PER_SCENARIO"
        @select="select"
        @createScore="createScore"
        @createMember="createMember"
        @createNew="createNew"
      />

      <main id="main" ref="editorArea" class="editor-area" tabindex="-1">
        <SummaryView
          v-if="selection.kind === 'summary'"
          :draft="draft"
          :seats="COUNCIL_SEATS"
          :checkState="studio.check.state"
          :issues="studio.check.issues"
          :notes="studio.notes.length"
          @select="select"
          @createNew="createNew"
          @createMember="createMember"
          @createScore="createScore"
        />
        <PackDetailsEditor v-else-if="selection.kind === 'details'" :draft="draft" @change="updateDraft" />
        <ScoreEditor
          v-else-if="selection.kind === 'score'"
          :draft="draft"
          :scoreId="selection.id"
          @change="updateDraft"
          @open="select"
          @removed="select({ kind: 'summary' })"
        />
        <ScenarioEditor
          v-else-if="selection.kind === 'scenario' && selectedScenario"
          :scenario="selectedScenario"
          :scoreNames="names.scores"
          :copied="draft.kind === 'retelling'"
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
          :changes="studio.memberChanges[selection.ref.id] ?? []"
          :gameMembers="usesGameContent(draft) ? gameMembers : []"
          :seatsLeft="COUNCIL_SEATS - councilRefs.length"
          :deckChoices="deckChoices"
          @change="updateDraft"
          @select="afterMemberChange"
          @open="select"
        />
        <DeckItemView
          v-else-if="selection.kind === 'item'"
          :key="selection.section"
          :section="selection.section"
          :itemRef="selection.ref"
          :draft="draft"
          :scoreOptions="scoreOptions"
          :stakeholderOptions="stakeholderOptions"
          :gameMembers="usesGameContent(draft) ? gameMembers : []"
          :seatsLeft="COUNCIL_SEATS - councilRefs.length"
          @change="updateDraft"
          @select="afterItemChange"
        />
        <DeckAddView v-else-if="selection.kind === 'add'" :section="selection.section" :draft="draft" @change="updateDraft" />
        <ReleaseView v-else-if="selection.kind === 'release'" :draft="draft" :checksClean="canExport" @export="exportPack" />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'

import { addToCouncil, aftershockUsers, createOwnScore, usesGameContent, newestRef, SCORES_PER_SCENARIO, toFillIn, COUNCIL_SEATS, createOwnCard, createOwnEvent, createOwnMember, isOwn, isOwnMember, memberOfReaction, PLACEHOLDER_NAMES, putContent, removeChangesTo, resolveNames as resolveRefNames, scenarioRefs, type DeckSection } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import { listBaseRefs, loadFirstParty } from '@studio/content/first_party'
import { PLAY_IT_LIVE, type PlayStatus } from '@studio/content/game_preview'
import { exportCurrentDraft, playCurrentDraft, studio, updateDraft, type ExportFormat } from '@studio/state/studio_state'
import ChecksButton from '@studio/workspace/checks_button.vue'
import type { IssueTarget } from '@studio/workspace/checks_panel.vue'
import ContentsNav from '@studio/workspace/contents_nav.vue'
import CouncilView from '@studio/workspace/council_view.vue'
import DeckAddView from '@studio/workspace/deck_add_view.vue'
import DeckItemView from '@studio/workspace/deck_item_view.vue'
import MemberView from '@studio/workspace/member_view.vue'
import PackDetailsEditor from '@studio/workspace/pack_details_editor.vue'
import ReleaseView from '@studio/workspace/release_view.vue'
import ScenarioEditor from '@studio/workspace/scenario_editor.vue'
import type { Selection } from '@studio/workspace/selection'
import SummaryView from '@studio/workspace/summary_view.vue'
import ScoreEditor from '@studio/workspace/score_editor.vue'

defineEmits<{ leave: [] }>()

type NameSection = 'scores' | 'stakeholders' | 'cards' | 'events'

const draft = computed(() => studio.current?.draft ?? null)
const scenarios = computed(() => Object.values(draft.value?.content.scenarios ?? {}))
/** A pack opens on its summary: where it stands and where to go next (slice 4). */
const selection = ref<Selection>({ kind: 'summary' })
/** What "Edit" goes back to: the last editor open, or the first scenario. */
const lastEdit = ref<Selection>(scenarios.value[0] ? { kind: 'scenario', id: scenarios.value[0].id } : { kind: 'details' })
const selectedScenario = computed(() => (selection.value.kind === 'scenario' ? draft.value?.content.scenarios[selection.value.id] : undefined))

const editorArea = ref<HTMLElement | null>(null)

/** Open an editor. Each opens at its top, since the editor column scrolls on its own. */
function select(next: Selection) {
  selection.value = next
  if (next.kind !== 'summary') lastEdit.value = next
  editorArea.value?.scrollTo?.({ top: 0 })
}

/** A release can give the open card, event or member a new version (M4.7): stay on it. */
watch(() => draft.value?.content, (content) => {
  const current = selection.value
  if (!content || (current.kind !== 'item' && current.kind !== 'member')) return
  const own = (current.kind === 'item' ? content[current.section] : content.stakeholders)[current.ref.id]
  if (own && own.version !== current.ref.version) select({ ...current, ref: { id: own.id, version: own.version } })
})

/** "Go to it" from the checks: open the editor, then move focus into it. */
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

/** Any item's name, for the sidebar. */
function nameOf(section: 'stakeholders' | DeckSection, ref: VersionRef): string {
  return section === 'stakeholders' ? memberName(ref) : itemName(section, ref)
}

async function focusEditor(selector = '.editor-area input, .editor-area textarea') {
  await nextTick()
  document.querySelector<HTMLElement>(selector)?.focus()
}

/** The pack's own scores, in the first scenario's order (M4.17). */
const ownScores = computed(() => (draft.value ? scenarioRefs(draft.value, 'score_refs').filter((ref) => draft.value!.content.scores[ref.id]).map((ref) => ({ id: ref.id, name: draft.value!.content.scores[ref.id].name })) : []))

/** "+ New score": made, tracked by every scenario, and opened with its name ready to type. */
async function createScore() {
  if (!draft.value) return
  const made = createOwnScore(draft.value)
  if (!made) return
  updateDraft(made.draft)
  select({ kind: 'score', id: made.id })
  await focusEditor()
  ;(document.activeElement as HTMLInputElement | null)?.select?.()
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

/** The deck's cards and events by name, whose each is (the domain's isOwn), for a member's page to connect from. */
const deckChoices = computed(() => decks.value.flatMap((deck) => deck.refs.map((ref) => ({ section: deck.section, ref, name: itemName(deck.section, ref), own: isOwn(draft.value!, deck.section, ref) }))))

/** The game's council members who aren't seated, by name: a picker can seat one and connect them (slice 3b). */
const gameMembers = ref<Array<{ ref: VersionRef; name: string }>>([])

async function loadGameMembers() {
  const seated = new Set(councilRefs.value.map((ref) => ref.id))
  const { base } = await loadFirstParty()
  const refs = (await listBaseRefs('stakeholders')).filter((ref) => !seated.has(ref.id))
  // The newest version of each (the domain's newestRef), as the council notes seat them
  const newest = [...new Set(refs.map((ref) => ref.id))].map((id) => newestRef(refs, id)!)
  gameMembers.value = await Promise.all(newest.map(async (ref) => ({ ref, name: await base.loadStakeholder(ref).then((member) => member.name, () => ref.id) })))
}

watch(() => councilRefs.value.map((ref) => ref.id).join(','), () => void loadGameMembers(), { immediate: true })

const saveText = computed(() => {
  if (!studio.persistent) return 'Not kept: export to save'
  return { saved: 'Saved in this browser', saving: 'Saving…', unsaved: 'Saving…', failed: "Couldn't save" }[studio.save]
})

/** The author's own items still to fill in, as sidebar keys ("cards/ours_x"), from the domain. */
const fillIn = computed(() => new Set(draft.value ? toFillIn(draft.value).map((item) => `${item.section}/${item.ref.id}`) : []))
/** How many cards, events, aftershocks and reactions change each member, from the last check. */
const changeCounts = computed(() => Object.fromEntries(Object.entries(studio.memberChanges).map(([id, sources]) => [id, sources.length])))

/** "Play it": what happened, in the toolbar (D15). */
const playing = ref(false)
const playText = ref(PLAY_IT_LIVE ? '' : 'Play it arrives with the launch')

const PLAY_WORDS: Record<PlayStatus['state'], string> = {
  opening: 'Opening the game…',
  playing: "Playing in the game's tab",
  refused: "The game refused it: see its tab",
  no_answer: "The game didn't answer: press Play it again",
  blocked: "Your browser blocked the game's tab: allow pop-ups here",
}

async function playIt() {
  playing.value = true
  playText.value = 'Preparing the pack…'
  try {
    const issues = await playCurrentDraft((status) => {
      playText.value = PLAY_WORDS[status.state]
    })
    if (issues.length > 0) playText.value = 'Fix what the checks list first'
  } finally {
    playing.value = false
  }
}

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
/*
 * The workspace fills the window below the header, and each column scrolls
 * on its own (the UI/UX audit, D23): the toolbar, the contents and the
 * editor never scroll each other out of view.
 */
.workspace {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.workspace-bar {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.875rem;
  padding: 0.625rem 1.5rem;
  border-bottom: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.bar-name {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.bar-save {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.view-switch {
  display: flex;
  margin-left: 0.5rem;
  border: 1px solid var(--forge-hairline-strong);
  border-radius: 999px;
  overflow: hidden;
}

.view-option {
  min-height: 2.25rem;
  padding: 0 0.875rem;
  border: none;
  background: transparent;
  color: var(--forge-text);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  cursor: pointer;
}

.view-option[aria-pressed='true'] {
  background: rgba(212, 184, 96, 0.18);
  color: var(--forge-text-bright);
  font-weight: 600;
}

.bar-play-status {
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.bar-tools {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  min-height: 0;
  display: flex;
}

.contents {
  flex: 0 0 17.5rem;
  overflow-y: auto;
  border-right: 1px solid var(--forge-hairline);
  background: var(--forge-rail);
}

.editor-area {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 1.75rem 2.25rem 2.5rem;
}

.editor-area:focus {
  outline: none;
}

/* A narrow window (a tablet held upright): the contents above the editor, the page scrolling as one */
@media (max-width: 48rem) {
  .workspace-body {
    flex-direction: column;
    min-height: auto;
  }

  .contents {
    flex: none;
    max-height: 18rem;
    border-right: none;
    border-bottom: 1px solid var(--forge-hairline);
  }

  .editor-area {
    overflow-y: visible;
    padding: 1.25rem 1.25rem 2rem;
  }
}
</style>
