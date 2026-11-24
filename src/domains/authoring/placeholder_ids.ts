/**
 * Placeholder ids (docs/PACK_STUDIO.md §4.1).
 *
 * New content starts with a placeholder name ("New card"), so its id comes
 * from that name (`…_new_card`). Ids show in the pack's files, so once the
 * author names it, it takes the id of its real name, once: an id never
 * changes after that. Whatever refers to it follows (`retarget`).
 */

import { contentIdFromName } from './content_ids'
import { draftIds, putContent, removeContent, type DraftPack, type DraftSection } from './draft_pack'

/** True while content still has the id its placeholder name gave it. */
export function hasPlaceholderIdFor(draft: DraftPack, placeholder: string, id: string): boolean {
  const base = contentIdFromName(placeholder, draft.prefix)
  return id === base || new RegExp(`^${base}_\\d+$`).test(id)
}

/**
 * Gives named content the id of its name, while it still has its placeholder
 * id. `retarget` updates what refers to it. Returns the (possibly unchanged) id.
 */
export function settlePlaceholderId(
  draft: DraftPack,
  section: DraftSection,
  id: string,
  placeholder: string,
  retarget: (draft: DraftPack, oldId: string, newId: string) => DraftPack,
): { draft: DraftPack; id: string } {
  const item = draft.content[section][id] as { name: string; version: number } | undefined
  if (!item || !hasPlaceholderIdFor(draft, placeholder, id) || item.name.trim() === '' || item.name === placeholder) {
    return { draft, id }
  }
  const taken = draftIds(draft)
  taken.delete(id)
  const newId = contentIdFromName(item.name, draft.prefix, taken)
  if (newId === id) return { draft, id }
  const moved = putContent(removeContent(draft, section, id), section, { ...item, id: newId } as never)
  return { draft: retarget(moved, id, newId), id: newId }
}
