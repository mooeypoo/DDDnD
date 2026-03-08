import type { Meta, StoryObj } from '@storybook/vue3'

import OutcomePanel from '@/ui/components/results/outcome_panel.vue'
import { outcomeMocks } from '../mocks/outcomes'

import boundaryBuilderUrl from '@/assets/artwork/archetypes/boundary_builder.svg?url'
import firefighterUrl from '@/assets/artwork/archetypes/firefighter.svg?url'
import systemStabilizerUrl from '@/assets/artwork/archetypes/system_stabilizer.svg?url'
import stakeholderWhispererUrl from '@/assets/artwork/archetypes/stakeholder_whisperer.svg?url'
import runawayRefactorerUrl from '@/assets/artwork/archetypes/runaway_refactorer.svg?url'

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

// ─── Without portrait (baseline) ────────────────────────────────────────────

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

// ─── With archetype portrait illustrations ───────────────────────────────────────

export const BoundaryBuilderWithPortrait: Story = {
  name: 'Boundary Builder — With Portrait',
  args: {
    ...outcomeMocks.boundary_builder,
    tier: 'triumph',
    portraitUrl: boundaryBuilderUrl
  }
}

export const FirefighterWithPortrait: Story = {
  name: 'Firefighter — With Portrait',
  args: {
    ...outcomeMocks.firefighter,
    tier: 'survival',
    portraitUrl: firefighterUrl
  }
}

export const SystemStabilizerWithPortrait: Story = {
  name: 'System Stabilizer — With Portrait',
  args: {
    ...outcomeMocks.system_stabilizer,
    tier: 'success',
    portraitUrl: systemStabilizerUrl
  }
}

export const StakeholderWhispererWithPortrait: Story = {
  name: 'Stakeholder Whisperer — With Portrait',
  args: {
    ...outcomeMocks.stakeholder_whisperer,
    tier: 'success',
    portraitUrl: stakeholderWhispererUrl
  }
}

export const RunawayRefactorerWithPortrait: Story = {
  name: 'Runaway Refactorer — With Portrait',
  args: {
    ...outcomeMocks.runaway_refactorer,
    tier: 'struggle',
    portraitUrl: runawayRefactorerUrl
  }
}

export const CollapseWithPortrait: Story = {
  name: 'System Collapse — With Portrait',
  args: {
    archetype: 'firefighter',
    title: 'The Last Firefighter',
    summary: 'Every alarm fired at once. There was no architecture left to save — only incidents to close.',
    mood: 'tense',
    tier: 'collapse',
    portraitUrl: firefighterUrl
  }
}
