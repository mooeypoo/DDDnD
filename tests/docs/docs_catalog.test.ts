import { describe, expect, it } from 'vitest'
import {
  pickPlayableVersion,
  recordPlayableRef,
  selectHistoryEntities,
  selectPlayableEntities,
} from '../../scripts/lib/docs_catalog'

describe('docs catalog playable-latest', () => {
  it('prefers the version an entry point actually refs', () => {
    expect(pickPlayableVersion([1, 2], 2)).toBe(2)
    expect(pickPlayableVersion([1, 2], 1)).toBe(1)
  })

  it('falls back to the newest inventory file when nothing in play refs the id', () => {
    expect(pickPlayableVersion([1, 3, 2], undefined)).toBe(3)
  })

  it('selects one entity per id and keeps retired files in history', () => {
    const inventory = [
      { id: 'improved_clarity', version: 1 },
      { id: 'improved_clarity', version: 2 },
      { id: 'team_energized', version: 1 },
    ]
    const playable = new Map<string, number>([['improved_clarity', 2]])

    const selected = selectPlayableEntities(inventory, playable)
    expect(selected).toEqual([
      { id: 'improved_clarity', version: 2 },
      { id: 'team_energized', version: 1 },
    ])
    expect(selectHistoryEntities(inventory, selected)).toEqual([{ id: 'improved_clarity', version: 1 }])
  })

  it('keeps the higher ref when two entry points disagree', () => {
    const map = new Map<string, number>()
    recordPlayableRef(map, { id: 'refactor_module', version: 1 })
    recordPlayableRef(map, { id: 'refactor_module', version: 2 })
    expect(map.get('refactor_module')).toBe(2)
  })
})
