import type { Meta, StoryObj } from '@storybook/vue3'

import RunIntroSplash from '@/ui/components/common/run_intro_splash.vue'
import { metricStates } from '../mocks/metrics'
import { stakeholderStates } from '../mocks/stakeholders'

const stakeholderNames: Record<string, string> = {
  lead_engineer: 'Lead Engineer',
  engineering_team: 'Engineering Team',
  finance_team: 'Finance Team',
  cto: 'CTO',
  vp_product: 'VP Product',
  product_team: 'Product Team',
  users: 'Users',
  support_team: 'Support Team',
  leadership_team: 'Leadership',
  operations_team: 'Operations Team'
}

const meta: Meta<typeof RunIntroSplash> = {
  title: 'Overlays/RunIntroSplash',
  component: RunIntroSplash,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    playerName: 'Moriel',
    playerClassName: 'Boundary Mage',
    scenarioName: 'The Monolith of Mild Despair',
    scores: metricStates.unstable,
    stakeholders: stakeholderStates.engHappyFinanceUpset,
    stakeholderNames,
    maxTurns: 8
  },
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NameOnly: Story = {
  args: {
    playerName: 'Arthas',
    playerClassName: undefined
  }
}

export const ClassOnly: Story = {
  args: {
    playerName: undefined,
    playerClassName: 'Reliability Cleric'
  }
}

export const Anonymous: Story = {
  name: 'No Name / No Class',
  args: {
    playerName: undefined,
    playerClassName: undefined
  }
}

export const HealthySystem: Story = {
  name: 'Healthy Starting Scores',
  args: {
    scores: metricStates.healthy,
    stakeholders: stakeholderStates.leadershipPleasedTeamExhausted,
    stakeholderNames,
    maxTurns: 12
  }
}

export const CriticalSystem: Story = {
  name: 'Near-Collapse Scores',
  args: {
    scores: metricStates.nearCollapse,
    stakeholders: stakeholderStates.productImpatientUsersFrustrated,
    stakeholderNames,
    maxTurns: 6,
    playerName: 'Gandalf',
    playerClassName: 'Legacy Ranger',
    scenarioName: 'Rocketship Runtime Panic'
  }
}
