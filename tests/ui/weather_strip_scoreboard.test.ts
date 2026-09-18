import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WeatherStrip from '@/ui/play/weather_strip.vue'

const baseProps = {
  scores: { domain_clarity: 62, team_morale: 38 },
  currentTurn: 3,
  maxTurns: 10
}

describe('weather_strip as a scoreboard', () => {
  it('names every score alongside its value', () => {
    const wrapper = mount(WeatherStrip, { props: baseProps })
    const labels = wrapper.findAll('.weather-vial-label').map((node) => node.text())

    expect(labels).toEqual(['Clarity', 'Morale'])
    expect(wrapper.findAll('.weather-vial-value').map((node) => node.text())).toEqual(['62', '38'])
  })

  it('shows last turn movement so direction teaches itself', () => {
    const wrapper = mount(WeatherStrip, {
      props: { ...baseProps, scoreDeltas: { domain_clarity: 4, team_morale: -6 } }
    })

    const deltas = wrapper.findAll('.weather-vial-delta')
    expect(deltas.map((node) => node.text())).toEqual(['+4', '−6'])
    expect(deltas[0].classes()).toContain('is-gain')
    expect(deltas[1].classes()).toContain('is-loss')
  })

  it('stays quiet on the first turn and on scores that did not move', () => {
    expect(mount(WeatherStrip, { props: baseProps }).findAll('.weather-vial-delta')).toHaveLength(0)

    const settled = mount(WeatherStrip, {
      props: { ...baseProps, scoreDeltas: { domain_clarity: 0, team_morale: 5 } }
    })
    expect(settled.findAll('.weather-vial-delta').map((node) => node.text())).toEqual(['+5'])
  })

  it('speaks the value, the mood, and the movement to screen readers', () => {
    const wrapper = mount(WeatherStrip, {
      props: { ...baseProps, scoreDeltas: { domain_clarity: 4 } }
    })

    const spoken = wrapper.find('.visually-hidden').text().replace(/\s+/g, ' ')
    expect(spoken).toBe('Domain Clarity 62, Strained, up 4 last turn')
  })
})
