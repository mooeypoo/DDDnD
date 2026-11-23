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
  // Identity: a scenario is identified by its pack key AND its id+version
  // (ADR 0014). Two packs may ship a scenario with the same id.
  /** Key of the pack the scenario comes from (`dddnd:base`, `github:…`). */
  packKey: string
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
  /** Scores the scenario tracks (score_refs): which classes and modifiers fit it (journal M3.10). */
  trackedScoreIds?: string[]
  /** Pack short_name for each starting score id. Presentation only. */
  startingScoreShortNames?: Record<string, string>

  /**
   * Present when the scenario comes from a community pack (ADR 0001). The UI
   * labels such quests so players always know they are not first-party.
   */
  communityPack?: {
    /** The pack's name, as the pack states it. */
    name: string
    /** Who published it, from where it was loaded (ADR 0013). */
    publisher: string
  }

  /**
   * The scenario's expected win-rate band, from its `balance_targets`
   * (journal M3.8). The lobby's difficulty mark comes from it.
   */
  winRateTarget?: { min: number; max: number }

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

/** Stable identity of a quest: pack key plus scenario id and version. */
export function questKey(quest: Pick<QuestDisplayModel, 'packKey' | 'id' | 'version'>): string {
  return `${quest.packKey}|${quest.id}-v${quest.version}`
}

/** Whether two quests are the same scenario from the same pack. */
export function isSameQuest(
  a: Pick<QuestDisplayModel, 'packKey' | 'id' | 'version'> | null | undefined,
  b: Pick<QuestDisplayModel, 'packKey' | 'id' | 'version'> | null | undefined,
): boolean {
  return Boolean(a && b && questKey(a) === questKey(b))
}
