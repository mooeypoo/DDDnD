import type { Meta, StoryObj } from '@storybook/vue3'
import ClassCard from '@/ui/components/cards/class_card.vue'
import type { PlayerClass } from '@/domains/content/model'

const meta: Meta<typeof ClassCard> = {
  title: 'Game/ClassCard',
  component: ClassCard,
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
      description: 'Whether this class card is the currently selected class'
    }
  }
}

export default meta

type Story = StoryObj<typeof meta>

// ── Mock class data (matches content/classes/*.json IDs) ──────────────────

const boundaryMage: PlayerClass = {
  id: 'boundary_mage',
  version: 1,
  name: 'Boundary Mage',
  description: 'Expert at defining bounded contexts and enforcing clean domain interfaces.',
  flavor_text: 'Clear boundaries keep the codebase at peace.'
}

const stakeholderBard: PlayerClass = {
  id: 'stakeholder_bard',
  version: 1,
  name: 'Stakeholder Bard',
  description: 'Master of stakeholder relations and the art of communicating technical trade-offs.',
  flavor_text: 'A well-told story smooths the path forward.'
}

const reliabilityCleric: PlayerClass = {
  id: 'reliability_cleric',
  version: 1,
  name: 'Reliability Cleric',
  description: 'Guardian of system health, uptime, and operational runbooks.',
  flavor_text: 'Stability is the foundation of all progress.'
}

const legacyRanger: PlayerClass = {
  id: 'legacy_ranger',
  version: 1,
  name: 'Legacy Ranger',
  description: 'Scout of inherited code, carving safe paths through inherited complexity.',
  flavor_text: 'Every system has history; honor it.'
}

const deliveryRogue: PlayerClass = {
  id: 'delivery_rogue',
  version: 1,
  name: 'Delivery Rogue',
  description: 'Swift executor of change, weaving between constraints to ship on deadline.',
  flavor_text: 'Speed matters when the deadline approaches.'
}

// ── Stories ───────────────────────────────────────────────────────────────

/**
 * Boundary Mage — default (unselected) state.
 * Shows the purple accent color, class portrait, Cinzel name,
 * description, flavor text, and "Choose Class →" label.
 */
export const BoundaryMageDefault: Story = {
  name: 'Boundary Mage — Default',
  args: {
    playerClass: boundaryMage,
    isSelected: false
  }
}

/**
 * Boundary Mage — selected state.
 * Shows accent-colored glow filter, brighter brackets,
 * accent-tinted inset bloom, and "✓ Class Selected" label with checkmark.
 */
export const BoundaryMageSelected: Story = {
  name: 'Boundary Mage — Selected',
  args: {
    playerClass: boundaryMage,
    isSelected: true
  }
}

/**
 * Stakeholder Bard — golden accent variant.
 */
export const StakeholderBard: Story = {
  name: 'Stakeholder Bard',
  args: {
    playerClass: stakeholderBard,
    isSelected: false
  }
}

/**
 * Reliability Cleric — blue accent variant.
 */
export const ReliabilityCleric: Story = {
  name: 'Reliability Cleric',
  args: {
    playerClass: reliabilityCleric,
    isSelected: false
  }
}

/**
 * Legacy Ranger — green accent variant.
 */
export const LegacyRanger: Story = {
  name: 'Legacy Ranger',
  args: {
    playerClass: legacyRanger,
    isSelected: false
  }
}

/**
 * Delivery Rogue — orange accent variant.
 */
export const DeliveryRogue: Story = {
  name: 'Delivery Rogue',
  args: {
    playerClass: deliveryRogue,
    isSelected: false
  }
}

/**
 * All five classes in their default state, displayed in a row.
 * Demonstrates the full spectrum of accent colors side by side.
 */
export const AllClasses: Story = {
  name: 'All Classes — Grid',
  render: () => ({
    components: { ClassCard },
    setup() {
      return { boundaryMage, stakeholderBard, reliabilityCleric, legacyRanger, deliveryRogue }
    },
    template: `
      <div style="
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 16px;
        padding: 20px;
        background: #0d0904;
        min-height: 100vh;
      ">
        <ClassCard :playerClass="boundaryMage" />
        <ClassCard :playerClass="stakeholderBard" />
        <ClassCard :playerClass="reliabilityCleric" />
        <ClassCard :playerClass="legacyRanger" />
        <ClassCard :playerClass="deliveryRogue" />
      </div>
    `
  })
}

/**
 * One selected, four default — the typical in-game selection state.
 */
export const OneSelected: Story = {
  name: 'Selection State — One Active',
  render: () => ({
    components: { ClassCard },
    setup() {
      return { boundaryMage, stakeholderBard, reliabilityCleric, legacyRanger, deliveryRogue }
    },
    template: `
      <div style="
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 16px;
        padding: 20px;
        background: #0d0904;
        min-height: 100vh;
      ">
        <ClassCard :playerClass="boundaryMage" :isSelected="true" />
        <ClassCard :playerClass="stakeholderBard" />
        <ClassCard :playerClass="reliabilityCleric" />
        <ClassCard :playerClass="legacyRanger" />
        <ClassCard :playerClass="deliveryRogue" />
      </div>
    `
  })
}
