import type { Meta, StoryObj } from '@storybook/vue3'

import StakeholderHud from '@/ui/components/stakeholders/stakeholder_hud.vue'
import { stakeholderStates } from '../mocks/stakeholders'

const meta: Meta<typeof StakeholderHud> = {
  title: 'Game/StakeholderHud',
  component: StakeholderHud,
  tags: ['autodocs'],
  args: {
    stakeholders: stakeholderStates.engHappyFinanceUpset
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

export const EngHappyFinanceUpset: Story = {}

export const ProductImpatientUsersFrustrated: Story = {
  args: {
    stakeholders: stakeholderStates.productImpatientUsersFrustrated
  }
}

export const LeadershipPleasedTeamExhausted: Story = {
  args: {
    stakeholders: stakeholderStates.leadershipPleasedTeamExhausted
  }
}
