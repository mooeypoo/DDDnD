import type { Meta, StoryObj } from '@storybook/vue3'

import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import { cardMocks } from '../mocks/cards'

const meta: Meta<typeof CardDetailsModal> = {
  title: 'Overlays/CardDetailsModal',
  component: CardDetailsModal,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    card: cardMocks.riskyRefactor,
    isDisabled: false
  },
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const InspectCard: Story = {}

export const DisabledPlayAction: Story = {
  args: {
    card: cardMocks.budgetCuttingFix,
    isDisabled: true
  }
}
