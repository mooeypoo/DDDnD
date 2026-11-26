/**
 * Starting from the base game's content (docs/PACK_STUDIO.md D7, D13).
 *
 * "Copy and adapt" a base scenario: the draft gets its own copy of the
 * scenario (a new id), still pointing at the base council, cards, events,
 * scores and endings. "Make my own version" of a base card or event: the
 * draft gets a copy under a new id, and the draft's scenarios switch to it.
 * Nothing is ever overridden: packs can't replace each other's content.
 */

import type { Card, Event, VersionRef } from '../content/model'
import type { ContentProvider } from '../content/services/content_provider'
import { addContent, createDraft, putContent, type DraftPack, type NewDraftInput } from './draft_pack'

/**
 * A deep copy of content. Content is plain JSON data, and a JSON round trip
 * also copies values a UI holds in reactive wrappers (Vue proxies), which
 * `structuredClone` refuses.
 */
function copyOf<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/**
 * A new retelling draft holding a copy of one base scenario. The copy keeps
 * the scenario's name, story and balance; the author changes what they like.
 * `provider` resolves base content (the base pack's scoped provider).
 */
export async function draftFromBaseScenario(
  provider: ContentProvider,
  scenarioRef: VersionRef,
  input: Omit<NewDraftInput, 'kind'>,
): Promise<{ draft: DraftPack; scenarioId: string }> {
  const base = await provider.loadScenario(scenarioRef)
  const { id: _id, version: _version, ...fields } = base
  // A pack needs a description; start with one the author can change
  const description = input.description?.trim() || `A DDDnD retelling of "${base.name}".`
  const { draft, id } = addContent(createDraft({ ...input, description, kind: 'retelling' }), 'scenarios', copyOf(fields))
  // Remember who the game seats here: a note can then tell "you took them out" from the game's own sharing (M4.14)
  const origins = { [id]: { scenario: { id: scenarioRef.id, version: scenarioRef.version }, seated: base.stakeholder_refs.map((ref) => ref.id) } }
  return { draft: { ...draft, origins }, scenarioId: id }
}

type CopyableSection = 'cards' | 'events'
type CopyableContent = { cards: Card; events: Event }
const REF_FIELD = { cards: 'card_refs', events: 'event_refs' } as const

/**
 * "Make my own version" of a base card or event (D7): copies it into the
 * draft under a new id, and points the draft's scenarios at the copy instead
 * of the original.
 */
export function copyToEdit<S extends CopyableSection>(
  draft: DraftPack,
  section: S,
  original: CopyableContent[S],
): { draft: DraftPack; id: string } {
  const { id: _id, version: _version, ...fields } = original
  const added = addContent(draft, section, copyOf(fields) as never)
  const copyRef = { id: added.id, version: 1 }
  const field = REF_FIELD[section]

  let next = added.draft
  for (const scenario of Object.values(next.content.scenarios)) {
    const refs = scenario[field]
    if (!refs.some((ref) => ref.id === original.id && ref.version === original.version)) continue
    next = putContent(next, 'scenarios', {
      ...scenario,
      [field]: refs.map((ref) => (ref.id === original.id && ref.version === original.version ? copyRef : ref)),
    })
  }
  return { draft: next, id: added.id }
}
