import type { Meta, StoryObj } from '@storybook/vue3'

import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import { cardMocks } from '../mocks/cards'
import { ACTION_EFFECT_ICON_ASSETS } from '@/ui/config/presentation_asset_registry'

const refactorArtUrl = ACTION_EFFECT_ICON_ASSETS.cards.refactor_action

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

// ─── Category variant stories ────────────────────────────────────────────────

export const CategoryRefactor: Story = {
  name: 'Category — Refactor',
  args: {
    card: cardMocks.riskyRefactor
  }
}

export const CategoryInfrastructure: Story = {
  name: 'Category — Infrastructure',
  args: {
    card: cardMocks.infrastructureMove
  }
}

export const CategoryTeam: Story = {
  name: 'Category — Team',
  args: {
    card: cardMocks.moraleBoostingAction
  }
}

export const CategoryFix: Story = {
  name: 'Category — Emergency Fix',
  args: {
    card: cardMocks.budgetCuttingFix
  }
}

export const CategoryProcess: Story = {
  name: 'Category — Process',
  args: {
    card: {
      id: 'streamline_deployment_process',
      version: 1,
      name: 'Streamline Deployment Process',
      description: 'Document and automate the release workflow to reduce toil and variance.',
      flavor_text: 'Fewer steps, fewer surprises, fewer 2am rollbacks.',
      score_changes: [
        { score_id: 'delivery_confidence', delta: 5 },
        { score_id: 'developer_morale', delta: 3 }
      ],
      delayed_effect_refs: [],
      style_tags: ['process', 'workflow', 'documentation']
    }
  }
}

// ─── Artwork story ───────────────────────────────────────────────────────────

export const WithArtwork: Story = {
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

// ─── Tutorial state story ─────────────────────────────────────────────────────

export const TutorialLocked: Story = {
  name: 'Tutorial — Locked',
  args: {
    card: cardMocks.safeIncrementalChange,
    isTutorialLocked: true
  }
}
