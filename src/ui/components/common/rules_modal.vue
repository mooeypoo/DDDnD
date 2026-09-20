<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="How to play"
    size="lg"
    @close="close"
  >
    <div class="modal-body">
        <h3>Your move</h3>
        <p>
          You hold a <strong>legal hand</strong> — usually six cards. Each turn you either
          play one card onto the table, or <strong>Consult the Archives</strong> and spend
          the turn replacing a card you do not want. The rest of the pack lives in the
          <strong>Grimoire</strong>: look, inspect, do not play from the shelves.
        </p>

        <h3>What you will see</h3>
        <p>
          Playing a card (or finishing a consult) lands on the table first. Then last turn
          may catch up as aftershocks. Then a random event may land, and the council may speak.
          The engine still resolves delayed effects before your card; the table shows
          <em>your</em> move first so you can see what you just did. Press
          <strong>Continue</strong> through each beat. Skip remaining if you want speed.
        </p>

        <h3>The system and the council</h3>
        <p>
          Vials along the table show the system's scores — domain clarity, delivery,
          morale, trust, and the rest of the pack. Neglect a dimension and it can collapse:
          the chamber storms, the triggering vial burns, and gains elsewhere wither.
          Those vials are the system's mood, not a second goal.
          The council gathers around the scene. Their satisfaction (0–100) decides whether
          they bless you or work against you.
        </p>

        <h3>Aftershocks</h3>
        <p>
          Some cards echo forward. A refactor may slow delivery now and raise clarity later.
          A quick fix may buy today and spawn tomorrow's crisis. Aftershock marks on a card
          warn you that delayed effects are coming. When one lands, the table pauses, shakes,
          and names what arrived.
        </p>

        <h3>Consult the Archives</h3>
        <p>
          Searching for a better option is delay, so it costs the turn. Open Consult, mark
          a hand card, choose a remaining page (or take a random legal one), and approve
          both names — “X replaced by Y.” Aftershocks, events, and the council still resolve.
          If the deck is empty, Consult stays hidden: there is nothing left to draw.
        </p>

        <h3>Collapse</h3>
        <p>
          When a core score falls too far, coupling binds the table:
        </p>
        <ul>
          <li><strong>Delivery collapse</strong> — Gains to domain clarity and maintainability weaken.</li>
          <li><strong>Morale collapse</strong> — Maintainability gains shrink.</li>
          <li><strong>Trust collapse</strong> — Delivery gains shrink.</li>
        </ul>
        <p>
          Card glances show the reduced values. Stabilize the collapsed score first, or the
          rest of your work is fighting a system that will not hold.
        </p>

        <h3>A worthy ending</h3>
        <p>
          Keep the system in balance before turns run out. That is the quest: a living
          software system under pressure, not the vials themselves. Your outcome is a
          <strong>tier</strong> (how well you did) and an <strong>ending</strong>
          (what kind of architect the table remembers). There is no single path.
          The architect who tries to fix everything may fix nothing.
        </p>

        <p class="tip">
          <strong>Tip:</strong> History is a look, not a HUD. Annals reads what already
          happened. The Grimoire shows what remains. Neither lets you play around the hand.
        </p>
    </div>

    <template #footer>
      <AppButton label="Return to the council" variant="primary" @click="close" />
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

/**
 * Game rules modal with static instructional content and close action.
 */
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-body {
  color: var(--dng-subtitle-warm);
}

.modal-body h3 {
  color: var(--dng-title-gold);
  margin-top: var(--space-xl);
  margin-bottom: var(--space-md);
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.modal-body h3:first-child {
  margin-top: 0;
}

.modal-body h3::before {
  content: '▸';
  color: var(--dng-bronze-mid);
  font-size: var(--text-2xl);
}

.modal-body p {
  margin: var(--space-md) 0;
  font-size: var(--text-base);
  line-height: 1.7;
  color: var(--dng-subtitle-warm);
}

.modal-body ol,
.modal-body ul {
  margin: var(--space-md) 0;
  padding-left: var(--space-xl);
}

.modal-body li {
  margin: var(--space-sm) 0;
  line-height: 1.7;
  color: var(--dng-subtitle-warm);
}

.modal-body li strong {
  color: var(--dng-title-gold);
  font-weight: var(--font-semibold);
}

.tip {
  margin-top: var(--space-xl) !important;
  padding: var(--space-md);
  background: linear-gradient(135deg, rgba(160, 112, 24, 0.15) 0%, rgba(160, 112, 24, 0.05) 100%);
  border-left: 4px solid var(--dng-bronze-mid);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.tip strong {
  color: var(--dng-title-gold);
}

@media (max-width: 768px) {
  .modal-header,
  .modal-body {
    padding: var(--space-lg);
  }
}
</style>
