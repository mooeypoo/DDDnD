import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { SCENARIO_BALANCE_TARGETS } from '../src/domains/simulation/services/audit/scenario_balance_targets_audit.ts'
import {
  recordPlayableRef,
  selectHistoryEntities,
  selectPlayableEntities,
  type VersionRef,
} from './lib/docs_catalog.ts'

interface ContentPackManifest {
  id: string
  version: string
  name: string
  description: string
  scenarios: VersionRef[]
  tutorials?: VersionRef[]
  classes: VersionRef[]
  challenge_modifiers: VersionRef[]
  content: {
    scenarios: string[]
    cards: string[]
    stakeholders: string[]
    stakeholder_reaction_rules: string[]
    scores: string[]
    events: string[]
    delayed_effects: string[]
    outcome_tiers: string[]
    outcome_archetypes: string[]
    classes: string[]
    challenge_modifiers: string[]
  }
}

interface VersionedEntity {
  id: string
  version: number
  delayed_effect_refs?: VersionRef[]
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const baseRoot = path.resolve(projectRoot, 'content')
const tutorialRoot = path.resolve(projectRoot, 'content/tutorial')
const outputDir = path.resolve(projectRoot, 'docs-site/public/data')

function parseVersionedFilename(filename: string): VersionRef {
  const match = filename.match(/^(.*)-v(\d+)\.json$/)
  if (!match) {
    throw new Error(`Invalid versioned filename: ${filename}`)
  }

  return {
    id: match[1],
    version: Number(match[2]),
  }
}

async function readJsonFile<T>(root: string, directory: string, filename: string): Promise<T> {
  const filePath = path.join(root, directory, filename)
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function loadInventory<T extends VersionedEntity>(
  root: string,
  directory: string,
  filenames: string[]
): Promise<T[]> {
  const entries = await Promise.all(filenames.map((filename) => readJsonFile<T>(root, directory, filename)))
  return entries
}

function difficultyFor(scenarioId: string): { id: string; label: string } | null {
  const target = SCENARIO_BALANCE_TARGETS[scenarioId]
  if (!target) {
    return null
  }

  const expected = (target.win_rate_min + target.win_rate_max) / 2
  if (expected >= 0.6) {
    return { id: 'easy', label: 'Easy' }
  }
  if (expected >= 0.45) {
    return { id: 'normal', label: 'Normal' }
  }
  return { id: 'hard', label: 'Hard' }
}

function mapToObject(map: Map<string, number>): Record<string, number> {
  return Object.fromEntries([...map.entries()].sort((left, right) => left[0].localeCompare(right[0])))
}

async function main() {
  const baseManifest = JSON.parse(await readFile(path.join(baseRoot, 'manifest.json'), 'utf8')) as ContentPackManifest
  const tutorialManifest = JSON.parse(
    await readFile(path.join(tutorialRoot, 'manifest.json'), 'utf8')
  ) as ContentPackManifest

  const playableScenarios = await Promise.all(
    baseManifest.scenarios.map(async (ref) => ({
      ...(await readJsonFile<any>(baseRoot, 'scenarios', `${ref.id}-v${ref.version}.json`)),
      is_tutorial: false,
      pack_id: baseManifest.id,
      difficulty: difficultyFor(ref.id),
    }))
  )

  const tutorialScenarios = await Promise.all(
    (tutorialManifest.tutorials ?? []).map(async (ref) => ({
      ...(await readJsonFile<any>(tutorialRoot, 'scenarios', `${ref.id}-v${ref.version}.json`)),
      is_tutorial: true,
      pack_id: tutorialManifest.id,
      difficulty: null,
    }))
  )

  const scenarios = [...playableScenarios, ...tutorialScenarios].sort(
    (left, right) => Number(left.is_tutorial) - Number(right.is_tutorial) || left.id.localeCompare(right.id)
  )

  const cards = [
    ...(await loadInventory<any>(baseRoot, 'cards', baseManifest.content.cards)),
    ...(await loadInventory<any>(tutorialRoot, 'cards', tutorialManifest.content.cards)),
  ]
  const stakeholders = [
    ...(await loadInventory<any>(baseRoot, 'stakeholders', baseManifest.content.stakeholders)),
    ...(await loadInventory<any>(tutorialRoot, 'stakeholders', tutorialManifest.content.stakeholders)),
  ]
  const stakeholderReactionRules = [
    ...(await loadInventory<any>(
      baseRoot,
      'stakeholder-reaction-rules',
      baseManifest.content.stakeholder_reaction_rules
    )),
    ...(await loadInventory<any>(
      tutorialRoot,
      'stakeholder-reaction-rules',
      tutorialManifest.content.stakeholder_reaction_rules
    )),
  ]
  const scores = [
    ...(await loadInventory<any>(baseRoot, 'scores', baseManifest.content.scores)),
    ...(await loadInventory<any>(tutorialRoot, 'scores', tutorialManifest.content.scores)),
  ]
  const events = [
    ...(await loadInventory<any>(baseRoot, 'events', baseManifest.content.events)),
    ...(await loadInventory<any>(tutorialRoot, 'events', tutorialManifest.content.events)),
  ]
  const delayedEffects = [
    ...(await loadInventory<any>(baseRoot, 'delayed-effects', baseManifest.content.delayed_effects)),
    ...(await loadInventory<any>(tutorialRoot, 'delayed-effects', tutorialManifest.content.delayed_effects)),
  ]
  const outcomeTiers = [
    ...(await loadInventory<any>(baseRoot, 'outcome-tiers', baseManifest.content.outcome_tiers)),
    ...(await loadInventory<any>(tutorialRoot, 'outcome-tiers', tutorialManifest.content.outcome_tiers)),
  ]
  const outcomeArchetypes = [
    ...(await loadInventory<any>(baseRoot, 'outcome-archetypes', baseManifest.content.outcome_archetypes)),
    ...(await loadInventory<any>(
      tutorialRoot,
      'outcome-archetypes',
      tutorialManifest.content.outcome_archetypes
    )),
  ]
  const classes = await loadInventory<any>(baseRoot, 'classes', baseManifest.content.classes)
  const challengeModifiers = await loadInventory<any>(
    baseRoot,
    'challenge-modifiers',
    baseManifest.content.challenge_modifiers
  )

  const playable = {
    cards: new Map<string, number>(),
    stakeholders: new Map<string, number>(),
    events: new Map<string, number>(),
    scores: new Map<string, number>(),
    delayed_effects: new Map<string, number>(),
    scenarios: new Map<string, number>(),
  }

  for (const scenario of scenarios) {
    recordPlayableRef(playable.scenarios, { id: scenario.id, version: scenario.version })
    for (const ref of scenario.card_refs ?? []) {
      recordPlayableRef(playable.cards, ref)
    }
    for (const ref of scenario.stakeholder_refs ?? []) {
      recordPlayableRef(playable.stakeholders, ref)
    }
    for (const ref of scenario.event_refs ?? []) {
      recordPlayableRef(playable.events, ref)
    }
    for (const ref of scenario.score_refs ?? []) {
      recordPlayableRef(playable.scores, ref)
    }
  }

  const cardByKey = new Map(cards.map((card) => [`${card.id}-v${card.version}`, card]))
  const eventByKey = new Map(events.map((event) => [`${event.id}-v${event.version}`, event]))

  for (const [id, version] of playable.cards) {
    const card = cardByKey.get(`${id}-v${version}`)
    for (const ref of card?.delayed_effect_refs ?? []) {
      recordPlayableRef(playable.delayed_effects, ref)
    }
  }

  for (const [id, version] of playable.events) {
    const event = eventByKey.get(`${id}-v${version}`)
    for (const ref of event?.delayed_effect_refs ?? []) {
      recordPlayableRef(playable.delayed_effects, ref)
    }
  }

  const playableCards = selectPlayableEntities(cards, playable.cards)
  const playableEvents = selectPlayableEntities(events, playable.events)
  const playableStakeholders = selectPlayableEntities(stakeholders, playable.stakeholders)
  const playableScores = selectPlayableEntities(scores, playable.scores)
  const playableDelayedEffects = selectPlayableEntities(delayedEffects, playable.delayed_effects)

  const retiredScenarioRefs = baseManifest.content.scenarios
    .map(parseVersionedFilename)
    .filter((ref) => !ref.id.startsWith('test_') && playable.scenarios.get(ref.id) !== ref.version)

  const scenarioHistory = await Promise.all(
    retiredScenarioRefs.map((ref) => readJsonFile<any>(baseRoot, 'scenarios', `${ref.id}-v${ref.version}.json`))
  )

  const scenarioCardMap: Record<string, VersionRef[]> = {}
  const scenarioStakeholderMap: Record<string, VersionRef[]> = {}
  const scenarioEventMap: Record<string, VersionRef[]> = {}
  const scenarioScoreMap: Record<string, VersionRef[]> = {}

  for (const scenario of scenarios) {
    scenarioCardMap[scenario.id] = scenario.card_refs ?? []
    scenarioStakeholderMap[scenario.id] = scenario.stakeholder_refs ?? []
    scenarioEventMap[scenario.id] = scenario.event_refs ?? []
    scenarioScoreMap[scenario.id] = scenario.score_refs ?? []
  }

  const output = {
    meta: {
      generated_at: new Date().toISOString(),
      generator: 'scripts/generate-content-catalog.ts',
      playable_policy: 'entry_point_refs',
      content_pack: {
        id: baseManifest.id,
        version: baseManifest.version,
        name: baseManifest.name,
      },
      tutorial_pack: {
        id: tutorialManifest.id,
        version: tutorialManifest.version,
        name: tutorialManifest.name,
      },
      counts: {
        scenarios: scenarios.length,
        cards: playableCards.length,
        stakeholders: playableStakeholders.length,
        events: playableEvents.length,
        delayed_effects: playableDelayedEffects.length,
        scores: playableScores.length,
      },
      commit_sha: process.env.COMMIT_SHA ?? null,
    },
    playable_versions: {
      scenarios: mapToObject(playable.scenarios),
      cards: mapToObject(playable.cards),
      stakeholders: mapToObject(playable.stakeholders),
      events: mapToObject(playable.events),
      scores: mapToObject(playable.scores),
      delayed_effects: mapToObject(playable.delayed_effects),
    },
    scenarios,
    scenario_history: scenarioHistory,
    cards: playableCards,
    card_history: selectHistoryEntities(cards, playableCards),
    stakeholders: playableStakeholders,
    events: playableEvents,
    event_history: selectHistoryEntities(events, playableEvents),
    delayed_effects: playableDelayedEffects,
    delayed_effect_history: selectHistoryEntities(delayedEffects, playableDelayedEffects),
    scores: playableScores,
    stakeholder_reaction_rules: stakeholderReactionRules,
    outcome_tiers: outcomeTiers,
    outcome_archetypes: outcomeArchetypes,
    classes,
    challenge_modifiers: challengeModifiers,
    scenario_maps: {
      cards: scenarioCardMap,
      stakeholders: scenarioStakeholderMap,
      events: scenarioEventMap,
      scores: scenarioScoreMap,
    },
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(path.join(outputDir, 'content-catalog.json'), JSON.stringify(output, null, 2), 'utf8')

  console.log(`Wrote ${path.join(outputDir, 'content-catalog.json')}`)
}

main().catch((error) => {
  console.error('Failed to generate content catalog:', error)
  process.exit(1)
})
