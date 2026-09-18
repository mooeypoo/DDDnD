/**
 * Quest Display Model
 * 
 * A lightweight, presentational model for rendering quest/scenario cards on the setup screen.
 * Derived from loaded scenario content but focused only on UI display needs.
 * 
 * This is NOT a gameplay model and contains no simulation logic.
 */

import type { VersionRef } from '@/domains/content/model'

/**
 * UI display model for a quest/scenario
 * 
 * Contains only information needed to render quest selection cards.
 * Derived from the Scenario content type but selected/shaped for UI display.
 */
export interface QuestDisplayModel {
  // Identity
  id: string
  version: number
  
  // Display text (from scenario content)
  name: string
  description: string
  shortDescription?: string
  flavorText?: string
  
  // Stats derived from available data
  turnCount: number
  stakeholderCount: number
  actionCardCount: number

  /** Stakeholder display names from pack content. Presentation only. */
  councilNames?: string[]
  /** Authored scenario starting_scores. Weather mapping happens in the UI. */
  startingScores?: Record<string, number>
  /** Pack short_name for each starting score id. Presentation only. */
  startingScoreShortNames?: Record<string, string>

  // Tutorial metadata (only present for tutorial quests)
  isTutorial?: boolean
  tutorialOrder?: number
}

/**
 * Helper to create a VersionRef from a QuestDisplayModel
 * Useful when selecting a quest to pass to start_new_run()
 */
export function getQuestVersionRef(quest: QuestDisplayModel): VersionRef {
  return {
    id: quest.id,
    version: quest.version
  }
}
