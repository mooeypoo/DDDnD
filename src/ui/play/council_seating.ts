/**
 * Who sits at the war table when the council is bigger than the table.
 *
 * The table has room for a few seats (fewer on narrow screens). With more
 * stakeholders than seats, the seats go to the most recently active ones,
 * and the rest wait in an "other council members" list. A stakeholder is
 * active on a turn when their satisfaction changed or they reacted.
 *
 * Seating is replayed from the run's history, so it is the same after a
 * reload. Seats are stable: a stakeholder who becomes active takes the seat
 * of the least recently active one (the one longest without activity), and
 * everyone else stays where they were. Presentation only.
 */

/** The parts of a turn history entry seating reads. */
export interface SeatingTurn {
  total_stakeholder_changes: ReadonlyArray<{ stakeholder_id: string; delta: number }>
  stakeholder_resolution?: { reactions?: ReadonlyArray<{ stakeholder_id: string }> }
}

export interface CouncilSeatingInput {
  /** The council in content order. */
  stakeholder_ids: readonly string[]
  /** Turns played so far, oldest first. */
  history: readonly SeatingTurn[]
  /** Seats available on this screen. */
  seat_count: number
  /** A stakeholder speaking right now: always seated while they speak. */
  voicing?: string | null
}

export interface CouncilSeating {
  /** Seated stakeholders, by seat (seat 0 first). */
  seated: string[]
  /** Everyone else, in content order. */
  others: string[]
}

function activeIn(turn: SeatingTurn, ids: readonly string[]): string[] {
  const active = new Set<string>()
  for (const change of turn.total_stakeholder_changes) {
    if (change.delta !== 0) active.add(change.stakeholder_id)
  }
  for (const reaction of turn.stakeholder_resolution?.reactions ?? []) {
    active.add(reaction.stakeholder_id)
  }
  // Content order, so ties resolve the same way every time
  return ids.filter((id) => active.has(id))
}

/**
 * Seats `incoming` in place of the seated stakeholder who has gone longest
 * without activity, skipping anyone in `keep`. Ties go to the later seat.
 */
function seat(seated: string[], incoming: string, lastActive: Map<string, number>, keep: ReadonlySet<string>): boolean {
  let victim = -1
  for (let index = 0; index < seated.length; index += 1) {
    if (keep.has(seated[index])) continue
    if (victim === -1 || (lastActive.get(seated[index]) ?? -1) <= (lastActive.get(seated[victim]) ?? -1)) {
      victim = index
    }
  }
  if (victim === -1) return false
  seated[victim] = incoming
  return true
}

export function seatCouncil(input: CouncilSeatingInput): CouncilSeating {
  const ids = input.stakeholder_ids
  const seatCount = Math.max(0, Math.min(input.seat_count, ids.length))
  if (seatCount === ids.length) {
    return { seated: [...ids], others: [] }
  }

  const seated = ids.slice(0, seatCount)
  const lastActive = new Map<string, number>()
  let latestActive: string[] = []
  input.history.forEach((turn, turnIndex) => {
    const active = activeIn(turn, ids)
    latestActive = active
    for (const id of active) lastActive.set(id, turnIndex)
    const keep = new Set(active)
    for (const id of active) {
      if (!seated.includes(id)) seat(seated, id, lastActive, keep)
    }
  })

  const voicing = input.voicing
  if (voicing && ids.includes(voicing) && !seated.includes(voicing) && seatCount > 0) {
    // Prefer not to unseat someone else from this turn; if everyone seated was, unseat anyway
    if (!seat(seated, voicing, lastActive, new Set([voicing, ...latestActive]))) {
      seat(seated, voicing, lastActive, new Set([voicing]))
    }
  }

  return { seated, others: ids.filter((id) => !seated.includes(id)) }
}

/**
 * Seats the table offers at a viewport width: 3 on narrow phones (four
 * overlapped there), 4 on wide phones and small tablets, 5 mid-width, 6 on
 * wide screens.
 */
export function seatBudgetForWidth(width: number): number {
  if (width <= 480) return 3
  if (width <= 720) return 4
  if (width < 1024) return 5
  return 6
}
