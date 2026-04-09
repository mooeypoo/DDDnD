/**
 * CardFamily — full card-family showcase
 *
 * Renders the complete dungeon-family row in one story:
 *   ScenarioBanner (top) → 3× ActionCard → 2× EventCard → CardDetailsModal overlay.
 *
 * Use this as the "north star" view to verify visual consistency across all
 * card-type members when design tokens or shared styles change.
 */
import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'

import ScenarioBanner from '@/ui/components/scenario/scenario_banner.vue'
import ActionCard from '@/ui/components/cards/action_card.vue'
import EventCard from '@/ui/components/events/event_card.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import EventDetailsModal from '@/ui/components/events/event_details_modal.vue'

import { cardMocks } from '../mocks/cards'
import { eventMocks } from '../mocks/events'
import { scenarioMocks } from '../mocks/scenarios'

const meta: Meta = {
  title: 'Game/CardFamily',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'All dungeon-family card types rendered together. ' +
          'Verifies visual consistency of bronze ring, chamfer shell, inset surface, ' +
          'and interaction affordances across ActionCard and EventCard.',
      },
    },
  },
}

export default meta

// ─── Shared story data ───────────────────────────────────────────────────────

const scenario = scenarioMocks.legacyMonolithStabilization

const actions = [
  cardMocks.safeIncrementalChange,    // category: incremental/safe
  cardMocks.moraleBoostingAction,     // category: team
  cardMocks.infrastructureMove,       // category: infrastructure
]

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Full card-type row — ScenarioBanner bookends a 3-column grid of
 * ActionCards and a 2-column grid of EventCards.
 * Click any card's "Inspect" button to open that card's modal.
 */
export const FullRow: StoryObj = {
  name: 'Full Card-Family Row',
  render: () => ({
    components: {
      ScenarioBanner,
      ActionCard,
      EventCard,
      CardDetailsModal,
      EventDetailsModal,
    },
    setup() {
      const openCardModal = ref(false)
      const selectedCard = ref(cardMocks.safeIncrementalChange)

      const openEventModal = ref(false)
      const selectedEvent = ref({
        title: eventMocks.productionIncident.name,
        description: eventMocks.productionIncident.description,
        severity: 'high' as const,
        highlights: ['User trust −10', 'Delivery confidence −6', 'Support team satisfaction −7'],
      })

      function showCardDetails(card: typeof cardMocks.safeIncrementalChange) {
        selectedCard.value = card
        openCardModal.value = true
      }

      function showEventDetails(event: typeof selectedEvent.value) {
        selectedEvent.value = event
        openEventModal.value = true
      }

      const eventItems = [
        {
          title: eventMocks.productionIncident.name,
          description: eventMocks.productionIncident.description,
          severity: 'high' as const,
          highlights: ['User trust −10', 'Delivery confidence −6', 'Support team satisfaction −7'],
        },
        {
          title: eventMocks.auditPressure.name,
          description: eventMocks.auditPressure.description,
          severity: 'medium' as const,
          highlights: ['Budget −4', 'Domain clarity +2', 'Documentation aftershock scheduled'],
        },
      ]

      return {
        scenario,
        actions,
        eventItems,
        openCardModal,
        selectedCard,
        openEventModal,
        selectedEvent,
        showCardDetails,
        showEventDetails,
      }
    },
    template: `
      <div class="family-stage">
        <!-- Scenario context banner -->
        <ScenarioBanner
          :title="scenario.title"
          :short-description="scenario.shortDescription"
          :description="scenario.description"
          :current-turn="scenario.currentTurn"
          :max-turns="scenario.maxTurns"
        />

        <!-- Action card row -->
        <section class="family-section">
          <h2 class="family-section-label">Action Cards</h2>
          <div class="family-card-row">
            <ActionCard
              v-for="card in actions"
              :key="card.id"
              :card="card"
              @show-details="showCardDetails(card)"
            />
          </div>
        </section>

        <!-- Event card row -->
        <section class="family-section">
          <h2 class="family-section-label">Event Cards</h2>
          <div class="family-card-row">
            <div
              v-for="(event, idx) in eventItems"
              :key="idx"
              class="family-event-wrapper"
              role="button"
              tabindex="0"
              @click="showEventDetails(event)"
              @keydown.enter="showEventDetails(event)"
            >
              <EventCard
                :title="event.title"
                :description="event.description"
                :severity="event.severity"
                :highlights="event.highlights"
              />
            </div>
          </div>
        </section>

        <!-- Action card details modal -->
        <CardDetailsModal
          :is-open="openCardModal"
          :card="selectedCard"
          @close="openCardModal = false"
        />

        <!-- Event details modal -->
        <EventDetailsModal
          :is-open="openEventModal"
          :title="selectedEvent.title"
          :description="selectedEvent.description"
          :severity="selectedEvent.severity"
          :highlights="selectedEvent.highlights"
          @close="openEventModal = false"
        />
      </div>
    `,
  }),
}

export const ActionCardsOnly: StoryObj = {
  name: 'Action Cards — Three Categories',
  render: () => ({
    components: { ActionCard, CardDetailsModal },
    setup() {
      const openModal = ref(false)
      const selectedCard = ref(cardMocks.safeIncrementalChange)
      function showDetails(card: typeof cardMocks.safeIncrementalChange) {
        selectedCard.value = card
        openModal.value = true
      }
      return { actions, openModal, selectedCard, showDetails }
    },
    template: `
      <div class="family-stage">
        <div class="family-card-row">
          <ActionCard
            v-for="card in actions"
            :key="card.id"
            :card="card"
            @show-details="showDetails(card)"
          />
        </div>
        <CardDetailsModal
          :is-open="openModal"
          :card="selectedCard"
          @close="openModal = false"
        />
      </div>
    `,
  }),
}

export const EventCardsOnly: StoryObj = {
  name: 'Event Cards — All Four Severities',
  render: () => ({
    components: { EventCard, EventDetailsModal },
    setup() {
      const openModal = ref(false)
      const selected = ref({
        title: '',
        description: '',
        severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
        highlights: [] as string[],
      })
      const allEvents = [
        {
          title: 'Minor Dependency Lag',
          description: 'A third-party library has fallen two minor versions behind patch cycle.',
          severity: 'low' as const,
          highlights: ['No API breaking changes detected', 'Upgrade path complexity growing'],
        },
        {
          title: eventMocks.auditPressure.name,
          description: eventMocks.auditPressure.description,
          severity: 'medium' as const,
          highlights: ['Budget −4', 'Domain clarity +2'],
        },
        {
          title: eventMocks.productionIncident.name,
          description: eventMocks.productionIncident.description,
          severity: 'high' as const,
          highlights: ['User trust −10', 'Delivery confidence −6'],
        },
        {
          title: eventMocks.burnoutWarning.name,
          description: eventMocks.burnoutWarning.description,
          severity: 'critical' as const,
          highlights: ['Developer morale −9', 'Leadership concern rising'],
        },
      ]
      function show(evt: typeof selected.value) {
        selected.value = evt
        openModal.value = true
      }
      return { allEvents, openModal, selected, show }
    },
    template: `
      <div class="family-stage">
        <div class="family-card-row">
          <div
            v-for="(evt, idx) in allEvents"
            :key="idx"
            role="button"
            tabindex="0"
            @click="show(evt)"
            @keydown.enter="show(evt)"
          >
            <EventCard
              :title="evt.title"
              :description="evt.description"
              :severity="evt.severity"
              :highlights="evt.highlights"
            />
          </div>
        </div>
        <EventDetailsModal
          :is-open="openModal"
          :title="selected.title"
          :description="selected.description"
          :severity="selected.severity"
          :highlights="selected.highlights"
          @close="openModal = false"
        />
      </div>
    `,
  }),
}

// ─── Shared layout styles (injected as non-scoped in the story) ───────────────
// These are story-page layout styles only — not component styles.
const style = document.createElement('style')
style.textContent = `
  .family-stage {
    display: flex;
    flex-direction: column;
    gap: var(--space-xl, 32px);
    padding: var(--space-xl, 32px);
    background: var(--surface-base, #0a0e12);
    min-height: 100vh;
  }

  .family-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-md, 16px);
  }

  .family-section-label {
    margin: 0;
    font-family: var(--font-heading, sans-serif);
    font-size: var(--text-xs, 11px);
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-muted, #5c6b7a);
  }

  .family-card-row {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--space-lg, 24px);
    align-items: start;
  }

  .family-event-wrapper {
    cursor: pointer;
  }
  .family-event-wrapper:focus-visible {
    outline: 2px solid var(--dng-bracket, rgba(196,148,34,0.82));
    outline-offset: 4px;
  }
`
if (typeof document !== 'undefined' && !document.head.querySelector('[data-card-family-styles]')) {
  style.dataset.cardFamilyStyles = 'true'
  document.head.appendChild(style)
}
