import { ScenarioBundle, versionRefKey } from '@/domains/content/model'
import { ScoreChangeRecord, StakeholderChangeRecord } from '@/shared/contracts'
import { StakeholderReactionRecord, StakeholderResolutionRecord } from '../model'
import {
  ConditionEvaluationState,
  evaluateNumericCondition,
  parseConditionDescription
} from './condition_evaluator'

export interface ResolveStakeholderRulesResult {
  stakeholder_resolution: StakeholderResolutionRecord
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
}

function toScoreChanges(scoreChanges: { score_id: string; delta: number }[]): ScoreChangeRecord[] {
  return scoreChanges.map((change) => ({
    score_id: change.score_id,
    delta: change.delta
  }))
}

function toStakeholderChanges(
  stakeholderChanges: { stakeholder_id: string; delta: number }[] | undefined
): StakeholderChangeRecord[] {
  if (!stakeholderChanges) {
    return []
  }

  return stakeholderChanges.map((change) => ({
    stakeholder_id: change.stakeholder_id,
    delta: change.delta
  }))
}

interface MatchedRule {
  rule_ref: { id: string; version: number }
  score_changes: ScoreChangeRecord[]
  stakeholder_changes: StakeholderChangeRecord[]
  priority: number
  name: string
  description: string
}

export function resolveStakeholderRules(
  scenarioBundle: ScenarioBundle,
  conditionState: ConditionEvaluationState
): ResolveStakeholderRulesResult {
  const reactions: StakeholderReactionRecord[] = []
  const allScoreChanges: ScoreChangeRecord[] = []
  const allStakeholderChanges: StakeholderChangeRecord[] = []

  const stakeholders = Array.from(scenarioBundle.stakeholders.values()).sort((a, b) =>
    a.id.localeCompare(b.id)
  )

  for (const stakeholder of stakeholders) {
    const matchedRules: MatchedRule[] = []

    for (const ruleRef of stakeholder.reaction_rule_refs) {
      const rule = scenarioBundle.stakeholder_reaction_rules.get(versionRefKey(ruleRef))
      if (!rule) {
        continue
      }

      const parsedCondition = parseConditionDescription(rule.condition_description, scenarioBundle)
      if (!parsedCondition || !evaluateNumericCondition(parsedCondition, conditionState)) {
        continue
      }

      matchedRules.push({
        rule_ref: { id: rule.id, version: rule.version },
        score_changes: toScoreChanges(rule.score_changes),
        stakeholder_changes: toStakeholderChanges(rule.stakeholder_changes),
        priority: rule.priority ?? 100,
        name: rule.name,
        description: rule.description
      })
    }

    matchedRules.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }

      return a.rule_ref.id.localeCompare(b.rule_ref.id)
    })

    if (matchedRules.length === 0) {
      continue
    }

    const stakeholderScoreChanges = matchedRules.flatMap((rule) => rule.score_changes)
    const stakeholderChanges = matchedRules.flatMap((rule) => rule.stakeholder_changes)

    allScoreChanges.push(...stakeholderScoreChanges)
    allStakeholderChanges.push(...stakeholderChanges)

    reactions.push({
      stakeholder_id: stakeholder.id,
      applied_rule_refs: matchedRules.map((rule) => rule.rule_ref),
      score_changes: stakeholderScoreChanges,
      stakeholder_changes: stakeholderChanges,
      presentation: {
        title: stakeholder.name,
        summary: matchedRules.map((rule) => `${rule.name}: ${rule.description}`).join(' | ')
      }
    })
  }

  const stakeholderResolution: StakeholderResolutionRecord = {
    reactions,
    presentation: {
      title: 'Stakeholder Resolution',
      summary:
        reactions.length === 0
          ? 'No stakeholder rules were eligible this turn.'
          : `Applied ${reactions.length} stakeholder reaction(s).`
    }
  }

  return {
    stakeholder_resolution: stakeholderResolution,
    score_changes: allScoreChanges,
    stakeholder_changes: allStakeholderChanges
  }
}
