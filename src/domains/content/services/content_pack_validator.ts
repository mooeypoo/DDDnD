import type { ContentProvider } from './content_provider'
import { buildScenarioBundle } from './bundle_builder'
import { validateScenarioBundle, type ValidationError } from './bundle_validator'
import type { VersionRef } from '../model'

export interface ContentPackScenarioValidationResult {
  scenario_ref: VersionRef
  valid: boolean
  errors: ValidationError[]
  build_error?: string
}

export interface ContentPackValidationSummary {
  scenarios_checked: number
  valid_scenarios: number
  invalid_scenarios: number
}

export interface ContentPackValidationReport {
  overall_valid: boolean
  summary: ContentPackValidationSummary
  scenarios: ContentPackScenarioValidationResult[]
}

export interface ValidateContentPackInput {
  scenario_refs: VersionRef[]
  provider: ContentProvider
}

export async function validateContentPack(input: ValidateContentPackInput): Promise<ContentPackValidationReport> {
  const scenarios: ContentPackScenarioValidationResult[] = []

  for (const scenario_ref of input.scenario_refs) {
    try {
      const bundle = await buildScenarioBundle(scenario_ref.id, scenario_ref.version, input.provider)
      const validation = validateScenarioBundle(bundle)

      scenarios.push({
        scenario_ref,
        valid: validation.valid,
        errors: validation.errors,
      })
    } catch (error) {
      const build_error = error instanceof Error ? error.message : String(error)
      scenarios.push({
        scenario_ref,
        valid: false,
        errors: [],
        build_error,
      })
    }
  }

  const valid_scenarios = scenarios.filter(r => r.valid).length
  const invalid_scenarios = scenarios.length - valid_scenarios

  return {
    overall_valid: invalid_scenarios === 0,
    summary: {
      scenarios_checked: scenarios.length,
      valid_scenarios,
      invalid_scenarios,
    },
    scenarios,
  }
}
