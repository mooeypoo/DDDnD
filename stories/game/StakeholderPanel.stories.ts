import type { Meta, StoryObj } from '@storybook/vue3'

import StakeholderPanel from '@/ui/components/stakeholders/stakeholder_panel.vue'
import { stakeholderStates } from '../mocks/stakeholders'

const meta: Meta<typeof StakeholderPanel> = {
  title: 'Game/StakeholderPanel',
  component: StakeholderPanel,
  tags: ['autodocs'],
  args: {
    stakeholders: stakeholderStates.engHappyFinanceUpset
  },
  parameters: {
    layout: 'padded'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const EngineeringHappyFinanceUpset: Story = {}

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
