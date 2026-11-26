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

export interface UnseatedNote {
  scenario_id: string
  stakeholder_id: string
  sources: UnseatedSource[]
}

/**
 * Who isn't seated but is changed anyway, per scenario, with what changes
 * them. Grouped by person, in the order they first come up. The part of
 * `scenarioChanges` (connections.ts) about people missing from the table.
 */
export async function unseatedNotes(draft: DraftPack, base: BaseContentReader): Promise<UnseatedNote[]> {
  return unseatedNotesFrom(await scenarioChanges(draft, base))
}

/** `unseatedNotes`, from a walk already made (the Studio walks once per check). */
export function unseatedNotesFrom(tables: readonly ScenarioChanges[]): UnseatedNote[] {
  const notes: UnseatedNote[] = []
  for (const table of tables) {
    for (const [stakeholderId, sources] of table.by_person) {
      if (!table.seated.has(stakeholderId)) notes.push({ scenario_id: table.scenario_id, stakeholder_id: stakeholderId, sources })
    }
  }
  return notes
}

/** Removes the changes to one person from one of the draft's own cards, events, aftershocks or reactions. */
export function removeChangesTo(draft: DraftPack, section: NoteSection, id: string, stakeholderId: string): DraftPack {
  const item = draft.content[section][id]
  if (!item) return draft
  const kept = (item.stakeholder_changes ?? []).filter((change: StakeholderChange) => change.stakeholder_id !== stakeholderId)
  return putContent(draft, section, withEffects(item, { score_changes: item.score_changes, stakeholder_changes: kept }) as never)
}
