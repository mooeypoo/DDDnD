/**
 * What the workspace has open: one editor at a time, chosen from the
 * contents sidebar, a check's "Go to it", or an editor's own links.
 */
import { scenarioRefs, type DeckSection, type DraftPack, type RoundStep } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'

export type Selection =
  | { kind: 'summary' }
  | { kind: 'details' }
  | { kind: 'scenario'; id: string }
  | { kind: 'score'; id: string }
  | { kind: 'endings' }
  | { kind: 'ending'; id: string }
  | { kind: 'class'; id: string }
  | { kind: 'challenge'; id: string }
  | { kind: 'coupling'; id: string }
  | { kind: 'council' }
  | { kind: 'member'; ref: VersionRef }
  | { kind: 'item'; section: DeckSection; ref: VersionRef }
  | { kind: 'add'; section: DeckSection }
  | { kind: 'release' }
  /** The guided round's own panel for a step (§5): a first card or event, the checks, playing. */
  | { kind: 'round'; step: RoundStep }

/** True when `selection` is the given scenario, council page, member, item or "add from the game" page. */
export function isSelected(selection: Selection, target: Selection): boolean {
  if (selection.kind !== target.kind) return false
  switch (target.kind) {
    case 'scenario':
    case 'score':
    case 'ending':
    case 'class':
    case 'challenge':
    case 'coupling':
      return (selection as typeof target).id === target.id
    case 'member':
      return (selection as typeof target).ref.id === target.ref.id
    case 'item': {
      const current = selection as typeof target
      return current.section === target.section && current.ref.id === target.ref.id && current.ref.version === target.ref.version
    }
    case 'add':
      return (selection as typeof target).section === target.section
    case 'round':
      return (selection as typeof target).step === target.step
    default:
      return true
  }
}

/**
 * True while what's open is still in the draft. Undo (M4.24) can take back
 * the card or ending an editor shows; the workspace then opens the summary.
 */
export function stillThere(draft: DraftPack, selection: Selection): boolean {
  const { content } = draft
  switch (selection.kind) {
    case 'scenario': return selection.id in content.scenarios
    case 'score': return selection.id in content.scores
    case 'ending': return selection.id in content.outcome_archetypes
    case 'class': return selection.id in content.classes
    case 'challenge': return selection.id in content.challenge_modifiers
    case 'coupling': return selection.id in content.coupling_rules
    case 'member': return scenarioRefs(draft, 'stakeholder_refs').some((ref) => ref.id === selection.ref.id)
    case 'item': return scenarioRefs(draft, selection.section === 'cards' ? 'card_refs' : 'event_refs').some((ref) => ref.id === selection.ref.id)
    default: return true
  }
}
