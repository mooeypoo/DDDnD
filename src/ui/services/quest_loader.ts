/**
 * Quest Loader Service
 * 
 * Loads scenario content from the content provider and transforms it
 * into a lightweight display model for quest selection cards.
 * 
 * This service bridges the gap between:
 * - The content domain (Scenario interface, content provider)
 * - The UI display layer (QuestDisplayModel)
 * 
 * Responsibilities:
 * - Resolve scenario version refs to loaded content
 * - Transform scenario content into display models
 * - Count available actions, stakeholders, etc. for stats display
 * - Handle content loading errors gracefully
 */

import type { VersionRef } from '@/domains/content/model'
import type { Scenario } from '@/domains/content/model'
import type { ContentProvider } from '@/domains/content/services/content_provider'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'

/**
 * Loads a single scenario and transforms it into a QuestDisplayModel for display.
 * 
 * @param scenarioRef - The { id, version } reference to the scenario
 * @param contentProvider - The content provider to load from (optional, creates a default one)
 * @returns A QuestDisplayModel with stats derived from the scenario content
 * @throws Will throw if the scenario cannot be loaded
 */
export async function loadQuestDisplayModel(
  scenarioRef: VersionRef,
  contentProvider: ContentProvider
): Promise<QuestDisplayModel> {
  const scenario = await contentProvider.loadScenario(scenarioRef)
  const [councilNames, startingScoreShortNames] = await Promise.all([
    loadCouncilNames(scenario.stakeholder_refs, contentProvider),
    loadScoreShortNames(scenario.score_refs, contentProvider),
  ])

  return {
    ...transformScenarioToQuestDisplay(scenario),
    councilNames,
    startingScoreShortNames,
  }
}

/**
 * Loads multiple scenarios and transforms them into QuestDisplayModels.
 * 
 * If any scenario fails to load, the error is logged and that quest is skipped.
 * This makes the setup screen resilient to individual scenario load failures.
 * 
 * @param scenarioRefs - Array of scenario references
 * @param contentProvider - The content provider to load from (optional, creates a default one)
 * @returns Array of QuestDisplayModels for successfully loaded scenarios
 */
export async function loadQuestDisplayModels(
  scenarioRefs: VersionRef[],
  contentProvider: ContentProvider
): Promise<QuestDisplayModel[]> {
  // Load all scenarios in parallel
  const results = await Promise.allSettled(
    scenarioRefs.map(ref => loadQuestDisplayModel(ref, contentProvider))
  )
  
  // Collect successful loads and log failures
  const quests: QuestDisplayModel[] = []
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      quests.push(result.value)
    } else {
      // Log errors for debugging - helps with content loading issues
      console.error(
        `Failed to load quest at index ${index}:`,
        result.reason
      )
    }
  })
  
  return quests
}

/**
 * Transforms a Scenario content object into a QuestDisplayModel.
 * 
 * This mapping extracts only the fields needed for display and calculates
 * derived statistics from the scenario's referenced content.
 * 
 * @param scenario - The loaded scenario content
 * @returns A display model for rendering quest cards
 */
function transformScenarioToQuestDisplay(scenario: Scenario): QuestDisplayModel {
  return {
    id: scenario.id,
    version: scenario.version,
    name: scenario.name,
    description: scenario.description,
    shortDescription: scenario.short_description,
    flavorText: scenario.flavor_text,
    turnCount: scenario.max_turns,
    stakeholderCount: scenario.stakeholder_refs.length,
    actionCardCount: scenario.card_refs.length,
    isTutorial: scenario.is_tutorial ?? false,
    tutorialOrder: scenario.tutorial_order,
    startingScores: { ...scenario.starting_scores },
  }
}

async function loadCouncilNames(
  refs: VersionRef[],
  contentProvider: ContentProvider
): Promise<string[]> {
  const results = await Promise.allSettled(
    refs.map((ref) => contentProvider.loadStakeholder(ref))
  )

  const names: string[] = []
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.name) {
      names.push(result.value.name)
    }
  }
  return names
}

async function loadScoreShortNames(
  refs: VersionRef[],
  contentProvider: ContentProvider
): Promise<Record<string, string>> {
  const results = await Promise.allSettled(
    refs.map((ref) => contentProvider.loadScore(ref))
  )

  const shortNames: Record<string, string> = {}
  for (const result of results) {
    if (result.status !== 'fulfilled' || !result.value) continue
    if (result.value.id && result.value.short_name) {
      shortNames[result.value.id] = result.value.short_name
    }
  }
  return shortNames
}
