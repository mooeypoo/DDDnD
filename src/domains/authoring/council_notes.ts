/**
 * Notes about council members who aren't seated (docs/PACK_STUDIO.md M4.5a).
 *
 * A card, event, aftershock or reaction may change how someone feels who
 * isn't at this scenario's table. That's allowed (shared content does it all
 * the time) and the game ignores the change (journal M3.9), but an author
 * probably didn't mean it. So the Studio notes it, without blocking export,
 * and offers to seat them or to change the content.
 */

import type { StakeholderChange } from '../content/model'
import { scenarioChanges, type ChangeSection, type ChangeSource, type ScenarioChanges } from './connections'
import { putContent, withEffects, type DraftPack } from './draft_pack'
import type { BaseContentReader } from './draft_reading'

export type NoteSection = ChangeSection

/** Something that changes how a person who isn't seated feels. */
export type UnseatedSource = ChangeSource

/**
 * Why someone who isn't seated is still changed, which decides what the
 * Studio says (M4.14). None of them blocks export: the game ignores a
 * change to someone who isn't at the table.
 * - `taken_out`: the game's scenario seats them, and the author took them out.
 * - `yours`: the author's own content changes them. Fine on purpose, for a
 *   card shared with another scenario where they sit.
 * - `shared`: only the game's own content changes them, and the game's
 *   scenario doesn't seat them either: cards are shared between scenarios,
 *   and this is how DDDnD plays.
 */
export type NoteReason = 'taken_out' | 'yours' | 'shared'

export interface UnseatedNote {
  scenario_id: string
  stakeholder_id: string
  reason: NoteReason
  sources: UnseatedSource[]
}

/**
 * Who isn't seated but is changed anyway, per scenario, with what changes
 * them. Grouped by person, in the order they first come up. The part of
 * `scenarioChanges` (connections.ts) about people missing from the table.
 */
export async function unseatedNotes(draft: DraftPack, base: BaseContentReader): Promise<UnseatedNote[]> {
  return unseatedNotesFrom(draft, await scenarioChanges(draft, base))
}

/** `unseatedNotes`, from a walk already made (the Studio walks once per check). */
export function unseatedNotesFrom(draft: DraftPack, tables: readonly ScenarioChanges[]): UnseatedNote[] {
  const notes: UnseatedNote[] = []
  for (const table of tables) {
    const origin = draft.origins?.[table.scenario_id]
    for (const [stakeholderId, sources] of table.by_person) {
      if (table.seated.has(stakeholderId)) continue
      notes.push({ scenario_id: table.scenario_id, stakeholder_id: stakeholderId, reason: noteReason(origin?.seated, stakeholderId, sources), sources })
    }
  }
  return notes
}

/**
 * Taken out first (the author did it), then the author's own content, then
 * the game's own sharing. A draft without a recorded origin (imported, or
 * made before M4.14) can't tell "taken out" from "shared"; its game-only
 * notes read as shared, which still says how to seat them.
 */
function noteReason(originallySeated: readonly string[] | undefined, stakeholderId: string, sources: readonly UnseatedSource[]): NoteReason {
  if (originallySeated?.includes(stakeholderId)) return 'taken_out'
  if (sources.some((source) => source.own)) return 'yours'
  return 'shared'
}

/** Removes the changes to one person from one of the draft's own cards, events, aftershocks or reactions. */
export function removeChangesTo(draft: DraftPack, section: NoteSection, id: string, stakeholderId: string): DraftPack {
  const item = draft.content[section][id]
  if (!item) return draft
  const kept = (item.stakeholder_changes ?? []).filter((change: StakeholderChange) => change.stakeholder_id !== stakeholderId)
  return putContent(draft, section, withEffects(item, { score_changes: item.score_changes, stakeholder_changes: kept }) as never)
}
