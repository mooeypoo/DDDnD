<template>
  <!--
    The checks, in the toolbar at every width (the UI/UX audit, D23): a
    button that says how the pack stands, opening a panel with the game's
    checks and the council notes. The button's status is a polite live
    region, so a screen reader hears "2 to fix" without opening anything
    (§10). Escape or a click outside closes the panel.
  -->
  <div ref="root" class="checks-menu" @keydown.escape.stop="close(true)">
    <button
      ref="toggle"
      type="button"
      class="checks-toggle"
      :class="`status-${statusKind}`"
      :aria-expanded="open"
      aria-controls="checks-panel"
      @click="open ? close(false) : show()"
    >
      <span class="dot" aria-hidden="true"></span>
      <span class="visually-hidden">Checks: </span>
      <span>{{ shortText }}</span>
      <span v-if="notes.length > 0" class="notes-count">· {{ notes.length === 1 ? '1 note' : `${notes.length} notes` }}</span>
    </button>
    <span class="visually-hidden" role="status" aria-live="polite">{{ announced }}</span>

    <div v-if="open" id="checks-panel" ref="panel" class="checks-popover" role="region" aria-label="Checks and notes">
      <ChecksPanel :state="state" :issues="issues" :live="false" @goTo="goTo" />
      <CouncilNotesPanel
        :notes="notes"
        :full="full"
        @seat="(memberRef) => $emit('seat', memberRef)"
        @removeChange="(change) => $emit('removeChange', change)"
        @goTo="goTo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'

import type { NoteSection, PackIssue } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'
import type { CheckState, CouncilNote } from '@studio/state/studio_state'
import ChecksPanel, { type IssueTarget } from '@studio/workspace/checks_panel.vue'
import CouncilNotesPanel from '@studio/workspace/council_notes_panel.vue'

const props = defineProps<{ state: CheckState; issues: PackIssue[]; notes: CouncilNote[]; full: boolean }>()
const emit = defineEmits<{
  goTo: [target: IssueTarget]
  seat: [ref: VersionRef]
  removeChange: [change: { section: NoteSection; id: string; stakeholderId: string }]
}>()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const toggle = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

const statusKind = computed(() => {
  if (props.state === 'checking' || props.state === 'idle') return 'pending'
  return props.issues.length === 0 ? 'ok' : 'problems'
})

const shortText = computed(() => {
  if (statusKind.value === 'pending') return 'Checking…'
  if (statusKind.value === 'ok') return 'Ready to export'
  return `${props.issues.length} to fix`
})

/** What a screen reader hears when the checks settle. Silent while checking, so typing isn't interrupted. */
const announced = computed(() => {
  if (statusKind.value === 'pending') return ''
  const fix = statusKind.value === 'ok' ? 'Ready to export' : props.issues.length === 1 ? '1 thing to fix before export' : `${props.issues.length} things to fix before export`
  return props.notes.length > 0 ? `${fix}. ${props.notes.length === 1 ? '1 note' : `${props.notes.length} notes`}.` : fix
})

function onOutside(event: PointerEvent) {
  if (root.value && !root.value.contains(event.target as Node)) close(false)
}

async function show() {
  open.value = true
  document.addEventListener('pointerdown', onOutside)
  await nextTick()
  panel.value?.querySelector<HTMLElement>('button, [href]')?.focus()
}

function close(returnFocus: boolean) {
  if (!open.value) return
  open.value = false
  document.removeEventListener('pointerdown', onOutside)
  if (returnFocus) toggle.value?.focus()
}

/** "Go to it" closes the panel; the workspace then moves focus into the editor. */
function goTo(target: IssueTarget) {
  close(false)
  emit('goTo', target)
}

onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside))
</script>

<style scoped>
.checks-menu {
  position: relative;
}

.checks-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0 0.875rem;
  border-radius: 999px;
  border: 1px solid var(--forge-hairline-strong);
  background: transparent;
  color: var(--forge-text-secondary);
  font-family: var(--forge-font-body);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

.checks-toggle.status-ok {
  border-color: rgba(143, 209, 143, 0.5);
  color: var(--forge-up);
}

.checks-toggle.status-problems {
  border-color: rgba(239, 138, 106, 0.6);
  color: var(--forge-down);
}

.checks-toggle[aria-expanded='true'] {
  background: var(--forge-panel);
}

.dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}

.notes-count {
  font-weight: 500;
  color: var(--forge-warning);
}

.checks-popover {
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 20;
  width: min(24rem, calc(100vw - 2rem));
  max-height: min(36rem, calc(100dvh - 9rem));
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1rem 1.125rem;
  border-radius: 0.75rem;
  border: 1px solid var(--forge-hairline-strong);
  background: var(--forge-panel);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.5);
}
</style>
