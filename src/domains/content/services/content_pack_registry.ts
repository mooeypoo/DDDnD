import type { ContentPackManifest, ContentInventoryKey } from '../model/content_pack_manifest'
import type { VersionRef } from '../model/version_ref'
import { parseFilename, versionRefKey } from '../model/version_ref'
import type { ContentProvider, ContentType } from './content_provider'
import { ContentNotFoundError, createContentProvider } from './content_provider'
import { firstPartyPackKey } from './pack_identity'

/**
 * Registered pack plus its provider instance.
 */
interface RegistryPack {
  key: string
  manifest: ContentPackManifest
  provider: ContentProvider
  /** `<section>/<filename>` for every file the pack lists. */
  files: Set<string>
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
 * that is already registered (same pack key, or a content file a pack it can
 * see already lists).
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

function fileKey(contentType: ContentType, ref: VersionRef): string {
  return ownershipKey(contentKeyByType[contentType], `${versionRefKey(ref)}.json`)
}

const FIRST_PARTY_KEY_PREFIX = firstPartyPackKey('')

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

/** A scenario entry point together with the pack it belongs to. */
export interface PackScenarioRef {
  pack_key: string
  ref: VersionRef
}

/** A registered pack, as callers see it. */
export interface RegisteredPack {
  key: string
  manifest: ContentPackManifest
}

/**
 * Registry of content packs.
 *
 * Identity (ADR 0012, ADR 0014): packs are registered and looked up by their
 * pack key, never by manifest id. Two community packs that both call
 * themselves `gilded_ledger` are two different packs here. Packs registered
 * without a key are first-party (`dddnd:<id>`).
 *
 * Ownership: content belongs to the pack that lists it. Two packs may list
 * the same file only if they can never see each other: a pack may not list a
 * file that a pack in its dependency closure lists (its scenarios couldn't
 * tell which one they meant), and first-party packs never overlap each other.
 *
 * Scope: a pack's content resolves only from the pack itself and the packs it
 * declares (transitively) in `depends_on`. Dependencies always name
 * first-party packs (ADR 0013), so they resolve to `dddnd:<id>`.
 */
export class ContentPackRegistry {
  private readonly packs: RegistryPack[] = []

  /**
   * Registers a pack under its key and returns the key.
   *
   * Throws ContentPackConflictError when the key is already registered, or
   * when the pack lists a file that a pack it can see (or that can see it)
   * already lists. Nothing is registered in that case.
   */
  registerPack(
    manifest: ContentPackManifest,
    provider: ContentProvider = createContentProvider(manifest.base_url),
    key: string = firstPartyPackKey(manifest.id),
  ): string {
    if (this.packs.some((pack) => pack.key === key)) {
      throw new ContentPackConflictError(`A pack with id "${manifest.id}" (${key}) is already loaded`)
    }

    const files = new Set<string>()
    for (const section of Object.keys(manifest.content) as ContentInventoryKey[]) {
      for (const filename of manifest.content[section]) {
        files.add(ownershipKey(section, filename))
      }
    }
    const pack: RegistryPack = { key, manifest, provider, files }

    for (const other of this.packs) {
      if (!this.canSeeEachOther(pack, other)) continue
      for (const file of files) {
        if (other.files.has(file)) {
          const [section, filename] = file.split('/')
          throw new ContentPackConflictError(
            `Pack "${manifest.id}" lists content.${section} "${filename}", which pack "${other.manifest.id}" already provides. ` +
            'Packs cannot replace each other\'s content; give the file a new id instead.',
          )
        }
      }
    }

    this.packs.push(pack)
    return key
  }

  /** Returns manifests in registration order. */
  getManifests(): ContentPackManifest[] {
    return this.packs.map((pack) => pack.manifest)
  }

  /** Returns registered packs (key and manifest) in registration order. */
  getPacks(): RegisteredPack[] {
    return this.packs.map(({ key, manifest }) => ({ key, manifest }))
  }

  /** Returns one registered pack by key. */
  getPack(key: string): RegisteredPack | undefined {
    const pack = this.findPack(key)
    return pack ? { key: pack.key, manifest: pack.manifest } : undefined
  }

  /** Scenario entry points of every pack, each with its pack key. */
  getAvailableScenarios(): PackScenarioRef[] {
    return this.packs.flatMap((pack) => dedupeVersionRefs(pack.manifest.scenarios).map((ref) => ({ pack_key: pack.key, ref })))
  }

  /** Tutorial entry points of every pack, each with its pack key. */
  getAvailableTutorials(): PackScenarioRef[] {
    return this.packs.flatMap((pack) => dedupeVersionRefs(pack.manifest.tutorials).map((ref) => ({ pack_key: pack.key, ref })))
  }

  /** Player classes: a game-wide choice, from first-party packs only. */
  getAvailableClasses(): VersionRef[] {
    return dedupeVersionRefs(this.firstPartyPacks().flatMap((pack) => pack.manifest.classes))
  }

  /** Challenge modifiers: a game-wide choice, from first-party packs only. */
  getAvailableChallengeModifiers(): VersionRef[] {
    return dedupeVersionRefs(this.firstPartyPacks().flatMap((pack) => pack.manifest.challenge_modifiers ?? []))
  }

  /**
   * Returns deduplicated outcome archetype refs discovered from every pack's
   * inventory. Used only to recognize archetype ids (share links).
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
   * Provider for game-wide choices that are not part of a scenario bundle
   * (player classes, challenge modifiers). Resolves from first-party packs
   * only, which never overlap, so every ref has exactly one owner.
   */
  createGameWideProvider(): ContentProvider {
    const firstParty = this.firstPartyPacks()
    return this.createProvider((contentType, ref) => {
      const owner = firstParty.find((pack) => pack.files.has(fileKey(contentType, ref)))
      if (!owner) {
        throw new ContentNotFoundError(contentType, ref)
      }
      return owner
    })
  }

  /**
   * Creates a provider limited to one pack and its declared dependencies.
   *
   * Throws ContentPackDependencyError when the pack or a declared dependency
   * is not registered, or a dependency has an incompatible version.
   */
  createScopedProvider(packKey: string): ContentProvider {
    const scope = this.resolveScope(packKey)
    const scopePack = scope[0]

    return this.createProvider((contentType, ref) => {
      const file = fileKey(contentType, ref)
      const owner = scope.find((pack) => pack.files.has(file))
      if (owner) {
        return owner
      }
      const elsewhere = this.packs.find((pack) => pack.files.has(file))
      if (elsewhere) {
        throw new ContentOutOfScopeError(contentType, ref, elsewhere.manifest.id, scopePack.manifest.id)
      }
      throw new ContentNotFoundError(contentType, ref)
    })
  }

  private findPack(key: string): RegistryPack | undefined {
    return this.packs.find((pack) => pack.key === key)
  }

  private firstPartyPacks(): RegistryPack[] {
    return this.packs.filter((pack) => pack.key.startsWith(FIRST_PARTY_KEY_PREFIX))
  }

  /** Keys of the registered packs a pack depends on, transitively (missing ones skipped). */
  private dependencyClosure(pack: RegistryPack): Set<string> {
    const closure = new Set<string>()
    const pending = [...pack.manifest.depends_on]
    while (pending.length > 0) {
      const key = firstPartyPackKey((pending.pop() as { pack_id: string }).pack_id)
      if (closure.has(key)) continue
      closure.add(key)
      const target = this.findPack(key)
      if (target) pending.push(...target.manifest.depends_on)
    }
    return closure
  }

  private canSeeEachOther(a: RegistryPack, b: RegistryPack): boolean {
    const bothFirstParty = a.key.startsWith(FIRST_PARTY_KEY_PREFIX) && b.key.startsWith(FIRST_PARTY_KEY_PREFIX)
    return bothFirstParty || this.dependencyClosure(a).has(b.key) || this.dependencyClosure(b).has(a.key)
  }

  /**
   * Collects a pack and its transitive dependencies (the pack first), checking each one.
   */
  private resolveScope(packKey: string): RegistryPack[] {
    const root = this.findPack(packKey)
    if (!root) {
      throw new ContentPackDependencyError(`Pack ${packKey} is not loaded`)
    }

    const scope: RegistryPack[] = []
    const pending = [root]
    while (pending.length > 0) {
      const current = pending.shift() as RegistryPack
      if (scope.includes(current)) {
        continue
      }
      scope.push(current)

      for (const dependency of current.manifest.depends_on) {
        const target = this.findPack(firstPartyPackKey(dependency.pack_id))
        if (!target) {
          throw new ContentPackDependencyError(
            `Pack "${current.manifest.id}" depends on pack "${dependency.pack_id}", which is not loaded`,
          )
        }
        if (!satisfiesDependency(target.manifest.version, dependency.version)) {
          throw new ContentPackDependencyError(
            `Pack "${current.manifest.id}" needs pack "${dependency.pack_id}" ${dependency.version} (same major version or newer), ` +
            `but ${target.manifest.version} is loaded`,
          )
        }
        pending.push(target)
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
