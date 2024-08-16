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
  const allUserCardsList = Object.keys(cards)
  const allUserCardsListByPower = allUserCardsList.sort((a, b) => {
    if (cards[a].required_power < cards[b].required_power) return -1
    else if (cards[a].required_power > cards[b].required_power) return 1
    else {
      // alphabetically
      if (a < b) return -1
      else if (a > b) return 1
      else return 0
    }
  })
  const cardDisplayName = (name) => cards[name].name
  const toggleCard = function (name) {
    // Check the card is valid
    if (allUserCardsList.indexOf(name) === -1) {
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
  const userCardDialogCardName = computed({
    get() {
      return store.userCardDialog.card
    },
    set(cardName) {
      store.setUserCardDialogCard(cardName)
    }
  })

  const userCardDialogCardInfo = computed(() => cards[store.userCardDialog.card])

  // Bools
  const isGameActive = computed(() => store.isActive)
  const isInstructionDialogOpen = computed(() => store.instructionDialog)
  const isResetDialogOpen = computed(() => store.resetDialog)
  const isUserCardInfoDialogOpen = computed(() => store.userCardDialog.open)

  // Computed
  const userCardChoices = computed({
    get() {
      return store.chosenCards
    },
    set(val) {
      store.setChosenCards(val)
    }
  })

  // TODO: Should this be in scoreDetails?
  const availablePower = computed(() => {
    let power = scoreStore.user_power
    store.chosenCards.forEach((item) => {
      if (power < 0) return

      const details = cards[item]
      if (!details) return

      power -= cards[item].required_power
    })

    return power || 0
  })

  // Dialogs
  const toggleInstructionDialog = function () {
    store.instructionDialog = !store.instructionDialog
  }

  const toggleResetDialog = function () {
    store.resetDialog = !store.resetDialog
  }

  const toggleUserCardDialog = function () {
    store.userCardDialog.open = !store.userCardDialog.open
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
    userCardChoices, // Currently chosen cards for the turn
    toggleCard,
    cardDisplayName,
    availablePower,
    allUserCardsList,
    allUserCardsListByPower,
    isUserCardInfoDialogOpen,
    userCardDialogCardName,
    userCardDialogCardInfo,
    toggleUserCardDialog
  }
}
