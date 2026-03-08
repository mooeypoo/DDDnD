import type { Meta, StoryObj } from '@storybook/vue3'

import OutcomePanel from '@/ui/components/results/outcome_panel.vue'
import { outcomeMocks } from '../mocks/outcomes'

const meta: Meta<typeof OutcomePanel> = {
  title: 'Results/OutcomePanel',
  component: OutcomePanel,
  tags: ['autodocs'],
  args: {
    ...outcomeMocks.system_stabilizer
  },
  parameters: {
    layout: 'padded'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const BoundaryBuilder: Story = {
  args: {
    ...outcomeMocks.boundary_builder
  }
}

export const Firefighter: Story = {
  args: {
    ...outcomeMocks.firefighter
  }
}

export const SystemStabilizer: Story = {
  args: {
    ...outcomeMocks.system_stabilizer
  }
}

export const StakeholderWhisperer: Story = {
  args: {
    ...outcomeMocks.stakeholder_whisperer
  }
}

export const RunawayRefactorer: Story = {
  args: {
    ...outcomeMocks.runaway_refactorer
  }
}
