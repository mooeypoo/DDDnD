<template>
  <header class="game-masthead">
    <div class="masthead-left">
      <GameLogo size="small" />
    </div>
    
    <nav class="masthead-right" aria-label="Game navigation">
      <button class="nav-button" @click="$emit('show-rules')" aria-label="Show game rules">
        <span class="button-icon">📖</span>
        <span class="button-label">Rules</span>
      </button>
      
      <button class="nav-button" @click="$emit('show-about')" aria-label="About this game">
        <span class="button-icon">ℹ️</span>
        <span class="button-label">About</span>
      </button>
      
      <button 
        class="nav-button reset-button" 
        @click="handleResetClick" 
        aria-label="Reset and start a new run"
      >
        <span class="button-icon">↻</span>
        <span class="button-label">Reset Run</span>
      </button>
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

defineEmits<{
  'show-rules': []
  'show-about': []
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

/* Navigation buttons */
.nav-button {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-panel);
  border: 1px solid var(--border-card);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-button:hover {
  background: var(--surface-card);
  border-color: var(--border-focus);
  transform: translateY(-1px);
}

.nav-button:active {
  transform: translateY(0);
}

.nav-button:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.button-icon {
  font-size: var(--text-md);
  line-height: 1;
}

.button-label {
  line-height: 1;
}

/* Reset button styling */
.reset-button {
  background: var(--surface-card);
  border-color: var(--border-accent);
  color: var(--text-accent);
}

.reset-button:hover {
  background: var(--effect-warning-bg);
  border-color: var(--effect-warning);
  color: var(--effect-warning);
}

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
  }
  
  .masthead-right {
    gap: var(--space-xs);
  }
  
  .nav-button {
    padding: var(--space-xs) var(--space-sm);
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
