import type { ContentPackManifest, ContentInventoryKey } from '../model/content_pack_manifest'
import type { VersionRef } from '../model/version_ref'
import { versionRefKey } from '../model/version_ref'
import type { ContentProvider, ContentType } from './content_provider'
import { ContentNotFoundError, createContentProvider } from './content_provider'

interface RegistryPack {
  manifest: ContentPackManifest
  provider: ContentProvider
}

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

function inventoryContainsRef(pack: RegistryPack, contentType: ContentType, ref: VersionRef): boolean {
  const inventoryKey = contentKeyByType[contentType]
  const filename = `${versionRefKey(ref)}.json`
  return pack.manifest.content[inventoryKey].includes(filename)
}

export class ContentPackRegistry {
  private readonly packs: RegistryPack[] = []

  registerPack(manifest: ContentPackManifest, provider = createContentProvider(manifest.base_url)): void {
    this.packs.push({
      manifest,
      provider,
    })
  }

  getManifests(): ContentPackManifest[] {
    return this.packs.map((pack) => pack.manifest)
  }

  getAvailableScenarios(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.scenarios))
  }

  getAvailableClasses(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.classes))
  }

  getAvailableChallengeModifiers(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.challenge_modifiers ?? []))
  }

  getAvailableTutorials(): VersionRef[] {
    return dedupeVersionRefs(this.packs.flatMap((pack) => pack.manifest.tutorials))
  }

  createMergedProvider(): ContentProvider {
    const resolveOwnerPacks = (contentType: ContentType, ref: VersionRef): RegistryPack[] => {
      const owners = this.packs.filter((pack) => inventoryContainsRef(pack, contentType, ref))
      if (owners.length > 0) {
        return [...owners].reverse()
      }

      return [...this.packs].reverse()
    }

    const loadFromType = async <T>(contentType: ContentType, ref: VersionRef, loader: (provider: ContentProvider, ref: VersionRef) => Promise<T>): Promise<T> => {
      const candidates = resolveOwnerPacks(contentType, ref)

      let lastError: unknown
      for (const candidate of candidates) {
        try {
          return await loader(candidate.provider, ref)
        } catch (error) {
          lastError = error
          if (!(error instanceof ContentNotFoundError)) {
            throw error
          }
        }
      }

      if (lastError instanceof Error) {
        throw lastError
      }

      throw new ContentNotFoundError(contentType, ref)
    }

    return {
      loadScenario: (ref) => loadFromType('scenarios', ref, (provider, currentRef) => provider.loadScenario(currentRef)),
      loadScore: (ref) => loadFromType('scores', ref, (provider, currentRef) => provider.loadScore(currentRef)),
      loadStakeholder: (ref) => loadFromType('stakeholders', ref, (provider, currentRef) => provider.loadStakeholder(currentRef)),
      loadStakeholderReactionRule: (ref) =>
        loadFromType('stakeholder-reaction-rules', ref, (provider, currentRef) => provider.loadStakeholderReactionRule(currentRef)),
      loadCard: (ref) => loadFromType('cards', ref, (provider, currentRef) => provider.loadCard(currentRef)),
      loadEvent: (ref) => loadFromType('events', ref, (provider, currentRef) => provider.loadEvent(currentRef)),
      loadDelayedEffect: (ref) =>
        loadFromType('delayed-effects', ref, (provider, currentRef) => provider.loadDelayedEffect(currentRef)),
      loadOutcomeTier: (ref) => loadFromType('outcome-tiers', ref, (provider, currentRef) => provider.loadOutcomeTier(currentRef)),
      loadOutcomeArchetype: (ref) =>
        loadFromType('outcome-archetypes', ref, (provider, currentRef) => provider.loadOutcomeArchetype(currentRef)),
      loadPlayerClass: (ref) => loadFromType('classes', ref, (provider, currentRef) => provider.loadPlayerClass(currentRef)),
      loadChallengeModifier: (ref) => loadFromType('challenge-modifiers', ref, (provider, currentRef) => provider.loadChallengeModifier(currentRef)),
    }
  }
}
