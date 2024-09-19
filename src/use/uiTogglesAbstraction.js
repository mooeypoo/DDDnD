import { computed } from 'vue'
import { useUITogglesStore } from '@/stores/uitoggles'

export function useUITogglesAbstraction() {
  const uiTogglesStore = useUITogglesStore()

  const isAbandonConfirmDialog = computed(() => uiTogglesStore.abandonConfirmDialog)
  const toggleAbandonConfirmationDialog = function (state) {
    uiTogglesStore.toggleAbandonConfirmDialog(state)
  }

  return {
    isAbandonConfirmDialog,
    toggleAbandonConfirmationDialog
  }
}
