import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook/vue3'
import SurfaceDrawerPanel from '@/ui/components/surfaces/surface_drawer_panel.vue'

const meta: Meta<typeof SurfaceDrawerPanel> = {
  title: 'Overlays/SurfaceDrawerPanel',
  component: SurfaceDrawerPanel,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    title: 'Chronicle Drawer',
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

export const ChronicleEntries: Story = {
  render: args => ({
    components: { SurfaceDrawerPanel },
    setup: () => ({ args }),
    template: `
      <SurfaceDrawerPanel v-bind="args" @toggle="() => {}">
        <ul>
          <li>Turn 4: Event trigger increased audit pressure.</li>
          <li>Turn 5: Refactor action improved maintainability by +8.</li>
          <li>Turn 6: Delayed aftershock reduced delivery confidence by -4.</li>
        </ul>
        <template #footer>
          <button>Export Log</button>
        </template>
      </SurfaceDrawerPanel>
    `,
  }),
}

export const InteractiveToggle: Story = {
  render: () => ({
    components: { SurfaceDrawerPanel },
    setup: () => {
      const open = ref(false)
      return { open }
    },
    template: `
      <SurfaceDrawerPanel :is-open="open" title="Chronicle Drawer" @toggle="open = !open">
        <p>This drawer supports timeline notes and turn summaries.</p>
      </SurfaceDrawerPanel>
    `,
  }),
}
