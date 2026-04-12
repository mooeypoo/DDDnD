import { describe, expect, it } from 'vitest'
import type { Card } from '@/domains/content/model'
import { validateContentPack } from '@/domains/content/services/content_pack_validator'
import { createMockContentProvider } from './test_helpers'

describe('content_pack_validator', () => {
  it('returns overall_valid=true for a valid scenario list', async () => {
    const provider = createMockContentProvider()

    const report = await validateContentPack({
      provider,
      scenario_refs: [{ id: 'test_scenario', version: 1 }],
    })

    expect(report.overall_valid).toBe(true)
    expect(report.summary.scenarios_checked).toBe(1)
    expect(report.summary.valid_scenarios).toBe(1)
    expect(report.summary.invalid_scenarios).toBe(0)
    expect(report.scenarios[0].valid).toBe(true)
  })

  it('captures build errors as invalid scenario results', async () => {
    const provider = createMockContentProvider()

    const report = await validateContentPack({
      provider,
      scenario_refs: [{ id: 'missing_scenario', version: 1 }],
    })

    expect(report.overall_valid).toBe(false)
    expect(report.summary.invalid_scenarios).toBe(1)
    expect(report.scenarios[0].valid).toBe(false)
    expect(report.scenarios[0].build_error).toContain('missing_scenario-v1')
  })

  it('flags invalid bundle structure errors', async () => {
    const base = createMockContentProvider()

    const provider = {
      ...base,
      loadCard: async (ref: { id: string; version: number }) => {
        const card = await base.loadCard(ref)
        return {
          ...card,
          usage_limit: 0,
        } as Card
      },
    }

    const report = await validateContentPack({
      provider,
      scenario_refs: [{ id: 'test_scenario', version: 1 }],
    })

    expect(report.overall_valid).toBe(false)
    expect(report.summary.invalid_scenarios).toBe(1)
    expect(report.scenarios[0].errors.some(e => e.type === 'invalid_card_usage_limit')).toBe(true)
  })
})
