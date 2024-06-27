import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useScoreStore } from '@/stores/score'
import { useUserStore } from '@/stores/user'
import { useHistoryStore } from '@/stores/history'
import { useEffectsStore } from '@/stores/effects'
import { userCards } from '@/use/cards/userCards'

export function gameDetails() {
  const store = useGameStore()
  // Other stores
  const effectsStore = useEffectsStore()
  const scoreStore = useScoreStore()
  const userStore = useUserStore()
  const historyStore = useHistoryStore()

  // User cards
  const { cards } = userCards()
  const cardNames = Object.keys(cards)
  const toggleCard = function (name) {
    // Check the card is valid
    if (cardNames.indexOf(name) === -1) {
      return
    }

    // check if card is in the chosenCards array
    const i = store.chosenCards.indexOf(name)
    if (i === -1) {
      // Add
      store.chosenCards.push(name)
    } else {
      store.chosenCards.splice(i, 1)
    }
  }

  // Bools
  const isGameActive = computed(() => store.isActive)
  const isInstructionDialogOpen = computed(() => store.instructionDialog)
  const isResetDialogOpen = computed(() => store.resetDialog)

  // Computed
  const userCardChoices = computed({
    get() {
      return store.chosenCards
    },
    set(val) {
      store.setChosenCards(val)
    }
  })

  // Dialogs
  const toggleInstructionDialog = function () {
    store.instructionDialog = !store.instructionDialog
  }

  const toggleResetDialog = function () {
    store.resetDialog = !store.resetDialog
  }

  const setGameActive = function () {
    store.toggleActive(true)
  }

  const reset = function () {
    effectsStore.reset()
    store.reset()
    historyStore.reset()
    scoreStore.reset()
    userStore.reset()
  }

  return {
    reset,
    isGameActive,
    setGameActive,
    toggleInstructionDialog,
    toggleResetDialog,
    isInstructionDialogOpen,
    isResetDialogOpen,
    userCardChoices,
    toggleCard
  }
}
