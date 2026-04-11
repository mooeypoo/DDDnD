<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="About DDDnD"
    size="lg"
    @close="close"
  >
    <div class="modal-body">
        <h3>What is DDDnD?</h3>
        <p>
          <strong>DDDnD</strong> (Domain-Driven Design & Dragons) is a turn-based strategy game 
          where the dungeon is a software system — and the monsters are technical debt, 
          organizational chaos, and impossible deadlines.
        </p>
        
        <p>
          You are a systems architect — part wizard, part diplomat, part battle-hardened 
          adventurer — thrust into a codebase on the brink. Each turn, you'll play action cards to refactor modules, 
          define bounded contexts, appease stakeholders, or ship desperate quick fixes. 
          Every decision has consequences. Some arrive immediately. Others lurk for turns, 
          waiting to strike.
        </p>

        <h3>The Quest</h3>
        <p>
          Choose a scenario—a cursed monolith, a sprawling microservice dungeon, a compliance 
          labyrinth, or a hypergrowth gauntlet—and try to stabilize the system before time 
          runs out. Your final outcome depends on the scores you maintain, the stakeholders 
          you manage, and the architectural path you carve.
        </p>
        
        <h3>Core Game Concepts</h3>
        <ul>
          <li><strong>Action Cards</strong> — Spells of architecture. Each one reshapes the system.</li>
          <li><strong>Scores</strong> — Six dimensions of system health. Neglect any at your peril.</li>
          <li><strong>Stakeholders</strong> — Powerful NPCs with their own agendas. Keep them satisfied—or face their wrath.</li>
          <li><strong>Architectural Aftershocks</strong> — Delayed consequences. Today's shortcut is tomorrow's crisis.</li>
          <li><strong>System Coupling</strong> — Let a dimension collapse, and the rot spreads. Progress elsewhere is weakened.</li>
          <li><strong>Events</strong> — Random encounters: production fires, customer escalations, and surprise departures.</li>
        </ul>

        <h3>Quick Architecture Concepts</h3>
        <ul class="quick-concepts">
          <li>
            <strong>
              <a href="https://en.wikipedia.org/wiki/Domain-driven_design" target="_blank" rel="noopener noreferrer">
                Domain-Driven Design
                <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
              </a>
            </strong> — A way of designing software by focusing on the core business domain and its logic.
          </li>
          <li>
            <strong>
              <a href="https://en.wikipedia.org/wiki/Systems_architecture" target="_blank" rel="noopener noreferrer">
                Systems Architecture
                <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
              </a>
            </strong> — The structure and organization of complex software or hardware systems.
          </li>
          <li>
            <strong>
              <a href="https://en.wikipedia.org/wiki/Systems_thinking" target="_blank" rel="noopener noreferrer">
                Systems Thinking
                <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
              </a>
            </strong> — Understanding how parts of a system interact and influence each other as a whole.
          </li>
        </ul>


        <h3>Dungeon Master</h3>
        <SocialLinksPanel />
        <p class="credits">
          A game about software architecture, technical debt, and the humans who manage both.
        </p>
    </div>

    <template #footer>
      <AppButton label="Got it!" variant="primary" @click="close" />
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import SocialLinksPanel from './social_links_panel.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
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
  line-height: 1.7;
  color: var(--dng-subtitle-warm);
}

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

.creator-credit {
  margin-top: var(--space-sm);
}

.creator-credit a {
  color: var(--dng-subtitle-warm);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.creator-credit a:hover,
.creator-credit a:focus-visible {
  color: var(--dng-bronze-hi);
}

.credits {
  margin-top: var(--space-xl) !important;
  padding: var(--space-md);
  font-style: italic;
  color: var(--dng-footer-muted);
  font-size: var(--text-sm);
  background: rgba(13, 9, 4, 0.45);
  border-left: 4px solid var(--dng-bronze-mid);
  border-radius: var(--radius-md);
}

</style>
