import { defineStore } from 'pinia'

export const useScoreStore = defineStore('score', {
  state: () => ({
    coins: 0,
    revenue: 0,
    system: {
      modularity: 0,
      performance: 0,
      stability: 0
    },
    happiness: {
      users: 0, // can be affected negatively by speed of delivery, etc
      devs: 0
    }
    // consider adding "revenue" as an explicit
    // communication
    // diversity?
    // Elements / challenges / options to do will have
    /*
    duration: x, // how many turns; 1 for one-time, 0 for always
    on_time_effect: {
      ...
    }
    effect_per_turn: {
      ...
    }
    */
  }),
  getters: {
    // getMaintainability: (state) => state.maintainability,
    // getScore: (state) => (state.maintainability + state.sustainability + state.modularization) / 3,
  },
  actions: {
    startGame() {
      // TODO: There should be some random initial conditions
      const defaultStart = {
        coins: 10000,
        revenue: 1000,
        system: {
          modularity: 50,
          performance: 50,
          stability: 50
        },
        happiness: {
          users: 50,
          devs: 50
        }
      }

      // Load initial conditions
      // TODO: Do this properly, srsly
      this.coins = defaultStart.coins
      this.revenue = defaultStart.revenue
      this.system.modularity = defaultStart.system.modularity
      this.system.performance = defaultStart.system.performance
      this.system.stability = defaultStart.system.stability
      this.happiness.users = defaultStart.happiness.users
      this.happiness.devs = defaultStart.happiness.devs
    }
  }
})
