import type { Meta, StoryObj } from '@storybook/vue3'

import OutcomePanel from '@/ui/components/results/outcome_panel.vue'
import { outcomeMocks } from '../mocks/outcomes'

const meta: Meta<typeof OutcomePanel> = {
  title: 'Results/OutcomePanel',
  component: OutcomePanel,
  tags: ['autodocs'],
  args: {
    ...outcomeMocks.system_stabilizer,
    tier: 'success'
  },
  parameters: {
    layout: 'padded'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const BoundaryBuilder: Story = {
  args: {
    ...outcomeMocks.boundary_builder,
    tier: 'triumph'
  }
}

export const Firefighter: Story = {
  args: {
    ...outcomeMocks.firefighter,
    tier: 'survival'
  }
}

export const SystemStabilizer: Story = {
  args: {
    ...outcomeMocks.system_stabilizer,
    tier: 'success'
  }
}

export const StakeholderWhisperer: Story = {
  args: {
    ...outcomeMocks.stakeholder_whisperer,
    tier: 'success'
  }
}

export const RunawayRefactorer: Story = {
  args: {
    ...outcomeMocks.runaway_refactorer,
    tier: 'struggle'
  }
}

export const Collapse: Story = {
  name: 'System Collapse (Worst Outcome)',
  args: {
    archetype: 'firefighter',
    title: 'The Last Firefighter',
    summary: 'Every alarm fired at once. There was no architecture left to save — only incidents to close.',
    mood: 'tense',
    tier: 'collapse'
  }
}
