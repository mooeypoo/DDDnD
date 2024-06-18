import { defineStore } from 'pinia'

export const useScoreStore = defineStore('score', {
  state: () => ({
    money: 0, // start with something
    revenue: 0,
    system: {
      modularity: 0
    },
    // consider adding "revenue" as an explicit
    // communication
    // diversity?
    happiness: {
      users: 0, // can be affected negatively by speed of delivery, etc
      devs: 0
    }
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
  actions: {}
})
