import type { Meta, StoryObj } from '@storybook/vue3'

import GameHudSidebar from '@/ui/components/common/game_hud_sidebar.vue'
import { metricStates } from '../mocks/metrics'
import { stakeholderStates } from '../mocks/stakeholders'

const meta: Meta<typeof GameHudSidebar> = {
  title: 'Game/GameHudSidebar',
  component: GameHudSidebar,
  tags: ['autodocs'],
  args: {
    currentTurn: 3,
    maxTurns: 8,
    scores: metricStates.healthy,
    stakeholders: stakeholderStates.engHappyFinanceUpset,
    stakeholderNames: {
      lead_engineer: 'Lead Engineer',
      engineering_team: 'Engineering Team',
      finance_team: 'Finance Team',
      cto: 'CTO'
    }
  },
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    () => ({
      template: '<div style="display: flex; height: 100vh;"><story /></div>'
    })
  ]
}

export default meta

type Story = StoryObj<typeof meta>

export const EarlyTurn: Story = {}

export const MidGame: Story = {
  args: {
    currentTurn: 5,
    maxTurns: 8,
    scores: metricStates.unstable,
    stakeholders: stakeholderStates.productImpatientUsersFrustrated,
    stakeholderNames: {
      vp_product: 'VP Product',
      product_team: 'Product Team',
      users: 'Users',
      support_team: 'Support Team'
    }
  }
}

export const FinalTurn: Story = {
  args: {
    currentTurn: 8,
    maxTurns: 8,
    scores: metricStates.nearCollapse,
    stakeholders: stakeholderStates.leadershipPleasedTeamExhausted,
    stakeholderNames: {
      leadership_team: 'Leadership',
      cto: 'CTO',
      engineering_team: 'Engineering Team',
      operations_team: 'Operations Team'
    }
  }
}
