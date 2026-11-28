/**
 * The first-party packs (base, tutorial), read from the Studio's own site at
 * /content (studio/vite.config.ts). Loaded once and shared: the start screen
 * lists base scenarios from them, and every draft check runs against them.
 */

import { cardVerdict, describeEffects, gameBalance, manifestRefs, previewBaseScenario, type FirstPartyPack, type GameBalance, type ScenarioPreview } from '@/domains/authoring'
import type { Scenario, VersionRef } from '@/domains/content/model'
import type { ContentInventoryKey } from '@/domains/content/model/content_pack_manifest'
import { ContentPackRegistry } from '@/domains/content/services/content_pack_registry'
import { createContentProvider, type ContentProvider } from '@/domains/content/services/content_provider'
import { loadManifest } from '@/domains/content/services/manifest_loader'
import { firstPartyPackKey } from '@/domains/content/services/pack_identity'

const MANIFEST_URLS = ['/content/manifest.json', '/content/tutorial/manifest.json']

export interface FirstPartyContent {
  packs: FirstPartyPack[]
  /** Resolves base content (and only base), as a draft's references do. */
  base: ContentProvider
}

let loading: Promise<FirstPartyContent> | null = null

export function loadFirstParty(): Promise<FirstPartyContent> {
  if (!loading) {
    loading = (async () => {
      const manifests = await Promise.all(MANIFEST_URLS.map((url) => loadManifest(url)))
      const packs = manifests.map((manifest) => ({ manifest, provider: createContentProvider(manifest.base_url) }))
      const registry = new ContentPackRegistry()
      for (const pack of packs) registry.registerPack(pack.manifest, pack.provider)
      return { packs, base: registry.createScopedProvider(firstPartyPackKey('base')) }
    })()
    loading.catch(() => {
      loading = null
    })
  }
  return loading
}

/** Everything the base game offers in one section (its manifest's list), as references. */
export async function listBaseRefs(section: ContentInventoryKey): Promise<VersionRef[]> {
  const { packs } = await loadFirstParty()
  const manifest = packs.find((pack) => pack.manifest.id === 'base')?.manifest
  return manifest ? manifestRefs(manifest, section) : []
}

export interface BaseScenarioChoice {
  ref: VersionRef
  name: string
  summary: string
  /** How big it is, for the gallery's line: seats, deck and turns. */
  council: number
  cards: number
  events: number
  turns: number
}

/** The base game's adventures, for "Start from a DDDnD scenario" (D13). */
export async function listBaseScenarios(): Promise<BaseScenarioChoice[]> {
  const { packs, base } = await loadFirstParty()
  const manifest = packs.find((pack) => pack.manifest.id === 'base')?.manifest
  const scenarios: Scenario[] = await Promise.all((manifest?.scenarios ?? []).map((ref) => base.loadScenario(ref)))
  return scenarios.map((scenario) => ({
    ref: { id: scenario.id, version: scenario.version },
    name: scenario.name,
    summary: scenario.short_description ?? scenario.description,
    council: scenario.stakeholder_refs.length,
    cards: scenario.card_refs.length,
    events: scenario.event_refs.length,
    turns: scenario.max_turns,
  }))
}

/** One of the game's scenarios, to look at before copying it (M4.28). */
export async function previewScenario(ref: VersionRef): Promise<ScenarioPreview> {
  const { base } = await loadFirstParty()
  return previewBaseScenario(base, ref)
}

/**
 * The game's first scenario, as its lobby lists them (the manifest's
 * scenarios, not its inventory): the frame for a retelling from scratch
 * (they all share their scores, tiers and endings) and the welcome page's
 * example move.
 */
export async function baseFrameRef(): Promise<VersionRef | null> {
  const { packs } = await loadFirstParty()
  const first = packs.find((pack) => pack.manifest.id === 'base')?.manifest.scenarios[0]
  return first ? { id: first.id, version: first.version } : null
}

/**
 * A real move from the game, for the welcome page: the first card in the
 * game's first scenario that trades something away, in the domain's words.
 * Read from the content, so it never drifts from the game.
 */
export async function exampleMove(): Promise<{ scenario: string; card: string; words: string } | null> {
  const { base } = await loadFirstParty()
  const ref = await baseFrameRef()
  if (!ref) return null
  const scenario = await base.loadScenario(ref)
  const cards = await Promise.all(scenario.card_refs.map((cardRef) => base.loadCard(cardRef)))
  const card = cards.find((candidate) => cardVerdict(candidate) === 'trades_off' && (candidate.stakeholder_changes?.length ?? 0) > 0)
  if (!card) return null
  const [scores, people] = await Promise.all([
    Promise.all(scenario.score_refs.map(async (scoreRef) => [scoreRef.id, (await base.loadScore(scoreRef)).name] as const)),
    Promise.all(scenario.stakeholder_refs.map(async (memberRef) => [memberRef.id, (await base.loadStakeholder(memberRef)).name] as const)),
  ])
  return { scenario: scenario.name, card: card.name, words: describeEffects(card, { scores: Object.fromEntries(scores), stakeholders: Object.fromEntries(people) }) }
}

let balance: Promise<GameBalance> | null = null

/** The game's own scenarios in numbers (D3), for the balance hints to compare with. Worked out once. */
export function loadGameBalance(): Promise<GameBalance> {
  if (!balance) {
    balance = (async () => {
      const { packs, base } = await loadFirstParty()
      const manifest = packs.find((pack) => pack.manifest.id === 'base')?.manifest
      const scenarios: Scenario[] = await Promise.all((manifest?.scenarios ?? []).map((ref) => base.loadScenario(ref)))
      return gameBalance(scenarios, base)
    })()
    balance.catch(() => {
      balance = null
    })
  }
  return balance
}
