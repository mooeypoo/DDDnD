import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// Save the steps that were taken and their impact
export const useHistoryStore = defineStore('history', {
  state: () => ({
    history: [
/*
        {
            type: 'user' / 'system',
            desc: ''
            effect: {}            
        }
*/
    ], 
  }),
  getters: {
  },
  actions: {
    getFullHistory: (state) => state.history,
    getLastLog: (state) => state.history[state.history.length - 1],
    getLastUserAction: (state) => state.history
        .filter(item => item.type = 'user')[state.history.length - 1],
  },
})
