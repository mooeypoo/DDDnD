import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonFramePrototype from '@/ui/prototypes/dungeon/DungeonFramePrototype.vue'

const meta: Meta<typeof DungeonFramePrototype> = {
  title: 'Prototypes/Dungeon/DungeonFramePrototype',
  component: DungeonFramePrototype,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Bounded Context Registry',
    subtitle: 'Active domains and ownership boundaries',
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'aged', 'accent'],
      description: 'Visual weight of the bronze ring. default = standard wear, aged = heavy patina, accent = arcane-resonant dividers.',
    },
  },
}

export default meta
type Story = StoryObj<typeof DungeonFramePrototype>

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Baseline form: outer dark shell (1px border + 3px gap) → 12px bronze ring (bevel gradient)
 * → 6px bronze seam → dark nameplate (directional bevel borders) → teal-dark inset
 * (radial top-bloom gradient) → footer band.
 *
 * Outer corners are chamfered at 8px/45° — the clip-path octagon removes the
 * rectangular-panel silhouette. Ambient depth comes from filter: drop-shadow()
 * which follows the chamfered shape.
 */
export const Default: Story = {
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <DungeonFramePrototype v-bind="args">
        <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
          <li>Define Bounded Context</li>
          <li>Introduce Anti-Corruption Layer</li>
          <li>Extract Shared Kernel</li>
          <li>Document Ubiquitous Language</li>
        </ul>
        <template #footer>Turn 3 of 12 · 4 actions remaining</template>
      </DungeonFramePrototype>
    `,
  }),
}

/**
 * Chamfer silhouette check: render on a lighter background to make the
 * octagonal clip-path corners clearly visible as a structural shape.
 * This is a review story — not a usage demonstration.
 */
export const ChamferSilhouette: Story = {
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <div style="background: #1e2430; padding: 48px; border-radius: 4px;">
        <DungeonFramePrototype v-bind="args">
          <p style="margin: 0; color: var(--text-secondary)">
            The outer corners are clipped at 8px × 45°. Each corner shows a
            flat 45° cut rather than a radius curve — this is the chamfered
            architectural silhouette.
          </p>
          <template #footer>Silhouette review · chamfer = 8px</template>
        </DungeonFramePrototype>
      </div>
    `,
  }),
  parameters: {
    backgrounds: { default: 'Panel' },
  },
}

/**
 * No nameplate: outer shell + ring + inset only.
 * The bronze ring, L-brackets, and chamfered silhouette carry the
 * dungeon-console identity without any label zone.
 */
export const NoHeader: Story = {
  args: {
    title: undefined,
    subtitle: undefined,
  },
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <DungeonFramePrototype v-bind="args">
        <p style="margin: 0; color: var(--text-secondary)">
          Panel content with no header plate. The bronze ring and inset surface
          carry the dungeon-console identity without any title band.
        </p>
      </DungeonFramePrototype>
    `,
  }),
}

/**
 * Nameplate with a trailing action button.
 * The action slot renders inside the nameplate row (frame surface level),
 * to the right of title/subtitle. Tests layout at the nameplate layer,
 * not inside the dark inset content.
 */
export const WithHeaderAction: Story = {
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <DungeonFramePrototype v-bind="args">
        <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
          <li>Coordinate Service Contracts</li>
          <li>Hold Architecture Workshop</li>
          <li>Establish Team Ownership</li>
        </ul>
        <template #header-actions>
          <button style="
            background: transparent;
            border: 1px solid rgba(168, 120, 32, 0.40);
            color: #a87820;
            font-family: var(--font-body);
            font-size: var(--text-xs);
            letter-spacing: 0.06em;
            padding: 3px 10px;
            cursor: pointer;
            line-height: 1.4;
          ">Filter</button>
        </template>
        <template #footer>3 contracts pending · Sprint 2</template>
      </DungeonFramePrototype>
    `,
  }),
}

/**
 * Aged variant: heavier patina, reduced highlight across the ring bevel.
 * Title gold shifts to a more muted amber. Use for legacy or low-priority contexts.
 */
export const AgedVariant: Story = {
  args: {
    title: 'Legacy Monolith Registry',
    subtitle: 'Pre-migration service surface — handle with care',
    variant: 'aged',
  },
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <DungeonFramePrototype v-bind="args">
        <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
          <li>Deprecate Legacy API</li>
          <li>Absorb Emergency Production Fix</li>
          <li>Harden Operational Runbooks</li>
        </ul>
        <template #footer>Last audited: Turn 1 · Stability: Fragile</template>
      </DungeonFramePrototype>
    `,
  }),
}

/**
 * Accent variant: teal-tinted divider lines signal active or focused state.
 * Bronze ring is unchanged — only the structural dividers shift toward teal.
 */
export const AccentVariant: Story = {
  args: {
    title: 'Event Storming Session',
    subtitle: 'Cross-domain event flow · Active review',
    variant: 'accent',
  },
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <DungeonFramePrototype v-bind="args">
        <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
          <li>Introduce Event Storming</li>
          <li>Clarify Cross-Team Handoffs</li>
          <li>Fortify Observability Stack</li>
        </ul>
        <template #footer>Session active · 2 blocking events identified</template>
      </DungeonFramePrototype>
    `,
  }),
}

/**
 * Side-by-side comparison of all three variants at equal width.
 * Identical content and structure in all three — only variant token
 * overrides are responsible for the visual differences.
 *
 * What to look for:
 *   Default — warm gold ring with visible bevel, teal bloom in inset,
 *             nameplate gold shimmer, bronze divider/bracket.
 *   Aged    — flat dark ring (near-invisible bevel), desaturated inset
 *             (no teal bloom), no plate shimmer, dim bracket & title.
 *   Accent  — warm bronze ring (unchanged), teal nameplate edges + seam,
 *             strong teal bloom in inset, teal brackets and dividers.
 */
export const AllVariants: Story = {
  render: () => ({
    components: { DungeonFramePrototype },
    template: `
      <div class="storybook-grid columns-3" style="align-items: start;">

        <DungeonFramePrototype
          variant="default"
          title="Bounded Context Map"
          subtitle="Active domain registry"
        >
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
            <li>Define Bounded Context</li>
            <li>Extract Shared Kernel</li>
            <li>Document Ubiquitous Language</li>
          </ul>
          <template #footer>default · warm bronze · teal inset bloom</template>
        </DungeonFramePrototype>

        <DungeonFramePrototype
          variant="aged"
          title="Legacy Monolith Map"
          subtitle="Pre-migration surface"
        >
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
            <li>Deprecate Legacy API</li>
            <li>Absorb Emergency Fix</li>
            <li>Harden Runbooks</li>
          </ul>
          <template #footer>aged · flat dark ring · no bloom · dim label</template>
        </DungeonFramePrototype>

        <DungeonFramePrototype
          variant="accent"
          title="Event Storming Session"
          subtitle="Cross-domain flow · Active review"
        >
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary)">
            <li>Introduce Event Storming</li>
            <li>Clarify Cross-Team Handoffs</li>
            <li>Fortify Observability</li>
          </ul>
          <template #footer>accent · teal brackets · bloom · dividers</template>
        </DungeonFramePrototype>

      </div>
    `,
  }),
  parameters: {
    layout: 'padded',
  },
}

/**
 * Narrow single-column form factor — sidebar or aside context.
 * Tests that title truncation and layout hold at constrained widths.
 */
export const NarrowPanel: Story = {
  args: {
    title: 'Domain Integrity Score',
    subtitle: 'Current turn aggregate',
  },
  render: (args) => ({
    components: { DungeonFramePrototype },
    setup: () => ({ args }),
    template: `
      <div style="max-width: 280px;">
        <DungeonFramePrototype v-bind="args">
          <p style="margin: 0; color: var(--text-secondary); font-size: var(--text-xs)">
            Aggregate boundary health across all active bounded contexts this turn.
          </p>
          <template #footer>Score: 74 / 100</template>
        </DungeonFramePrototype>
      </div>
    `,
  }),
}
