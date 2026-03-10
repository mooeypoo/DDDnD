/**
 * Tutorial Content Isolation Tests
 *
 * Verifies that tutorial content is properly isolated from main content.
 * Tutorial content files must:
 * - live under content/tutorial/
 * - use unique IDs that don't collide with main content
 * - follow the same schema as main content
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, resolve } from 'path'

const rootDir = resolve(__dirname, '../..')
const mainContentDir = join(rootDir, 'content')
const tutorialContentDir = join(rootDir, 'content/tutorial')

function loadJsonFiles(dir: string): Array<{ filename: string; data: Record<string, unknown> }> {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(filename => ({
      filename,
      data: JSON.parse(readFileSync(join(dir, filename), 'utf-8'))
    }))
}

function getIdsFromDir(dir: string): string[] {
  return loadJsonFiles(dir).map(f => f.data.id as string).filter(Boolean)
}

describe('tutorial content isolation', () => {
  it('tutorial content directory exists', () => {
    expect(existsSync(tutorialContentDir)).toBe(true)
  })

  const subdirs = ['scores', 'stakeholders', 'cards', 'events', 'delayed-effects', 'scenarios']

  for (const subdir of subdirs) {
    it(`tutorial ${subdir} have unique IDs not colliding with main content`, () => {
      const mainIds = getIdsFromDir(join(mainContentDir, subdir))
      const tutorialIds = getIdsFromDir(join(tutorialContentDir, subdir))

      if (tutorialIds.length === 0) return // skip if no content in this subdir

      for (const id of tutorialIds) {
        expect(mainIds).not.toContain(id)
      }
    })

    it(`tutorial ${subdir} files have matching id and version in filename`, () => {
      const files = loadJsonFiles(join(tutorialContentDir, subdir))
      for (const { filename, data } of files) {
        const expectedFilename = `${data.id}-v${data.version}.json`
        expect(filename).toBe(expectedFilename)
      }
    })
  }

  it('tutorial scenarios have tutorial metadata fields', () => {
    const scenarios = loadJsonFiles(join(tutorialContentDir, 'scenarios'))
    expect(scenarios.length).toBeGreaterThan(0)

    for (const { filename, data } of scenarios) {
      expect(data.is_tutorial, `${filename} missing is_tutorial`).toBe(true)
      expect(data.tutorial_order, `${filename} missing tutorial_order`).toBeTypeOf('number')
      expect(data.tutorial_script_ref, `${filename} missing tutorial_script_ref`).toBeDefined()
    }
  })

  it('tutorial scripts exist for each scenario script ref', () => {
    const scenarios = loadJsonFiles(join(tutorialContentDir, 'scenarios'))
    const scriptFiles = loadJsonFiles(join(tutorialContentDir, 'scripts'))
    const scriptIds = scriptFiles.map(s => s.data.id)

    for (const { data } of scenarios) {
      const scriptRef = data.tutorial_script_ref as { id: string; version: number } | undefined
      if (scriptRef) {
        expect(scriptIds, `Script ${scriptRef.id} not found`).toContain(scriptRef.id)
      }
    }
  })

  it('tutorial scripts have valid step structures', () => {
    const scripts = loadJsonFiles(join(tutorialContentDir, 'scripts'))
    expect(scripts.length).toBeGreaterThan(0)

    for (const { filename, data } of scripts) {
      const steps = data.steps as Array<Record<string, unknown>>
      expect(steps, `${filename} missing steps`).toBeDefined()
      expect(steps.length, `${filename} has no steps`).toBeGreaterThan(0)

      for (const step of steps) {
        expect(step.id, `Step in ${filename} missing id`).toBeDefined()
        expect(step.trigger, `Step ${step.id} in ${filename} missing trigger`).toBeDefined()
        expect(step.title, `Step ${step.id} in ${filename} missing title`).toBeDefined()
        expect(step.message, `Step ${step.id} in ${filename} missing message`).toBeDefined()

        const trigger = step.trigger as Record<string, unknown>
        const validTypes = ['run_start', 'turn_start', 'turn_end', 'run_end']
        expect(validTypes, `Step ${step.id} has invalid trigger type: ${trigger.type}`).toContain(trigger.type)
      }
    }
  })
})
