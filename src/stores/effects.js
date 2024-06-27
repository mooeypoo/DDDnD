// import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useEffectsStore = defineStore('effects', {
  state: () => ({
    immediate: [],
    ongoing: [],
    delayed: [],
    modifiers: []
  }),
  getters: {},
  actions: {
    reset() {}
  }
})
