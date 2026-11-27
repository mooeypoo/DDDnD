/**
 * Releases and the version-bump assistant (docs/PACK_STUDIO.md M4.7;
 * CONTENT_PACKS.md §7 item 4; CONTENT_VERSIONING.md).
 *
 * Content is named by `{ id, version }`, and a version names one fixed
 * behaviour: once "ours_pair_on_it v1" has left the Studio in an exported
 * pack, it must always mean what it meant there. So the draft remembers what
 * it last exported. When an author changes how something plays (its numbers,
 * its references), the next export gives it the next version and points the
 * draft's own references at it. Wording changes keep the version.
 *
 * Bumps cascade: a card at v2 means its scenario's card list changed, so the
 * scenario moves to v2 as well, exactly as the game's own content does.
 *
 * The pack's own version (semver) is what players see in the bazaar. The
 * assistant suggests the next one from what changed; the author may choose
 * any later version.
 */

import type { VersionRef } from '../content/model'
import { draftPackId } from './draft_export'
import { DRAFT_SECTIONS, draftLicense, putContent, type DraftContent, type DraftPack, type DraftSection } from './draft_pack'

/**
 * Fields that never change how the game plays: the words people read, and
 * the balance targets the audit tooling reads. Every other field counts as
 * play, including fields the Studio doesn't know yet (the safe default).
 */
const WORDING_FIELDS = new Set([
  'name',
  'short_name',
  'description',
  'short_description',
  'flavor_text',
  'condition_description',
  'trigger_condition_description',
  'balance_targets',
])

/** What a field is, in the author's words, for the release summary. */
const FIELD_WORDS: Record<string, string> = {
  name: 'name',
  short_name: 'short name',
  description: 'description',
  short_description: 'summary',
  flavor_text: 'flavour text',
  condition_description: 'condition wording',
  trigger_condition_description: 'condition wording',
  balance_targets: 'balance targets',
  score_changes: 'score changes',
  stakeholder_changes: 'council changes',
  delayed_effect_refs: 'aftershocks',
  turns_until_resolution: 'timing',
  usage_limit: 'times per game',
  cooldown_turns: 'rest turns',
  occurrence_weight: 'how often it happens',
  trigger_condition: 'when it can happen',
  condition: 'condition',
  priority: 'order',
  reaction_rule_refs: 'reactions',
  max_turns: 'turns',
  starting_scores: 'starting scores',
  score_refs: 'scores',
  stakeholder_refs: 'council',
  card_refs: 'cards',
  event_refs: 'events',
  failure_conditions: 'how it can be lost',
}

export function fieldWords(field: string): string {
  return FIELD_WORDS[field] ?? field.replace(/_/g, ' ')
}

type Entity = { id: string; version: number; name?: string }

/** JSON with sorted keys, so that two equal values always compare equal. */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** The fields that differ between two versions of the same content, split into play and wording. */
export function changedFields(before: object, after: object): { play: string[]; wording: string[] } {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)])
  fields.delete('id')
  fields.delete('version')
  const changed = [...fields].filter((field) =>
    stable((before as Record<string, unknown>)[field]) !== stable((after as Record<string, unknown>)[field]))
  return { play: changed.filter((field) => !WORDING_FIELDS.has(field)), wording: changed.filter((field) => WORDING_FIELDS.has(field)) }
}

/**
 * How a piece of content plays, as one comparable string: every field except
 * its identity and its wording. Two versions with the same signature play
 * the same. The base-content lock uses it to hold the game's own content to
 * the rule the Studio holds drafts to.
 */
export function playSignature(entity: object): string {
  const play = Object.fromEntries(Object.entries(entity).filter(([field]) => field !== 'id' && field !== 'version' && !WORDING_FIELDS.has(field)))
  return stable(play)
}

function entities(content: DraftContent, section: DraftSection): Entity[] {
  return Object.values(content[section] as Record<string, Entity>)
}

/** Points every reference in the draft's own content at a new version of `id`. */
function repoint(draft: DraftPack, id: string, from: number, to: number): DraftPack {
  const moved = (ref: VersionRef) => (ref.id === id && ref.version === from ? { id, version: to } : ref)
  let next = draft
  for (const section of DRAFT_SECTIONS) {
    for (const entity of entities(next.content, section)) {
      let changed = false
      const updated: Record<string, unknown> = { ...entity }
      for (const [field, value] of Object.entries(entity)) {
        if (field.endsWith('_refs') && Array.isArray(value)) {
          const refs = (value as VersionRef[]).map(moved)
          if (refs.some((ref, index) => ref !== value[index])) {
            updated[field] = refs
            changed = true
          }
        } else if (field.endsWith('_ref') && value && typeof value === 'object') {
          const ref = moved(value as VersionRef)
          if (ref !== value) {
            updated[field] = ref
            changed = true
          }
        }
      }
      if (changed) next = putContent(next, section, updated as never)
    }
  }
  return next
}

/** One piece of the draft's own content, compared with the last export. */
export interface ContentChange {
  section: DraftSection
  id: string
  name: string
  /** Its version in the last export. */
  from: number
  /** Its version in this export: `from + 1` when how it plays changed. */
  to: number
  play: string[]
  wording: string[]
  /** True when it only moves because something it refers to moved. */
  follows: boolean
}

export interface ReleasePlan {
  /** The pack version last exported, or null before the first export. */
  since: string | null
  changed: ContentChange[]
  added: Array<{ section: DraftSection; id: string; name: string }>
  removed: Array<{ section: DraftSection; id: string; name: string }>
  /** The license, when it changed since the last export: different terms are a new release. */
  license: { from: string; to: string } | null
  /** What kind of release this is, from what changed. */
  kind: 'first' | 'unchanged' | 'wording' | 'play'
  /** The pack version the assistant suggests. */
  suggested: string
}

/**
 * Gives every released piece of content whose play changed the next version,
 * and follows references until nothing else moves. Content already at a new
 * version since the last export isn't bumped again.
 */
export function applyVersionBumps(draft: DraftPack): { draft: DraftPack; bumped: Map<string, { section: DraftSection; from: number; to: number }> } {
  const bumped = new Map<string, { section: DraftSection; from: number; to: number }>()
  const released = draft.released?.content
  if (!released) return { draft, bumped }
  let next = draft
  for (let moved = true; moved;) {
    moved = false
    for (const section of DRAFT_SECTIONS) {
      for (const entity of entities(next.content, section)) {
        const before = (released[section] as Record<string, Entity>)[entity.id]
        if (!before || entity.version !== before.version || changedFields(before, entity).play.length === 0) continue
        const to = entity.version + 1
        next = repoint(putContent(next, section, { ...entity, version: to } as never), entity.id, entity.version, to)
        bumped.set(entity.id, { section, from: entity.version, to })
        moved = true
      }
    }
  }
  return { draft: next, bumped }
}

function parseVersion(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-.+)?$/)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

/** True when `next` is a later pack version than `previous` (pre-release tags aside). */
export function isLaterVersion(next: string, previous: string): boolean {
  const a = parseVersion(next)
  const b = parseVersion(previous)
  if (!a || !b) return false
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return false
}

/** The next pack version: a new minor for changes to play or content, a patch for wording. */
export function nextPackVersion(previous: string, kind: 'wording' | 'play'): string {
  const parts = parseVersion(previous) ?? [1, 0, 0]
  return kind === 'play' ? `${parts[0]}.${parts[1] + 1}.0` : `${parts[0]}.${parts[1]}.${parts[2] + 1}`
}

/** What this export would release, compared with the last one. */
export function planRelease(draft: DraftPack): ReleasePlan {
  const released = draft.released
  if (!released) return { since: null, changed: [], added: [], removed: [], license: null, kind: 'first', suggested: draft.version }

  const { bumped } = applyVersionBumps(draft)
  const changed: ContentChange[] = []
  const added: ReleasePlan['added'] = []
  const removed: ReleasePlan['removed'] = []
  for (const section of DRAFT_SECTIONS) {
    const before = released.content[section] as Record<string, Entity>
    for (const entity of entities(draft.content, section)) {
      const previous = before[entity.id]
      if (!previous) {
        added.push({ section, id: entity.id, name: entity.name ?? entity.id })
        continue
      }
      const fields = changedFields(previous, entity)
      const bump = bumped.get(entity.id)
      const already = entity.version !== previous.version
      if (!bump && !already && fields.play.length === 0 && fields.wording.length === 0) continue
      changed.push({
        section,
        id: entity.id,
        name: entity.name ?? entity.id,
        from: previous.version,
        to: bump?.to ?? entity.version,
        play: fields.play,
        wording: fields.wording,
        // Bumped with no play change of its own: something it refers to moved
        follows: Boolean(bump) && fields.play.length === 0,
      })
    }
    for (const entity of Object.values(before)) {
      if (!(draft.content[section] as Record<string, Entity>)[entity.id]) removed.push({ section, id: entity.id, name: entity.name ?? entity.id })
    }
  }

  // A release from before the Studio recorded its license can't be compared
  const now = draftLicense(draft).id
  const license = released.license !== undefined && released.license !== now ? { from: released.license, to: now } : null

  const playChanged = added.length > 0 || removed.length > 0 || changed.some((change) => change.play.length > 0 || change.to !== change.from)
  // New terms change no play: a patch, like wording
  const kind = playChanged ? 'play' : changed.length > 0 || license ? 'wording' : 'unchanged'
  const suggested = kind === 'unchanged' ? released.version : nextPackVersion(released.version, kind)
  return { since: released.version, changed, added, removed, license, kind, suggested }
}

/**
 * The draft as released at `version`: bumps applied, the version set, and a
 * copy of its content kept as the new "last export". The caller exports
 * this draft, and keeps it only if the export succeeds.
 */
export function releaseDraft(draft: DraftPack, version: string): DraftPack {
  const bumped = applyVersionBumps(draft).draft
  const content = JSON.parse(JSON.stringify(bumped.content)) as DraftContent
  return { ...bumped, version, released: { version, content, license: draftLicense(bumped).id, pack_id: draftPackId(bumped) } }
}

/** Whether `version` can be the next release: later than the last export, or the same when nothing changed. */
export function releaseVersionProblem(plan: ReleasePlan, version: string): string | null {
  if (!parseVersion(version)) return 'Use three numbers, such as 1.2.0.'
  if (plan.since === null) return null
  if (plan.kind === 'unchanged') return version === plan.since || isLaterVersion(version, plan.since) ? null : `Use ${plan.since} or later.`
  return isLaterVersion(version, plan.since) ? null : `Use a version after ${plan.since}: players' copies of ${plan.since} are already out there.`
}
