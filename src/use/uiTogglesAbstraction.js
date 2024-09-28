import { computed } from 'vue'
import { useUITogglesStore } from '@/stores/uitoggles'

export function useUITogglesAbstraction() {
  const uiTogglesStore = useUITogglesStore()

  const isAbandonConfirmDialog = computed({
    get: () => uiTogglesStore.abandonConfirmDialog,
    set: (value) => uiTogglesStore.toggleAbandonConfirmDialog(value)
  })
  const isCardDetailsDialogOpen = computed({
    get: () => uiTogglesStore.cardDetailsDialogOpen,
    set: (value) => {
      if (!value) {
        uiTogglesStore.closeCardDetailsDialog()
      } else {
        uiTogglesStore.openCardDetailsDialog(null)
      }
    }
  })
  const cardDetailsDialogData = computed(() => uiTogglesStore.cardDetailsDialogData)

  const toggleAbandonConfirmationDialog = function (state) {
    uiTogglesStore.toggleAbandonConfirmDialog(state)
  }
  const openCardDetailsDialog = function (cardID, cardType = 'player', deckID = 'ddd') {
    uiTogglesStore.openCardDetailsDialog(cardID, cardType, deckID)
  }
  const closeCardDetailsDialog = function () {
    uiTogglesStore.closeCardDetailsDialog()
  }

  return {
    // Abandon Confirm Dialog
    isAbandonConfirmDialog,
    toggleAbandonConfirmationDialog,
    // Card Details Dialog
    isCardDetailsDialogOpen,
    cardDetailsDialogData,
    openCardDetailsDialog,
    closeCardDetailsDialog
  }
}
