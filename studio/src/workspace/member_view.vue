<template>
  <div v-if="member" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Council member · {{ own ? 'yours' : 'from the game' }}</span>
        <h1 class="editor-title">{{ member.name || 'Unnamed council member' }}</h1>
      </div>
      <div class="head-actions">
        <button v-if="!own" type="button" class="button button-quiet" :disabled="councilFull" @click="copyToNewMember">Copy to a new member</button>
        <button
          v-if="!confirmingRemoval"
          type="button"
          class="button"
          :class="own ? 'button-danger' : 'button-quiet'"
          :disabled="lastSeat"
          @click="confirmingRemoval = true"
        >{{ own ? 'Delete' : 'Take out of this pack' }}</button>
      </div>
      <p v-if="lastSeat" class="field-hint head-confirm">A council needs at least one member: seat someone else before taking {{ member.name || 'them' }} out.</p>
      <p v-else-if="!own && councilFull" class="field-hint head-confirm">Every seat is taken: take someone out to make room for a copy.</p>
      <RemoveMember
        v-if="confirmingRemoval"
        class="head-confirm"
        :draft="draft"
        :memberRef="memberRef"
        :name="member.name"
        :own="own"
        @cancel="confirmingRemoval = false"
        @remove="remove"
      />
    </div>

    <!-- The game's own: read-only. Why, and what to do instead (D21) -->
    <template v-if="!own">
      <div class="locked-note" role="note">
        <p>They react exactly as in DDDnD. To change them, copy them to a new member.</p>
        <details class="why-more">
          <summary>Why?</summary>
          <p>The game's cards and events refer to its council members, so they can't be edited here. A copy starts with the same description and reactions, and you can edit all of it. The game's cards and events don't affect the copy; only your own do. If you don't want {{ member.name }} at your table, take them out.</p>
        </details>
      </div>
      <section class="editor-section" aria-labelledby="member-about">
        <h2 id="member-about" class="editor-section-title">Who they are</h2>
        <p class="read-text">{{ member.description }}</p>
      </section>
      <section class="editor-section" aria-labelledby="member-reactions-read">
        <h2 id="member-reactions-read" class="editor-section-title">How they react</h2>
        <p v-if="reactions.length === 0" class="field-hint">They have no reactions of their own: only cards and events move them.</p>
        <ul v-else class="reaction-read-list">
          <li v-for="rule in reactions" :key="rule.id" class="plain">
            <span class="plain-lead">{{ rule.name }}.</span>
            When {{ conditionWords(rule) }}: {{ effectWords(rule) }}.
          </li>
        </ul>
        <p class="field-hint">Every reaction whose condition holds happens once a turn, after the card and any event.</p>
      </section>
    </template>

    <!-- The draft's own: the editor -->
    <template v-else>
      <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>
      <section class="editor-section" aria-labelledby="member-words">
        <h2 id="member-words" class="editor-section-title">Who they are</h2>
        <label class="field">Name
          <input :value="member.name" :maxlength="limits.text.name" @input="setMember({ name: text($event) })" @change="settleMember" />
          <span class="field-hint">A role, so it reads well at any table: "Head of Payments", not a person's name.</span>
        </label>
        <label class="field">What they care about, in a sentence
          <textarea :value="member.description" rows="2" :maxlength="limits.text.description" @input="setMember({ description: text($event) })"></textarea>
        </label>
        <label class="field">One-line summary (optional)
          <input :value="member.short_description ?? ''" :maxlength="limits.text.short_description" @input="setSummary(text($event))" />
        </label>
      </section>

      <section class="editor-section" aria-labelledby="member-reactions">
        <h2 id="member-reactions" class="editor-section-title">How they react</h2>
        <p class="field-hint">
          A reaction waits for a score to cross a line, then changes how they feel (and maybe the scores). Every reaction
          whose condition holds happens once a turn, after the card and any event. Cards and events can move them too:
          pick them under "Council" when editing your own cards.
        </p>

        <!-- Keyed by place, not id: naming a reaction settles its id, and the fields must stay put (focus) -->
        <article v-for="(rule, index) in ownReactions" :key="index" class="reaction" :aria-labelledby="`reaction-${index}`">
          <h3 :id="`reaction-${index}`" class="reaction-title">{{ rule.name || 'Unnamed reaction' }}</h3>
          <label class="field">Name
            <input :value="rule.name" :maxlength="limits.text.name" @input="setRule(rule, { name: text($event) })" @change="settleRule(rule.id)" />
          </label>
          <label class="field">What happens, in a sentence
            <input :value="rule.description" :maxlength="limits.text.description" @input="setRule(rule, { description: text($event) })" />
          </label>

          <ConditionEditor :condition="rule.condition" :scoreOptions="scoreOptions" @change="(patch) => setCondition(rule, patch)" />

          <EffectsEditor
            :scoreChanges="rule.score_changes"
            :stakeholderChanges="rule.stakeholder_changes ?? []"
            :scoreOptions="scoreOptions"
            :stakeholderOptions="stakeholderOptions"
            @change="(effects) => setRuleEffects(rule, effects)"
          />
          <p class="plain"><span class="plain-lead">In plain words:</span> when {{ conditionWords(rule) }}: {{ effectWords(rule) }}.</p>
          <button type="button" class="effect-remove" @click="dropReaction(rule.id)">Delete this reaction</button>
        </article>

        <button type="button" class="button button-quiet add-reaction" :disabled="scoreOptions.length === 0" @click="newReaction">+ Add a reaction</button>
      </section>

    </template>

    <!-- Connections from the other side (slice 3): everything that changes their satisfaction, each a link to it -->
    <section class="editor-section" aria-labelledby="member-changed-by">
      <h2 id="member-changed-by" class="editor-section-title">What changes their satisfaction</h2>
      <p v-if="sources.length === 0" class="field-hint">
        Nothing yet. Give one of your cards or events a change to {{ member.name || 'them' }} under “When played”, or give them a reaction.
      </p>
      <ul v-else class="source-list">
        <li v-for="source in sources" :key="`${source.section}/${source.ref.id}-v${source.ref.version}`" class="source-row">
          <span class="source-what">
            <button v-if="targetOf(source)" type="button" class="source-link" @click="emit('open', targetOf(source)!)">{{ source.name }}</button>
            <span v-else class="source-name">{{ source.name }}</span>
            <span class="source-kind">{{ kindOf(source) }}</span>
          </span>
          <span class="source-delta" :class="source.delta > 0 ? 'tone-up' : 'tone-down'">{{ signedDelta(source.delta) }} {{ SATISFACTION_WORD }}</span>
        </li>
      </ul>
      <p v-if="own" class="field-hint">The game's own cards and events don't change members you create. To have one of them change {{ member.name || 'this member' }}, make your own version of it.</p>
    </section>
  </div>
  <p v-else class="loading" role="status">Loading…</p>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import {
  addReaction,
  SATISFACTION_WORD,
  signedDelta,
  toFillIn,
  type ChangeSource,
  copyMember,
  COUNCIL_SEATS,
  describeCondition,
  describeEffects,
  isOwnMember,
  putContent,
  removeFromCouncil,
  removeReaction,
  setReactionCondition,
  settleNewMemberId,
  settleNewReactionId,
  withEffects,
  withOptionalText,
  type DraftPack,
} from '@/domains/authoring'
import type { NumericCondition, ScoreChange, Stakeholder, StakeholderChange, StakeholderReactionRule, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { loadFirstParty } from '@studio/content/first_party'
import ConditionEditor from '@studio/workspace/condition_editor.vue'
import EffectsEditor from '@studio/workspace/effects_editor.vue'
import RemoveMember from '@studio/workspace/remove_member.vue'
import type { Selection } from '@studio/workspace/selection'

interface Option { id: string; name: string }

const props = defineProps<{
  memberRef: VersionRef
  draft: DraftPack
  scoreOptions: Option[]
  stakeholderOptions: Option[]
  /** What changes this member's satisfaction (the domain's walk, from the last check). */
  changes: ChangeSource[]
}>()
const emit = defineEmits<{ change: [draft: DraftPack]; select: [ref: VersionRef | null]; open: [selection: Selection] }>()

/** Their sources, the author's own first. */
const sources = computed(() => [...props.changes.filter((source) => source.own), ...props.changes.filter((source) => !source.own)])

/** Where a source is edited: a card or event; an aftershock's card or event; another member's reaction on their page. */
function targetOf(source: ChangeSource): Selection | null {
  if (source.section === 'cards' || source.section === 'events') return { kind: 'item', section: source.section, ref: source.ref }
  if (source.section === 'delayed_effects' && source.via && source.via.section !== 'stakeholders') return { kind: 'item', section: source.via.section, ref: source.via.ref }
  if (source.section === 'stakeholder_reaction_rules' && source.via && source.via.ref.id !== props.memberRef.id) return { kind: 'member', ref: source.via.ref }
  return null
}

function kindOf(source: ChangeSource): string {
  const whose = source.own ? 'yours' : "the game's"
  if (source.section === 'cards') return `card · ${whose}`
  if (source.section === 'events') return `event · ${whose}`
  if (source.section === 'delayed_effects') return `aftershock of ${source.via?.name ?? 'a card'}`
  return source.via?.ref.id === props.memberRef.id ? 'their own reaction' : `${source.via?.name ?? 'a member'}'s reaction`
}

/** What the domain says this member still needs, in words (toFillIn). */
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((item) => item.section === 'stakeholders' && item.ref.id === props.memberRef.id)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of their own' : 'what they care about'))
})

const limits = CONTENT_LIMITS
const own = computed(() => isOwnMember(props.draft, props.memberRef))
const baseMember = ref<Stakeholder | null>(null)
const baseReactions = ref<StakeholderReactionRule[]>([])
const member = computed<Stakeholder | null>(() => (own.value ? props.draft.content.stakeholders[props.memberRef.id] : baseMember.value))
const ownReactions = computed(() => (own.value && member.value
  ? member.value.reaction_rule_refs.map((ref) => props.draft.content.stakeholder_reaction_rules[ref.id]).filter((rule) => rule !== undefined)
  : []))
const reactions = computed(() => (own.value ? ownReactions.value : baseReactions.value))
const lastSeat = computed(() => props.stakeholderOptions.length <= 1)
const councilFull = computed(() => props.stakeholderOptions.length >= COUNCIL_SEATS)

/** Taking them out or deleting them asks first, under the head. */
const confirmingRemoval = ref(false)
watch(() => props.memberRef.id, () => {
  confirmingRemoval.value = false
})

watch(() => [props.memberRef.id, props.memberRef.version, own.value], async () => {
  const wanted = props.memberRef.id
  baseMember.value = null
  baseReactions.value = []
  if (own.value) return
  const { base } = await loadFirstParty()
  const loaded = await base.loadStakeholder(props.memberRef)
  const rules = await Promise.all(loaded.reaction_rule_refs.map((ref) => base.loadStakeholderReactionRule(ref)))
  // The view is reused across members: a slow load for the last one mustn't land on this one
  if (props.memberRef.id !== wanted) return
  baseReactions.value = rules
  baseMember.value = loaded
}, { immediate: true })

const names = computed(() => ({
  scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])),
  stakeholders: { ...Object.fromEntries(props.stakeholderOptions.map((option) => [option.id, option.name])), ...(member.value ? { [props.memberRef.id]: member.value.name } : {}) },
}))

function targetName(condition: NumericCondition): string {
  return (condition.target_type === 'score' ? names.value.scores : names.value.stakeholders)[condition.target_id] ?? condition.target_id
}

function conditionWords(rule: StakeholderReactionRule): string {
  return describeCondition(rule.condition, targetName(rule.condition))
}

function effectWords(rule: StakeholderReactionRule): string {
  return describeEffects(rule, names.value)
}

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function setMember(fields: Partial<Stakeholder>) {
  if (member.value) emit('change', putContent(props.draft, 'stakeholders', { ...member.value, ...fields }))
}

function setSummary(value: string) {
  if (member.value) emit('change', putContent(props.draft, 'stakeholders', withOptionalText(member.value, 'short_description', value)))
}

/** Once a new member is named, they get the id of their name (ids show in the pack's files). */
function settleMember() {
  const settled = settleNewMemberId(props.draft, props.memberRef.id)
  if (settled.id === props.memberRef.id) return
  emit('change', settled.draft)
  emit('select', { id: settled.id, version: props.memberRef.version })
}

function setRule(rule: StakeholderReactionRule, fields: Partial<StakeholderReactionRule>) {
  emit('change', putContent(props.draft, 'stakeholder_reaction_rules', { ...rule, ...fields }))
}

function setCondition(rule: StakeholderReactionRule, patch: Partial<NumericCondition>) {
  const condition = { ...rule.condition, ...patch }
  emit('change', setReactionCondition(props.draft, rule.id, condition, targetName(condition)))
}

function setRuleEffects(rule: StakeholderReactionRule, effects: { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }) {
  emit('change', putContent(props.draft, 'stakeholder_reaction_rules', withEffects(rule, effects)))
}

function settleRule(ruleId: string) {
  const settled = settleNewReactionId(props.draft, props.memberRef.id, ruleId)
  if (settled.id !== ruleId) emit('change', settled.draft)
}

async function newReaction() {
  const score = props.scoreOptions[0]
  if (!score) return
  emit('change', addReaction(props.draft, props.memberRef.id, score).draft)
  await nextTick()
  const nameInput = document.querySelector<HTMLInputElement>('.reaction:last-of-type .field input')
  nameInput?.focus()
  nameInput?.select()
}

function dropReaction(ruleId: string) {
  emit('change', removeReaction(props.draft, props.memberRef.id, ruleId))
}

/** A new member of the draft's own, started from this one (D21): opened, ready to edit. */
function copyToNewMember() {
  if (!baseMember.value) return
  const copied = copyMember(props.draft, baseMember.value, baseReactions.value)
  emit('change', copied.draft)
  emit('select', { id: copied.id, version: 1 })
}

function remove() {
  emit('change', removeFromCouncil(props.draft, props.memberRef))
  emit('select', null)
}
</script>

<style scoped>
.source-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.source-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 0.25rem 1rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: var(--forge-ground);
}

.source-what {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.625rem;
  min-width: 0;
}

.source-link {
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-gold);
  font: inherit;
  text-align: left;
  text-decoration: underline;
  cursor: pointer;
}

.source-name {
  color: var(--forge-text-bright);
}

.source-kind {
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}

.source-delta {
  font-weight: 600;
  white-space: nowrap;
}

.tone-up { color: var(--forge-up); }
.tone-down { color: var(--forge-down); }




.read-text {
  margin: 0;
  color: var(--forge-text-bright);
}

.reaction-read-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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

.reaction {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem 1.125rem;
  border-radius: 0.625rem;
  border: 1px solid var(--forge-hairline);
  background: var(--forge-ground);
}

.reaction-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.effect-remove {
  align-self: flex-start;
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

.add-reaction {
  align-self: flex-start;
}

.loading {
  margin: 0;
}
</style>
