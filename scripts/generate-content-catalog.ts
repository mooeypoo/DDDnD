import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface VersionRef {
  id: string
  version: number
}

interface ContentPackManifest {
  id: string
  version: string
  name: string
  description: string
  scenarios: VersionRef[]
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
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..')
const contentRoot = path.resolve(projectRoot, 'content')
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

async function readJsonFile<T>(directory: string, filename: string): Promise<T> {
  const filePath = path.join(contentRoot, directory, filename)
  const raw = await readFile(filePath, 'utf8')
  return JSON.parse(raw) as T
}

async function loadInventory<T extends VersionedEntity>(directory: string, filenames: string[]): Promise<T[]> {
  const entries = await Promise.all(filenames.map((filename) => readJsonFile<T>(directory, filename)))
  return entries.sort((a, b) => a.id.localeCompare(b.id) || a.version - b.version)
}

async function loadScenarioByRef(ref: VersionRef) {
  const filename = `${ref.id}-v${ref.version}.json`
  return readJsonFile<any>('scenarios', filename)
}

async function main() {
  const manifestRaw = await readFile(path.join(contentRoot, 'manifest.json'), 'utf8')
  const manifest = JSON.parse(manifestRaw) as ContentPackManifest

  const scenarios = await Promise.all(manifest.scenarios.map((ref) => loadScenarioByRef(ref)))
  const cards = await loadInventory<any>('cards', manifest.content.cards)
  const stakeholders = await loadInventory<any>('stakeholders', manifest.content.stakeholders)
  const stakeholderReactionRules = await loadInventory<any>(
    'stakeholder-reaction-rules',
    manifest.content.stakeholder_reaction_rules
  )
  const scores = await loadInventory<any>('scores', manifest.content.scores)
  const events = await loadInventory<any>('events', manifest.content.events)
  const delayedEffects = await loadInventory<any>('delayed-effects', manifest.content.delayed_effects)
  const outcomeTiers = await loadInventory<any>('outcome-tiers', manifest.content.outcome_tiers)
  const outcomeArchetypes = await loadInventory<any>('outcome-archetypes', manifest.content.outcome_archetypes)
  const classes = await loadInventory<any>('classes', manifest.content.classes)
  const challengeModifiers = await loadInventory<any>(
    'challenge-modifiers',
    manifest.content.challenge_modifiers
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
      content_pack: {
        id: manifest.id,
        version: manifest.version,
        name: manifest.name,
      },
      counts: {
        scenarios: scenarios.length,
        cards: cards.length,
        stakeholders: stakeholders.length,
        stakeholder_reaction_rules: stakeholderReactionRules.length,
        scores: scores.length,
        events: events.length,
        delayed_effects: delayedEffects.length,
        outcome_tiers: outcomeTiers.length,
        outcome_archetypes: outcomeArchetypes.length,
        classes: classes.length,
        challenge_modifiers: challengeModifiers.length,
      },
      commit_sha: process.env.COMMIT_SHA ?? null,
    },
    manifest: {
      ...manifest,
      content_refs: {
        scenarios: manifest.content.scenarios.map(parseVersionedFilename),
        cards: manifest.content.cards.map(parseVersionedFilename),
        stakeholders: manifest.content.stakeholders.map(parseVersionedFilename),
        stakeholder_reaction_rules: manifest.content.stakeholder_reaction_rules.map(parseVersionedFilename),
        scores: manifest.content.scores.map(parseVersionedFilename),
        events: manifest.content.events.map(parseVersionedFilename),
        delayed_effects: manifest.content.delayed_effects.map(parseVersionedFilename),
        outcome_tiers: manifest.content.outcome_tiers.map(parseVersionedFilename),
        outcome_archetypes: manifest.content.outcome_archetypes.map(parseVersionedFilename),
        classes: manifest.content.classes.map(parseVersionedFilename),
        challenge_modifiers: manifest.content.challenge_modifiers.map(parseVersionedFilename),
      },
    },
    scenarios,
    cards,
    stakeholders,
    stakeholder_reaction_rules: stakeholderReactionRules,
    scores,
    events,
    delayed_effects: delayedEffects,
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
