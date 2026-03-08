<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>About DDDnD</h2>
        <button class="close-button" @click="close" aria-label="Close">×</button>
      </div>
      
      <div class="modal-body">
        <h3>What is DDDnD?</h3>
        <p>
          <strong>DDDnD</strong> (Domain-Driven Design nD) is a narrative simulation game 
          about making architectural decisions in legacy software systems.
        </p>
        
        <p>
          You play as a systems architect trying to improve a struggling codebase. 
          Every turn, you'll choose an architectural intervention—defining bounded contexts, 
          refactoring aggregates, or shipping quick fixes—and face the consequences.
        </p>
        
        <h3>Core Concepts</h3>
        <ul>
          <li><strong>Action Cards</strong> - Architectural decisions you can make</li>
          <li><strong>Scores</strong> - Metrics tracking system health (clarity, maintainability, trust, etc.)</li>
          <li><strong>Stakeholders</strong> - Organizational forces reacting to your choices</li>
          <li><strong>Architectural Aftershocks</strong> - Delayed consequences of your decisions</li>
          <li><strong>Events</strong> - Unexpected pressures that emerge during gameplay</li>
        </ul>
        
        <h3>Winning</h3>
        <p>
          Balance competing priorities before time runs out. Your outcome will be classified 
          by both success tier and play style archetype.
        </p>

        <h3>Creator</h3>
        <p class="creator-credit">
          Made by
          <a href="https://moriel.tech" target="_blank" rel="noopener noreferrer">Moriel Schottlender</a>
          ·
          <a href="https://github.com/mooeypoo/DDDnD" target="_blank" rel="noopener noreferrer">GitHub</a>
        </p>
        
        <p class="credits">
          A game about software architecture, technical debt, and the humans who manage both.
        </p>
      </div>
      
      <div class="modal-footer">
        <button class="primary-button" @click="close">Got it!</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-lg);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--radius-xl);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
  border: 2px solid var(--color-primary);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xl);
  border-bottom: 2px solid var(--color-border-default);
  background: var(--color-bg-overlay);
}

.modal-header h2 {
  margin: 0;
  color: var(--color-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
}

.close-button {
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  font-size: var(--text-4xl);
  cursor: pointer;
  padding: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
  border-radius: var(--radius-md);
}

.close-button:hover {
  color: var(--color-primary);
  background: var(--color-bg-overlay);
  transform: rotate(90deg);
}

.modal-body {
  padding: var(--space-xl);
  color: var(--color-text-primary);
}

.modal-body h3 {
  color: var(--color-primary);
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
  color: var(--color-primary);
  font-size: var(--text-2xl);
}

.modal-body p {
  margin: var(--space-md) 0;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.modal-body ul {
  margin: var(--space-md) 0;
  padding-left: var(--space-xl);
}

.modal-body li {
  margin: var(--space-sm) 0;
  line-height: 1.7;
  color: var(--color-text-secondary);
}

.modal-body li strong {
  color: var(--color-text-primary);
  font-weight: var(--font-semibold);
}

.creator-credit {
  margin-top: var(--space-sm);
}

.creator-credit a {
  color: var(--color-text-primary);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.creator-credit a:hover,
.creator-credit a:focus-visible {
  color: var(--color-primary);
}

.credits {
  margin-top: var(--space-xl) !important;
  padding: var(--space-md);
  font-style: italic;
  color: var(--color-text-tertiary);
  font-size: var(--text-sm);
  background: var(--color-bg-overlay);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
}

.modal-footer {
  padding: var(--space-xl);
  border-top: 2px solid var(--color-border-default);
  display: flex;
  justify-content: flex-end;
  background: var(--color-bg-overlay);
}

.primary-button {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  font-weight: var(--font-bold);
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
}

.primary-button:hover {
  background: #d63851;
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.primary-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: var(--space-md);
  }
  
  .modal-content {
    max-height: 95vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding: var(--space-lg);
  }
  
  .modal-header h2 {
    font-size: var(--text-xl);
  }
}
</style>
