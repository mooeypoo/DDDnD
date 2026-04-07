import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonCardPrototype from '@/ui/prototypes/dungeon/DungeonCardPrototype.vue'

const meta: Meta<typeof DungeonCardPrototype> = {
  title: 'Prototypes/Dungeon/DungeonCardPrototype',
  component: DungeonCardPrototype,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Define Bounded Context',
    subtitle: 'Strategic · Domain shaping',
    variant: 'default',
    compact: false,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'aged', 'accent', 'neutral', 'positive', 'warning', 'danger'],
      description:
        'Material or semantic variant. ' +
        'Material: default = standard wear, aged = heavy patina, accent = arcane-resonant. ' +
        'Semantic: neutral = no impact, positive = gain/resolution, warning = cost/caution, danger = threat/failure.',
    },
    compact: {
      control: 'boolean',
      description: 'Compact density: reduces ring padding and body padding for dense card layouts.',
    },
  },
}

export default meta
type Story = StoryObj<typeof DungeonCardPrototype>

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Simplified card: outer shell → flat bronze ring → label header → teal inset.
 *
 * What is structurally lighter than DungeonFramePrototype:
 *   · 6px chamfer (vs 8px) and 2px shell gap (vs 3px) — less architectural weight.
 *   · Ring is flat-faced: 3-stop gradient, no inset bevel box-shadow.
 *     The Frame's 7-stop symmetric bevel gives the impression of a thick cast
 *     mounting ring; the card's flat ring reads as a thin border.
 *   · Header is a label on the bronze: no background plate, no wall-to-wall bleed,
 *     no 4-edge bevel borders, no shimmer. One border-bottom divider only.
 *   · Title is text-xs, sentence-case, tracking-wide (vs text-sm uppercase on Frame).
 *   · 4px inset top-corner chamfers (vs 14px) — family hint, not theatre.
 *   · Bottom-only brackets (bl/br) — card rests on two anchors, not four.
 *   · Drop shadow: two stops, ~5px blur (vs three stops, 40px blur on Frame).
 */
export const Default: Story = {
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Carve the domain boundary. Establish what belongs inside,
          what belongs outside, and where the context map stops.
        </p>
        <template #footer>Cost: 2 turns · Effect: permanent</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * No nameplate: ring, brackets, and teal inset without any title band.
 * The chamfered octagon and L-brackets carry the dungeon-console identity
 * without a label zone. Use for locked, hidden, or purely visual cards.
 */
export const NoHeader: Story = {
  args: {
    title: undefined,
    subtitle: undefined,
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          No header. Bronze ring and teal inset alone carry the dungeon identity —
          useful for icon cards, placeholder slots, or as-yet-unrevealed cards.
        </p>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Header-actions slot: a tag anchored to the right of the title,
 * within the thin label zone between bronze ring and teal inset — not inside the inset.
 * Use for card type indicators, cost badges, or rarity marks.
 */
export const WithHeaderAction: Story = {
  args: {
    title: 'Introduce Anti-Corruption Layer',
    subtitle: 'Boundary · Integration pattern',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Decouples the context map from internal implementation details —
          prevents the legacy model from polluting the new domain language.
        </p>
        <template #header-actions>
          <span style="
            display: inline-block;
            padding: 2px 8px;
            border: 1px solid rgba(168, 120, 32, 0.40);
            color: #a87820;
            font-family: var(--font-body);
            font-size: var(--text-xs);
            letter-spacing: 0.06em;
          ">Tactical</span>
        </template>
        <template #footer>Cost: 1 turn · Effect: per-context</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Compact density: ring padding reduced to 4px V / 7px H (from 6px V / 10px H),
 * body padding to 8px (from --space-sm). Structural layers unchanged —
 * 6px chamfer, 3-stop bronze gradient, 4px inset chamfers, and bottom brackets
 * are identical to the regular card.
 * Use in dense card grids, hand displays, or sidebar card lists.
 */
export const Compact: Story = {
  args: {
    compact: true,
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 280px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Compact density. Ring 4px V / 7px H, body 8px.
          Chamfer, bronze gradient, and inset structure are unchanged.
        </p>
        <template #footer>Cost: 2 turns</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Aged variant: heavier patina, flat bronze ring bevel, desaturated inset.
 * No teal bloom. Use for deprecated actions, legacy domain cards, or
 * historically significant but currently inactive mechanics.
 */
export const AgedVariant: Story = {
  args: {
    title: 'Deprecate Legacy API',
    subtitle: 'Legacy · Decommission',
    variant: 'aged',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Schedule removal. Notify consumers. Stage migration paths.
          The endpoint will remain alive for two more sprints.
        </p>
        <template #footer>Deprecated · Sunset: Turn 6</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Accent variant: teal header-divider, inset top bloom, bottom brackets, and footer.
 * Bronze ring stays warm — teal signal lives at the interface layers only.
 * Use for active mechanics, urgent actions, or high-priority events.
 */
export const AccentVariant: Story = {
  args: {
    title: 'Introduce Event Storming',
    subtitle: 'Discovery · Cross-domain',
    variant: 'accent',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Gather domain experts. Map event flows across service boundaries.
          Surface hidden assumptions before they become production incidents.
        </p>
        <template #footer>Session active · 2 domains involved</template>
      </DungeonCardPrototype>
    `,
  }),
}

// ─── Semantic accent variants ─────────────────────────────────────────────────

/**
 * Neutral: cool slate gray accent areas.
 * Explicitly communicates "no impact" — inset, divider, and brackets are
 * desaturated gray rather than teal or a semantic hue.
 * Use for informational cards, passive observations, or no-change outcomes.
 */
export const NeutralVariant: Story = {
  args: {
    title: 'Hold Architecture Workshop',
    subtitle: 'Alignment · No-change',
    variant: 'neutral',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Facilitated session. No domain model changes committed.
          Shared understanding logged for the next sprint.
        </p>
        <template #footer>Impact: neutral · No structural change</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Positive: emerald green accent areas.
 * Communicates gains, resolutions, or improvements — inset bloom, header
 * divider, and bottom brackets carry the green signal.
 * Bronze ring stays warm and unchanged.
 * Use for beneficial actions, growth events, or resolved blockers.
 */
export const PositiveVariant: Story = {
  args: {
    title: 'Define bounded context',
    subtitle: 'Strategic · Gain',
    variant: 'positive',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Clear ownership established. Domain language locked.
          Integration surface reduced by 40%.
        </p>
        <template #footer>Outcome: +2 clarity · Boundary secured</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Warning: orange accent areas.
 * Communicates cost pressure, caution, or resource drain — orange divider,
 * inset bloom, and bottom brackets flag the attention area.
 * Bronze ring stays warm and unchanged.
 * Use for high-cost actions, approaching limits, or risky plays.
 */
export const WarningVariant: Story = {
  args: {
    title: 'Negotiate technical runway',
    subtitle: 'Cost · Caution',
    variant: 'warning',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          Runway depleted by turn 4 if unaddressed.
          Budget realignment required before next sprint.
        </p>
        <template #footer>Cost: 3 turns · Risk: high if deferred</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * Danger: crimson accent areas.
 * Communicates threats, eliminations, or urgent failures — red divider,
 * inset bloom, and bottom brackets carry the danger signal.
 * Bronze ring stays warm and unchanged.
 * Use for active incidents, production failures, or elimination events.
 */
export const DangerVariant: Story = {
  args: {
    title: 'Absorb emergency production fix',
    subtitle: 'Crisis · Urgent',
    variant: 'danger',
  },
  render: (args) => ({
    components: { DungeonCardPrototype },
    setup: () => ({ args }),
    template: `
      <DungeonCardPrototype v-bind="args" style="max-width: 320px;">
        <p style="margin: 0; color: var(--text-secondary)">
          P0 incident. Unplanned work absorbs full sprint capacity.
          All planned cards deferred. Post-mortem mandatory.
        </p>
        <template #footer>Incident active · Sprint blocked</template>
      </DungeonCardPrototype>
    `,
  }),
}

/**
 * All four semantic variants side-by-side at equal width.
 * Same structural shell — bronze ring, flat gradient, label header, teal inset.
 * Only the accent-area tokens change: divider, bloom, shimmer, brackets, footer.
 *
 * What to look for:
 *   Neutral  — slate gray; signal absence rather than presence.
 *   Positive — emerald green; inset bloom + brackets + footer carry the gain.
 *   Warning  — orange; bracket corners and header divider flag cost pressure.
 *   Danger   — crimson; divider + bloom + brackets signal urgency.
 *
 * The bronze ring reads identically across all four — semantic meaning lives
 * in the interface zones only, not in the ring material.
 */
export const SemanticVariants: Story = {
  render: () => ({
    components: { DungeonCardPrototype },
    template: `
      <div class="storybook-grid columns-4" style="align-items: start;">

        <DungeonCardPrototype
          variant="neutral"
          title="Hold architecture workshop"
          subtitle="Alignment"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            No model changes committed.
            Understanding shared.
          </p>
          <template #footer>neutral · no impact</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          variant="positive"
          title="Define bounded context"
          subtitle="Strategic"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Boundary locked.
            Integration surface reduced.
          </p>
          <template #footer>positive · +2 clarity</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          variant="warning"
          title="Negotiate technical runway"
          subtitle="Cost"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Runway depleted by turn 4
            if unaddressed.
          </p>
          <template #footer>warning · high cost</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          variant="danger"
          title="Absorb production fix"
          subtitle="Crisis"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            P0 incident.
            Sprint capacity consumed.
          </p>
          <template #footer>danger · sprint blocked</template>
        </DungeonCardPrototype>

      </div>
    `,
  }),
}

// ─── Material / mood variants ──────────────────────────────────────────────────

/**
 * Side-by-side comparison of all three variants at equal width.
 * Identical content — only variant token overrides affect appearance.
 *
 * What to look for:
 *   Default — warm 3-stop bronze ring, teal inset bloom, subtle header divider.
 *   Aged    — flat dark patina ring, no teal bloom, dim brackets and title text.
 *   Accent  — warm bronze ring (unchanged), teal header divider, strong teal bloom.
 */
export const AllVariants: Story = {
  render: () => ({
    components: { DungeonCardPrototype },
    template: `
      <div class="storybook-grid columns-3" style="align-items: start;">

        <DungeonCardPrototype
          variant="default"
          title="Define Bounded Context"
          subtitle="Strategic · Domain shaping"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Establish ownership. Map the boundary.
            Isolate the ubiquitous language.
          </p>
          <template #footer>default · 3-stop ring · teal bloom</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          variant="aged"
          title="Deprecate Legacy API"
          subtitle="Legacy · Decommission"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Schedule removal. Notify consumers.
            Stage migration paths.
          </p>
          <template #footer>aged · flat bronze · no bloom</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          variant="accent"
          title="Introduce Event Storming"
          subtitle="Discovery · Cross-domain"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Map event flows. Surface assumptions.
            Expose hidden integration points.
          </p>
          <template #footer>accent · teal divider · strong bloom</template>
        </DungeonCardPrototype>

      </div>
    `,
  }),
}

/**
 * Side-by-side comparison of regular and compact density.
 * Same card, same variant, same content — only padding tokens differ.
 *
 * What to look for:
 *   Regular — ring 6px V / 10px H, body --space-sm.
 *   Compact — ring 4px V / 7px H, body 8px.
 *   Both    — 6px chamfer, 3-stop gradient, 4px inset chamfers, bottom brackets unchanged.
 */
export const ContentDensity: Story = {
  render: () => ({
    components: { DungeonCardPrototype },
    template: `
      <div class="storybook-grid columns-2" style="align-items: start;">

        <DungeonCardPrototype
          title="Extract Shared Kernel"
          subtitle="Collaboration · Shared ownership"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Regular density. Ring 6px V / 10px H, body --space-sm.
            Standard layout for single-card focus contexts.
          </p>
          <template #footer>regular · 6px/10px ring · space-sm body</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          title="Extract Shared Kernel"
          subtitle="Collaboration · Shared ownership"
          :compact="true"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Compact density. Ring 4px V / 7px H, body 8px.
            For dense grids or sidebar card lists.
          </p>
          <template #footer>compact · 4px/7px ring · 8px body</template>
        </DungeonCardPrototype>

      </div>
    `,
  }),
}

/**
 * Dense 2-column grid of compact cards — the primary gameplay layout.
 * Shows four cards side-by-side at reduced padding to simulate a hand
 * display, deck builder grid, or queued-action sidebar.
 *
 * What to look for:
 *   All structural layers (chamfer, ring, header, inset, bottom brackets)
 *   visible at compact density. Bottom bl/br bracket ornaments frame each
 *   card from below without crowding adjacent cards in the grid.
 */
export const CardGrid: Story = {
  render: () => ({
    components: { DungeonCardPrototype },
    template: `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 640px; align-items: start;">

        <DungeonCardPrototype
          title="Define bounded context"
          subtitle="Strategic"
          :compact="true"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Establish ownership. Map the boundary.
            Isolate the ubiquitous language.
          </p>
          <template #footer>Cost: 1 turn</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          title="Introduce anti-corruption layer"
          subtitle="Integration"
          variant="accent"
          :compact="true"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Prevent legacy model pollution.
            Translate at the seam, not inside.
          </p>
          <template #footer>Cost: 2 turns</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          title="Deprecate legacy API"
          subtitle="Decommission"
          variant="aged"
          :compact="true"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Notify consumers. Stage migration.
            Sunset in two more sprints.
          </p>
          <template #footer>Sunset: Turn 6</template>
        </DungeonCardPrototype>

        <DungeonCardPrototype
          title="Extract shared kernel"
          subtitle="Collaboration"
          :compact="true"
        >
          <p style="margin: 0; color: var(--text-secondary)">
            Align on the minimal shared model.
            Test together or not at all.
          </p>
          <template #footer>Cost: 1 turn · 2 teams</template>
        </DungeonCardPrototype>

      </div>
    `,
  }),
}
