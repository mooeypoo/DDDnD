import type { Meta, StoryObj } from '@storybook/vue3'

import ActionCard from '@/ui/components/cards/action_card.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import { cardMocks } from '../mocks/cards'

const meta: Meta<typeof ActionCard> = {
  title: 'Game/ActionCard',
  component: ActionCard,
  tags: ['autodocs'],
  args: {
    card: cardMocks.safeIncrementalChange,
    isDisabled: false
  },
  parameters: {
    layout: 'padded'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Summary: Story = {}

export const WithTags: Story = {
  args: {
    card: cardMocks.safeIncrementalChange
  }
}

export const WithDelayedEffect: Story = {
  args: {
    card: cardMocks.riskyRefactor
  }
}

export const WithStakeholderImpact: Story = {
  args: {
    card: cardMocks.moraleBoostingAction
  }
}

export const InspectView: Story = {
  render: (args) => ({
    components: { ActionCard, CardDetailsModal },
    setup() {
      return { args }
    },
    template: `
      <div style="display: grid; gap: 1rem; width: min(920px, 92vw)">
        <ActionCard v-bind="args" />
        <CardDetailsModal :isOpen="true" :card="args.card" />
      </div>
    `
  }),
  args: {
    card: cardMocks.riskyRefactor
  }
}

export const Disabled: Story = {
  args: {
    card: cardMocks.infrastructureMove,
    isDisabled: true
  }
}
