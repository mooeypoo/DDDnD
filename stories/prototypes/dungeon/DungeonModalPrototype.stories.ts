import type { Meta, StoryObj } from '@storybook/vue3'
import DungeonModalPrototype from '@/ui/prototypes/dungeon/DungeonModalPrototype.vue'

const meta: Meta<typeof DungeonModalPrototype> = {
  title: 'Prototypes/Dungeon/DungeonModalPrototype',
  component: DungeonModalPrototype,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    title: 'Negotiate Technical Runway',
    subtitle: 'Sprint 3 dependency realignment',
    variant: 'default',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'aged', 'accent'],
      description: 'Visual weight token set. default = standard wear, aged = heavy patina, accent = arcane-resonant teal dividers.',
    },
  },
}

export default meta
type Story = StoryObj<typeof DungeonModalPrototype>

// ─── Shared inline button styles for story action strips ──────────────────────
// These are prototype-only styles — not a button component. They demonstrate
// the action strip layout without pulling in the production button system.

const btnBase = 'font-family:var(--font-body);font-size:var(--text-xs);letter-spacing:0.06em;line-height:1.4;padding:6px 18px;cursor:pointer;'
const btnPrimary = `${btnBase}background:rgba(138,96,14,0.22);border:1px solid rgba(184,132,28,0.60);color:#d4b860;`
const btnDismiss = `${btnBase}background:transparent;border:1px solid rgba(168,120,32,0.28);color:#7a6c44;`

// ─── Stories ──────────────────────────────────────────────────────────────────

/**
 * Minimal form: title + body, no subtitle or action plate.
 *
 * Structural layers visible here:
 *   outer shell (flex col, no top padding)
 *   → header cap (full-bleed dark plate, top brackets, bronze bottom seam)
 *   → bronze ring (margin 0 3px 3px, L/R/B shell gap visible)
 *   → teal-dark inset with body text
 *
 * Key difference from DungeonFramePrototype:
 * · Header cap sits OUTSIDE the bronze ring at the shell level.
 *   The frame nameplate sits INSIDE the ring (12px ring padding on all sides).
 *   Here, the ring wraps only the content zone. The cap is a shell-level structure.
 * · Top brackets anchor in the cap (modal outer corners).
 *   Frame: all four brackets on the ring. Modal: top 2 on cap, bottom 2 on ring.
 * · Deeper drop-shadow cascade — modal reads as elevated, frame reads as embedded.
 */
export const Default: Story = {
  args: {
    title: 'Apply Architectural Decision',
    subtitle: undefined,
  },
  render: (args) => ({
    components: { DungeonModalPrototype },
    setup: () => ({ args }),
    template: `
      <div style="width: 520px;">
        <DungeonModalPrototype v-bind="args">
          <p style="margin: 0 0 var(--space-md); color: var(--text-secondary)">
            This decision will mark all bounded contexts in the current sprint as
            reviewed and apply the Anti-Corruption Layer pattern to the three
            service boundaries identified in the last architecture workshop.
          </p>
          <p style="margin: 0; color: var(--text-muted); font-size: var(--text-xs);">
            The change cannot be reversed within the same sprint phase.
          </p>
        </DungeonModalPrototype>
      </div>
    `,
  }),
}

/**
 * Full form: title + subtitle + body + action plate.
 *
 * All six structural zones active:
 *   cap (title + subtitle) → ring → inset (body) → action plate
 *
 * The action plate sits OUTSIDE the inset, on the ring surface.
 * It uses the same dark-plate gradient as the header cap, creating a
 * deliberate bookend composition:
 *
 *   [dark header cap]  ←—— same plate material ——→  [dark action plate]
 *   [              teal inset body in between              ]
 *
 * The 6px ring-gap bronze seam is the visible bridge between inset
 * and action plate — same material as the seam in DungeonFramePrototype
 * between nameplate and inset.
 *
 * Action button styling is prototype-only inline — not wired to the
 * production button component.
 */
export const WithSubtitleAndActions: Story = {
  render: (args) => ({
    components: { DungeonModalPrototype },
    setup: () => ({ args }),
    template: `
      <div style="width: 520px;">
        <DungeonModalPrototype v-bind="args">
          <p style="margin: 0 0 var(--space-md); color: var(--text-secondary)">
            The architecture team has flagged a three-sprint gap between the
            current delivery velocity and the infrastructure migration timeline.
            Accepting this proposal realigns the roadmap and reduces risk of
            hard coupling across the payment and identity domains.
          </p>
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li>Pause new feature work in the identity domain for Sprint 4</li>
            <li>Assign two engineers to the bounded-context extraction task</li>
            <li>Schedule a cross-team retrospective before Sprint 5 planning</li>
          </ul>
          <template #actions>
            <button :style="'${btnDismiss}'">Dismiss</button>
            <button :style="'${btnPrimary}'">Confirm Proposal</button>
          </template>
        </DungeonModalPrototype>
      </div>
    `,
  }),
}

/**
 * Long body content: the teal inset expands to fit extended content.
 *
 * No overflow or max-height is applied at the component level — height
 * constraint is the consumer's responsibility (an overlay wrapper that
 * limits the viewport region). This story shows the unconstrained form.
 *
 * Confirms that the header cap and action plate maintain their structural
 * positions as the inset body grows: cap stays fixed at the top, action
 * plate stays fixed at the bottom of the ring.
 */
export const LongBodyContent: Story = {
  args: {
    title: 'Architecture Incident Report',
    subtitle: 'Monolith of Mild Despair · Severity 2',
  },
  render: (args) => ({
    components: { DungeonModalPrototype },
    setup: () => ({ args }),
    template: `
      <div style="width: 520px;">
        <DungeonModalPrototype v-bind="args">
          <p style="margin: 0 0 var(--space-md); color: var(--text-secondary)">
            During Sprint 2, the team identified a cascading failure pattern
            originating in the legacy order-processing service. Three separate
            bounded contexts are consuming the internal API directly, bypassing
            the Anti-Corruption Layer introduced in the previous sprint.
          </p>
          <p style="margin: 0 0 var(--space-md); color: var(--text-secondary)">
            Root cause analysis identified the following contributing factors:
          </p>
          <ul style="margin: 0 0 var(--space-md); padding-left: 1.25rem; color: var(--text-secondary);">
            <li>No enforced boundary at the application layer between payment and fulfillment domains</li>
            <li>Three undocumented integration points added during the emergency production fix</li>
            <li>Shared kernel contract was modified without notifying downstream consumers</li>
            <li>Observability stack was not updated to cover the new call paths</li>
          </ul>
          <p style="margin: 0 0 var(--space-md); color: var(--text-secondary)">
            The recommended remediation sequence is to first introduce a new
            integration event that both domains subscribe to, removing the
            direct dependency. The shared kernel contract must be frozen and
            versioned before any further modifications are permitted.
          </p>
          <p style="margin: 0 0 var(--space-md); color: var(--text-secondary)">
            A cross-team retrospective is required before Sprint 3 planning to
            ensure all affected domain owners are aligned on the new event
            contract. The compliance audit trail must be updated to reflect
            the incident timeline and remediation steps.
          </p>
          <p style="margin: 0; color: var(--text-muted); font-size: var(--text-xs);">
            Filed: Turn 6 · Incident #0034 · Assigned: Architecture Guild
          </p>
          <template #actions>
            <button :style="'${btnDismiss}'">Acknowledge</button>
            <button :style="'${btnPrimary}'">Begin Remediation</button>
          </template>
        </DungeonModalPrototype>
      </div>
    `,
  }),
}

/**
 * Tri-zone silhouette check: render on a contrasting background to make
 * BOTH the outer octagonal clip-path AND the inner inset corner chamfers
 * visible as distinct structural shapes.
 *
 * What to look for:
 *   Outer  — 10px chamfer (larger than frame's 8px) on .dungeon-modal via clip-path.
 *   Inner  — 14px chamfer on .dungeon-modal__inset top corners only.
 *            Bronze ring material shows through the corner slopes.
 *            Shadow wedges inside TL/TR corners deepen the recession.
 *   Seam   — 8px bronze bridge between inset and action plate (ring-gap).
 *   Bookend — dark cap [3px bronze seam] bronze ring [8px seam] [teal inset] [8px seam] dark action plate.
 *             Cap and action plate use identical dark-plate gradient — top/bottom bookend.
 *   Cap split — top brackets anchor in the cap; bottom brackets anchor in the ring.
 *               This is the key structural difference from DungeonFramePrototype,
 *               where all four brackets live on the ring.
 * This is a structural review story — not a usage demonstration.
 */
export const StructuralSilhouette: Story = {
  render: (args) => ({
    components: { DungeonModalPrototype },
    setup: () => ({ args }),
    template: `
      <div style="background: #1e2430; padding: 48px; border-radius: 4px;">
        <DungeonModalPrototype v-bind="args">
          <p style="margin: 0; color: var(--text-secondary)">
            Outer: 10px chamfer on the shell clip-path (slightly heavier than the frame's 8px).
            Inner: 14px chamfer on the inset top-left and top-right corners —
            bronze ring material is visible through the corner cuts as sloped walls.
            Shadow wedges simulate depth recession into the content well.
            Drop-shadow cascade is heavier than the frame — the modal reads as
            physically elevated above the page surface.
          </p>
          <template #actions>
            <button style="${btnDismiss}">Dismiss</button>
            <button style="${btnPrimary}">Confirm</button>
          </template>
        </DungeonModalPrototype>
      </div>
    `,
  }),
  args: {
    title: 'Silhouette Review',
    subtitle: 'outer 10px · inner 14px · cap seam 3px',
    variant: 'default',
  },
  parameters: {
    backgrounds: { default: 'Panel' },
  },
}

/**
 * All three variants side by side at equal width.
 *
 * What to look for:
 *   default — warm gold title in cap, full bronze ring bevel, teal bloom in inset,
 *             bronze shimmer bleeding from cap into ring, dark action plate at base.
 *   aged    — flatter dark ring (weaker bevel), desaturated inset (no bloom),
 *             muted title amber in cap, near-invisible plate shimmer and bracket.
 *   accent  — warm ring unchanged; teal cap + action plate bevel edges,
 *             strong teal inset bloom, teal brackets.
 *
 * Identical content across all three — only the variant token set differs.
 */
export const AllVariants: Story = {
  render: () => ({
    components: { DungeonModalPrototype },
    template: `
      <div class="storybook-grid columns-3" style="align-items: start;">

        <DungeonModalPrototype
          variant="default"
          title="Coordinate Service Contracts"
          subtitle="Payment · Identity · Fulfillment"
        >
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li>Freeze shared kernel contract</li>
            <li>Version integration events</li>
            <li>Notify downstream consumers</li>
          </ul>
          <template #actions>
            <button style="${btnDismiss}">Cancel</button>
            <button style="${btnPrimary}">Apply</button>
          </template>
        </DungeonModalPrototype>

        <DungeonModalPrototype
          variant="aged"
          title="Coordinate Service Contracts"
          subtitle="Payment · Identity · Fulfillment"
        >
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li>Freeze shared kernel contract</li>
            <li>Version integration events</li>
            <li>Notify downstream consumers</li>
          </ul>
          <template #actions>
            <button style="${btnDismiss}">Cancel</button>
            <button style="${btnPrimary}">Apply</button>
          </template>
        </DungeonModalPrototype>

        <DungeonModalPrototype
          variant="accent"
          title="Coordinate Service Contracts"
          subtitle="Payment · Identity · Fulfillment"
        >
          <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-secondary);">
            <li>Freeze shared kernel contract</li>
            <li>Version integration events</li>
            <li>Notify downstream consumers</li>
          </ul>
          <template #actions>
            <button style="${btnDismiss}">Cancel</button>
            <button style="${btnPrimary}">Apply</button>
          </template>
        </DungeonModalPrototype>

      </div>
    `,
  }),
  parameters: {
    layout: 'padded',
  },
}
