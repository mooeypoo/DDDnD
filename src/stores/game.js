import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    instructionDialog: false
  }),
  getters: {
    isActive: (state) => !!state.active
  },
  actions: {
    toggleActive: (isActive) => (this.active = !!isActive)
  }
})
