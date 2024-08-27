import { defineStore } from 'pinia'

// Save the steps that were taken and their impact
export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: [
      /*
        {
            actor: 'user' / 'system',
            desc: '',
            time: '',
            effect: {},
        }
*/
    ]
  }),
  getters: {
    getFullHistory: (state) => state.history,
    getLatestEntry: (state) => state.history[0],
    getLatestUserAction: (state) => state.history.filter((item) => (item.actor = 'user'))[0]
  },
  actions: {
    reset() {
      this.history = []
    },
    addEntry(actor, type, desc, extra) {
      // Put it in the first position of the array (recent should be first)
      this.history.splice(0, 0, {
        actor,
        type,
        desc,
        time: Date.now(),
        extra
      })
    }
  }
})
