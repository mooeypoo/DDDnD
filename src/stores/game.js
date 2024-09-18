import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    chosenCards: [],
    turnCount: 0
  }),
  getters: {
    isActive: (state) => !!state.active,
    getTurnCount: (state) => state.turnCount
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
    increaseTurn() {
      this.turnCount++
    }
  }
})
