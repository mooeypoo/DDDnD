import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    instructionDialog: false,
    resetDialog: false
  }),
  getters: {
    isActive: (state) => !!state.active
  },
  actions: {
    reset() {
      this.toggleActive(false)
    },
    toggleActive(isActive) {
      this.active = !!isActive
    },
    toggleResetConfirmationDialog(isActive) {
      this.resetDialog = !!isActive
    }
  }
})
