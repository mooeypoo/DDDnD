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
  name: 'With Aftershock Indicator',
  args: {
    card: cardMocks.riskyRefactor
  }
}

export const WithStakeholderImpact: Story = {
  name: 'With Stakeholder Indicator',
  args: {
    card: cardMocks.moraleBoostingAction
  }
}

export const AllIndicators: Story = {
  name: 'All Indicators (Aftershock + Stakeholder)',
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

export const InspectView: Story = {
  name: 'Inspect Modal (Side-by-Side)',
  render: (args) => ({
    components: { ActionCard, CardDetailsModal },
    setup() {
      const stakeholderNames: Record<string, string> = {
        vp_product: 'VP Product',
        lead_engineer: 'Lead Engineer'
      }
      return { args, stakeholderNames }
    },
    template: `
      <div style="display: grid; gap: 1.5rem; width: min(920px, 92vw)">
        <ActionCard v-bind="args" />
        <CardDetailsModal :isOpen="true" :card="args.card" :stakeholderNames="stakeholderNames" />
      </div>
    `
  }),
  args: {
    card: cardMocks.riskyRefactor
  }
}
