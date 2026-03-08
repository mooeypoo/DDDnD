import type { Meta, StoryObj } from '@storybook/vue3'

import TurnBriefingPanel from '@/ui/components/turn/turn_briefing_panel.vue'
import { eventMocks } from '../mocks/events'

const meta: Meta<typeof TurnBriefingPanel> = {
  title: 'Game/TurnBriefing',
  component: TurnBriefingPanel,
  tags: ['autodocs'],
  args: {
    eventTitle: eventMocks.surpriseGrowth.name,
    narrativeDescription: eventMocks.surpriseGrowth.description,
    availableActions: 4,
    pendingAftershocks: 1
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const CalmSessionNote: Story = {
  args: {
    eventTitle: 'Steady Momentum',
    narrativeDescription:
      'Team ownership is clearer this turn. You have room to choose a deliberate, low-risk architecture move.',
    availableActions: 3,
    pendingAftershocks: 0
  }
}

export const PressureTurn: Story = {
  args: {
    eventTitle: eventMocks.productionIncident.name,
    narrativeDescription: eventMocks.productionIncident.description,
    availableActions: 5,
    pendingAftershocks: 2
  }
}
