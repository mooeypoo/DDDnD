<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Game Rules</h2>
        <button class="close-button" @click="close" aria-label="Close">×</button>
      </div>
      
      <div class="modal-body">
        <h3>How to Play</h3>
        <p>
          Each turn, you select one <strong>action card</strong> representing an architectural 
          decision. The system then evolves through several phases.
        </p>
        
        <h3>Turn Resolution Phases</h3>
        <ol>
          <li>
            <strong>Architectural Aftershocks</strong> - Delayed effects from previous turns resolve
          </li>
          <li>
            <strong>Player Action</strong> - Your selected card resolves, affecting scores and stakeholders
          </li>
          <li>
            <strong>System Event</strong> - A random event may occur (bug discovered, urgent request, etc.)
          </li>
          <li>
            <strong>Stakeholder Resolution</strong> - Stakeholders react to the current state
          </li>
          <li>
            <strong>Turn Wrap-Up</strong> - Turn ends, progress recorded
          </li>
        </ol>
        
        <h3>Scores</h3>
        <p>
          Track different aspects of system health:
        </p>
        <ul>
          <li><strong>Domain Clarity</strong> - How well bounded contexts are defined</li>
          <li><strong>Maintainability</strong> - Code quality and ease of change</li>
          <li><strong>Delivery Confidence</strong> - Team's ability to ship reliably</li>
          <li><strong>Developer Morale</strong> - Team satisfaction and energy</li>
          <li><strong>User Trust</strong> - End-user confidence in the system</li>
          <li><strong>Budget</strong> - Financial runway remaining</li>
        </ul>
        
        <h3>Stakeholders</h3>
        <p>
          Organizational forces with their own priorities. Their satisfaction (0-100) affects 
          their reactions and can influence scores and events.
        </p>
        
        <h3>Architectural Aftershocks</h3>
        <p>
          Some decisions have <em>delayed consequences</em>. For example, refactoring may initially 
          slow delivery but improve clarity later. These appear at the start of future turns.
        </p>
        
        <h3>Winning</h3>
        <p>
          Balance all metrics before reaching the maximum turn limit. Your outcome is determined by 
          final scores, stakeholder satisfaction, and the path you took.
        </p>
        
        <p class="tip">
          <strong>Tip:</strong> Every choice involves tradeoffs. There's no single right answer.
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
  max-width: 700px;
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

.modal-body ol,
.modal-body ul {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.modal-body li {
  margin: 0.5rem 0;
  line-height: 1.6;
}

.tip {
  margin-top: 1.5rem !important;
  padding: 1rem;
  background: rgba(233, 69, 96, 0.1);
  border-left: 3px solid #e94560;
  border-radius: 4px;
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
  font-weight: 600;
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
