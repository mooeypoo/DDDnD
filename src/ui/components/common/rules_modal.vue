<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Game Rules</h2>
        <button class="close-button" @click="close" aria-label="Close">×</button>
      </div>
      
      <div class="modal-body">
        <h3>⚔️ How to Play</h3>
        <p>
          Each turn, you play one <strong>action card</strong>—an architectural spell that 
          reshapes the system. Then the world reacts: aftershocks resolve, events strike, 
          and stakeholders pass judgment.
        </p>
        
        <h3>🔄 Turn Phases</h3>
        <ol>
          <li>
            <strong>Architectural Aftershocks</strong> — Delayed effects from past decisions 
            resolve. The consequences of your earlier choices arrive.
          </li>
          <li>
            <strong>Player Action</strong> — Your chosen card takes effect, shifting scores 
            and stakeholder moods.
          </li>
          <li>
            <strong>System Event</strong> — The dungeon fights back. A random event may 
            trigger: a critical bug, a customer escalation, or worse.
          </li>
          <li>
            <strong>Stakeholder Resolution</strong> — The powers that be react to the current 
            state of the system. Keeping them satisfied is half the battle.
          </li>
          <li>
            <strong>Turn Wrap-Up</strong> — Scores settle. History is recorded. The next 
            turn awaits.
          </li>
        </ol>
        
        <h3>📊 The System Ledger</h3>
        <p>
          Six scores track the health of your system. Neglect any dimension and the 
          consequences compound:
        </p>
        <ul>
          <li><strong>Domain Clarity</strong> — How well your bounded contexts are defined</li>
          <li><strong>Maintainability</strong> — Code quality and ease of change</li>
          <li><strong>Delivery Confidence</strong> — Your team's ability to ship reliably</li>
          <li><strong>Team Morale</strong> — Developer satisfaction and energy</li>
          <li><strong>User Trust</strong> — End-user confidence in the system</li>
          <li><strong>Budget</strong> — Financial runway remaining</li>
        </ul>
        
        <h3>👥 Stakeholders</h3>
        <p>
          Powerful figures with their own priorities. Each has a satisfaction level (0–100) 
          that determines their reaction. Let a stakeholder grow unhappy and they'll 
          actively work against you—draining morale, cutting budgets, or undermining trust.
        </p>
        
        <h3>💥 Architectural Aftershocks</h3>
        <p>
          Some spells echo through time. A refactoring may slow delivery now but improve 
          clarity two turns later. A quick fix may buy time today and spawn bugs tomorrow. 
          Aftershock icons on cards warn you that delayed effects are in play.
        </p>

        <h3>🔗 System Coupling</h3>
        <p>
          Beware the cascade. When a core dimension collapses below a critical threshold, 
          the rot spreads—positive gains in related areas are reduced:
        </p>
        <ul>
          <li>
            <strong>Delivery Collapse</strong> — When delivery confidence is critically low, 
            gains to domain clarity and maintainability are weakened.
          </li>
          <li>
            <strong>Morale Collapse</strong> — When team morale is critically low, 
            maintainability gains are reduced.
          </li>
          <li>
            <strong>Trust Collapse</strong> — When user trust is critically low, 
            delivery confidence gains are reduced.
          </li>
        </ul>
        <p>
          Watch for ⚠️ collapse warnings in the System Ledger. When active, 
          card previews will show the adjusted values. Stabilize the collapsing 
          dimension first—or your other efforts will be in vain.
        </p>

        <h3>🏆 Cards & Resources</h3>
        <p>
          Some cards can only be played a limited number of times per run. Others require 
          a cooldown between uses. Choose wisely—powerful cards are scarce, and the dungeon 
          is long.
        </p>

        <h3>🎯 Winning</h3>
        <p>
          Balance all six dimensions before your turns run out. Your final outcome is 
          classified by <strong>tier</strong> (how well you did) and <strong>archetype</strong> 
          (what kind of architect you became).
        </p>
        
        <p class="tip">
          <strong>Tip:</strong> There is no single path to victory. Every choice is a tradeoff. 
          The architect who tries to fix everything may end up fixing nothing.
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
