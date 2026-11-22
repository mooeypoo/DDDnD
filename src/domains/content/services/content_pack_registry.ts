import type { ContentPackManifest, ContentInventoryKey } from '../model/content_pack_manifest'
import type { VersionRef } from '../model/version_ref'
import { parseFilename, versionRefKey } from '../model/version_ref'
import type { ContentProvider, ContentType } from './content_provider'
import { ContentNotFoundError, createContentProvider } from './content_provider'

/**
 * Registered pack plus its provider instance.
 */
interface RegistryPack {
  manifest: ContentPackManifest
  provider: ContentProvider
}

/**
 * Mapping from provider load type to manifest inventory section.
 */
const contentKeyByType: Record<ContentType, ContentInventoryKey> = {
  scenarios: 'scenarios',
  scores: 'scores',
  stakeholders: 'stakeholders',
  'stakeholder-reaction-rules': 'stakeholder_reaction_rules',
  cards: 'cards',
  events: 'events',
  'delayed-effects': 'delayed_effects',
  'outcome-tiers': 'outcome_tiers',
  'outcome-archetypes': 'outcome_archetypes',
  classes: 'classes',
  'challenge-modifiers': 'challenge_modifiers',
}

/**
 * Thrown when a pack cannot be registered because it collides with a pack
 * that is already registered (same pack id, or a content file another pack owns).
 */
export class ContentPackConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentPackConflictError'
  }
}

/**
 * Thrown when a pack's declared dependency is missing or incompatible.
 */
export class ContentPackDependencyError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentPackDependencyError'
  }
}

/**
 * Thrown when content exists in a registered pack, but outside the packs the
 * requesting pack may use (itself and what it declares in `depends_on`).
 */
export class ContentOutOfScopeError extends Error {
  constructor(
    public contentType: ContentType,
    public ref: VersionRef,
    public ownerPackId: string,
    public scopePackId: string,
  ) {
    super(
      `${contentType}/${versionRefKey(ref)}.json belongs to pack "${ownerPackId}", ` +
      `which pack "${scopePackId}" does not declare in depends_on`,
    )
    this.name = 'ContentOutOfScopeError'
  }
}

/**
 * Deduplicates refs by id+version while preserving first-seen order.
 */
function dedupeVersionRefs(refs: VersionRef[]): VersionRef[] {
  const seen = new Set<string>()
  const deduped: VersionRef[] = []

  refs.forEach((ref) => {
    const key = versionRefKey(ref)
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    deduped.push(ref)
  })

  return deduped
}

function ownershipKey(section: ContentInventoryKey, filename: string): string {
  return `${section}/${filename}`
}

function parseSemver(version: string): [number, number, number] | null {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

/**
 * A dependency is satisfied by a registered pack with the same major version
 * that is at least the declared version (caret semantics: `1.2.0` accepts
 * `1.2.0`–`1.x.x`, not `2.0.0`).
 */
function satisfiesDependency(registeredVersion: string, declaredVersion: string): boolean {
  const registered = parseSemver(registeredVersion)
  const declared = parseSemver(declaredVersion)
  if (!registered || !declared) {
    return false
  }
  if (registered[0] !== declared[0]) {
    return false
  }
  for (let index = 1; index < 3; index += 1) {
    if (registered[index] !== declared[index]) {
      return registered[index] > declared[index]
    }
  }
  return true
}

/**
 * Registry of content packs.
 *
 * Ownership rule (ADR 0001): every content file is owned by exactly one
 * registered pack. Registering a pack that claims a file another pack already
 * owns fails, so no pack can redefine another pack's content.
 *
 * Scope rule: a scenario's content resolves only from the pack that owns the
 * scenario and the packs it declares (transitively) in `depends_on`.
 */
export class ContentPackRegistry {
  private readonly packs: RegistryPack[] = []
  private readonly ownerByFile = new Map<string, RegistryPack>()

  /**
   * Registers a manifest and optional custom provider for that pack.
   *
   * Throws ContentPackConflictError when the pack id is already registered or
   * when the pack claims a content file that another pack owns. Nothing is
   * registered in that case.
   */
  registerPack(manifest: ContentPackManifest, provider = createContentProvider(manifest.base_url)): void {
    if (this.packs.some((pack) => pack.manifest.id === manifest.id)) {
      throw new ContentPackConflictError(`A pack with id "${manifest.id}" is already loaded`)
    }

    const pack: RegistryPack = { manifest, provider }
    const claims: string[] = []

    for (const section of Object.keys(manifest.content) as ContentInventoryKey[]) {
      for (const filename of manifest.content[section]) {
        const key = ownershipKey(section, filename)
        const owner = this.ownerByFile.get(key)
        if (owner) {
          throw new ContentPackConflictError(
            `Pack "${manifest.id}" lists content.${section} "${filename}", which pack "${owner.manifest.id}" already provides. ` +
            'Packs cannot replace each other\'s content; give the file a new id instead.',
          )
        }
        claims.push(key)
      }
    }

    this.packs.push(pack)
    for (const key of claims) {
      this.ownerByFile.set(key, pack)
    }
  }

  /**
   * Returns manifests in registration order.
   */
  getManifests(): ContentPackManifest[] {
    return this.packs.map((pack) => pack.manifest)
  }

  /**
   * Returns deduplicated scenario refs exposed by all packs.
   */
  getAvailableScenarios(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.scenarios))
  }

  /**
   * Returns deduplicated class refs exposed by all packs.
   */
  getAvailableClasses(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.classes))
  }

  /**
   * Returns deduplicated challenge modifier refs exposed by all packs.
   */
  getAvailableChallengeModifiers(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.challenge_modifiers ?? []))
  }

  /**
   * Returns deduplicated tutorial refs exposed by all packs.
   */
  getAvailableTutorials(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.tutorials))
  }

  /**
   * Returns deduplicated outcome archetype refs discovered from manifest inventory filenames.
   */
  getAvailableOutcomeArchetypes(): VersionRef[] {
    const refs = this.packs.flatMap((pack) =>
      pack.manifest.content.outcome_archetypes
        .map((filename) => parseFilename(filename))
        .filter((ref): ref is VersionRef => ref !== null)
    )

    return dedupeVersionRefs(refs)
  }

  /**
   * Returns the id of the pack that owns a content ref, or null.
   */
  findOwnerPackId(contentType: ContentType, ref: VersionRef): string | null {
    return this.ownerOf(contentType, ref)?.manifest.id ?? null
  }

  /**
   * Creates a provider that resolves any content by its owning pack.
   *
   * Used for game-wide choices that are not part of a scenario bundle
   * (player classes, challenge modifiers, the quest list). Content that no
   * registered pack lists in its inventory is not found.
   */
  createMergedProvider(): ContentProvider {
    return this.createProvider((contentType, ref) => {
      const owner = this.ownerOf(contentType, ref)
      if (!owner) {
        throw new ContentNotFoundError(contentType, ref)
      }
      return owner
    })
  }

  /**
   * Creates a provider limited to one pack and its declared dependencies.
   *
   * Throws ContentPackDependencyError when a declared dependency is not
   * registered or has an incompatible version.
   */
  createScopedProvider(packId: string): ContentProvider {
    const scope = this.resolveScope(packId)

    return this.createProvider((contentType, ref) => {
      const owner = this.ownerOf(contentType, ref)
      if (!owner) {
        throw new ContentNotFoundError(contentType, ref)
      }
      if (!scope.has(owner.manifest.id)) {
        throw new ContentOutOfScopeError(contentType, ref, owner.manifest.id, packId)
      }
      return owner
    })
  }

  /**
   * Creates the provider a scenario bundle must be built with: scoped to the
   * pack that owns the scenario.
   */
  createScenarioProvider(scenarioRef: VersionRef): ContentProvider {
    const ownerPackId = this.findOwnerPackId('scenarios', scenarioRef)
    if (!ownerPackId) {
      throw new ContentNotFoundError('scenarios', scenarioRef)
    }
    return this.createScopedProvider(ownerPackId)
  }

  private ownerOf(contentType: ContentType, ref: VersionRef): RegistryPack | undefined {
    return this.ownerByFile.get(ownershipKey(contentKeyByType[contentType], `${versionRefKey(ref)}.json`))
  }

  /**
   * Collects a pack and its transitive dependencies, checking each one.
   */
  private resolveScope(packId: string): Set<string> {
    const byId = new Map(this.packs.map((pack) => [pack.manifest.id, pack]))
    if (!byId.has(packId)) {
      throw new ContentPackDependencyError(`Pack "${packId}" is not loaded`)
    }

    const scope = new Set<string>()
    const pending = [packId]
    while (pending.length > 0) {
      const currentId = pending.pop() as string
      if (scope.has(currentId)) {
        continue
      }
      scope.add(currentId)
      const current = byId.get(currentId) as RegistryPack

      for (const dependency of current.manifest.depends_on) {
        const target = byId.get(dependency.pack_id)
        if (!target) {
          throw new ContentPackDependencyError(
            `Pack "${currentId}" depends on pack "${dependency.pack_id}", which is not loaded`,
          )
        }
        if (!satisfiesDependency(target.manifest.version, dependency.version)) {
          throw new ContentPackDependencyError(
            `Pack "${currentId}" needs pack "${dependency.pack_id}" ${dependency.version} (same major version or newer), ` +
            `but ${target.manifest.version} is loaded`,
          )
        }
        pending.push(dependency.pack_id)
      }
    }
    return scope
  }

  private createProvider(resolve: (contentType: ContentType, ref: VersionRef) => RegistryPack): ContentProvider {
    const load = async <T>(
      contentType: ContentType,
      ref: VersionRef,
      loader: (provider: ContentProvider, currentRef: VersionRef) => Promise<T>,
    ): Promise<T> => loader(resolve(contentType, ref).provider, ref)

    return {
      loadScenario: (ref) => load('scenarios', ref, (provider, currentRef) => provider.loadScenario(currentRef)),
      loadScore: (ref) => load('scores', ref, (provider, currentRef) => provider.loadScore(currentRef)),
      loadStakeholder: (ref) => load('stakeholders', ref, (provider, currentRef) => provider.loadStakeholder(currentRef)),
      loadStakeholderReactionRule: (ref) =>
        load('stakeholder-reaction-rules', ref, (provider, currentRef) => provider.loadStakeholderReactionRule(currentRef)),
      loadCard: (ref) => load('cards', ref, (provider, currentRef) => provider.loadCard(currentRef)),
      loadEvent: (ref) => load('events', ref, (provider, currentRef) => provider.loadEvent(currentRef)),
      loadDelayedEffect: (ref) => load('delayed-effects', ref, (provider, currentRef) => provider.loadDelayedEffect(currentRef)),
      loadOutcomeTier: (ref) => load('outcome-tiers', ref, (provider, currentRef) => provider.loadOutcomeTier(currentRef)),
      loadOutcomeArchetype: (ref) =>
        load('outcome-archetypes', ref, (provider, currentRef) => provider.loadOutcomeArchetype(currentRef)),
      loadPlayerClass: (ref) => load('classes', ref, (provider, currentRef) => provider.loadPlayerClass(currentRef)),
      loadChallengeModifier: (ref) =>
        load('challenge-modifiers', ref, (provider, currentRef) => provider.loadChallengeModifier(currentRef)),
    }
  }
}
