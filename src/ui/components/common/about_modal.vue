<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="What is this?"
    size="lg"
    @close="close"
  >
    <div class="modal-body">
        <h3>DDDnD</h3>
        <p>
          <strong>Domain-Driven Design n' Dragons</strong> is a tabletop adventure of software
          architecture. The dungeon is a living system. The monsters are technical debt,
          organizational chaos, and impossible deadlines.
        </p>

        <p>
          You join the council as the systems architect. The council gathers around
          the scene. You hold a <strong>legal hand of cards</strong> — usually six — and play
          one onto the table each turn, or spend the turn searching the Grimoire.
          Every decision has consequences. Some land immediately. Others wait as
          aftershocks, then strike.
        </p>

        <h3>The quest</h3>
        <p>
          Choose a scenario — a cursed monolith, a sprawling microservice dungeon, a
          compliance labyrinth, a hypergrowth gauntlet — and try to keep the system
          worthy before the last turn. Vials along the table show the system's mood —
          the scores you inherit. The council watches from their seats. Your ending
          depends on the path you carve,
          not on a catalog of every spell at once.
        </p>

        <h3>In the chamber</h3>
        <ul>
          <li><strong>Action cards</strong> — Architectural moves. Play from the hand in front of you.</li>
          <li><strong>Vials</strong> — The system's mood along the table, not a spreadsheet.</li>
          <li><strong>The council</strong> — The people around the table, each with their own agenda. Keep them, or face them.</li>
          <li><strong>The Grimoire</strong> — The rest of the pack. Look. Do not play from the shelves.</li>
          <li><strong>Consult the Archives</strong> — Spend a turn to replace a card. Searching is delay.</li>
          <li><strong>Aftershocks</strong> — Yesterday's shortcut arriving as today's crisis.</li>
          <li><strong>Coupling</strong> — Let a score collapse, and the rot spreads. Progress elsewhere withers.</li>
        </ul>

        <h3>Architecture, outside the chamber</h3>
        <ul class="quick-concepts">
          <li>
            <strong>
              <a href="https://en.wikipedia.org/wiki/Domain-driven_design" target="_blank" rel="noopener noreferrer">
                Domain-Driven Design
                <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
              </a>
            </strong> — Design software by focusing on the core business domain and its language.
          </li>
          <li>
            <strong>
              <a href="https://en.wikipedia.org/wiki/Systems_architecture" target="_blank" rel="noopener noreferrer">
                Systems Architecture
                <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
              </a>
            </strong> — The structure and organization of a complex system.
          </li>
          <li>
            <strong>
              <a href="https://en.wikipedia.org/wiki/Systems_thinking" target="_blank" rel="noopener noreferrer">
                Systems Thinking
                <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
              </a>
            </strong> — How the parts of a system move each other.
          </li>
        </ul>

        <h3>Dungeon Master</h3>
        <SocialLinksPanel />
        <p class="credits">
          A game about software architecture, technical debt, and the humans who manage both.
        </p>
    </div>

    <template #footer>
      <AppButton label="Return to the council" variant="primary" @click="close" />
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import SocialLinksPanel from './social_links_panel.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

/**
 * Informational modal that explains the game premise and supporting links.
 * It is static UI content and does not mutate game state beyond close events.
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
