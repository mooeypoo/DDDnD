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
    reset() {
      this.immediate = []
      this.ongoing = []
      this.delayed = []
      this.modifiers = []
    },
    sortOngoing() {
      this.ongoing.sort((a, b) => b.turns_left - a.turns_left)
    },
    sortDelayed() {
      this.delayed.sort((a, b) => b.wait_turns - a.wait_turns)
    },
    removeIndexFromOngoing(index) {
      this.ongoing.splice(index, 1)
    },
    removeIndexFromDelayed(index) {
      this.delayed.splice(index, 1)
    },
    addImmediate(type, cardKey, effectGroup, effectName, effectValue) {
      this.immediate.push({
        type,
        cardKey,
        effectName,
        effectGroup,
        effectValue
      })
    },
    addOngoing(type, cardKey, effectGroup, effectName, effectValue, turns_left) {
      this.ongoing.push({
        type,
        cardKey,
        turns_left,
        effectName,
        effectGroup,
        effectValue
      })
    },
    addDelayed(type, cardKey, wait_turns, goodOutcomeObj, badOutcomeObj) {
      this.delayed.push({
        type,
        cardKey,
        wait_turns,
        goodOutcome: goodOutcomeObj,
        badOutcome: badOutcomeObj
      })
    }
    // addModifiers(type, cardKey, effectGroup, effectName, effectValue) {
    //   this.delayed.push({
    //     type,
    //     cardKey,
    //     effect: effectObj
    //   })
    // },
  }
})
