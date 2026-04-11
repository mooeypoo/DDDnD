import type { Meta, StoryObj } from '@storybook/vue3'
import AppButton from '@/ui/components/common/AppButton.vue'

const meta: Meta<typeof AppButton> = {
  title: 'Foundations/AppButton',
  component: AppButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: 'Confirm Proposal',
    variant: 'primary',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'subtle', 'warning'],
      description:
        'Visual priority of the button. ' +
        'primary = teal plate bevel (affirm/proceed). ' +
        'secondary = warm gold bevel (supporting). ' +
        'subtle = dimmed ring + muted label (low-priority). ' +
        'warning = amber plate bevel (caution/destructive).',
    },
    label: {
      control: 'text',
      description: 'Button label text. Used when no slot content is provided.',
    },
    disabled: {
      control: 'boolean',
      description:
        'Disables the button. Sets the native HTML disabled attribute and applies ' +
        'the unavailable visual state (flat ring, reduced opacity, no interaction).',
    },
  },
}

export default meta
type Story = StoryObj<typeof AppButton>

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Interactive default — single primary button with Storybook controls.
 *
 * Structural zones visible here:
 *   outer shell (chamfered clip-path, 5px corner cut, ambient drop-shadow)
 *   → 3px dark shell gap
 *   → bronze ring (7px vertical, 14px horizontal padding)
 *   → 10px L-bracket mounts at each ring corner
 *   → dark face plate (plate gradient + directional bevel borders)
 *   → label text (uppercase, tracked, engraved-gold)
 *
 * Primary variant: teal plate bevel + teal brackets — the affirm/proceed signal,
 * same teal language as the accent variant on AppFrame but scoped to the face plate.
 */
export const Default: Story = {
  render: (args) => ({
    components: { AppButton },
    setup: () => ({ args }),
    template: `<AppButton v-bind="args" />`,
  }),
}

/**
 * Variant gallery — all four active variants in a single row.
 *
 * Left-to-right visual priority hierarchy:
 *   primary   — teal bevel, teal brackets (affirm/proceed)
 *   secondary — warm gold bevel, bronze brackets (supporting)
 *   subtle    — dimmed ring, muted bevel, ochre label (low-priority)
 *   warning   — amber bevel, amber brackets (caution/destructive)
 *
 * All four share the identical outer shell silhouette, ring material,
 * bracket construction, and plate structure. Only the bevel border tokens
 * and label/bracket color differ — no structural shape changes.
 */
export const VariantGallery: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
        <AppButton variant="primary"   label="Apply Pattern" />
        <AppButton variant="secondary" label="Review Later" />
        <AppButton variant="subtle"    label="Dismiss" />
        <AppButton variant="warning"   label="Absorb Risk" />
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}

/**
 * Disabled state — the `disabled` boolean prop sets the native HTML disabled
 * attribute, which triggers the :disabled pseudo-class and all associated
 * visual overrides (flat ring, opacity 0.42, no hover/focus/active).
 *
 * Shown across all four variants to confirm the disabled visual overrides
 * apply regardless of the variant's bevel-color signal.
 */
export const DisabledState: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: flex-start;">
        <p style="margin: 0 0 4px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">
          disabled prop — native HTML disabled attr · opacity 0.42 · no interaction
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: center;">
          <AppButton variant="primary"   label="Apply Pattern"    :disabled="true" />
          <AppButton variant="secondary" label="Review Later"     :disabled="true" />
          <AppButton variant="subtle"    label="Dismiss"          :disabled="true" />
          <AppButton variant="warning"   label="Absorb Risk"      :disabled="true" />
        </div>
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}

/**
 * Chamfer silhouette check — render on a contrasting surface to confirm:
 *   · 5px outer chamfer (smaller than AppFrame's 8px)
 *   · Drop-shadow is octagonal (follows clip-path)
 *   · Teal brackets on primary, amber on warning, dim brackets on subtle
 */
export const ChamferSilhouette: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="background: #1a1e28; padding: 48px; border-radius: 4px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center;">
        <AppButton variant="primary"   label="Apply Pattern" />
        <AppButton variant="secondary" label="Review Later" />
        <AppButton variant="subtle"    label="Dismiss" />
        <AppButton variant="warning"   label="Absorb Risk" />
        <AppButton variant="primary"   label="Locked"           :disabled="true" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}

/**
 * Long label — tests that bronze ring padding stays constant while the button
 * face grows horizontally. The 14px horizontal ring padding is independent of
 * label length; the 5px corner chamfer scales with total shell size.
 */
export const LongLabel: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="display: flex; flex-direction: column; gap: 14px; align-items: flex-start;">
        <AppButton variant="primary"   label="Deploy Emergency Infrastructure Fix" />
        <AppButton variant="secondary" label="Negotiate Architecture Budget Runway" />
        <AppButton variant="warning"   label="Trigger Compliance Audit Trail Review" />
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}

/**
 * In-context action strip — primary + secondary + subtle inside a dark plate
 * surface, showing the compositional relationship between AppButton and the
 * dungeon-console action plate context (as used in modal footer slots).
 */
export const InContextActionStrip: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="
        background: linear-gradient(to bottom, var(--dng-plate-bg-hi, #191308) 0%, var(--dng-plate-bg-base, #0e0b04) 100%);
        border: 1px solid rgba(100, 72, 10, 0.35);
        border-top: 1px solid var(--dng-plate-bottom, rgba(100, 72, 10, 0.65));
        padding: 12px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        align-items: center;
      ">
        <AppButton variant="subtle"    label="Dismiss" />
        <AppButton variant="secondary" label="Save Draft" />
        <AppButton variant="primary"   label="Confirm Proposal" />
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}

/**
 * Priority comparison — all four active variants with usage-intent labels,
 * making the visual priority hierarchy legible at a glance.
 */
export const PriorityComparison: Story = {
  render: () => ({
    components: { AppButton },
    template: `
      <div style="background: #141820; padding: 40px; border-radius: 4px;">
        <div style="display: grid; grid-template-columns: repeat(2, auto); gap: 24px 32px; width: fit-content;">

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Primary — affirm / proceed</span>
            <AppButton variant="primary" label="Apply Pattern" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Warning — caution / destructive</span>
            <AppButton variant="warning" label="Absorb Risk" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Secondary — supporting / neutral</span>
            <AppButton variant="secondary" label="Review Later" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start;">
            <span style="font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">Subtle — lowest priority</span>
            <AppButton variant="subtle" label="Dismiss" />
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
