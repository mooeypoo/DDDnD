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

        <h3>System Coupling</h3>
        <p>
          When parts of the system collapse, improvements become less effective. 
          This represents the real-world difficulty of making progress when foundational 
          systems are failing.
        </p>
        <ul>
          <li>
            <strong>Delivery Collapse</strong> — When delivery confidence drops very low, 
            architecture work (domain clarity, maintainability) becomes harder to apply.
          </li>
          <li>
            <strong>Morale Collapse</strong> — When team morale drops very low, 
            maintainability improvements are weakened.
          </li>
          <li>
            <strong>Trust Collapse</strong> — When user trust drops very low, 
            delivery improvements are disrupted.
          </li>
        </ul>
        <p>
          Watch for ⚠️ collapse warnings in the System Ledger. When active, 
          card effect previews will show the adjusted values.
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
  max-width: 700px;
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

.modal-body ol,
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

.tip {
  margin-top: var(--space-xl) !important;
  padding: var(--space-md);
  background: linear-gradient(135deg, rgba(233, 69, 96, 0.15) 0%, rgba(233, 69, 96, 0.05) 100%);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}

.tip strong {
  color: var(--color-primary);
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
