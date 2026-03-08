import { describe, expect, it } from 'vitest'
import { AVAILABLE_QUESTS } from '@/ui/config/available_quests'

describe('available quests config', () => {
  it('includes all integrated scenarios for setup selection', () => {
    const ids = AVAILABLE_QUESTS.map((quest) => quest.id)

    expect(ids).toContain('monolith_of_mild_despair')
    expect(ids).toContain('microservice_sprawl')
    expect(ids).toContain('compliance_gauntlet')
    expect(ids).toContain('startup_hypergrowth')
  })

  it('does not contain duplicate scenario refs', () => {
    const keys = AVAILABLE_QUESTS.map((quest) => `${quest.id}-v${quest.version}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
