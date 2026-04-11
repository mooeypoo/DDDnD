import type { Meta, StoryObj } from '@storybook/vue3'

import ActionCard from '@/ui/components/cards/action_card.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import { ACTION_EFFECT_ICON_ASSETS } from '@/ui/config/presentation_asset_registry'
import { cardMocks } from '../mocks/cards'

const refactorArtUrl = ACTION_EFFECT_ICON_ASSETS.cards.refactor_action
const infraArtUrl = ACTION_EFFECT_ICON_ASSETS.cards.infrastructure_investment
const patchArtUrl = ACTION_EFFECT_ICON_ASSETS.cards.quick_patch

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

const reusableAvailability = {
  card_id: 'safe_incremental_change',
  card_version: 1,
  short_summary: 'Reusable card with no usage limit or cooldown.',
  is_playable: true,
  unavailable_reason: null,
  usage_limit: null,
  uses_remaining: null,
  times_used: 0,
  cooldown_turns: 0,
  available_on_turn: 1,
  turns_until_available: 0
} as const

const oneTimeAvailability = {
  ...reusableAvailability,
  usage_limit: 1,
  uses_remaining: 1
} as const

const cooldownAvailability = {
  ...reusableAvailability,
  cooldown_turns: 2,
  times_used: 1,
  available_on_turn: 4,
  turns_until_available: 0
} as const

const onCooldownAvailability = {
  ...cooldownAvailability,
  is_playable: false,
  unavailable_reason: 'cooldown_active' as const,
  turns_until_available: 2
}

export const Summary: Story = {}

export const ReusableCard: Story = {
  args: {
    card: cardMocks.safeIncrementalChange,
    availability: reusableAvailability
  }
}

export const OneTimeCard: Story = {
  args: {
    card: {
      ...cardMocks.riskyRefactor,
      usage_limit: 1
    },
    availability: oneTimeAvailability
  }
}

export const CooldownCard: Story = {
  args: {
    card: {
      ...cardMocks.infrastructureMove,
      cooldown_turns: 2
    },
    availability: cooldownAvailability
  }
}

export const OnCooldownCard: Story = {
  args: {
    card: {
      ...cardMocks.infrastructureMove,
      cooldown_turns: 2
    },
    availability: onCooldownAvailability
  }
}

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

// ─── Artwork integration stories ────────────────────────────────────────────

export const WithRefactorArtwork: Story = {
  name: 'With Artwork — Refactor',
  args: {
    card: cardMocks.riskyRefactor,
    artwork: {
      illustration_url: refactorArtUrl,
      icon_key: 'refactor_action',
      alt: 'Refactoring transformation schema'
    }
  }
}

export const WithInfraArtwork: Story = {
  name: 'With Artwork — Infrastructure',
  args: {
    card: cardMocks.infrastructureMove,
    artwork: {
      illustration_url: infraArtUrl,
      icon_key: 'infrastructure_investment',
      alt: 'Infrastructure investment schema'
    }
  }
}

export const WithPatchArtwork: Story = {
  name: 'With Artwork — Quick Patch',
  args: {
    card: cardMocks.budgetCuttingFix,
    artwork: {
      illustration_url: patchArtUrl,
      icon_key: 'quick_patch',
      alt: 'Reactive patch schema'
    }
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

export const InspectViewWithArtwork: Story = {
  name: 'Inspect Modal + Artwork',
  render: (args) => ({
    components: { ActionCard, CardDetailsModal },
    setup() {
      const stakeholderNames: Record<string, string> = {
        vp_product: 'VP Product',
        lead_engineer: 'Lead Engineer'
      }
      const artwork = {
        illustration_url: refactorArtUrl,
        icon_key: 'refactor_action',
        alt: 'Refactoring transformation schema'
      }
      return { args, stakeholderNames, artwork }
    },
    template: `
      <div style="display: grid; gap: 1.5rem; width: min(920px, 92vw)">
        <ActionCard v-bind="args" :artwork="artwork" />
        <CardDetailsModal :isOpen="true" :card="args.card" :stakeholderNames="stakeholderNames" :artwork="artwork" />
      </div>
    `
  }),
  args: {
    card: cardMocks.riskyRefactor
  }
}
