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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  border: 2px solid #16213e;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #16213e;
}

.modal-header h2 {
  margin: 0;
  color: #e94560;
  font-size: 1.75rem;
}

.close-button {
  background: none;
  border: none;
  color: #8b92a8;
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
}

.close-button:hover {
  color: #e94560;
}

.modal-body {
  padding: 1.5rem;
  color: #e0e0e0;
}

.modal-body h3 {
  color: #e94560;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.modal-body h3:first-child {
  margin-top: 0;
}

.modal-body p {
  margin: 0.75rem 0;
  line-height: 1.6;
}

.modal-body ul {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.modal-body li {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.credits {
  margin-top: 1.5rem !important;
  font-style: italic;
  color: #8b92a8;
  font-size: 0.95rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 2px solid #16213e;
  display: flex;
  justify-content: flex-end;
}

.primary-button {
  background: #e94560;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight:600;
  cursor: pointer;
  transition: background 0.2s;
}

.primary-button:hover {
  background: #d63851;
}

@media (max-width: 640px) {
  .modal-content {
    margin: 0.5rem;
    max-height: 95vh;
  }
  
  .modal-header h2 {
    font-size: 1.5rem;
  }
}
</style>
