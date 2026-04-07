import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonProgressPrototype from '@/ui/prototypes/dungeon/DungeonProgressPrototype.vue'

const meta: Meta<typeof DungeonProgressPrototype> = {
  title: 'Prototypes/Dungeon/DungeonProgressPrototype',
  component: DungeonProgressPrototype,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    value: 60,
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'alert'],
      description:
        'Visual signal state of the meter. ' +
        'default = teal fill (neutral reading). ' +
        'success = green fill (goal met / capacity healthy). ' +
        'warning = amber fill + nameplate bevel (approaching limit). ' +
        'alert = crimson fill (critical / over-threshold).',
    },
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Current meter value. Clamped to 0–100.',
    },
    label: {
      control: 'text',
      description:
        'Optional label text. When set, renders the nameplate header above the inset ' +
        'and shows the label in the footer readout. When omitted, no nameplate is shown ' +
        'and the footer readout defaults to "Progress".',
    },
  },
}

export default meta
type Story = StoryObj<typeof DungeonProgressPrototype>

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interactive default — single meter with full Storybook controls.
 *
 * Structural zones visible here:
 *   outer shell (8px chamfered clip-path, ambient octagonal drop-shadow)
 *   → 3px dark shell gap
 *   → bronze ring (12px uniform — same panel-weight as DungeonFramePrototype)
 *   → L-bracket mounts at four ring corners (16px/3px/6px geometry)
 *   → teal inset (radial bloom + linear depth gradient + chamfered top aperture)
 *     → dark track channel (--dng-panel-footer background, inset top-shadow)
 *       → teal fill bar (--dng-progress-fill, 300ms ease-out transition)
 *         → leading-edge shimmer (3px ::after with glow)
 *     → footer readout (label left / value% right)
 *
 * Drag the `value` range control to watch the fill animate.
 * The leading-edge shimmer moves with the fill bar.
 */
export const Default: Story = {
  render: (args) => ({
    components: { DungeonProgressPrototype },
    setup: () => ({ args }),
    template: `<DungeonProgressPrototype v-bind="args" />`,
  }),
}

/**
 * Value states — five fill levels in a column: 0 / 25 / 50 / 75 / 100.
 *
 * Confirms at-a-glance:
 *   · value=0: fill bar hidden, leading-edge shimmer also hidden (.is-empty)
 *   · value=25: fill occupies first quarter; shimmer visible at 25% position
 *   · value=50: half-filled; teal fill clearly distinct from dark track
 *   · value=75: three-quarters filled
 *   · value=100: track entirely filled; shimmer at right edge of track
 *
 * All five show "default" variant. No label — no nameplate rendered.
 */
export const ValueStates: Story = {
  render: () => ({
    components: { DungeonProgressPrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; min-width: 400px;">
        <DungeonProgressPrototype :value="0"   variant="default" />
        <DungeonProgressPrototype :value="25"  variant="default" />
        <DungeonProgressPrototype :value="50"  variant="default" />
        <DungeonProgressPrototype :value="75"  variant="default" />
        <DungeonProgressPrototype :value="100" variant="default" />
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Variant gallery — all four variants at ~60% fill with labels.
 *
 * Shows the semantic fill color spectrum:
 *   default  — teal fill: standard neutral meter reading
 *   success  — green fill: goal met / resource healthy
 *   warning  — amber fill + amber nameplate bevel: approaching threshold
 *   alert    — crimson fill: critical / over-threshold
 *
 * The warning variant is the only one that modifies both the fill color
 * AND the nameplate bevel (plate-top/bottom/shimmer → amber). All others
 * override --dng-progress-fill only and leave ring and nameplate unchanged.
 */
export const VariantGallery: Story = {
  render: () => ({
    components: { DungeonProgressPrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; min-width: 440px;">
        <DungeonProgressPrototype :value="62" variant="default" label="Technical Debt" />
        <DungeonProgressPrototype :value="58" variant="success" label="Sprint Velocity" />
        <DungeonProgressPrototype :value="74" variant="warning" label="Release Risk" />
        <DungeonProgressPrototype :value="88" variant="alert"   label="Production Load" />
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * With label — confirms nameplate header + readout footer when label is set.
 *
 * When `label` prop is present:
 *   1. A full-bleed nameplate plate renders above the inset — same wall-to-wall
 *      construction as DungeonFramePrototype's header, with negative margin bleed
 *      and directional plate bevel borders.
 *   2. The nameplate-to-inset gap (--dng-ring-gap: 8px) produces a visible bronze
 *      seam bridge between the two zones — the same structural read as the frame.
 *   3. The footer readout shows the label text on the left, value% on the right.
 *
 * Compare with ValueStates where no nameplate renders — ring goes straight to inset.
 */
export const WithLabel: Story = {
  render: (args) => ({
    components: { DungeonProgressPrototype },
    setup: () => ({ args }),
    template: `<DungeonProgressPrototype v-bind="args" />`,
  }),
  args: {
    value: 45,
    label: 'Architecture Compliance',
    variant: 'default',
  },
}

/**
 * No label — confirms no-nameplate layout: ring goes directly to inset.
 *
 * The ring-gap is present in the ring's flex layout but has no visible
 * effect when only one child (the inset) is rendered. The inset's
 * inner-chamfer aperture slopes are still visible at top corners.
 *
 * Footer readout defaults to "Progress" label when no label prop is set.
 */
export const NoLabel: Story = {
  render: () => ({
    components: { DungeonProgressPrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; min-width: 400px;">
        <DungeonProgressPrototype :value="33" variant="default" />
        <DungeonProgressPrototype :value="66" variant="success" />
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Chamfer silhouette on contrasting surface — confirm panel-weight read.
 *
 * Dark background isolates the outer shell geometry:
 *   · 8px chamfer at each corner — same as DungeonFramePrototype
 *   · Drop-shadow is octagonal (follows clip-path, three stacked drops)
 *   · Bronze ring visible at full 12px thickness on all four sides
 *   · Inner-chamfer aperture slopes visible at inset top corners
 *   · Bracket ornaments prominent against the dark surround
 *
 * Shows labeled + unlabeled configurations side by side.
 */
export const ChamferSilhouette: Story = {
  render: () => ({
    components: { DungeonProgressPrototype },
    template: `
      <div style="background: #0d1018; padding: 48px; border-radius: 4px; display: flex; flex-direction: column; gap: 32px; min-width: 440px;">
        <DungeonProgressPrototype :value="70" variant="default" label="System Stability" />
        <DungeonProgressPrototype :value="40" variant="warning" label="Incident Rate" />
        <DungeonProgressPrototype :value="55" variant="alert"   label="Error Budget" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}
