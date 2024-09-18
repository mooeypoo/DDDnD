import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    resetDialog: false,
    chosenCards: [],
    turnCount: 0
  }),
  getters: {
    isActive: (state) => !!state.active
  },
  actions: {
    reset() {
      this.toggleActive(false)
      this.chosenCards = []
      this.turnCount = 0
    },

    toggleActive(isActive) {
      this.active = !!isActive
    },
    toggleResetConfirmationDialog(isActive) {
      this.resetDialog = !!isActive
    },
    toggleInstructionsDialog(isActive) {
      this.instructionsDialog = !!isActive
    }
  }
})
