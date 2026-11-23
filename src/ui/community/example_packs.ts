/**
 * Example packs the bazaar suggests: the DDDnD author's own extras in
 * mooeypoo/DDDnD-packs, pinned to release tags. They are community packs like
 * any other (not part of the game, not reviewed, ADR 0010): "Try it" only
 * fills in the import dialog, which shows the usual review before anything
 * is fetched or imported.
 */

import { packKeyForSource } from '@/domains/content/services/pack_identity'
import { checkPackSourceUrl } from '@/domains/content/services/pack_source_policy'

export interface ExamplePack {
  /** Display name, as the pack's manifest states it. */
  name: string
  /** What kind of pack it is, so players know what they're trying. */
  kind: 'new_setting' | 'new_topic'
  kindLabel: string
  blurb: string
  manifestUrl: string
}

const PACKS_REPO = 'https://raw.githubusercontent.com/mooeypoo/DDDnD-packs'

export const EXAMPLE_PACKS: readonly ExamplePack[] = [
  {
    name: 'Demo: The Gilded Ledger',
    kind: 'new_setting',
    kindLabel: 'Same game, new setting',
    blurb: 'The monolith story retold for a payments company, with its own council, cards and events on the base game\'s scores and endings.',
    manifestUrl: `${PACKS_REPO}/gilded_ledger-v1.1.0/packs/gilded_ledger/manifest.json`,
  },
  {
    name: 'SRE: The Pager Storm',
    kind: 'new_topic',
    kindLabel: 'A different topic',
    blurb: 'Learn site reliability engineering instead of domain-driven design: keep a service up without burning out the on-call. Its own scores, council, endings and classes.',
    manifestUrl: `${PACKS_REPO}/sre_on_call-v1.0.0/packs/sre_on_call/manifest.json`,
  },
]

/** The pack key an example would have once imported, to hide examples already in the bazaar. */
export function examplePackKey(example: ExamplePack): string | null {
  const check = checkPackSourceUrl(example.manifestUrl)
  return check.ok ? packKeyForSource(check.source) : null
}
