import { defineStore } from 'pinia'

export const useScoreStore = defineStore('score', {
  state: () => ({
    active: false,
    money: 0,
    revenue: 0,
    system: {
      modularity: 0
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
    isGameActive: (state) => !!state.active
    // getMaintainability: (state) => state.maintainability,
    // getScore: (state) => (state.maintainability + state.sustainability + state.modularization) / 3,
  },
  actions: {
    startGame() {
      this.active = true

      // TODO: There should be some random initial conditions
      const defaultStart = {
        money: 10000,
        revenue: 1000,
        system: {
          modularity: 50
        },
        happiness: {
          users: 50,
          devs: 50
        }
      }

      // Load initial conditions
      // TODO: Do this properly, srsly
      this.money = defaultStart.money
      this.revenue = defaultStart.revenue
      this.system.modularity = defaultStart.system.modularity
      this.happiness.users = defaultStart.happiness.users
      this.happiness.devs = defaultStart.happiness.devs
    }
  }
})
