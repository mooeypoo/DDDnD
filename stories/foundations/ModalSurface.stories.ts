import type { Meta, StoryObj } from '@storybook/vue3'

import ModalSurface from '@/ui/components/common/modal_surface.vue'

const meta: Meta<typeof ModalSurface> = {
  title: 'Foundations/ModalSurface',
  component: ModalSurface,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    title: 'Card Inspection'
  },
  parameters: {
    layout: 'fullscreen'
  }
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => ({
    components: { ModalSurface },
    setup() {
      return { args }
    },
    template: `
      <ModalSurface v-bind="args">
        <p style="margin: 0 0 0.75rem 0;">Inspect architecture choices without leaving the current turn context.</p>
        <p style="margin: 0; opacity: 0.85;">Use this surface for rules, card details, or deeper decision context.</p>
      </ModalSurface>
    `
  })
}

export const WithFooterActions: Story = {
  render: (args) => ({
    components: { ModalSurface },
    setup() {
      return { args }
    },
    template: `
      <ModalSurface v-bind="args">
        <p style="margin: 0;">This modal shell supports optional action controls while keeping a consistent presentation style.</p>
        <template #footer>
          <button style="padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--color-border-default); background: var(--color-bg-overlay); color: var(--color-text-primary);">Cancel</button>
          <button style="padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid var(--color-primary); background: var(--color-primary); color: var(--color-text-bright);">Confirm</button>
        </template>
      </ModalSurface>
    `
  }),
  args: {
    title: 'Rules Reference'
  }
}
