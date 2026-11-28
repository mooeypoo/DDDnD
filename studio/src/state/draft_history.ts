/**
 * Undo and redo for the open draft (§6 item 6, M4.24). A history of whole
 * drafts: a draft is plain data, and every edit already produces a new one
 * (D22), so a step back is just the draft before.
 *
 * Typing a name is one step, not one per letter: edits less than
 * `GROUP_MS` apart join the step they follow. Pure, so it's tested without
 * a screen; the Studio's state holds one and resets it when a draft opens.
 */

import type { DraftPack } from '@/domains/authoring'

/** Edits closer together than this are one step to undo. */
export const GROUP_MS = 1000
/** Steps kept: enough for a session's mistakes, small enough to hold in memory. */
export const MAX_STEPS = 100

export interface DraftHistory {
  past: DraftPack[]
  future: DraftPack[]
  /** When the last edit was recorded, to group a burst of typing. */
  last_at: number
}

export function emptyHistory(): DraftHistory {
  return { past: [], future: [], last_at: -Infinity }
}

/**
 * An edit is about to replace `before`. A new step, or part of the one being
 * typed (or, with `sameStep`, part of the last step whenever it comes: a new
 * item's id following its name). Redo is gone either way.
 */
export function recordEdit(history: DraftHistory, before: DraftPack, at: number, options: { sameStep?: boolean } = {}): DraftHistory {
  const grouped = (options.sameStep || at - history.last_at < GROUP_MS) && history.past.length > 0
  const past = grouped ? history.past : [...history.past, before].slice(-MAX_STEPS)
  // Joining the last step doesn't restart the clock: what's typed next is its own step
  return { past, future: [], last_at: options.sameStep ? history.last_at : at }
}

/**
 * The draft before the last step, or null when there's nothing to undo.
 * What isn't the author's content stays as it is now: the guided round's
 * place (moving through the round isn't an edit to take back).
 */
export function undoEdit(history: DraftHistory, current: DraftPack): { history: DraftHistory; draft: DraftPack } | null {
  const previous = history.past[history.past.length - 1]
  if (!previous) return null
  return {
    history: { past: history.past.slice(0, -1), future: [current, ...history.future], last_at: -Infinity },
    draft: keepPlace(previous, current),
  }
}

export function redoEdit(history: DraftHistory, current: DraftPack): { history: DraftHistory; draft: DraftPack } | null {
  const [next, ...rest] = history.future
  if (!next) return null
  return {
    history: { past: [...history.past, current].slice(-MAX_STEPS), future: rest, last_at: -Infinity },
    draft: keepPlace(next, current),
  }
}

function keepPlace(draft: DraftPack, current: DraftPack): DraftPack {
  const { round: _round, ...rest } = draft
  return current.round ? { ...rest, round: current.round } : rest
}
