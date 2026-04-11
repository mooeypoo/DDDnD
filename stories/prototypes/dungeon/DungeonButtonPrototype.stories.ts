import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonButtonPrototype from '@/ui/prototypes/dungeon/DungeonButtonPrototype.vue'

const meta: Meta<typeof DungeonButtonPrototype> = {
  title: 'Prototypes/Dungeon/DungeonButtonPrototype',
  component: DungeonButtonPrototype,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: 'Confirm Proposal',
    variant: 'primary',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'subtle', 'warning', 'disabled'],
      description:
        'Visual state of the button. primary = teal plate bevel, affirm action. ' +
        'secondary = warm plate bevel, supporting action. ' +
        'subtle = dimmed ring + muted label, low-priority. ' +
        'warning = amber plate bevel, caution/destructive. ' +
        'disabled = flat, inert, not clickable.',
    },
    label: {
      control: 'text',
      description: 'Button label text. Used when no slot content is provided.',
    },
  },
}

export default meta
type Story = StoryObj<typeof DungeonButtonPrototype>

// ─────────────────────────────────────────────────────────────────────────────
// STORIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Interactive default — single primary button with Storybook controls.
 *
 * Structural zones visible here:
 *   outer shell (chamfered clip-path, 5px corner cut, ambient drop-shadow)
 *   → 3px dark shell gap
 *   → bronze ring (7px vertical, 14px horizontal — same gradient as frame/modal)
 *   → 10px L-bracket mounts at each ring corner
 *   → dark face plate (plate gradient + directional bevel borders)
 *   → label text (uppercase, tracked, engraved-gold read)
 *
 * This is the primary variant: teal plate bevel + teal brackets mark
 * the button as the affirm/proceed action — same signal as the accent
 * variant on DungeonFramePrototype but isolated to the face plate layer.
 */
export const Default: Story = {
  render: (args) => ({
    components: { DungeonButtonPrototype },
    setup: () => ({ args }),
    template: `<DungeonButtonPrototype v-bind="args" />`,
  }),
}

/**
 * Variant gallery — all five variants in a single row.
 *
 * Read from left to right as a visual priority hierarchy:
 *   primary   — teal bevel, teal brackets (affirm/proceed)
 *   secondary — warm gold bevel, gold brackets (supporting)
 *   subtle    — dimmed ring, muted bevel, ochre label (low-priority)
 *   warning   — amber bevel, amber brackets (caution/destructive)
 *   disabled  — flat, inert, no click (unavailable)
 *
 * All five share the same outer shell silhouette, ring material,
 * bracket construction, and plate gradient. Only the bevel borders
 * (plate-top/bottom/left/right/shimmer) and label/bracket color
 * tokens differ across variants — no structural shape changes.
 */
export const VariantGallery: Story = {
  render: () => ({
    components: { DungeonButtonPrototype },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
        <DungeonButtonPrototype variant="primary"   label="Apply Pattern" />
        <DungeonButtonPrototype variant="secondary" label="Review Later" />
        <DungeonButtonPrototype variant="subtle"    label="Dismiss" />
        <DungeonButtonPrototype variant="warning"   label="Absorb Risk" />
        <DungeonButtonPrototype variant="disabled"  label="Locked" />
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Variant gallery on a contrasting surface — confirm silhouette reads.
 *
 * Dark background reveals:
 *   · 5px outer chamfer (smaller than frame's 8px, modal's 10px)
 *   · Drop-shadow is octagonal (follows clip-path)
 *   · Teal brackets on primary, amber on warning, dim brackets on subtle/disabled
 * This is a structural review story — not a usage demonstration.
 */
export const ChamferSilhouette: Story = {
  render: () => ({
    components: { DungeonButtonPrototype },
    template: `
      <div style="background: #1a1e28; padding: 48px; border-radius: 4px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
        <DungeonButtonPrototype variant="primary"   label="Apply Pattern" />
        <DungeonButtonPrototype variant="secondary" label="Review Later" />
        <DungeonButtonPrototype variant="subtle"    label="Dismiss" />
        <DungeonButtonPrototype variant="warning"   label="Absorb Risk" />
        <DungeonButtonPrototype variant="disabled"  label="Locked" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}

/**
 * Long label — tests text expansion and minimum bronze visibility.
 *
 * The button face grows horizontally with label length. The bronze
 * ring padding (14px horizontal) remains constant — the visible
 * bronze width is independent of button label length. The clip-path
 * chamfer scales with the total outer shell size, so longer buttons
 * maintain the same 5px corner proportion.
 *
 * The label uses text-overflow: clip (no ellipsis at this prototype
 * stage) — label truncation is a consumer concern.
 */
export const LongLabel: Story = {
  render: () => ({
    components: { DungeonButtonPrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">
        <DungeonButtonPrototype variant="primary"   label="Deploy Emergency Infrastructure Fix" />
        <DungeonButtonPrototype variant="secondary" label="Negotiate Architecture Budget Runway" />
        <DungeonButtonPrototype variant="warning"   label="Trigger Compliance Audit Trail Review" />
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Disabled row — all variants in disabled state.
 *
 * Three paths into the disabled visual state are shown:
 *   · variant="disabled" — the explicit disabled variant
 *   · variant="primary"  with label showing reduced ambient energy
 *     (in a real app these would also pass :disabled="true")
 *
 * Here only the explicit "disabled" variant is wired to the HTML
 * disabled attribute. The visual signal is:
 *   opacity: 0.42 — physically inert read
 *   flat bronze ring — minimal reflectivity
 *   near-invisible plate borders — face appears recessed/sealed
 *   cursor: not-allowed — standard unavailable feedback
 */
export const DisabledRow: Story = {
  render: () => ({
    components: { DungeonButtonPrototype },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: flex-start;">
        <p style="margin: 0 0 4px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Disabled state</p>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
          <DungeonButtonPrototype variant="disabled" label="Apply Pattern" />
          <DungeonButtonPrototype variant="disabled" label="Confirm Proposal" />
          <DungeonButtonPrototype variant="disabled" label="Deploy Fix" />
        </div>
        <p style="margin: 8px 0 0; font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted);">
          opacity: 0.42 · pointer-events: none · cursor: not-allowed · flat bronze ring
        </p>
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}

/**
 * Contrast comparison — all variants paired with context labels.
 *
 * Shows the four active variants together with their signal intent,
 * making the visual priority hierarchy legible at a glance.
 * Each label describes the actual usage intent of that variant.
 */
export const ContrastComparison: Story = {
  render: () => ({
    components: { DungeonButtonPrototype },
    template: `
      <div style="background: #141820; padding: 40px; border-radius: 4px;">
        <div style="display: grid; grid-template-columns: repeat(2, auto); gap: 24px 32px; width: fit-content;">

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Primary — affirm / proceed</span>
            <DungeonButtonPrototype variant="primary" label="Apply Pattern" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Warning — caution / destructive</span>
            <DungeonButtonPrototype variant="warning" label="Absorb Risk" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Secondary — supporting / neutral</span>
            <DungeonButtonPrototype variant="secondary" label="Review Later" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Subtle — lowest priority</span>
            <DungeonButtonPrototype variant="subtle" label="Dismiss" />
          </div>

        </div>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'dark' },
    controls: { disable: true },
  },
}

/**
 * In-context: action strip — buttons inside a dungeon modal action plate mock.
 *
 * Shows primary + secondary + subtle in a real-usage pairing:
 * the modal's action strip uses the same dark plate material as the
 * button face, creating a continuous read. This demonstrates the
 * compositional relationship between DungeonButtonPrototype and
 * DungeonModalPrototype action slots.
 *
 * Note: the strip background is the dungeon plate gradient, matching
 * what the modal __actions footer would provide.
 */
export const InContextActionStrip: Story = {
  render: () => ({
    components: { DungeonButtonPrototype },
    template: `
      <div style="
        background: linear-gradient(to bottom, var(--dng-plate-bg-hi, #191308) 0%, var(--dng-plate-bg-base, #0e0b04) 100%);
        border-top: 1px solid var(--dng-plate-bottom, rgba(100, 72, 10, 0.65));
        padding: 12px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        align-items: center;
        border: 1px solid rgba(100, 72, 10, 0.35);
      ">
        <DungeonButtonPrototype variant="subtle"    label="Dismiss" />
        <DungeonButtonPrototype variant="secondary" label="Save Draft" />
        <DungeonButtonPrototype variant="primary"   label="Confirm Proposal" />
      </div>
    `,
  }),
  parameters: {
    controls: { disable: true },
  },
}
