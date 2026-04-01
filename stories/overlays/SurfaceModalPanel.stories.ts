import type { Meta, StoryObj } from '@storybook/vue3'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'

const meta: Meta<typeof SurfaceModalPanel> = {
  title: 'Overlays/SurfaceModalPanel',
  component: SurfaceModalPanel,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    title: 'Run Chronicle Entry',
    size: 'md',
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

export const NarrativeContent: Story = {
  render: args => ({
    components: { SurfaceModalPanel },
    setup: () => ({ args }),
    template: `
      <SurfaceModalPanel v-bind="args" @close="() => {}">
        <p>A production incident has erupted in the southern services cluster.</p>
        <p>Choose whether to stabilize first or push emergency delivery.</p>
        <template #footer>
          <button>Dismiss</button>
          <button>Open Chronicle</button>
        </template>
      </SurfaceModalPanel>
    `,
  }),
}

export const LargeReferencePanel: Story = {
  args: {
    title: 'Architecture Notes',
    size: 'lg',
  },
  render: args => ({
    components: { SurfaceModalPanel },
    setup: () => ({ args }),
    template: `
      <SurfaceModalPanel v-bind="args" @close="() => {}">
        <h4>Context Alignment</h4>
        <ul>
          <li>Map current bounded contexts</li>
          <li>Identify unstable integration seams</li>
          <li>Track delayed effects in the next 2 turns</li>
        </ul>
        <template #footer>
          <button>Close</button>
        </template>
      </SurfaceModalPanel>
    `,
  }),
}
