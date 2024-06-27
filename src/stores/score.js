import { defineStore } from 'pinia'

export const useScoreStore = defineStore('score', {
  state: () => ({
    coins: 0,
    revenue: 0,
    system: {
      bounded_contexts: 0,
      modularity: 0,
      performance: 0
    },
    happiness: {
      users: 0, // can be affected negatively by speed of delivery, etc
      devs: 0
    },
    // factor whether things end with positive or negative outcomes
    // the better the maturity, the better the odds of good outcomes
    influence: 0,
    // User's power represents what actions are available
    // It grows when outcomes are positive,
    // and takes a penalty when outcomes are negative
    user_power: 0
  }),
  getters: {},
  actions: {
    reset() {
      this.coins = 0
      this.revenue = 0
      this.system = {
        bounded_contexts: 0,
        modularity: 0,
        performance: 0
      }
      this.happiness = {
        users: 0,
        devs: 0
      }
      this.user_power = 0
      this.influence = 0
    },
    startGame() {
      // TODO: There should be some random initial conditions
      const defaultStart = {
        coins: 10000,
        revenue: 100,
        system: {
          bounded_contexts: 50,
          modularity: 50,
          performance: 50
        },
        happiness: {
          users: 50,
          devs: 50
        },
        influence: 0,
        user_power: 10
      }

      // Load initial conditions
      this.coins = defaultStart.coins
      this.revenue = defaultStart.revenue
      this.system = { ...defaultStart.system }
      this.happiness = { ...defaultStart.happiness }
      this.happiness.users = defaultStart.happiness.users
      this.happiness.devs = defaultStart.happiness.devs
      this.influence = defaultStart.influence
      this.user_power = defaultStart.user_power
    }
  }
})
