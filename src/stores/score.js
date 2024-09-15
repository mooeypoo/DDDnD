import { defineStore } from 'pinia'

// TODO: Defaults can split to 'easy' / 'medium' / 'hard' gameplay
//       for starting conditions?
const defaults = {
  happiness: {
    users: 50,
    devs: 50
  },
  system: {
    modularity: 50,
    performance: 50,
    bounded_contexts: 50
  }
}

export const useScoreStore = defineStore('score', {
  state: () => ({
    // The structure here must be the same structure as viewDefinitions
    // and as the card impacts (same groups / element structures)
    happiness: {
      users: 50,
      devs: 50
    },
    system: {
      modularity: 50,
      performance: 50,
      bounded_contexts: 50
    }
  }),
  getters: {
    getElementValue(group, element) {
      if (group && element) {
        return this[group][element]
      }

      if (element) {
        return this[element]
      }

      return null
    }
  },
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
