<template>
  <SurfaceModalPanel
    :is-open="isOpen"
    title="Dungeon Master"
    size="sm"
    @close="close"
  >
    <div class="modal-body">
        <p>
          The chamber, the packs, and the engine were built by
          <strong><a href="https://moriel.tech" target="_blank" rel="noopener">
            Moriel Schottlender <span class="external-link-indicator" aria-label="Opens in new tab">↗</span>
          </a></strong>.
          The source lives on
          <a href="https://github.com/mooeypoo/dddnd" target="_blank" rel="noopener">GitHub <span class="external-link-indicator" aria-label="Opens in new tab">↗</span></a>.
        </p>
        <p>
          This plaque is a maker's mark, not a rulebook. How to play is next door.
        </p>
        <SocialLinksPanel />
      </div>

      <template #footer>
        <AppButton label="Return to the council" variant="primary" @click="close" />
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
  color: var(--dng-subtitle-warm);
}

.modal-body p {
  margin: 0 0 var(--space-md);
  font-size: var(--text-base);
  line-height: 1.7;
}

.modal-body a {
  color: var(--dng-title-gold);
}
</style>
