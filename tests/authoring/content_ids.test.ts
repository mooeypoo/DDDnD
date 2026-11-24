import { describe, expect, it } from 'vitest'

import { contentIdFromName, contentPrefix } from '@/domains/authoring'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'

describe('content ids from names (docs/PACK_STUDIO.md §4.1)', () => {
  it('makes a prefixed id from a name', () => {
    expect(contentIdFromName('Tune the Noisy Alerts', 'sre')).toBe('sre_tune_the_noisy_alerts')
    expect(contentIdFromName("Heroic Fix at 3 a.m.", 'sre')).toBe('sre_heroic_fix_at_3_a_m')
  })

  it('drops accents and anything outside the id grammar', () => {
    expect(contentIdFromName('Café Ünïcode — “quotes” & more!', 'x')).toBe('x_cafe_unicode_quotes_more')
  })

  it('makes a prefix from a pack name', () => {
    expect(contentPrefix('The Gilded Ledger')).toBe('the_gilded')
    expect(contentPrefix('Payments Platform Quest')).toBe('payments')
    expect(contentPrefix('Supercalifragilisticexpialidocious')).toBe('supercalifragili')
    expect(contentPrefix('SRE')).toBe('sre')
    expect(contentPrefix('!!!')).toBe('')
  })

  it('works without a prefix, and names something even from an empty name', () => {
    expect(contentIdFromName('Ship it', '')).toBe('ship_it')
    expect(contentIdFromName('???', 'sre')).toBe('sre_item')
  })

  it('never reuses a taken id', () => {
    const taken = new Set(['sre_ship_it', 'sre_ship_it_2'])
    expect(contentIdFromName('Ship it', 'sre', taken)).toBe('sre_ship_it_3')
  })

  it('stays within 64 characters, keeping the suffix', () => {
    const long = 'word '.repeat(40)
    const first = contentIdFromName(long, 'sre')
    const second = contentIdFromName(long, 'sre', new Set([first]))
    expect(first.length).toBeLessThanOrEqual(64)
    expect(second.length).toBeLessThanOrEqual(64)
    expect(second.endsWith('_2')).toBe(true)
  })

  it('always matches the content id grammar and avoids reserved ids', () => {
    for (const name of ['constructor', '__proto__', 'Prototype', '', '   ', '日本語', 'a'.repeat(200)]) {
      const id = contentIdFromName(name, '')
      expect(id).toMatch(CONTENT_LIMITS.id_pattern)
      expect(CONTENT_LIMITS.reserved_ids).not.toContain(id)
    }
  })
})
