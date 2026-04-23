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
        <AppButton label="Got it!" variant="primary" @click="close" />
      </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import SocialLinksPanel from './social_links_panel.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

/**
 * Informational modal containing creator profile and outbound links.
 */
defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()
function close() { emit('close') }
</script>

<style scoped>
.modal-body {
  color: var(--color-text-primary);
}
</style>
