<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="Dungeon Master"
    size="sm"
    @close="close"
  >
    <div class="modal-body">
        <p>
            This game was developed by 
            <strong><a href="https://moriel.tech" target="_blank" rel="noopener">
              Moriel Schottlender <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
            </a></strong>. Source code is available on <a href="https://github.com/mooeypoo/dddnd" target="_blank" rel="noopener">Github <span class="external-link-indicator" aria-label="Opens in new tab">↗</span></a>.
        </p>
        <SocialLinksPanel />
      </div>

      <template #footer>
      <div class="modal-footer">
        <button class="primary-button" @click="close">Got it!</button>
      </div>
      </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import SocialLinksPanel from './social_links_panel.vue'
defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
function close() { emit('close') }
</script>

<style scoped>
.modal-body {
  color: var(--color-text-primary);
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
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
</style>
