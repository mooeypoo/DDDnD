import type { Meta, StoryObj } from '@storybook/vue3'
import SurfaceFrameContainer from '@/ui/components/surfaces/surface_frame_container.vue'

const meta: Meta<typeof SurfaceFrameContainer> = {
  title: 'Foundations/SurfaceFrameContainer',
  component: SurfaceFrameContainer,
  tags: ['autodocs'],
  args: {
    title: 'Action Tray Frame',
    subtitle: 'Temporary structural frame for action controls',
    variant: 'default',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const WithActionList: Story = {
  render: args => ({
    components: { SurfaceFrameContainer },
    setup: () => ({ args }),
    template: `
      <SurfaceFrameContainer v-bind="args">
        <ul>
          <li>Refactor Legacy Gateway</li>
          <li>Align Budget With Architecture</li>
          <li>Introduce Anti-Corruption Layer</li>
        </ul>
        <template #footer>
          <small>3 actions available this turn</small>
        </template>
      </SurfaceFrameContainer>
    `,
  }),
}

export const EmphasisVariant: Story = {
  args: {
    title: 'Current Turn Actions',
    variant: 'emphasis',
  },
  render: args => ({
    components: { SurfaceFrameContainer },
    setup: () => ({ args }),
    template: `
      <SurfaceFrameContainer v-bind="args">
        <p>Select one action from your satchel to proceed.</p>
        <template #headerActions>
          <button>Sort</button>
        </template>
      </SurfaceFrameContainer>
    `,
  }),
}
