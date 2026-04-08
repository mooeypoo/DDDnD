<template>
  <header class="game-masthead">
    <div class="masthead-left">
      <GameLogo size="small" />
    </div>
    
    <nav class="masthead-right" aria-label="Game navigation">
      <AppButton variant="subtle" aria-label="Show game rules" @click="$emit('show-rules')">
        <span class="button-icon">📖</span>
        <span class="button-label">Rules</span>
      </AppButton>

      <AppButton variant="subtle" aria-label="About this game" @click="$emit('show-about')">
        <span class="button-icon">ℹ️</span>
        <span class="button-label">About</span>
      </AppButton>

      <AppButton variant="subtle" aria-label="Dungeon Master social links" @click="$emit('show-dungeon-master')">
        <span class="button-icon">🧙‍♂️</span>
        <span class="button-label">Dungeon Master</span>
      </AppButton>

      <AppButton variant="warning" aria-label="Reset and start a new run" @click="handleResetClick">
        <span class="button-icon">↻</span>
        <span class="button-label">Reset Run</span>
      </AppButton>
    </nav>
    
    <!-- Reset Confirmation Overlay -->
    <div v-if="showResetConfirmation" class="reset-confirmation-overlay" @click.self="cancelReset">
      <div class="confirmation-card">
        <div class="confirmation-icon">⚠️</div>
        <h3 class="confirmation-title">Reset Current Run?</h3>
        <p class="confirmation-message">
          This will end your current run and return you to scenario selection. 
          Your progress will be lost.
        </p>
        <div class="confirmation-actions">
          <button class="btn-cancel" @click="cancelReset">
            Cancel
          </button>
          <button class="btn-confirm" @click="confirmReset">
            Reset Run
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameLogo from './game_logo.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

defineEmits<{
  'show-rules': []
  'show-about': []
  'show-dungeon-master': []
  'reset-run': []
}>()

const showResetConfirmation = ref(false)

function handleResetClick() {
  showResetConfirmation.value = true
}

function cancelReset() {
  showResetConfirmation.value = false
}

function confirmReset() {
  showResetConfirmation.value = false
  // Emit after hiding the modal
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('reset-run'))
  }, 100)
}
</script>

<style scoped>
.game-masthead {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-card);
  position: relative;
}

.masthead-left {
  flex: 0 0 auto;
}

.masthead-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* .button-icon and .button-label target slot content spans inside AppButton;
   scoped styles apply to them because they are part of this component's template. */

/* Reset Confirmation Overlay */
.reset-confirmation-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.confirmation-card {
  background: var(--surface-modal);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  max-width: 420px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.confirmation-icon {
  font-size: var(--text-4xl);
  text-align: center;
  margin-bottom: var(--space-md);
}

.confirmation-title {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-bright);
  text-align: center;
  margin-bottom: var(--space-md);
}

.confirmation-message {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: var(--space-xl);
}

.confirmation-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
}

.btn-cancel,
.btn-confirm {
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.btn-cancel {
  background: var(--surface-panel);
  border: 1px solid var(--border-card);
  color: var(--text-primary);
}

.btn-cancel:hover {
  background: var(--surface-card);
  border-color: var(--border-focus);
}

.btn-confirm {
  background: var(--effect-warning);
  border: 1px solid var(--effect-warning);
  color: var(--bg-page);
}

.btn-confirm:hover {
  background: var(--effect-negative);
  border-color: var(--effect-negative);
}

.btn-cancel:focus-visible,
.btn-confirm:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .game-masthead {
    padding: var(--space-sm) var(--space-md);
    justify-content: center;
  }
  
  .masthead-right {
    gap: var(--space-xs);
  }

  .button-label {
    display: none;
  }

  .button-icon {
    font-size: var(--text-lg);
  }
}

@media (max-width: 480px) {
  .confirmation-card {
    padding: var(--space-lg);
  }
  
  .confirmation-actions {
    flex-direction: column;
  }
  
  .btn-cancel,
  .btn-confirm {
    flex: auto;
  }
}
</style>
