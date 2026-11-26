/**
 * Community pack review: what the consent screen tells a player before a
 * community pack is added (ADR 0001 decision 8, threats T8/T9 in
 * docs/CONTENT_PACKS_SECURITY.md).
 *
 * Pure presentation logic over a validated snapshot. Everything shown is plain
 * text; links show their hostname so a player sees where they lead.
 */

import { isPreviewSession } from '@/ui/preview/preview_session'
import type { PackSnapshot, Scenario } from '@/domains/content/model'
import { isFirstPartyPackKey } from '@/domains/content/services/pack_identity'
import { checkPackSourceUrl } from '@/domains/content/services/pack_source_policy'
import type { RunContentPack } from '@/domains/simulation/model'

export interface ReviewLink {
  url: string
  host: string
}

export interface PackReview {
  title: string
  version: string
  description: string
  /** "Builds on DDDnD's base pack" or "A standalone world". */
  kindLabel: string
  license: string
  /** Names the pack gives for its authors. Its own claim: anyone can write any name. */
  authors: Array<{ name: string; link?: ReviewLink }>
  /**
   * Who published it, from where it was loaded: the one thing a pack can't
   * claim falsely (ADR 0013). Shown next to the authors so the two can be compared.
   */
  publisher: { label: string; verified: boolean }
  homepage?: ReviewLink
  origin: {
    label: string
    detail: string
    note: string
    tone: 'calm' | 'caution'
  }
  /** Shown only for packs fetched from the internet. */
  privacyNote?: string
  scenarios: Array<{ name: string; summary: string; turns: number }>
  counts: { scenarios: number; cards: number; stakeholders: number; events: number }
  /** First 12 hex characters of the content hash: a short way to tell versions apart. */
  fingerprint: string
}

const FIRST_PARTY_PACK_NAMES: Record<string, string> = {
  base: "DDDnD's base pack",
  tutorial: "DDDnD's tutorial pack",
}

function toLink(url: string | undefined): ReviewLink | undefined {
  if (!url) return undefined
  try {
    return { url, host: new URL(url).hostname }
  } catch {
    return undefined
  }
}

function countFolder(snapshot: PackSnapshot, folder: string): number {
  return Object.keys(snapshot.entities).filter((path) => path.startsWith(`${folder}/`)).length
}

function describeOrigin(snapshot: PackSnapshot): PackReview['origin'] {
  const origin = snapshot.origin
  if (origin.kind === 'file') {
    return {
      label: 'From a file on this device',
      detail: origin.file_name,
      note: 'Nothing was downloaded from the internet.',
      tone: 'calm',
    }
  }

  const url = new URL(origin.manifest_url)
  const detail = `${url.hostname}${url.pathname}`
  switch (origin.pinning) {
    case 'commit':
      return { label: 'From GitHub, pinned to one exact commit', detail, note: 'This exact content can\'t change.', tone: 'calm' }
    case 'release_tag':
      return { label: 'From GitHub, pinned to a release', detail, note: 'Release tags normally don\'t change.', tone: 'calm' }
    default:
      return {
        label: 'From GitHub, not pinned to a release',
        detail,
        note: 'The author can change this content at any time. You will play the version you load now.',
        tone: 'caution',
      }
  }
}

/** Who published a pack, from where it was loaded (ADR 0013). Also used for bazaar and play labels. */
export function describePackPublisher(snapshot: PackSnapshot): PackReview['publisher'] {
  return snapshot.origin.kind === 'file' ? filePublisher() : publisherFromManifestUrl(snapshot.origin.manifest_url)
}

const FILE_PUBLISHER: PackReview['publisher'] = { label: 'unknown (loaded from a file)', verified: false }
/** In a preview tab, the only pack that can arrive is the one the Pack Studio sent (§11). */
const PREVIEW_PUBLISHER: PackReview['publisher'] = { label: 'the DDDnD Pack Studio (a preview)', verified: false }

function filePublisher(): PackReview['publisher'] {
  return isPreviewSession() ? PREVIEW_PUBLISHER : FILE_PUBLISHER
}

/**
 * A community run's pack, as shown on the results screen, the share card and
 * the play label: its name and publisher. Null for first-party runs. Works
 * from what the save recorded, so it still shows when the pack has since been
 * removed (then the name falls back to the pack id).
 */
export function describeRunCommunityPack(
  contentPack: RunContentPack | undefined,
  loadedName?: string,
): { name: string; publisher: string } | null {
  if (!contentPack || isFirstPartyPackKey(contentPack.key)) return null
  const publisher = contentPack.origin === 'remote' && contentPack.source_url
    ? publisherFromManifestUrl(contentPack.source_url)
    : filePublisher()
  return { name: loadedName ?? contentPack.id, publisher: publisher.label }
}

function publisherFromManifestUrl(manifestUrl: string): PackReview['publisher'] {
  const check = checkPackSourceUrl(manifestUrl)
  if (!check.ok) {
    return { label: 'Unknown', verified: false }
  }
  const { source } = check
  return source.host_kind === 'github_raw'
    ? { label: `${source.owner} on GitHub (${source.owner}/${source.repo})`, verified: true }
    : { label: `${source.owner} on GitHub Pages`, verified: true }
}

export function buildPackReview(snapshot: PackSnapshot): PackReview {
  const { manifest } = snapshot
  const dependencies = manifest.depends_on.map((dependency) => FIRST_PARTY_PACK_NAMES[dependency.pack_id] ?? `the "${dependency.pack_id}" pack`)

  const scenarios = [...manifest.scenarios, ...manifest.tutorials]
    .map((ref) => snapshot.entities[`scenarios/${ref.id}-v${ref.version}.json`] as Scenario | undefined)
    .filter((scenario): scenario is Scenario => Boolean(scenario))
    .map((scenario) => ({
      name: scenario.name,
      summary: scenario.short_description ?? scenario.description,
      turns: scenario.max_turns,
    }))

  return {
    title: manifest.name,
    version: manifest.version,
    description: manifest.description,
    kindLabel: manifest.kind === 'extension' ? `Builds on ${dependencies.join(' and ')}` : 'A standalone world with its own rules',
    license: manifest.license,
    authors: manifest.authors.map((author) => ({ name: author.name, link: toLink(author.url) })),
    publisher: describePackPublisher(snapshot),
    homepage: toLink(manifest.pack_homepage_url),
    origin: describeOrigin(snapshot),
    privacyNote: snapshot.origin.kind === 'remote'
      ? 'Loading it contacted GitHub, which can see your IP address, as any website can. Once added, nothing more is downloaded.'
      : undefined,
    scenarios,
    counts: {
      scenarios: scenarios.length,
      cards: countFolder(snapshot, 'cards'),
      stakeholders: countFolder(snapshot, 'stakeholders'),
      events: countFolder(snapshot, 'events'),
    },
    fingerprint: snapshot.content_hash.replace(/^sha256:/, '').slice(0, 12),
  }
}
