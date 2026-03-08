/**
 * EnvironmentPreview
 *
 * Composite story showing the full atmospheric environment:
 * tabletop background → console panels → cards → overlay layer.
 *
 * Use this story as the reference for how the game environment looks holistically.
 * Individual components stories validate components; this validates the environment.
 */
import type { Meta, StoryObj } from '@storybook/vue3'

import ScenarioBanner from '@/ui/components/scenario/scenario_banner.vue'
import TurnBriefingPanel from '@/ui/components/turn/turn_briefing_panel.vue'
import ScorePanel from '@/ui/components/scores/score_panel.vue'
import ActionCard from '@/ui/components/cards/action_card.vue'
import EventCard from '@/ui/components/events/event_card.vue'
import { cardMocks } from '../mocks/cards'
import { metricStates } from '../mocks/metrics'
import { scenarioMocks } from '../mocks/scenarios'
import { eventMocks } from '../mocks/events'

// This story uses a raw render function for composite layout;
// it doesn't model a single component.
const meta: Meta = {
  title: 'Game/EnvironmentPreview',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Shows the complete game environment as a composite scene. Demonstrates:

- **Global background**: tabletop dot grid + depth gradient
- **Console panels**: ScenarioBanner, TurnBriefing, MetricsPanel with inset-ridge shadow
- **Card artifacts**: ActionCard category accent strips, EventCard severity framing
- **Depth hierarchy**: background → panels → cards

Use this story to validate atmosphere without running the full game.
        `.trim()
      }
    }
  }
}

export default meta

type Story = StoryObj<typeof meta>

// Full console composition — represents the main game screen at mid-game
export const ConsoleComposition: Story = {
  name: 'Console Composition (Mid-Game)',
  render: () => ({
    components: { ScenarioBanner, TurnBriefingPanel, ScorePanel, ActionCard, EventCard },
    setup() {
      return {
        scenario: scenarioMocks.legacyMonolithStabilization,
        scores: metricStates.unstable,
        cards: [cardMocks.riskyRefactor, cardMocks.safeIncrementalChange, cardMocks.moraleBoostingAction],
        event: eventMocks.productionIncident
      }
    },
    template: `
      <div style="
        min-height: 100vh;
        padding: 2rem;
        display: grid;
        gap: 1.5rem;
        grid-template-columns: minmax(0, 1fr) 280px;
        grid-template-rows: auto auto 1fr;
        max-width: 1100px;
        margin: 0 auto;
      ">
        <!-- Scenario header — spans full width -->
        <div style="grid-column: 1 / -1;">
          <ScenarioBanner
            :title="scenario.title"
            :shortDescription="scenario.shortDescription"
            :currentTurn="scenario.currentTurn"
            :maxTurns="scenario.maxTurns"
          />
        </div>

        <!-- Left: turn briefing + action cards -->
        <div style="display: flex; flex-direction: column; gap: 1.25rem;">
          <TurnBriefingPanel
            :eventTitle="event.name"
            :narrativeDescription="event.description"
            :availableActions="3"
            :pendingAftershocks="2"
            :currentTurn="scenario.currentTurn"
            :totalTurns="scenario.maxTurns"
          />

          <EventCard
            :title="event.name"
            :description="event.description"
            severity="high"
            :highlights="['User trust -10', 'Delivery confidence -6']"
          />

          <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">
            <ActionCard v-for="card in cards" :key="card.id" :card="card" />
          </div>
        </div>

        <!-- Right: metrics panel -->
        <div>
          <ScorePanel :scores="scores" />
        </div>
      </div>
    `
  })
}

// Category showcase — all five category types side by side
export const CategoryAccents: Story = {
  name: 'Category Accent Showcase',
  render: () => ({
    components: { ActionCard },
    setup() {
      return {
        cards: [
          cardMocks.riskyRefactor,         // category: refactor  (teal)
          cardMocks.infrastructureMove,    // category: infrastructure (blue)
          cardMocks.moraleBoostingAction,  // category: team (amber)
          cardMocks.safeIncrementalChange, // category: refactor (teal)
          cardMocks.budgetCuttingFix       // category: fix (orange)
        ]
      }
    },
    template: `
      <div style="padding: 2rem; max-width: 1100px; margin: 0 auto;">
        <p style="
          font-family: var(--font-heading);
          color: var(--text-secondary);
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-widest);
          text-transform: uppercase;
          margin: 0 0 1rem;
        ">Category accent strips</p>
        <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))">
          <ActionCard v-for="card in cards" :key="card.id" :card="card" />
        </div>
      </div>
    `
  })
}

// Severity spectrum — event card severity framing
export const EventSeveritySpectrum: Story = {
  name: 'Event Severity Spectrum',
  render: () => ({
    components: { EventCard },
    setup() {
      return {
        events: [
          { severity: 'low',      title: 'Minor Anomaly',       description: 'A lint warning appeared in the build pipeline. No real damage, but worth watching.' },
          { severity: 'medium',   title: 'Audit Pressure',      description: 'External auditors are reviewing compliance documentation. Focus is shifting.' },
          { severity: 'high',     title: 'Production Incident', description: 'A critical service is degraded. User trust is dropping and the team is under pressure.' },
          { severity: 'critical', title: 'Cascading Failure',   description: 'Multiple services have failed simultaneously. All hands on deck — architecture choices have consequences.' }
        ]
      }
    },
    template: `
      <div style="padding: 2rem; display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); max-width: 1100px; margin: 0 auto;">
        <EventCard
          v-for="e in events"
          :key="e.severity"
          :title="e.title"
          :description="e.description"
          :severity="e.severity"
        />
      </div>
    `
  })
}

// Depth hierarchy demo — shows background, panel, card, overlay layers
export const DepthHierarchy: Story = {
  name: 'Depth Hierarchy',
  render: () => ({
    components: { ScorePanel, ActionCard },
    setup() {
      return {
        scores: metricStates.healthy,
        card: cardMocks.riskyRefactor
      }
    },
    template: `
      <div style="padding: 2rem; max-width: 680px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem;">
        <p style="
          font-size: var(--text-xs);
          letter-spacing: var(--tracking-widest);
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0;
          font-weight: var(--font-semibold);
        ">Elevation: background → panel → card</p>

        <!-- Panel layer -->
        <ScorePanel :scores="scores" />

        <!-- Card artifact layer  -->
        <ActionCard :card="card" />
      </div>
    `
  })
}
