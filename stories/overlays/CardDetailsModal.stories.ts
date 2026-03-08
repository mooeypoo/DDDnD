import type { Meta, StoryObj } from '@storybook/vue3'

import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import { cardMocks } from '../mocks/cards'

const mockStakeholderNames: Record<string, string> = {
  vp_product: 'VP Product',
  lead_engineer: 'Lead Engineer',
  leadership_team: 'Leadership Team',
  product_team: 'Product Team',
  finance_team: 'Finance Team',
  operations_team: 'Operations Team'
}

const meta: Meta<typeof CardDetailsModal> = {
  title: 'Overlays/CardDetailsModal',
  component: CardDetailsModal,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    card: cardMocks.riskyRefactor,
    isDisabled: false,
    stakeholderNames: mockStakeholderNames
  },
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const InspectCard: Story = {}

export const WithImmediateEffectsOnly: Story = {
  args: {
    card: cardMocks.safeIncrementalChange
  }
}

export const WithAllSections: Story = {
  name: 'All Sections (Effects + Aftershocks + Stakeholders)',
  args: {
    card: cardMocks.budgetCuttingFix
  }
}

export const DisabledPlayAction: Story = {
  args: {
    card: cardMocks.budgetCuttingFix,
    isDisabled: true
  }
}
