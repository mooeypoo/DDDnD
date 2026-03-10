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
import { createContentProvider } from '@/domains/content'
import { createTutorialContentProvider } from '@/domains/content/services/tutorial_content_provider'
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
  contentProvider = createContentProvider()
): Promise<QuestDisplayModel> {
  // Load the scenario content
  const scenario = await contentProvider.loadScenario(scenarioRef)
  
  // Transform into display model
  return transformScenarioToQuestDisplay(scenario)
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
  contentProvider: ContentProvider = createContentProvider()
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
  }
}

/**
 * Loads tutorial quest display models from the tutorial content namespace.
 *
 * Uses the tutorial content provider to load from /content/tutorial/.
 */
export async function loadTutorialQuestDisplayModels(
  scenarioRefs: VersionRef[]
): Promise<QuestDisplayModel[]> {
  const provider = createTutorialContentProvider()
  return loadQuestDisplayModels(scenarioRefs, provider)
}
