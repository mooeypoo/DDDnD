import type { Meta, StoryObj } from '@storybook/vue3'

import ScorePanel from '@/ui/components/scores/score_panel.vue'
import { metricStates } from '../mocks/metrics'

const meta: Meta<typeof ScorePanel> = {
  title: 'Game/MetricsPanel',
  component: ScorePanel,
  tags: ['autodocs'],
  args: {
    scores: metricStates.healthy
  },
  parameters: {
    layout: 'padded'
  }
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
