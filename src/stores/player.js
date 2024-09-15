import { defineStore } from 'pinia'
const defaults = {
  power: 10,
  influence: 10
}

export const usePlayerStore = defineStore('player', {
  state: () => ({
    power: 10,
    influence: 10
  }),
  getters: {},
  actions: {
    reset() {
      // reset to defaults
      Object.keys(defaults).forEach((key) => {
        if (typeof defaults[key] === 'object') {
          Object.keys(defaults[key]).forEach((subkey) => {
            this[key][subkey] = defaults[key][subkey]
          })
        } else {
          this[key] = defaults[key]
        }
      })
    }
  }
})
