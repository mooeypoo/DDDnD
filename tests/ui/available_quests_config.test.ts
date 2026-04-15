import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { ContentPackManifest } from '@/domains/content/model'
import { assertValidContentPackManifest } from '@/domains/content/services/manifest_validator'

function loadBaseManifest(): ContentPackManifest {
  const rootDir = resolve(__dirname, '../..')
  const raw = readFileSync(join(rootDir, 'content/manifest.json'), 'utf8')
  const parsed = JSON.parse(raw) as unknown
  assertValidContentPackManifest(parsed)
  return parsed
}

describe('available quests config', () => {
  const manifest = loadBaseManifest()

  it('includes all integrated scenarios for setup selection', () => {
    const ids = manifest.scenarios.map((quest) => quest.id)

    expect(ids).toContain('monolith_of_mild_despair')
    expect(ids).toContain('microservice_sprawl')
    expect(ids).toContain('compliance_gauntlet')
    expect(ids).toContain('startup_hypergrowth')
  })

  it('does not contain duplicate scenario refs', () => {
    const keys = manifest.scenarios.map((quest) => `${quest.id}-v${quest.version}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
