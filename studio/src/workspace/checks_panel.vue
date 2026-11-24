<template>
  <!--
    The Checks rail (§4.1): what the game would say if this pack were imported
    now. The status is a polite live region, so screen-reader users hear
    changes without losing their place (§10).
  -->
  <aside class="checks" aria-labelledby="checks-title">
    <h2 id="checks-title" class="checks-title">Checks</h2>
    <p class="checks-status" :class="`status-${statusKind}`" role="status" aria-live="polite">{{ statusText }}</p>

    <ul v-if="issues.length > 0" class="issue-list">
      <li v-for="(issue, index) in issues" :key="index" class="issue">
        <span class="issue-where">{{ where(issue.file) }}</span>
        <span class="issue-text">{{ friendly(issue) }}</span>
        <button v-if="target(issue.file)" type="button" class="issue-go" @click="$emit('goTo', target(issue.file)!)">Go to it ›</button>
      </li>
    </ul>

    <p class="checks-note">
      These are the game's own checks, the same ones a player's import runs.
      A pack exports only when they all pass.
    </p>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { issueSubject, type DraftSection, type PackIssue } from '@/domains/authoring'
import type { CheckState } from '@studio/state/studio_state'

const props = defineProps<{ state: CheckState; issues: PackIssue[] }>()
defineEmits<{ goTo: [target: IssueTarget] }>()

/** Where a problem can be fixed in the Studio, when there's an editor for it. */
export type IssueTarget =
  | { kind: 'details' }
  | { kind: 'scenario'; id: string }
  | { kind: 'item'; section: 'cards' | 'events'; ref: { id: string; version: number } }
  | { kind: 'member'; ref: { id: string; version: number } }
  | { kind: 'reaction'; id: string }

/** The Studio's editor for what an issue is about, if it has one. */
function target(file: string): IssueTarget | null {
  const subject = issueSubject(file)
  if (!subject) return null
  if (subject.kind === 'manifest') return { kind: 'details' }
  const { section, ref } = subject
  if (section === 'scenarios') return { kind: 'scenario', id: ref.id }
  if (section === 'stakeholders') return { kind: 'member', ref }
  if (section === 'stakeholder_reaction_rules') return { kind: 'reaction', id: ref.id }
  if (section === 'cards' || section === 'events') return { kind: 'item', section, ref }
  return null
}

const statusKind = computed(() => {
  if (props.state === 'checking' || props.state === 'idle') return 'pending'
  return props.issues.length === 0 ? 'ok' : 'problems'
})

const statusText = computed(() => {
  if (props.state === 'checking' || props.state === 'idle') return 'Checking…'
  if (props.issues.length === 0) return 'Ready to export'
  return props.issues.length === 1 ? '1 thing to fix before export' : `${props.issues.length} things to fix before export`
})

/** Where the problem is, in the Studio's words. */
function where(file: string): string {
  const subject = issueSubject(file)
  if (subject?.kind === 'manifest') return 'Pack details'
  const names: Partial<Record<DraftSection, string>> = {
    scenarios: 'Scenario',
    cards: 'Card',
    events: 'Event',
    stakeholders: 'Council member',
    stakeholder_reaction_rules: 'Reaction',
    delayed_effects: 'Aftershock',
  }
  return (subject?.kind === 'content' && names[subject.section]) || 'Pack'
}

/** The validator's wording for the commonest problems, said plainly. */
function friendly(issue: PackIssue): string {
  const { file, message } = issue
  const pack = file === 'manifest.json'
  if (/^authors: must be at least 1/.test(message)) return 'Add your name as the author.'
  if (/^description: must not be blank/.test(message)) {
    if (pack) return 'Add a description of the pack.'
    if (file.startsWith('stakeholders/')) return 'Add a description: who they are and what they care about.'
    return 'Add a description: what it does, in a sentence.'
  }
  if (/^name: must not be blank/.test(message)) return pack ? 'Give the pack a name.' : 'Give it a name.'
  return message
}
</script>

<style scoped>
.checks {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.checks-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--forge-text-bright);
}

.checks-status {
  margin: 0;
  padding: 0.625rem 0.875rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.status-pending {
  border: 1px solid var(--forge-hairline);
  color: var(--forge-text-secondary);
}

.status-ok {
  border: 1px solid rgba(143, 209, 143, 0.5);
  color: var(--forge-up);
}

.status-problems {
  border: 1px solid rgba(239, 138, 106, 0.55);
  color: var(--forge-down);
}

.issue-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.issue {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.625rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(239, 138, 106, 0.4);
  background: rgba(239, 138, 106, 0.07);
}

.issue-where {
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--forge-down);
}

.issue-text {
  color: var(--forge-text-bright);
  font-size: 0.9375rem;
  overflow-wrap: anywhere;
}

.issue-go {
  align-self: flex-start;
  min-height: 2rem;
  margin-top: 0.125rem;
  padding: 0;
  border: none;
  background: none;
  color: var(--forge-down);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  text-decoration: underline;
  cursor: pointer;
}

.checks-note {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--forge-text-secondary);
}
</style>
