import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useScoreStore = defineStore('score', {
  state: () => ({
    money: 100000, // start with something
    maintainability: 0,
    modularity: 0,
    happiness: {
      users: 0, // can be affected negatively by speed of delivery, etc
      devs: 0
    }
    // Elements / challenges / options to do will have
    /*
    duration: x, // how many turns; 1 for one-time, 0 for always
    effect: {
      money: .. // cost
      maintainability: 0,
      modularity: 0,
      happiness: {
        users: 0,
        devs: 0
      }
    }
    effect_per_turn: {
      money: ..., // recurring cost (0 for none, negative for cost, positive for income)
      maintainability: 0,
      modularity: 0,
      happiness: {
        users: 0,
        devs: 0
      }
    }
    */
  }),
  getters: {
    // getMaintainability: (state) => state.maintainability,
    // getScore: (state) => (state.maintainability + state.sustainability + state.modularization) / 3,
  },
  actions: {},
})
