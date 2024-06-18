import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: ''
  }),
  getters: {},
  actions: {
    setName(value) {
      this.name = value
    }
  }
})
