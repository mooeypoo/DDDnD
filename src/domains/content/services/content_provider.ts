/**
 * Content Provider
 * 
 * Loads and provides access to game content files from the content directory.
 * 
 * Responsibilities:
 * - Load JSON content files
 * - Provide versioned content by ID
 * - Validate filename/id/version matching
 * - Handle content not found cases
 * 
 * This service bridges the gap between raw JSON files and the rest of the system.
 * Callers should treat loaded objects as runtime inputs only after validation flow completes.
 */

import {
  Scenario,
  Score,
  Stakeholder,
  StakeholderReactionRule,
  Card,
  Event,
  DelayedEffect,
  OutcomeTier,
  OutcomeArchetype,
  PlayerClass,
  ChallengeModifier,
  ContentMetadata,
  VersionRef,
  versionRefKey,
} from '../model'
import { CONTENT_LIMITS } from '../validation/content_limits'
import { parseContentEntity, type ContentEntityByType } from '../validation/content_entity_parser'
import { readJsonWithLimit } from './bounded_json_reader'

/**
 * Content type names matching directory structure.
 */
export type ContentType =
  | 'scenarios'
  | 'scores'
  | 'stakeholders'
  | 'stakeholder-reaction-rules'
  | 'cards'
  | 'events'
  | 'delayed-effects'
  | 'outcome-tiers'
  | 'outcome-archetypes'
  | 'classes'
  | 'challenge-modifiers'

/**
 * Error thrown when content file cannot be loaded.
 */
export class ContentNotFoundError extends Error {
  constructor(
    public contentType: ContentType,
    public ref: VersionRef
  ) {
    super(`Content not found: ${contentType}/${versionRefKey(ref)}.json`)
    this.name = 'ContentNotFoundError'
  }
}

/**
 * Error thrown when filename doesn't match internal metadata.
 */
export class ContentVersionMismatchError extends Error {
  constructor(
    public filename: string,
    public expectedRef: VersionRef,
    public actualMetadata: ContentMetadata
  ) {
    super(
      `Content version mismatch in ${filename}: ` +
      `expected id="${expectedRef.id}" version=${expectedRef.version}, ` +
      `found id="${actualMetadata.id}" version=${actualMetadata.version}`
    )
    this.name = 'ContentVersionMismatchError'
  }
}

/**
 * Content Provider interface.
 *
 * Each loader resolves a specific id+version ref and rejects when missing.
 */
export interface ContentProvider {
  loadScenario(ref: VersionRef): Promise<Scenario>
  loadScore(ref: VersionRef): Promise<Score>
  loadStakeholder(ref: VersionRef): Promise<Stakeholder>
  loadStakeholderReactionRule(ref: VersionRef): Promise<StakeholderReactionRule>
  loadCard(ref: VersionRef): Promise<Card>
  loadEvent(ref: VersionRef): Promise<Event>
  loadDelayedEffect(ref: VersionRef): Promise<DelayedEffect>
  loadOutcomeTier(ref: VersionRef): Promise<OutcomeTier>
  loadOutcomeArchetype(ref: VersionRef): Promise<OutcomeArchetype>
  loadPlayerClass(ref: VersionRef): Promise<PlayerClass>
  loadChallengeModifier(ref: VersionRef): Promise<ChallengeModifier>
}

/**
 * Creates a content provider that loads from the /content directory.
 * 
 * @param basePath - Base path to content directory (default: '/content')
 */
export function createContentProvider(basePath = '/content'): ContentProvider {
  const loadedContent = new Map<string, ContentMetadata>()
  const inflightLoads = new Map<string, Promise<ContentMetadata>>()

  /**
   * Loads a versioned content file and validates filename-metadata identity.
   *
   * Successful loads stay in memory for the life of this provider. The lobby
   * already fetches a scenario's scores and stakeholders, and a run start
   * asks for the same files again — plus dozens of cards fetched together.
   * Failed loads are not cached, so a transient miss can be retried.
   */
  function loadContent<K extends ContentType>(
    contentType: K,
    ref: VersionRef
  ): Promise<ContentEntityByType[K]> {
    const cacheKey = `${contentType}/${versionRefKey(ref)}`
    const cached = loadedContent.get(cacheKey)
    if (cached) {
      return Promise.resolve(cached as ContentEntityByType[K])
    }

    const pending = inflightLoads.get(cacheKey)
    if (pending) {
      return pending as Promise<ContentEntityByType[K]>
    }

    const request = fetchContent(contentType, ref)
    inflightLoads.set(cacheKey, request)

    return request.then(
      (content) => {
        loadedContent.set(cacheKey, content)
        inflightLoads.delete(cacheKey)
        return content
      },
      (error: unknown) => {
        inflightLoads.delete(cacheKey)
        throw error
      },
    )
  }

  /**
   * Fetches one content file and turns it into a typed entity.
   *
   * Order matters: bounded read, then JSON parse, then the field-level schema
   * (ADR 0001), and only then the filename identity check. Nothing reaches
   * callers until it has passed all four.
   */
  async function fetchContent<K extends ContentType>(
    contentType: K,
    ref: VersionRef
  ): Promise<ContentEntityByType[K]> {
    const filename = `${versionRefKey(ref)}.json`
    const filePath = `${basePath}/${contentType}/${filename}`

    let response: Response
    try {
      response = await fetch(filePath)
    } catch {
      throw new ContentNotFoundError(contentType, ref)
    }

    if (!response.ok) {
      throw new ContentNotFoundError(contentType, ref)
    }

    const raw = await readJsonWithLimit(response, CONTENT_LIMITS.max_file_bytes, filePath)
    const content = parseContentEntity(contentType, ref, raw)

    if (content.id !== ref.id || content.version !== ref.version) {
      throw new ContentVersionMismatchError(filename, ref, content)
    }

    return content
  }

  return {
    loadScenario: (ref) => loadContent('scenarios', ref),
    loadScore: (ref) => loadContent('scores', ref),
    loadStakeholder: (ref) => loadContent('stakeholders', ref),
    loadStakeholderReactionRule: (ref) => loadContent('stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadContent('cards', ref),
    loadEvent: (ref) => loadContent('events', ref),
    loadDelayedEffect: (ref) => loadContent('delayed-effects', ref),
    loadOutcomeTier: (ref) => loadContent('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadContent('outcome-archetypes', ref),
    loadPlayerClass: (ref) => loadContent('classes', ref),
    loadChallengeModifier: (ref) => loadContent('challenge-modifiers', ref)
  }
}
