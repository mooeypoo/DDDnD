import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'

const meta: Meta<typeof SurfaceModalPanel> = {
  title: 'Overlays/SurfaceModalPanel',
  component: SurfaceModalPanel,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    title: 'Run Chronicle Entry',
    size: 'md',
    closeOnBackdrop: true,
    closeLabel: 'Close panel',
    variant: 'default',
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    variant: {
      control: 'select',
      options: ['default', 'aged', 'accent'],
      description: 'Visual weight token set.',
    },
  },
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default production form: title, body content, and an action plate via the
 * footer slot. Demonstrates all three dungeon zones:
 *   [dark header cap] → [teal inset body] → [dark action plate]
 */
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

/**
 * Behavioral contract story. Clicking the close button, pressing Escape, or
 * clicking outside the panel all drive the isOpen flag to false via the close
 * emit. Open/close cycle is exercised here — not just static appearance.
 */
export const BehavioralContract: Story = {
  args: { isOpen: undefined as unknown as boolean },
  render: () => ({
    components: { SurfaceModalPanel },
    setup() {
      const open = ref(false)
      return { open }
    },
    template: `
      <div style="padding: 32px;">
        <button @click="open = true" style="padding: 8px 20px; cursor: pointer;">
          Open modal
        </button>
        <SurfaceModalPanel
          :is-open="open"
          title="Behavioral Contract Check"
          size="md"
          :close-on-backdrop="true"
          close-label="Close panel"
          @close="open = false"
        >
          <p>
            Close paths exercised by this story:
          </p>
          <ul>
            <li>Close button (×) in the header cap</li>
            <li>Escape key</li>
            <li>Backdrop click (outside this panel)</li>
          </ul>
          <template #footer>
            <button @click="open = false">Dismiss</button>
          </template>
        </SurfaceModalPanel>
      </div>
    `,
  }),
}

/**
 * Large reference panel — lg size, no action plate (no footer slot).
 * Confirms inset body expands naturally when the action plate is absent.
 */
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
        <h4 style="margin: 0 0 8px; color: var(--text-secondary)">Context Alignment</h4>
        <ul style="color: var(--text-secondary)">
          <li>Map current bounded contexts</li>
          <li>Identify unstable integration seams</li>
          <li>Track delayed effects in the next 2 turns</li>
        </ul>
      </SurfaceModalPanel>
    `,
  }),
}

/**
 * Small dialog — sm size with action plate. Verifies the narrower width
 * doesn't break the cap seam or bracket placement at reduced proportions.
 */
export const SmallDialog: Story = {
  args: {
    title: 'Confirm Action',
    size: 'sm',
  },
  render: args => ({
    components: { SurfaceModalPanel },
    setup: () => ({ args }),
    template: `
      <SurfaceModalPanel v-bind="args" @close="() => {}">
        <p style="color: var(--text-secondary)">
          This action cannot be reversed within the same sprint phase.
        </p>
        <template #footer>
          <button>Cancel</button>
          <button>Confirm</button>
        </template>
      </SurfaceModalPanel>
    `,
  }),
}

/**
 * Aged variant — quieter, darker patina. Lower visual energy for legacy
 * or lower-priority contexts. All three dungeon zones visible.
 */
export const AgedVariant: Story = {
  args: {
    title: 'Legacy System Report',
    variant: 'aged',
  },
  render: args => ({
    components: { SurfaceModalPanel },
    setup: () => ({ args }),
    template: `
      <SurfaceModalPanel v-bind="args" @close="() => {}">
        <p style="color: var(--text-secondary)">
          The legacy order-processing service has been flagged for review.
          Three bounded contexts are consuming its internal API directly.
        </p>
        <template #footer>
          <button>Acknowledge</button>
          <button>Begin Remediation</button>
        </template>
      </SurfaceModalPanel>
    `,
  }),
}

/**
 * Accent variant — teal-tinted cap and action plate bevel edges, strong
 * inset bloom, teal brackets. Signals active or focused state.
 */
export const AccentVariant: Story = {
  args: {
    title: 'Negotiate Technical Runway',
    variant: 'accent',
  },
  render: args => ({
    components: { SurfaceModalPanel },
    setup: () => ({ args }),
    template: `
      <SurfaceModalPanel v-bind="args" @close="() => {}">
        <p style="color: var(--text-secondary)">
          The architecture team has flagged a three-sprint gap between the current
          delivery velocity and the infrastructure migration timeline.
        </p>
        <template #footer>
          <button>Dismiss</button>
          <button>Confirm Proposal</button>
        </template>
      </SurfaceModalPanel>
    `,
  }),
}

/**
 * Structural silhouette check — contrasting background makes the outer
 * octagonal chamfer (10px) and inner inset top-corner chamfers (14px) both
 * visible. Confirms tri-zone composition: dark cap → teal inset → dark plate.
 */
export const StructuralSilhouette: Story = {
  args: {
    title: 'Silhouette Review',
    variant: 'default',
  },
  render: args => ({
    components: { SurfaceModalPanel },
    setup: () => ({ args }),
    template: `
      <div style="background: #1e2430; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 48px;">
        <SurfaceModalPanel v-bind="args" @close="() => {}">
          <p style="color: var(--text-secondary)">
            Outer shell: 10px chamfer (clip-path). Inner inset: 14px top-corner chamfers
            revealing the bronze ring below. Drop-shadow cascade is heavier than
            AppFrame — the modal reads as elevated above the page surface.
          </p>
          <template #footer>
            <button>Dismiss</button>
            <button>Confirm</button>
          </template>
        </SurfaceModalPanel>
      </div>
    `,
  }),
  parameters: {
    layout: 'fullscreen',
  },
}

