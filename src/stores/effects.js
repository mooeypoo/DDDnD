import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useEffectsStore = defineStore('effects', {
  state: () => ({
    name: '',
    character: ''
  }),
  getters: {},
  actions: {}
})
