/**
 * Table choices: which player classes and challenge modifiers a scenario's
 * table offers (M3 slice 8, journal M3.10).
 *
 * A pack's table offers its own classes and modifiers, then those of the
 * first-party packs it depends on. A pack that only adds scenarios and cards
 * on the base scores therefore gets the base classes and modifiers without
 * declaring any. Each one is offered only for scenarios it fits:
 *
 * - a class fits when the scenario tracks its favored score, or when it has
 *   no favored score (identity only);
 * - a modifier fits when the scenario tracks every score it changes, so its
 *   card never promises an effect that silently doesn't happen.
 */

import type { ChallengeModifier, PlayerClass } from '../model/content_types'
import type { VersionRef } from '../model/version_ref'
import { versionRefKey } from '../model/version_ref'

/** True when the class's +1 bonus applies in a scenario tracking these scores (or it has no bonus). */
export function classFitsScenario(
  playerClass: Pick<PlayerClass, 'score_affinity'>,
  trackedScoreIds: readonly string[],
): boolean {
  return !playerClass.score_affinity || trackedScoreIds.includes(playerClass.score_affinity)
}

/** Scores the modifier changes that a scenario tracking these scores doesn't. */
export function untrackedModifierScores(
  modifier: Pick<ChallengeModifier, 'score_adjustments'>,
  trackedScoreIds: readonly string[],
): string[] {
  return Object.keys(modifier.score_adjustments ?? {}).filter((scoreId) => !trackedScoreIds.includes(scoreId))
}

/** True when every score the modifier changes is tracked by the scenario. */
export function modifierFitsScenario(
  modifier: Pick<ChallengeModifier, 'score_adjustments'>,
  trackedScoreIds: readonly string[],
): boolean {
  return untrackedModifierScores(modifier, trackedScoreIds).length === 0
}

/** One problem with a pack's table choices, in the same shape as other pack issues. */
export interface TableChoiceIssue {
  file: string
  message: string
}

export interface TableChoiceCheckInput {
  /** Classes the pack itself lists. */
  own_classes: PlayerClass[]
  /** Modifiers the pack itself lists. */
  own_modifiers: ChallengeModifier[]
  /** Every class the pack's table offers: its own and its dependencies'. */
  table_classes: PlayerClass[]
  /** The pack's playable scenarios (not tutorials, which skip the class choice), with the scores each tracks. */
  scenarios: Array<{ ref: VersionRef; tracked_score_ids: string[] }>
}

/**
 * Refuses table choices that would never work:
 *
 * - a class of the pack's own that fits none of its scenarios;
 * - a modifier of the pack's own that fits none of its scenarios;
 * - a scenario that no class at its table fits (nothing to sit down with).
 *
 * Classes and modifiers from dependencies are only filtered, never refused:
 * they belong to another pack and fit that pack's scenarios.
 */
export function tableChoiceIssues(input: TableChoiceCheckInput): TableChoiceIssue[] {
  if (input.scenarios.length === 0) return []
  const issues: TableChoiceIssue[] = []
  const scenarioNames = input.scenarios.map((scenario) => scenario.ref.id).join(', ')

  for (const playerClass of input.own_classes) {
    if (!input.scenarios.some((scenario) => classFitsScenario(playerClass, scenario.tracked_score_ids))) {
      issues.push({
        file: `classes/${versionRefKey(playerClass)}.json`,
        message: `score_affinity "${playerClass.score_affinity}" isn't a score any of this pack's scenarios track (${scenarioNames}), ` +
          'so the class would never be offered. Use a score one of them tracks, or leave score_affinity out for a class without a bonus.',
      })
    }
  }

  for (const modifier of input.own_modifiers) {
    if (!input.scenarios.some((scenario) => modifierFitsScenario(modifier, scenario.tracked_score_ids))) {
      const nearest = input.scenarios
        .map((scenario) => untrackedModifierScores(modifier, scenario.tracked_score_ids))
        .sort((a, b) => a.length - b.length)[0]
      issues.push({
        file: `challenge-modifiers/${versionRefKey(modifier)}.json`,
        message: `score_adjustments change scores none of this pack's scenarios track in full (${scenarioNames}); ` +
          `even the closest one lacks ${nearest.map((id) => `"${id}"`).join(', ')}. ` +
          'A modifier is offered only where every score it changes is tracked, so this one would never be offered.',
      })
    }
  }

  for (const scenario of input.scenarios) {
    if (!input.table_classes.some((playerClass) => classFitsScenario(playerClass, scenario.tracked_score_ids))) {
      issues.push({
        file: `scenarios/${versionRefKey(scenario.ref)}.json`,
        message: 'no player class fits this scenario, so its table would have no class to sit down with. ' +
          'Add a class whose score_affinity is one of the scenario\'s scores, or a class without score_affinity.',
      })
    }
  }

  return issues
}
