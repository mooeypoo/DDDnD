/**
 * Presentation helpers for replacing a hand card from the archives.
 *
 * Consult may name a remaining deck card (`draw_id`). Random replacement
 * peeks the current briefing deck order so the approval can name both pages
 * before the engine spends the turn. Forced unplayable refills still diff
 * the briefing hands after the engine has already drawn.
 */

export interface ArchiveReplaceCard {
  id: string
  name: string
}

export type ArchiveReplaceKind = 'consult' | 'forced'

export type ArchiveReplacePhase = 'confirm' | 'reveal'

export interface ArchiveReplaceOffer {
  kind: ArchiveReplaceKind
  phase: ArchiveReplacePhase
  outgoing: ArchiveReplaceCard[]
  incoming: ArchiveReplaceCard[]
  canCancel: boolean
  swapping: boolean
}

export interface HandSwapDiff {
  departedIds: string[]
  arrivedIds: string[]
  unplayableDepartedIds: string[]
}

/**
 * Diffs the legal hand before and after an engine turn.
 *
 * `playedId` / `discardedId` are player commitments, not silent drops.
 * Remaining departed ids are cards the engine removed because they were
 * no longer playable.
 */
export function diffHandCards(
  previousIds: string[],
  nextIds: string[],
  options: { playedId?: string | null; discardedId?: string | null } = {},
): HandSwapDiff {
  const next = new Set(nextIds)
  const previous = new Set(previousIds)
  const departedIds = previousIds.filter((id) => !next.has(id))
  const arrivedIds = nextIds.filter((id) => !previous.has(id))
  const committed = new Set(
    [options.playedId, options.discardedId].filter((id): id is string => Boolean(id)),
  )

  return {
    departedIds,
    arrivedIds,
    unplayableDepartedIds: departedIds.filter((id) => !committed.has(id)),
  }
}

export function consultReplaceSummary(outgoingName: string | null, incomingName: string | null): string {
  if (outgoingName && incomingName) {
    return `You set aside ${outgoingName}. ${incomingName} took its place.`
  }

  if (outgoingName) {
    return `You set aside ${outgoingName}.`
  }

  return 'You searched the remaining options instead of committing an architectural move.'
}

export function consultApprovalTitle(outgoingName: string, incomingName: string): string {
  return `${outgoingName} replaced by ${incomingName}`
}

/**
 * Names the page a random consult would pull: first still-legal deck card,
 * otherwise the front of the remaining deck.
 */
export function peekConsultDrawId(
  deckIds: string[],
  playableDeckIds: string[] = deckIds,
): string | null {
  const playable = new Set(playableDeckIds)
  return deckIds.find((id) => playable.has(id)) ?? deckIds[0] ?? null
}
