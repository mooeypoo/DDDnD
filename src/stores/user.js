import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    name: '',
    character: ''
  }),
  getters: {
    getName: (state) => state.name,
    getCharacter: (state) => state.character
  },
  actions: {
    reset() {
      this.name = ''
      this.character = ''
    },
    setName(value) {
      this.name = value
    },
    setCharacter(value) {
      this.character = value
    }
  }
})
