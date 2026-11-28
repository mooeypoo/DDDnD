/**
 * The example packs (D14, D40, M4.29): the Gilded Ledger (a DDD retelling)
 * and the SRE pack (a new subject), from DDDnD-packs at their release tags,
 * vendored into the Studio by `npm run studio:examples` and served from its
 * own site. Opened view-only, to see what a finished pack looks like.
 */

import { draftFromPack, type DraftKind, type DraftPack } from '@/domains/authoring'
import { readPackBundle } from '@/domains/content/services/pack_bundle_file'
import EXAMPLE_LIST from '../../examples/examples.json'

export interface ExamplePack {
  /** Its folder in DDDnD-packs, and its address in the Studio (`#/example/<folder>`). */
  folder: string
  /** The release tag it's pinned to. */
  tag: string
  file: string
  name: string
  /** The pack's own version: what the Studio shows (the tag is an id). */
  version: string
  kind: DraftKind
  content_hash: string
}

export const EXAMPLE_PACKS = EXAMPLE_LIST as ExamplePack[]

export function examplePack(folder: string): ExamplePack | null {
  return EXAMPLE_PACKS.find((example) => example.folder === folder) ?? null
}

/** The example for a kind of pack: the one the welcome page and the guided round point to. */
export function exampleOfKind(kind: DraftKind): ExamplePack | null {
  return EXAMPLE_PACKS.find((example) => example.kind === kind) ?? null
}

/** An example as a draft, checked against the content hash recorded at its tag. */
export async function loadExample(example: ExamplePack): Promise<DraftPack> {
  const response = await fetch(`/examples/${example.file}`)
  if (!response.ok) throw new Error(`${example.name} couldn't be loaded (${response.status}).`)
  const snapshot = await readPackBundle(await response.text(), example.file)
  if (snapshot.content_hash !== example.content_hash) throw new Error(`${example.name} isn't the release it should be (${example.tag}).`)
  const imported = draftFromPack(snapshot)
  if (!imported.ok) throw new Error(`${example.name} couldn't be opened: ${imported.problems.join(' ')}`)
  return imported.draft
}
