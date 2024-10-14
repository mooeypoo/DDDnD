import { defineStore } from 'pinia'
export const useUITogglesStore = defineStore('uitoggles', {
  state: () => ({
    abandonConfirmDialog: false,
    cardDetailsDialogOpen: false,
    cardDetailsDialogData: {},
    turnActionsDialogOpen: false
  }),
  getters: {},
  actions: {
    toggleAbandonConfirmDialog(isActive) {
      this.abandonConfirmDialog = !!isActive
    },
    toggleTurnActionsDialog(isActive) {
      this.turnActionsDialogOpen = !!isActive
    },
    openCardDetailsDialog(cardID, type = 'player', deck = 'ddd') {
      this.cardDetailsDialogData = {
        cardID,
        type,
        deck
      }

      this.cardDetailsDialogOpen = true
    },
    closeCardDetailsDialog() {
      this.cardDetailsDialogOpen = false
    }
  }
})
