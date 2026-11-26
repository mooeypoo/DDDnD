/**
 * Reading a draft the way the game will (docs/PACK_STUDIO.md, M4.5b).
 *
 * A draft refers to content by `{ id, version }`. A reference is the draft's
 * own when the draft holds that id at that version; otherwise it's the base
 * game's. These are the queries the Studio asks of a draft and the game's
 * content together, so that every screen answers them the same way.
 */

import type {
  Card,
  ContentPackManifest,
  DelayedEffect,
  Event,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  VersionRef,
} from '../content/model'
import { parseFilename } from '../content/model/version_ref'
import type { ContentInventoryKey } from '../content/model/content_pack_manifest'
import type { DraftContentTypes, DraftPack } from './draft_pack'

/** What the Studio needs from the base game: the content provider's loaders. */
export interface BaseContentReader {
  loadScore(ref: VersionRef): Promise<Score>
  loadCard(ref: VersionRef): Promise<Card>
  loadEvent(ref: VersionRef): Promise<Event>
  loadDelayedEffect(ref: VersionRef): Promise<DelayedEffect>
  loadStakeholder(ref: VersionRef): Promise<Stakeholder>
  loadStakeholderReactionRule(ref: VersionRef): Promise<StakeholderReactionRule>
}

/** The sections a draft refers to the base game for. */
export type ReferencedSection = 'scores' | 'stakeholders' | 'stakeholder_reaction_rules' | 'cards' | 'events' | 'delayed_effects'

const LOADERS: { [S in ReferencedSection]: (base: BaseContentReader, ref: VersionRef) => Promise<DraftContentTypes[S]> } = {
  scores: (base, ref) => base.loadScore(ref),
  stakeholders: (base, ref) => base.loadStakeholder(ref),
  stakeholder_reaction_rules: (base, ref) => base.loadStakeholderReactionRule(ref),
  cards: (base, ref) => base.loadCard(ref),
  events: (base, ref) => base.loadEvent(ref),
  delayed_effects: (base, ref) => base.loadDelayedEffect(ref),
}

/** True when the reference is to the draft's own content (editable), not the game's. */
export function isOwnRef(draft: DraftPack, section: ReferencedSection, ref: VersionRef): boolean {
  const own = draft.content[section][ref.id]
  return own !== undefined && own.version === ref.version
}

/** The draft's own content if the reference is to it; null otherwise. */
export function ownEntity<S extends ReferencedSection>(draft: DraftPack, section: S, ref: VersionRef): DraftContentTypes[S] | null {
  return isOwnRef(draft, section, ref) ? (draft.content[section][ref.id] as DraftContentTypes[S]) : null
}

/**
 * What a reference names: the draft's own content first, then the game's.
 * Null when it names nothing; reporting that is the game's checks' job.
 */
export async function resolveRef<S extends ReferencedSection>(
  draft: DraftPack,
  section: S,
  ref: VersionRef,
  base: BaseContentReader,
): Promise<{ entity: DraftContentTypes[S]; own: boolean } | null> {
  const own = ownEntity(draft, section, ref)
  if (own) return { entity: own, own: true }
  try {
    return { entity: await LOADERS[section](base, ref), own: false }
  } catch {
    return null
  }
}

/** Display names by id for a set of references (the ones that resolve). */
export async function resolveNames(draft: DraftPack, section: ReferencedSection, refs: readonly VersionRef[], base: BaseContentReader): Promise<Record<string, string>> {
  const resolved = await Promise.all(refs.map((ref) => resolveRef(draft, section, ref, base)))
  return Object.fromEntries(resolved.flatMap((entry, index) => (entry ? [[refs[index].id, entry.entity.name]] : [])))
}

type ScenarioRefField = 'score_refs' | 'stakeholder_refs' | 'card_refs' | 'event_refs'

/** Everything the draft's scenarios refer to in one field, once each, in order. */
export function scenarioRefs(draft: DraftPack, field: ScenarioRefField): VersionRef[] {
  const seen = new Set<string>()
  return Object.values(draft.content.scenarios).flatMap((scenario) => scenario[field]).filter((ref) => {
    const key = `${ref.id}-v${ref.version}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** True when some scenario of the draft already refers to this exact version. */
export function isReferenced(draft: DraftPack, field: ScenarioRefField, ref: VersionRef): boolean {
  return scenarioRefs(draft, field).some((existing) => existing.id === ref.id && existing.version === ref.version)
}

/** The content a pack's manifest lists in one section, as references. */
export function manifestRefs(manifest: ContentPackManifest, section: ContentInventoryKey): VersionRef[] {
  return ((manifest.content[section] as string[] | undefined) ?? []).map(parseFilename).filter((ref): ref is VersionRef => ref !== null)
}

/** The newest version of an id among some references, or null. */
export function newestRef(refs: readonly VersionRef[], id: string): VersionRef | null {
  return refs.filter((ref) => ref.id === id).sort((a, b) => b.version - a.version)[0] ?? null
}
