import type { Meta, StoryObj } from '@storybook/vue3'
import QuestCard from '@/ui/components/cards/quest_card.vue'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'

const meta: Meta<typeof QuestCard> = {
  title: 'Game/QuestCard',
  component: QuestCard,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'dungeon',
      values: [
        { name: 'dungeon', value: '#0d0904' }
      ]
    }
  },
  argTypes: {
    isSelected: {
      control: 'boolean',
      description: 'Whether this quest card is the currently selected quest'
    }
  }
}

export default meta

type Story = StoryObj<typeof meta>

// ── Mock data ──────────────────────────────────────────────────────────────

const mockQuest: QuestDisplayModel = {
  id: 'monolith_of_mild_despair',
  version: 1,
  name: 'The Monolith of Mild Despair',
  description:
    'A five-year-old monolith is buckling under the weight of two dozen intermingled subdomains, eroding delivery confidence with each release.',
  shortDescription:
    'Stabilize a tangled legacy monolith before delivery confidence collapses entirely.',
  flavorText:
    'You inherit a codebase where every change touches everything — and every stakeholder has an opinion.',
  turnCount: 8,
  stakeholderCount: 4,
  actionCardCount: 10
}

const mockTutorial: QuestDisplayModel = {
  id: 'tutorial_basics',
  version: 1,
  name: 'The First Domain',
  description:
    'A short guided mission that walks you through stakeholder management, card plays, and the Core Score — everything you need for your first real quest.',
  shortDescription: 'A step-by-step introduction to DDDnD mechanics.',
  turnCount: 3,
  stakeholderCount: 2,
  actionCardCount: 5,
  isTutorial: true,
  tutorialOrder: 1
}

const mockTutorial2: QuestDisplayModel = {
  id: 'tutorial_advanced',
  version: 1,
  name: 'The Tangled Dependency',
  description:
    'Navigate a real-world architecture dilemma involving conflicting stakeholders and scarce technical runway — your first taste of DDD pressure.',
  shortDescription: 'Apply everything you learned in a more complex scenario.',
  turnCount: 5,
  stakeholderCount: 3,
  actionCardCount: 8,
  isTutorial: true,
  tutorialOrder: 2
}

// ── Stories ───────────────────────────────────────────────────────────────

/**
 * A standard quest card in its default (unselected) state.
 * Shows the Domain Gate sigil, "Official Campaign" badge, all body content,
 * and the "Select Quest →" action label.
 */
export const QuestDefault: Story = {
  name: 'Quest — Default',
  args: {
    quest: mockQuest,
    isSelected: false
  }
}

/**
 * A quest card in the selected state.
 * The card shows a gold drop-shadow glow, brighter ring bevel, illuminated
 * brackets, and a "✓ Quest Selected" label with checkmark icon.
 */
export const QuestSelected: Story = {
  name: 'Quest — Selected',
  args: {
    quest: mockQuest,
    isSelected: true
  }
}

/**
 * A tutorial card in its default state.
 * Shows the Compass sigil, "Tutorial 1" eyebrow badge, purple-tinted inset,
 * and the "Enter Tutorial →" action label in lavender.
 */
export const TutorialDefault: Story = {
  name: 'Tutorial — Default',
  args: {
    quest: mockTutorial,
    isSelected: false
  }
}

/**
 * A tutorial card with tutorialOrder: 2 — verifying the badge text update.
 */
export const TutorialAdvanced: Story = {
  name: 'Tutorial — Advanced (Order 2)',
  args: {
    quest: mockTutorial2,
    isSelected: false
  }
}

/**
 * A quest card without optional fields (no shortDescription or flavorText).
 * Tests that the card degrades gracefully when only required fields are present.
 */
export const QuestMinimal: Story = {
  name: 'Quest — Minimal (no optional fields)',
  args: {
    quest: {
      id: 'bare_quest',
      version: 1,
      name: 'The Lean Domain',
      description: 'A minimal scenario with no optional copy text.',
      turnCount: 6,
      stakeholderCount: 3,
      actionCardCount: 8
    } satisfies QuestDisplayModel,
    isSelected: false
  }
}

/**
 * All four card variants side by side — useful for cross-variant comparison.
 * Cards are arranged in a 2×2 grid against the dungeon background.
 */
export const AllVariants: Story = {
  name: 'All Variants',
  render: () => ({
    components: { QuestCard },
    setup() {
      return { mockQuest, mockTutorial, mockTutorial2 }
    },
    template: `
      <div style="
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        padding: 20px;
        background: #0d0904;
        min-height: 100vh;
      ">
        <QuestCard :quest="mockQuest" />
        <QuestCard :quest="mockQuest" :isSelected="true" />
        <QuestCard :quest="mockTutorial" />
        <QuestCard :quest="mockTutorial2" />
      </div>
    `
  })
}
