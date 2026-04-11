import type { Meta, StoryObj } from '@storybook/vue3'
import AppBadge from '@/ui/components/common/AppBadge.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
import AppFrame from '@/ui/components/surfaces/AppFrame.vue'

const meta: Meta<typeof AppBadge> = {
  title: 'Foundations/AppBadge',
  component: AppBadge,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    variant: 'info',
    size: 'md',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'alert', 'locked', 'help'],
      description:
        'Semantic variant. Drives plate bevel color and centered glyph. ' +
        'info = teal ℹ (informational). ' +
        'success = green ✓ (positive/resolved). ' +
        'warning = amber ! (caution/pending). ' +
        'alert = red ✕ (critical/error). ' +
        'locked = dim 🔒 (unavailable). ' +
        'help = purple ? (guidance).',
    },
    size: {
      control: 'select',
      options: ['sm', 'md'],
      description:
        'Badge diameter. sm = 24px outer / 10px glyph. md = 36px outer / 15px glyph.',
    },
    label: {
      control: 'text',
      description: 'Accessible aria-label. Defaults to the variant name.',
    },
  },
}

export default meta
type Story = StoryObj<typeof AppBadge>

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interactive default — single medium badge with Storybook controls.
 *
 * Structural zones visible here:
 *   outer shell (circular border-radius 50%, 3px dark shell gap, ambient drop-shadow)
 *   → bronze ring (same four-stop vertical gradient as frame/modal/button)
 *   → dark face plate (plate gradient + directional bevel borders at each edge arc)
 *   → centered SVG glyph (10×10 viewBox, color = semantic variant token)
 *
 * The info variant shown here uses teal plate bevel arcs — same rgba values as
 * the primary button and accent frame variants, applied to the circular boundary.
 */
export const Default: Story = {
  render: (args) => ({
    components: { AppBadge },
    setup: () => ({ args }),
    template: `<AppBadge v-bind="args" />`,
  }),
}

/**
 * Semantic variant gallery — all six variants at medium size.
 *
 * Each badge uses identical structure (outer shell → ring → face → glyph).
 * Variant differentiation is achieved entirely through:
 *   · Plate bevel border colors (top/left/right/bottom/shimmer token overrides)
 *   · Glyph icon shape
 *   · --dng-badge-glyph-color token value
 *
 * The bronze ring material is identical across all six variants — it is always
 * a cast-bronze frame regardless of semantic state. The semantic signal lives
 * at the face plate boundary, not the ring.
 *
 * Reading order (left to right) by urgency register:
 *   info    — base informational state (teal)
 *   success — positive resolved (green)
 *   warning — caution/pending (amber — note warmer hue vs. info teal)
 *   alert   — critical/error (red — highest urgency)
 *   locked  — unavailable (dimmed ring, no semantic accent)
 *   help    — guidance/arcane (purple — outside the urgency register)
 */
export const VariantGallery: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div style="display: flex; align-items: center; gap: 20px;">
        <AppBadge variant="info"    size="md" label="Information" />
        <AppBadge variant="success" size="md" label="Success" />
        <AppBadge variant="warning" size="md" label="Warning" />
        <AppBadge variant="alert"   size="md" label="Alert" />
        <AppBadge variant="locked"  size="md" label="Locked" />
        <AppBadge variant="help"    size="md" label="Help" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}

/**
 * Size comparison — sm vs md at every semantic variant.
 *
 * Small (24px) and medium (36px) badges share identical layering.
 * Dimensional differences:
 *   · Ring thickness: 3px (sm) vs 4px (md)
 *   · Glyph: 10px (sm) vs 15px (md)
 *   · Shell gap: 3px in both sizes (shared --dng-shell-gap token)
 *
 * The bronze ring is proportionally visible at both sizes. The glyph
 * at 10px (sm) remains recognisable for all six shapes — the SVG
 * 10×10 viewBox was designed for minimum-size legibility.
 *
 * Use sm for inline status markers in dense layouts (e.g., adjacent
 * to a card title or row label). Use md for standalone indicators,
 * legend keys, or when the badge carries the primary semantic read.
 */
export const SizeComparison: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted); width: 28px; flex-shrink: 0;">md</span>
          <AppBadge variant="info"    size="md" />
          <AppBadge variant="success" size="md" />
          <AppBadge variant="warning" size="md" />
          <AppBadge variant="alert"   size="md" />
          <AppBadge variant="locked"  size="md" />
          <AppBadge variant="help"    size="md" />
        </div>
        <div style="display: flex; align-items: center; gap: 20px;">
          <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted); width: 28px; flex-shrink: 0;">sm</span>
          <AppBadge variant="info"    size="sm" />
          <AppBadge variant="success" size="sm" />
          <AppBadge variant="warning" size="sm" />
          <AppBadge variant="alert"   size="sm" />
          <AppBadge variant="locked"  size="sm" />
          <AppBadge variant="help"    size="sm" />
        </div>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}

/**
 * Badge cluster — multiple badges together as a status indicator set.
 *
 * Demonstrates how badges read as a group — e.g. a row of variant
 * markers that summarises a scenario's active condition stack.
 * The consistent circular silhouette makes the group scannable:
 * variant differentiation is legible without hovering or reading labels.
 */
export const BadgeCluster: Story = {
  render: () => ({
    components: { AppBadge },
    template: `
      <div style="display: flex; flex-direction: column; gap: 32px; align-items: flex-start;">
        <div>
          <p style="margin: 0 0 12px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted);">
            All active — scenario condition stack
          </p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <AppBadge variant="alert"   size="md" label="Critical: Compliance deadline" />
            <AppBadge variant="warning" size="md" label="Caution: Budget pressure" />
            <AppBadge variant="info"    size="md" label="Info: Architecture review open" />
            <AppBadge variant="help"    size="md" label="Guidance available" />
          </div>
        </div>
        <div>
          <p style="margin: 0 0 12px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted);">
            Resolved state
          </p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <AppBadge variant="success" size="md" label="Resolved" />
            <AppBadge variant="locked"  size="md" label="Locked — awaiting unlock" />
          </div>
        </div>
        <div>
          <p style="margin: 0 0 12px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted);">
            Small markers inline
          </p>
          <div style="display: flex; gap: 8px; align-items: center;">
            <AppBadge variant="alert"   size="sm" />
            <AppBadge variant="warning" size="sm" />
            <AppBadge variant="info"    size="sm" />
            <AppBadge variant="success" size="sm" />
            <AppBadge variant="locked"  size="sm" />
            <AppBadge variant="help"    size="sm" />
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}

/**
 * Alongside AppButton — indicator paired with action.
 *
 * Demonstrates how a badge sits adjacent to a button. The bronze ring
 * family connection reads in the shared material: both components use
 * the same four-stop vertical gradient, the same shell-gap dark strip,
 * and the same plate surface depth.
 *
 * The badge does not share the chamfer octagon of the button — its
 * circular form is intentionally distinct at the silhouette level to
 * avoid confusion with interactive elements.
 *
 * Note: the locked row uses AppButton's boolean `disabled` prop,
 * not a variant string — the correct production API.
 */
export const AlongsideButton: Story = {
  render: () => ({
    components: { AppBadge, AppButton },
    template: `
      <div style="display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <AppBadge variant="alert"   size="md" label="Alert: risk unresolved" />
          <AppButton variant="warning" label="Absorb Risk" />
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <AppBadge variant="success" size="md" label="Resolved" />
          <AppButton variant="primary" label="Confirm Pattern" />
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <AppBadge variant="locked"  size="md" label="Locked — action unavailable" />
          <AppButton :disabled="true" label="Locked" />
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <AppBadge variant="info"    size="sm" label="Info" />
          <AppBadge variant="warning" size="sm" label="Warning" />
          <AppButton variant="secondary" label="Review Details" />
        </div>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}

/**
 * In AppFrame header — badge as header-actions slot marker.
 *
 * Shows the badge anchored in the nameplate header-actions region of
 * an AppFrame. The bronze ring of the badge reads as family-consistent
 * with the frame ring surrounding it — shared material, distinct scale.
 *
 * Use sparingly: the nameplate is a small zone and the badge competes
 * with title text for attention. The small size (sm) is preferred
 * in the header slot.
 */
export const InFrameHeader: Story = {
  render: () => ({
    components: { AppBadge, AppFrame },
    template: `
      <div style="min-width: 340px; max-width: 480px;">
        <AppFrame
          title="Microservice Ownership"
          subtitle="Bounded context registry · turn 4"
          variant="accent"
        >
          <template #header-actions>
            <AppBadge variant="alert" size="sm" label="Unresolved risks" />
          </template>
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
            <li>Define Bounded Context</li>
            <li>Introduce Anti-Corruption Layer</li>
            <li>Document Ubiquitous Language</li>
          </ul>
          <template #footer>3 risks unresolved · 2 actions remaining</template>
        </AppFrame>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}
