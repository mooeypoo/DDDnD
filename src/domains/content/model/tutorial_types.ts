/**
 * Tutorial Content Types
 *
 * Types specific to tutorial content, including tutorial scripts
 * and tutorial scenario metadata extensions.
 *
 * These types supplement the base content types for tutorial-specific
 * behavior (hint steps, tutorial ordering, script references).
 */

import type { VersionRef } from './version_ref'

/**
 * Trigger for a tutorial hint step.
 *
 * Determines when a hint is shown during gameplay.
 */
export interface TutorialStepTrigger {
  type: 'run_start' | 'turn_start' | 'turn_end' | 'run_end'
  /** Turn number (for turn_start / turn_end triggers) */
  turn?: number
}

/**
 * A single tutorial hint step.
 */
export interface TutorialStep {
  id: string
  trigger: TutorialStepTrigger
  title: string
  message: string
  /** UI area to highlight (null = no highlight) */
  highlight: string | null
  /**
   * If set, only this card may be played during this step.
   * Other cards are visually locked in the UI.
   * The guidance persists even after the hint is dismissed,
   * until the next trigger advances the step.
   */
  required_card_id?: string
}

/**
 * Tutorial Script
 *
 * A sequence of hint steps that guide the player through a tutorial quest.
 * Loaded from content/tutorial/scripts/ JSON files.
 */
export interface TutorialScript {
  id: string
  version: number
  name: string
  description: string
  steps: TutorialStep[]
}

/**
 * Extended scenario metadata for tutorials.
 *
 * Tutorial scenarios include these additional fields beyond the base Scenario type.
 * These fields are optional on the base Scenario interface to avoid coupling,
 * and are checked at runtime when determining tutorial behavior.
 */
export interface TutorialScenarioMeta {
  is_tutorial: boolean
  tutorial_order: number
  tutorial_script_ref: VersionRef
}

/**
 * Type guard: checks whether a scenario-like object has tutorial metadata.
 */
export function isTutorialScenario(
  scenario: { is_tutorial?: boolean }
): scenario is { is_tutorial: true; tutorial_order: number; tutorial_script_ref: VersionRef } {
  return scenario.is_tutorial === true
}
