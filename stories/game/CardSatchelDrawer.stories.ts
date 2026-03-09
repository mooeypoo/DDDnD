import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import CardSatchelDrawer from '@/ui/components/cards/card_satchel_drawer.vue'

const meta: Meta<typeof CardSatchelDrawer> = {
  title: 'Game/CardSatchelDrawer',
  component: CardSatchelDrawer,
  tags: ['autodocs'],
  args: {
    isOpen: false,
    totalCards: 6,
    playableCards: 4
  },
  parameters: {
    layout: 'fullscreen'
  },
  decorators: [
    () => ({
      setup() {
        const isOpen = ref(false)
        return { isOpen }
      },
      template: `
        <div style="min-height:100vh; background:#0b0e1a; padding:24px;">
          <p style="color:#c8d0e0;">Click the drawer handle at the bottom to toggle the satchel.</p>
          <story />
        </div>
      `
    })
  ]
}

export default meta

type Story = StoryObj<typeof meta>

export const Closed: Story = {}

export const Open: Story = {
  args: {
    isOpen: true,
    totalCards: 6,
    playableCards: 4
  }
}

export const EmptySatchel: Story = {
  args: {
    isOpen: true,
    totalCards: 0,
    playableCards: 0
  }
}
