<template>
  <div v-if="member" class="editor">
    <div class="editor-head">
      <span class="editor-kicker">Council member · {{ own ? 'yours' : 'from the game' }}</span>
      <h1 class="editor-title">{{ member.name || 'Unnamed council member' }}</h1>
    </div>

    <!-- The game's own: read-only. Why, and what to do instead (D21) -->
    <template v-if="!own">
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
      <div class="why" role="note">
        <p><strong>You can't edit the game's council members.</strong> Many of the game's cards and events change how {{ member.name }} feels. An edited version would be a new person to the game, so those cards would no longer affect them.</p>
        <p>To change who's at the table, take them out and seat your own member in their place. To change how a card treats them, make your own version of the card.</p>
      </div>
      <RemoveMember :draft="draft" :memberRef="memberRef" :name="member.name" :own="false" :lastSeat="lastSeat" @remove="remove" />
    </template>

    <!-- The draft's own: the editor -->
    <template v-else>
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

          <fieldset class="condition">
            <legend class="condition-legend">When</legend>
            <label class="effect-field">
              <span class="visually-hidden">Score</span>
              <select :value="rule.condition.target_id" @change="setCondition(rule, { target_id: selectValue($event), target_type: 'score' })">
                <option v-for="option in scoreOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
              </select>
            </label>
            <label class="effect-field">
              <span class="visually-hidden">Comparison</span>
              <select :value="rule.condition.operator" @change="setCondition(rule, { operator: selectValue($event) as never })">
                <option v-for="(words, operator) in CONDITION_WORDS" :key="operator" :value="operator">{{ words }}</option>
              </select>
            </label>
            <label class="effect-field effect-amount">
              <span class="visually-hidden">Value, 0 to 100</span>
              <input type="number" min="0" max="100" step="1" :value="rule.condition.value" @change="setConditionValue(rule, $event)" />
            </label>
          </fieldset>

          <EffectsEditor
            :scoreChanges="rule.score_changes"
            :stakeholderChanges="rule.stakeholder_changes ?? []"
            :scoreOptions="scoreOptions"
            :stakeholderOptions="stakeholderOptions"
            @change="(effects) => setRuleEffects(rule, effects)"
          />
          <p class="plain"><span class="plain-lead">In plain words:</span> when {{ conditionWords(rule) }}, this {{ effectWords(rule) }}.</p>
          <button type="button" class="effect-remove" @click="dropReaction(rule.id)">Remove this reaction</button>
        </article>

        <button type="button" class="button button-quiet add-reaction" :disabled="scoreOptions.length === 0" @click="newReaction">+ Add a reaction</button>
      </section>

      <RemoveMember :draft="draft" :memberRef="memberRef" :name="member.name" :own="true" :lastSeat="lastSeat" @remove="remove" />
    </template>
  </div>
  <p v-else class="loading" role="status">Loading…</p>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

import {
  addReaction,
  CONDITION_WORDS,
  describeCondition,
  describeEffects,
  isOwnMember,
  putContent,
  removeFromCouncil,
  removeReaction,
  setReactionCondition,
  settleNewMemberId,
  settleNewReactionId,
  type DraftPack,
} from '@/domains/authoring'
import type { NumericCondition, ScoreChange, Stakeholder, StakeholderChange, StakeholderReactionRule, VersionRef } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { loadFirstParty } from '@studio/content/first_party'
import EffectsEditor from '@studio/workspace/effects_editor.vue'
import RemoveMember from '@studio/workspace/remove_member.vue'

interface Option { id: string; name: string }

const props = defineProps<{
  memberRef: VersionRef
  draft: DraftPack
  scoreOptions: Option[]
  stakeholderOptions: Option[]
}>()
const emit = defineEmits<{ change: [draft: DraftPack]; select: [ref: VersionRef | null] }>()

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

function selectValue(event: Event): string {
  return (event.target as HTMLSelectElement).value
}

function setMember(fields: Partial<Stakeholder>) {
  if (member.value) emit('change', putContent(props.draft, 'stakeholders', { ...member.value, ...fields }))
}

function setSummary(value: string) {
  if (!member.value) return
  const next = { ...member.value }
  if (value.trim()) next.short_description = value
  else delete next.short_description
  emit('change', putContent(props.draft, 'stakeholders', next))
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

function setConditionValue(rule: StakeholderReactionRule, event: Event) {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  if (Number.isFinite(parsed)) setCondition(rule, { value: Math.min(100, Math.max(0, parsed)) })
}

function setRuleEffects(rule: StakeholderReactionRule, effects: { score_changes: ScoreChange[]; stakeholder_changes: StakeholderChange[] }) {
  const next: StakeholderReactionRule = { ...rule, score_changes: effects.score_changes }
  if (effects.stakeholder_changes.length) next.stakeholder_changes = effects.stakeholder_changes
  else delete next.stakeholder_changes
  emit('change', putContent(props.draft, 'stakeholder_reaction_rules', next))
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

function remove() {
  emit('change', removeFromCouncil(props.draft, props.memberRef))
  emit('select', null)
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

.why {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 44rem;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(108, 199, 187, 0.45);
  background: rgba(108, 199, 187, 0.06);
}

.why p {
  margin: 0;
}

.why strong {
  color: var(--forge-text-bright);
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

.condition {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  padding: 0;
  border: none;
}

.condition-legend {
  float: left;
  margin-right: 0.25rem;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.effect-field select,
.effect-field input {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-panel);
  color: var(--forge-text-bright);
  font-family: var(--forge-font-body);
  font-size: 1rem;
}

.effect-amount input {
  width: 5.5rem;
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
