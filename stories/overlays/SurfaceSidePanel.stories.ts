import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import SurfaceSidePanel from '@/ui/components/surfaces/surface_side_panel.vue'

const meta: Meta<typeof SurfaceSidePanel> = {
  title: 'Overlays/SurfaceSidePanel',
  component: SurfaceSidePanel,
  tags: ['autodocs'],
  args: {
    title: 'Codex Snapshot',
    isOpen: true,
    side: 'right',
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

export const CodexPanel: Story = {
  render: args => ({
    components: { SurfaceSidePanel },
    setup: () => ({ args }),
    template: `
      <SurfaceSidePanel v-bind="args" @close="() => {}">
        <h4>Active Concepts</h4>
        <ul>
          <li>Anti-corruption layer pressure rising</li>
          <li>Stakeholder trust is volatile</li>
          <li>Delivery confidence recovered last turn</li>
        </ul>
        <template #footer>
          <button>Pin Note</button>
        </template>
      </SurfaceSidePanel>
    `,
  }),
}

export const ToggleablePanel: Story = {
  render: () => ({
    components: { SurfaceSidePanel },
    setup: () => {
      const isOpen = ref(false)
      return { isOpen }
    },
    template: `
      <div style="padding: 24px;">
        <button @click="isOpen = true">Open Codex Panel</button>
        <SurfaceSidePanel
          :is-open="isOpen"
          title="Codex Snapshot"
          side="left"
          @close="isOpen = false"
        >
          <p>Reusable side panel for codex-like overlays.</p>
        </SurfaceSidePanel>
      </div>
    `,
  }),
}
