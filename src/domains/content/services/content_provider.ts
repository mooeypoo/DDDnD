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
  parseFilename
} from '../model'

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
  /**
  * Loads a versioned content file and validates filename-metadata identity.
   */
  async function loadContent<T extends ContentMetadata>(
    contentType: ContentType,
    ref: VersionRef
  ): Promise<T> {
    const filename = `${versionRefKey(ref)}.json`
    const filePath = `${basePath}/${contentType}/${filename}`
    
    // Load the file
    let response: Response
    try {
      response = await fetch(filePath)
    } catch (error) {
      throw new ContentNotFoundError(contentType, ref)
    }
    
    if (!response.ok) {
      throw new ContentNotFoundError(contentType, ref)
    }
    
    // Parse JSON
    const content = await response.json() as T
    
    // Validate filename matches internal metadata
    const parsedRef = parseFilename(filename)
    if (!parsedRef) {
      throw new Error(`Invalid filename format: ${filename}`)
    }
    
    if (content.id !== ref.id || content.version !== ref.version) {
      throw new ContentVersionMismatchError(filename, ref, content)
    }
    
    return content
  }
  
  return {
    loadScenario: (ref) => loadContent<Scenario>('scenarios', ref),
    loadScore: (ref) => loadContent<Score>('scores', ref),
    loadStakeholder: (ref) => loadContent<Stakeholder>('stakeholders', ref),
    loadStakeholderReactionRule: (ref) => loadContent<StakeholderReactionRule>('stakeholder-reaction-rules', ref),
    loadCard: (ref) => loadContent<Card>('cards', ref),
    loadEvent: (ref) => loadContent<Event>('events', ref),
    loadDelayedEffect: (ref) => loadContent<DelayedEffect>('delayed-effects', ref),
    loadOutcomeTier: (ref) => loadContent<OutcomeTier>('outcome-tiers', ref),
    loadOutcomeArchetype: (ref) => loadContent<OutcomeArchetype>('outcome-archetypes', ref),
    loadPlayerClass: (ref) => loadContent<PlayerClass>('classes', ref),
    loadChallengeModifier: (ref) => loadContent<ChallengeModifier>('challenge-modifiers', ref)
  }
}
