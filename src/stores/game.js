import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    chosenCards: [],
    turnCount: 0
  }),
  getters: {
    isActive: (state) => !!state.active,
    getTurnCount: (state) => state.turnCount,
    getChosenCards: (state) => state.chosenCards
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
    },
    addChosenCard(cardId) {
      if (this.chosenCards.indexOf(cardId) === -1) {
        // Only add if it's not already in
        this.chosenCards.push(cardId)
      }
    },
    removeChosenCard(cardId) {
      const index = this.chosenCards.indexOf(cardId)

      if (index > -1) {
        // Only remove if it's in the list
        this.chosenCards.splice(index, 1)
      }
    }
  }
})
