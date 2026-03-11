<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Dungeon Master</h2>
        <button class="close-button" @click="close" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <p>
            This game was developed by 
            <strong><a href="https://moriel.tech" target="_blank" rel="noopener">
              Moriel Schottlender <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
            </a></strong>. Source code is available on <a href="https://github.com/mooeypoo/dddnd" target="_blank" rel="noopener">Github <span class="external-link-indicator" aria-label="Opens in new tab">↗</span></a>.
        </p>
        <SocialLinksPanel />
      </div>
      <div class="modal-footer">
        <button class="primary-button" @click="close">Got it!</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SocialLinksPanel from './social_links_panel.vue'
defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
function close() { emit('close') }
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
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-content {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: var(--radius-xl);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
  border: 2px solid var(--color-primary);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
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
  .modal-overlay { padding: var(--space-md); }
  .modal-content { max-height: 95vh; }
  .modal-header, .modal-body, .modal-footer { padding: var(--space-lg); }
  .modal-header h2 { font-size: var(--text-xl); }
}
</style>
