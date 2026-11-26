/**
 * What the workspace has open: one editor at a time, chosen from the
 * contents sidebar, a check's "Go to it", or an editor's own links.
 */
import type { DeckSection } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'

export type Selection =
  | { kind: 'summary' }
  | { kind: 'details' }
  | { kind: 'scenario'; id: string }
  | { kind: 'score'; id: string }
  | { kind: 'council' }
  | { kind: 'member'; ref: VersionRef }
  | { kind: 'item'; section: DeckSection; ref: VersionRef }
  | { kind: 'add'; section: DeckSection }
  | { kind: 'release' }

/** True when `selection` is the given scenario, council page, member, item or "add from the game" page. */
export function isSelected(selection: Selection, target: Selection): boolean {
  if (selection.kind !== target.kind) return false
  switch (target.kind) {
    case 'scenario':
    case 'score':
      return (selection as typeof target).id === target.id
    case 'member':
      return (selection as typeof target).ref.id === target.ref.id
    case 'item': {
      const current = selection as typeof target
      return current.section === target.section && current.ref.id === target.ref.id && current.ref.version === target.ref.version
    }
    case 'add':
      return (selection as typeof target).section === target.section
    default:
      return true
  }
}
