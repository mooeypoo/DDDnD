import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    active: false,
    chosenCards: [],
    turnCount: 0,
    // Impacts
    activeImpacts: [],
    delayedImpacts: []
  }),
  getters: {
    isActive: (state) => !!state.active,
    getTurnCount: (state) => state.turnCount,
    getChosenCards: (state) => state.chosenCards,
    // Impacts
    getActiveImpacts: (state) => state.activeImpacts,
    getDelayedImpacts: (state) => state.delayedImpacts
  },
  actions: {
    reset() {
      this.toggleActive(false)
      this.chosenCards = []
      this.turnCount = 0
      this.activeImpacts = []
      this.delayedImpacts = []
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
    },

    // Impacts
    addOngoingImpact(cardId, group, element, value, turns, msg, context = 'player') {
      this.activeImpacts.push({
        cardId,
        context,
        group,
        element,
        value,
        turns,
        msg
      })
      this.activeImpacts.sort((a, b) => {
        // Sort from lowest turns to highest
        return a.turns < b.turns
      })
    },
    addDelayedImpact(cardId, turns, good, bad, context = 'player') {
      this.delayedImpacts.push({
        cardId,
        context,
        turns,
        good,
        bad
      })

      this.delayedImpacts.sort((a, b) => {
        // Sort from lowest turns to highest
        return a.turns < b.turns
      })
    }
  }
})
