import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    instructionDialog: false,
    resetDialog: false,
    userCardDialog: {
      open: false,
      card: ''
    },
    chosenCards: []
  }),
  getters: {
    isActive: (state) => !!state.active
  },
  actions: {
    reset() {
      this.toggleActive(false)
      this.chosenCards = []
    },
    toggleActive(isActive) {
      this.active = !!isActive
    },
    toggleResetConfirmationDialog(isActive) {
      this.resetDialog = !!isActive
    },
    setUserCardDialogCard(card) {
      this.userCardDialog.card = card
    }
  }
})
