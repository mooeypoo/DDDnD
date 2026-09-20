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
 * These are game-lifecycle moments, not theater beats. The table already holds
 * `turn_end` / `run_end` hints until turn theater finishes, so those steps run
 * after the player has seen lightning, aftershocks, and the council.
 *
 * - `run_start` — after the run exists, before the first act
 * - `turn_start` — before the player acts this turn (preview what playing will show)
 * - `turn_end` — after the engine turn (explain what they just saw)
 * - `run_end` — after the last turn (same hold-until-theater as turn_end)
 *
 * Author delayed effects as a preview on `turn_start` of the landing turn, and
 * an explanation on `turn_end` of that turn. Do not claim an aftershock has
 * arrived before the player has taken the turn.
 */
export interface TutorialStepTrigger {
  type: 'run_start' | 'turn_start' | 'turn_end' | 'run_end'
  /** Turn number (for turn_start / turn_end triggers) */
  turn?: number
}

/**
 * A single tutorial hint step.
 *
 * This is content metadata only. UI controls rendering and interaction.
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
   *
   * When `required_verb` is `consult`, this is the hand card to set aside.
   */
  required_card_id?: string
  /**
   * Which table verb this step teaches. Defaults to `play` when
   * `required_card_id` is set. `consult` locks playing and requires
   * Consult the Archives instead.
   */
  required_verb?: 'play' | 'consult'
  /**
   * When `required_verb` is `consult`, the remaining Grimoire page that
   * must be drawn. The engine still spends the turn via `consult_archives`.
   */
  required_draw_id?: string
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
