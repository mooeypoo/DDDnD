import { defineStore } from 'pinia'
export const useUITogglesStore = defineStore('uitoggles', {
  state: () => ({
    abandonConfirmDialog: false
  }),
  getters: {},
  actions: {
    toggleAbandonConfirmDialog(isActive) {
      this.abandonConfirmDialog = !!isActive
    }
  }
})
