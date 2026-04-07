import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import AppTabs from '@/ui/components/common/AppTabs.vue'

const meta: Meta<typeof AppTabs> = {
  title: 'Foundations/AppTabs',
  component: AppTabs,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    tabs: ['Overview', 'Risks', 'History'],
    modelValue: 0,
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'aged', 'accent'],
      description:
        'Visual state of the tab strip. ' +
        'default = standard worn-bronze ring, recessed panel on inactive tabs. ' +
        'aged = darker patina ring, lower visual energy. ' +
        'accent = teal plate bevel on active tab + teal bracket mounts.',
    },
    modelValue: {
      control: { type: 'number', min: 0 },
      description: 'Index of the currently active tab (0-based).',
    },
    tabs: {
      control: 'object',
      description: 'Array of tab label strings rendered in order. Each item becomes one tab face.',
    },
  },
}

export default meta
type Story = StoryObj<typeof AppTabs>

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interactive default — three-tab strip, first tab active.
 *
 * Structural zones visible here:
 *   outer shell (8px chamfered clip-path, ambient octagonal drop-shadow)
 *   → 3px dark shell gap
 *   → bronze ring (8px top/bottom, 8px sides — tighter than the frame's 12px)
 *   → L-bracket mounts at each ring corner (16px/3px/6px, same as AppFrame)
 *   → full-bleed tab strip (negative-margin bleed mirrors the frame nameplate)
 *     → active tab:   plate gradient + directional bevel + title-gold label
 *     → inactive tabs: panel-surface recessed + subtitle-warm label
 *
 * Click each tab to switch the active index. The v-model binding is wired
 * via a local ref within the render function.
 */
export const Default: Story = {
  render: (args) => ({
    components: { AppTabs },
    setup() {
      const active = ref(args.modelValue ?? 0)
      return { args, active }
    },
    template: `<AppTabs :tabs="args.tabs" :variant="args.variant" v-model="active" />`,
  }),
}

/**
 * Variant gallery — all three variants side by side with the same tab set.
 *
 * Read top to bottom as a visual weight hierarchy:
 *   default  — standard bronze ring, warm plate-bevel active tab
 *   aged     — flatter bronze, dimmer labels, less reflective ring material
 *   accent   — teal plate bevel on active tab, teal bracket mounts
 *
 * All three share the same outer shell clip-path, ring gradient, bracket
 * construction, and strip bleed strategy. Differences are purely
 * token-override based — no structural shape changes.
 */
export const VariantGallery: Story = {
  render: () => ({
    components: { AppTabs },
    setup() {
      const a0 = ref(0)
      const a1 = ref(1)
      const a2 = ref(0)
      return { a0, a1, a2 }
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px; align-items: flex-start;">
        <div>
          <p style="margin: 0 0 8px; font-family: monospace; font-size: 11px; color: #7a6c44;">variant="default"</p>
          <AppTabs :tabs="['Overview', 'Risks', 'History']" variant="default" v-model="a0" />
        </div>
        <div>
          <p style="margin: 0 0 8px; font-family: monospace; font-size: 11px; color: #7a6c44;">variant="aged"</p>
          <AppTabs :tabs="['Overview', 'Risks', 'History']" variant="aged" v-model="a1" />
        </div>
        <div>
          <p style="margin: 0 0 8px; font-family: monospace; font-size: 11px; color: #7a6c44;">variant="accent"</p>
          <AppTabs :tabs="['Overview', 'Risks', 'History']" variant="accent" v-model="a2" />
        </div>
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Four-tab strip — confirms proportional tab sizing at four items.
 *
 * Each tab uses flex: 1 inside the strip so four items divide the
 * available width evenly. The bronze ring and chamfer silhouette
 * remain unchanged — only the strip's internal division changes with
 * the tab count.
 */
export const FourTabs: Story = {
  render: () => ({
    components: { AppTabs },
    setup() {
      const active = ref(1)
      return { active }
    },
    template: `
      <AppTabs
        :tabs="['Domain', 'Infrastructure', 'Application', 'Interface']"
        variant="default"
        v-model="active"
      />
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Long labels — stress-tests the tab strip with longer label strings.
 *
 * White-space: nowrap on each tab means the strip expands to accommodate
 * the labels rather than wrapping. Confirms that horizontal overflow is
 * handled gracefully and the chamfer clip-path still reads cleanly.
 */
export const LongLabels: Story = {
  render: () => ({
    components: { AppTabs },
    setup() {
      const active = ref(0)
      return { active }
    },
    template: `
      <AppTabs
        :tabs="['Architecture Review', 'Risk Assessment', 'Compliance Audit']"
        variant="default"
        v-model="active"
      />
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Two-tab strip — minimum sensible configuration.
 *
 * Confirms the strip reads correctly with only two items:
 * the inter-tab divider appears between them, no right divider on
 * the last item (last-child rule applied correctly), and both
 * active/inactive states are visible in one view.
 */
export const TwoTabs: Story = {
  render: () => ({
    components: { AppTabs },
    setup() {
      const active = ref(0)
      return { active }
    },
    template: `
      <AppTabs
        :tabs="['Active', 'Archived']"
        variant="default"
        v-model="active"
      />
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Chamfer silhouette on contrasting surface — confirm the octagonal read.
 *
 * Dark background isolates the outer shell geometry:
 *   · 8px chamfer at each corner — identical to AppFrame
 *   · Drop-shadow is octagonal (follows the clip-path border)
 *   · Bronze ring visible at top and bottom; strip fills full width
 *   · Bracket ornaments prominent against the dark surround
 *   · Accent variant shown to confirm teal bracket glow
 *
 * This is a structural review story — not a usage demonstration.
 */
export const ChamferSilhouette: Story = {
  render: () => ({
    components: { AppTabs },
    setup() {
      const a0 = ref(0)
      const a1 = ref(1)
      return { a0, a1 }
    },
    template: `
      <div style="background: #0d1018; padding: 48px 48px 56px; border-radius: 4px; display: flex; flex-direction: column; gap: 32px; align-items: flex-start;">
        <AppTabs :tabs="['Architecture', 'Risks', 'History']" variant="default" v-model="a0" />
        <AppTabs :tabs="['Architecture', 'Risks', 'History']" variant="accent"  v-model="a1" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}
