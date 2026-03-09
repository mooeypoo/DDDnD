import type { Meta, StoryObj } from '@storybook/vue3'

import ScoreHud from '@/ui/components/scores/score_hud.vue'
import { metricStates } from '../mocks/metrics'

const meta: Meta<typeof ScoreHud> = {
  title: 'Game/ScoreHud',
  component: ScoreHud,
  tags: ['autodocs'],
  args: {
    scores: metricStates.healthy
  },
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'dark' }
  },
  decorators: [
    () => ({
      template: '<div style="background: #0b0e1a; padding: 16px; border-radius: 12px;"><story /></div>'
    })
  ]
}

export default meta

type Story = StoryObj<typeof meta>

export const HealthySystem: Story = {}

export const WarningState: Story = {
  args: {
    scores: metricStates.unstable
  }
}

export const CriticalState: Story = {
  args: {
    scores: metricStates.nearCollapse
  }
}
