import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonBadgePrototype from '@/ui/prototypes/dungeon/DungeonBadgePrototype.vue'
import DungeonButtonPrototype from '@/ui/prototypes/dungeon/DungeonButtonPrototype.vue'
import DungeonFramePrototype from '@/ui/prototypes/dungeon/DungeonFramePrototype.vue'

const meta: Meta<typeof DungeonBadgePrototype> = {
  title: 'Prototypes/Dungeon/DungeonBadgePrototype',
  component: DungeonBadgePrototype,
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
type Story = StoryObj<typeof DungeonBadgePrototype>

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
    components: { DungeonBadgePrototype },
    setup: () => ({ args }),
    template: `<DungeonBadgePrototype v-bind="args" />`,
  }),
}

/**
 * Semantic variant gallery — all six variants at medium size on dark background.
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
    components: { DungeonBadgePrototype },
    template: `
      <div style="display: flex; align-items: center; gap: 20px;">
        <DungeonBadgePrototype variant="info"    size="md" label="Information" />
        <DungeonBadgePrototype variant="success" size="md" label="Success" />
        <DungeonBadgePrototype variant="warning" size="md" label="Warning" />
        <DungeonBadgePrototype variant="alert"   size="md" label="Alert" />
        <DungeonBadgePrototype variant="locked"  size="md" label="Locked" />
        <DungeonBadgePrototype variant="help"    size="md" label="Help" />
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
    components: { DungeonBadgePrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 24px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted); width: 28px; flex-shrink: 0;">md</span>
          <DungeonBadgePrototype variant="info"    size="md" />
          <DungeonBadgePrototype variant="success" size="md" />
          <DungeonBadgePrototype variant="warning" size="md" />
          <DungeonBadgePrototype variant="alert"   size="md" />
          <DungeonBadgePrototype variant="locked"  size="md" />
          <DungeonBadgePrototype variant="help"    size="md" />
        </div>
        <div style="display: flex; align-items: center; gap: 20px;">
          <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted); width: 28px; flex-shrink: 0;">sm</span>
          <DungeonBadgePrototype variant="info"    size="sm" />
          <DungeonBadgePrototype variant="success" size="sm" />
          <DungeonBadgePrototype variant="warning" size="sm" />
          <DungeonBadgePrototype variant="alert"   size="sm" />
          <DungeonBadgePrototype variant="locked"  size="sm" />
          <DungeonBadgePrototype variant="help"    size="sm" />
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
 * Dark background — ambient depth read on DM Console surface.
 *
 * The filter: drop-shadow cast is circular and matches the badge
 * silhouette. This is the canonical dark-surface placement — the
 * same surface on which the frame, modal, and button family live.
 *
 * The bronze ring top-lit bevel is most legible here: the bright
 * upper arc of the ring catches more contrast against the dark shell
 * gap and the ambient surface than it would on a lighter background.
 */
export const OnDarkBackground: Story = {
  render: () => ({
    components: { DungeonBadgePrototype },
    template: `
      <div style="background: #0b0e1a; padding: 48px 56px; border-radius: 4px; display: flex; gap: 18px; align-items: center;">
        <DungeonBadgePrototype variant="info"    size="md" />
        <DungeonBadgePrototype variant="success" size="md" />
        <DungeonBadgePrototype variant="warning" size="md" />
        <DungeonBadgePrototype variant="alert"   size="md" />
        <DungeonBadgePrototype variant="locked"  size="md" />
        <DungeonBadgePrototype variant="help"    size="md" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}

/**
 * Neutral background — legibility check on mid-tone surface.
 *
 * Validates that the drop-shadow and ring bevel still separate the
 * badge from a lighter background, and that the semantic glyph
 * colors remain readable without the dark-surface contrast boost.
 *
 * The outer shell's near-black border (--dng-shell-border) carries
 * the badge silhouette even when the shell background blends with
 * a dark-panel surface.
 */
export const OnNeutralBackground: Story = {
  render: () => ({
    components: { DungeonBadgePrototype },
    template: `
      <div style="background: #192031; padding: 48px 56px; border-radius: 4px; display: flex; gap: 18px; align-items: center;">
        <DungeonBadgePrototype variant="info"    size="md" />
        <DungeonBadgePrototype variant="success" size="md" />
        <DungeonBadgePrototype variant="warning" size="md" />
        <DungeonBadgePrototype variant="alert"   size="md" />
        <DungeonBadgePrototype variant="locked"  size="md" />
        <DungeonBadgePrototype variant="help"    size="md" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Card' },
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
    components: { DungeonBadgePrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 32px; align-items: flex-start;">
        <div>
          <p style="margin: 0 0 12px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted);">
            All active — scenario condition stack
          </p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <DungeonBadgePrototype variant="alert"   size="md" label="Critical: Compliance deadline" />
            <DungeonBadgePrototype variant="warning" size="md" label="Caution: Budget pressure" />
            <DungeonBadgePrototype variant="info"    size="md" label="Info: Architecture review open" />
            <DungeonBadgePrototype variant="help"    size="md" label="Guidance available" />
          </div>
        </div>
        <div>
          <p style="margin: 0 0 12px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted);">
            Resolved state
          </p>
          <div style="display: flex; gap: 10px; align-items: center;">
            <DungeonBadgePrototype variant="success" size="md" label="Resolved" />
            <DungeonBadgePrototype variant="locked"  size="md" label="Locked — awaiting unlock" />
          </div>
        </div>
        <div>
          <p style="margin: 0 0 12px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--dng-footer-muted);">
            Small markers inline
          </p>
          <div style="display: flex; gap: 8px; align-items: center;">
            <DungeonBadgePrototype variant="alert"   size="sm" />
            <DungeonBadgePrototype variant="warning" size="sm" />
            <DungeonBadgePrototype variant="info"    size="sm" />
            <DungeonBadgePrototype variant="success" size="sm" />
            <DungeonBadgePrototype variant="locked"  size="sm" />
            <DungeonBadgePrototype variant="help"    size="sm" />
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
 * Alongside a DungeonButtonPrototype — indicator paired with action.
 *
 * Demonstrates how a badge sits adjacent to a button. The bronze ring
 * family connection reads in the shared material: both components use
 * the same four-stop vertical gradient, the same shell-gap dark strip,
 * and the same plate surface depth.
 *
 * The badge does not share the chamfer octagon of the button — its
 * circular form is intentionally distinct at the silhouette level to
 * avoid confusion with interactive elements.
 */
export const AlongsideButton: Story = {
  render: () => ({
    components: { DungeonBadgePrototype, DungeonButtonPrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <DungeonBadgePrototype variant="alert"   size="md" label="Alert: risk unresolved" />
          <DungeonButtonPrototype variant="warning" label="Absorb Risk" />
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <DungeonBadgePrototype variant="success" size="md" label="Resolved" />
          <DungeonButtonPrototype variant="primary" label="Confirm Pattern" />
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <DungeonBadgePrototype variant="locked"  size="md" label="Locked — action unavailable" />
          <DungeonButtonPrototype variant="disabled" label="Locked" />
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <DungeonBadgePrototype variant="info"    size="sm" label="Info" />
          <DungeonBadgePrototype variant="warning" size="sm" label="Warning" />
          <DungeonButtonPrototype variant="secondary" label="Review Details" />
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
 * In a DungeonFramePrototype header — badge as header-actions slot marker.
 *
 * Shows the badge anchored in the nameplate header-actions region of
 * a DungeonFramePrototype. The bronze ring of the badge reads as
 * family-consistent with the frame ring surrounding it — shared
 * material, distinct scale.
 *
 * Use sparingly: the nameplate is a small zone and the badge competes
 * with title text for attention. The small size (sm) is preferred
 * in the header slot.
 */
export const InFrameHeader: Story = {
  render: () => ({
    components: { DungeonBadgePrototype, DungeonFramePrototype },
    template: `
      <div style="min-width: 340px; max-width: 480px;">
        <DungeonFramePrototype
          title="Microservice Ownership"
          subtitle="Bounded context registry · turn 4"
          variant="accent"
        >
          <template #header-actions>
            <DungeonBadgePrototype variant="alert" size="sm" label="Unresolved risks" />
          </template>
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
            <li>Define Bounded Context</li>
            <li>Introduce Anti-Corruption Layer</li>
            <li>Document Ubiquitous Language</li>
          </ul>
          <template #footer>3 risks unresolved · 2 actions remaining</template>
        </DungeonFramePrototype>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'DM Console' },
    controls: { disable: true },
  },
}
