import type { Meta, StoryObj } from '@storybook/vue3'
import CompactButton from '@/ui/components/common/CompactButton.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

const meta: Meta<typeof CompactButton> = {
  title: 'Foundations/CompactButton',
  component: CompactButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    label: 'Deploy',
    variant: 'primary',
    disabled: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'subtle', 'warning'],
      description:
        'Visual priority of the button. ' +
        'primary = teal bevel + teal icon tint (affirm/proceed). ' +
        'secondary = warm bronze bevel + gold label (supporting). ' +
        'subtle = flat dim bevel + muted label (low-priority). ' +
        'warning = amber bevel + amber label (caution/destructive).',
    },
    icon: {
      control: 'text',
      description:
        'Emoji or short glyph string rendered in the icon well. ' +
        'Use the `#icon` slot to pass inline <svg> content instead.',
    },
    label: {
      control: 'text',
      description: 'Button label text. Used when no default slot content is provided.',
    },
    disabled: {
      control: 'boolean',
      description:
        'Disables the button. Sets the native HTML disabled attribute and applies ' +
        'the unavailable visual state (flat bevel, opacity 0.42, no interaction).',
    },
  },
}

export default meta
type Story = StoryObj<typeof CompactButton>


// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Interactive default — single primary button with Storybook controls.
 *
 * At this scale the structure compresses to:
 *   chamfered plate (4px corner cut, ~26px tall)
 *   → optional icon well (26px wide, slightly darker inset zone, hairline divider)
 *   → label zone (Cinzel 12px, uppercase, tracked gold, 5px v-padding / 10px h-padding)
 *
 * No bronze ring layer — the directional inset bevel (top teal, bottom teal shadow)
 * carries the variant signal that AppButton delegates to the ring+bracket system.
 * Drop-shadow follows the chamfered octagon via filter.
 */
export const Default: Story = {
  render: (args) => ({
    components: { CompactButton },
    setup: () => ({ args }),
    template: `<CompactButton v-bind="args" />`,
  }),
}


/**
 * Variant gallery — all four variants without an icon.
 *
 * Left-to-right visual priority hierarchy mirrors AppButton:
 *   primary   — teal bevel, default gold label
 *   secondary — warm bronze bevel, gold label
 *   subtle    — flat dim bevel, muted ochre label
 *   warning   — amber bevel, amber label
 *
 * With no ring layer the buttons read two-thirds the height of AppButton.
 * The chamfer silhouette and material language (dark plate, directional bevel)
 * keep them in the same family while signalling a different weight class.
 */
export const VariantGallery: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
        <CompactButton variant="primary"   label="Deploy Fix" />
        <CompactButton variant="secondary" label="Review" />
        <CompactButton variant="subtle"    label="Defer" />
        <CompactButton variant="warning"   label="Rollback" />
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}


/**
 * With emoji icons — all four variants with the icon well active.
 *
 * The icon well is a 26px-wide darker inset zone separated from the label by a
 * hairline vertical divider. The divider and icon color take on the variant tint:
 * teal for primary, warm bronze for secondary, muted for subtle, amber for warning.
 *
 * Any single emoji or short glyph (⚔ ✦ 🗡 ⚠ 🔒 ⚡ ✓) works well here.
 */
export const WithEmojiIcons: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
        <CompactButton variant="primary"   icon="⚡" label="Deploy Fix" />
        <CompactButton variant="secondary" icon="📋" label="Review" />
        <CompactButton variant="subtle"    icon="↩" label="Defer" />
        <CompactButton variant="warning"   icon="⚠" label="Rollback" />
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}


/**
 * SVG icon slot — inline SVG passed via the `#icon` named slot.
 *
 * The icon well applies `fill: currentColor` to child SVGs so the icon
 * automatically adopts the variant's --compact-icon-color token.
 * Recommended viewBox: square (14×14 or 16×16). The well constrains
 * the SVG to 14×14px regardless of the source viewBox.
 */
export const WithSvgIcons: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
        <CompactButton variant="primary" label="Apply Pattern">
          <template #icon>
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1 L10.5 6 L16 6.9 L12 10.8 L13 16 L8 13.3 L3 16 L4 10.8 L0 6.9 L5.5 6 Z" />
            </svg>
          </template>
        </CompactButton>

        <CompactButton variant="secondary" label="Assign">
          <template #icon>
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="5" r="3.5" />
              <path d="M2 14 C2 10.7 4.7 8 8 8 C11.3 8 14 10.7 14 14" stroke-width="1.5" fill="none" stroke="currentColor" />
            </svg>
          </template>
        </CompactButton>

        <CompactButton variant="warning" label="Force Merge">
          <template #icon>
            <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 1 L9.5 5.5 L14 6.2 L11 9.1 L11.8 13.5 L8 11.4 L4.2 13.5 L5 9.1 L2 6.2 L6.5 5.5 Z" />
            </svg>
          </template>
        </CompactButton>
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}


/**
 * Icon only — label omitted, icon well is the only content.
 *
 * Useful for HUD icon-triggers where screen space is critical.
 * Provide an aria-label on the surrounding context or use a tooltip
 * to preserve accessibility when label text is absent.
 */
export const IconOnly: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
        <CompactButton variant="primary"   icon="⚡" />
        <CompactButton variant="secondary" icon="📋" />
        <CompactButton variant="subtle"    icon="↩" />
        <CompactButton variant="warning"   icon="⚠" />
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}


/**
 * Disabled state — across all four variants.
 *
 * The disabled prop sets the native HTML disabled attribute. The :disabled
 * pseudo-class flattens the bevel tokens, reduces opacity to 0.42, and
 * suppresses pointer-events — identical to AppButton's disabled strategy.
 */
export const DisabledState: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="display: flex; flex-direction: column; gap: 16px; align-items: flex-start;">
        <p style="margin: 0 0 4px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">
          disabled prop — native :disabled · opacity 0.42 · no interaction
        </p>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
          <CompactButton variant="primary"   icon="⚡" label="Deploy Fix"  :disabled="true" />
          <CompactButton variant="secondary" icon="📋" label="Review"      :disabled="true" />
          <CompactButton variant="subtle"    icon="↩" label="Defer"        :disabled="true" />
          <CompactButton variant="warning"   icon="⚠" label="Rollback"     :disabled="true" />
        </div>
      </div>
    `,
  }),
  parameters: { controls: { disable: true } },
}


/**
 * Scale comparison — CompactButton alongside AppButton.
 *
 * Side-by-side with the full AppButton family to demonstrate the size intention.
 * CompactButton targets ~26px tall vs AppButton's ~48px. Both share the
 * chamfered octagon silhouette, dark plate background, and directional bevel
 * border signal — the material family DNA is consistent.
 */
export const ScaleComparison: Story = {
  render: () => ({
    components: { CompactButton, AppButton },
    template: `
      <div style="
        background: #141009;
        border: 1px solid rgba(100,72,10,0.18);
        padding: 24px;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      ">
        <div>
          <p style="margin: 0 0 10px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">
            AppButton — standard size
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center;">
            <AppButton variant="primary"   label="Apply Pattern" />
            <AppButton variant="secondary" label="Review Later" />
            <AppButton variant="subtle"    label="Dismiss" />
            <AppButton variant="warning"   label="Rollback" />
          </div>
        </div>
        <div>
          <p style="margin: 0 0 10px; font-family: var(--font-body); font-size: var(--text-xs); color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">
            CompactButton — HUD / mobile size
          </p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; align-items: center;">
            <CompactButton variant="primary"   icon="⚡" label="Apply Pattern" />
            <CompactButton variant="secondary" icon="📋" label="Review Later" />
            <CompactButton variant="subtle"    icon="↩" label="Dismiss" />
            <CompactButton variant="warning"   icon="⚠" label="Rollback" />
          </div>
        </div>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}


/**
 * HUD action strip — compact buttons in a simulated HUD bar context.
 *
 * Shows how CompactButton behaves in a tight horizontal strip where
 * AppButton's ring padding would crowd the layout. The chamfer silhouette
 * and teal/amber variant signal remain readable at this density.
 */
export const HudActionStrip: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="
        background: linear-gradient(to bottom, #0b1c24, #091620);
        border: 1px solid rgba(20, 78, 100, 0.28);
        border-top: 1px solid rgba(20, 78, 100, 0.18);
        padding: 6px 12px;
        display: flex;
        align-items: center;
        gap: 6px;
        border-radius: 2px;
        width: 320px;
      ">
        <span style="
          font-family: var(--font-heading);
          font-size: var(--text-2xs);
          color: var(--dng-footer-muted);
          letter-spacing: var(--tracking-wider);
          text-transform: uppercase;
          margin-right: auto;
        ">Turn 4</span>
        <CompactButton variant="subtle"   icon="↩" label="Undo" />
        <CompactButton variant="secondary" icon="📋" label="Brief" />
        <CompactButton variant="primary"   icon="⚡" label="Resolve" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}


/**
 * Mobile toolbar — a vertical stack of compact buttons as might appear
 * in a collapsed mobile sidebar or drawer footer. The icon provides
 * quick visual scanning; the label confirms the action.
 */
export const MobileToolbar: Story = {
  render: () => ({
    components: { CompactButton },
    template: `
      <div style="
        background: #0e0b04;
        border: 1px solid rgba(80, 55, 8, 0.28);
        padding: 10px 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 160px;
        border-radius: 2px;
      ">
        <CompactButton variant="primary"   icon="⚡" label="Deploy Fix"   style="width: 100%; justify-content: flex-start;" />
        <CompactButton variant="secondary" icon="🔍" label="Investigate"  style="width: 100%; justify-content: flex-start;" />
        <CompactButton variant="secondary" icon="📋" label="Add to Board" style="width: 100%; justify-content: flex-start;" />
        <CompactButton variant="subtle"    icon="↩" label="Defer"         style="width: 100%; justify-content: flex-start;" />
        <CompactButton variant="warning"   icon="⚠" label="Escalate"     style="width: 100%; justify-content: flex-start;" />
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
    controls: { disable: true },
  },
}
