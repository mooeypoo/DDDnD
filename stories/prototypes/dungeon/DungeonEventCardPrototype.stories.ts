import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonEventCardPrototype from '@/ui/prototypes/dungeon/DungeonEventCardPrototype.vue'

const meta: Meta<typeof DungeonEventCardPrototype> = {
  title: 'Prototypes/Dungeon/DungeonEventCardPrototype',
  component: DungeonEventCardPrototype,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof DungeonEventCardPrototype>

/**
 * All four severity variants rendered side-by-side.
 * The prototype is self-contained and demos all variants in one pass.
 */
export const AllSeverities: Story = {
  name: 'All Severity Variants',
}
