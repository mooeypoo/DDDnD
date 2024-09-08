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
  const { userCardsDetails } = userCards()
  const allUserCardsList = Object.keys(userCardsDetails)
  const allUserCardsListByPower = allUserCardsList.sort((a, b) => {
    if (userCardsDetails[a].required_power < userCardsDetails[b].required_power) return -1
    else if (userCardsDetails[a].required_power > userCardsDetails[b].required_power) return 1
    else {
      // alphabetically
      if (a < b) return -1
      else if (a > b) return 1
      else return 0
    }
  })
  const increaseTurnCount = () => {
    store.increaseTurnCount()
  }
  const cardDisplayName = (name) => userCardsDetails[name].name
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
  const userCardDialogCardInfo = computed(() => userCardsDetails[store.userCardDialog.card])

  // Bools
  const isGameActive = computed(() => store.isActive)
  const isInstructionDialogOpen = computed(() => store.instructionDialog)
  const isResetDialogOpen = computed(() => store.resetDialog)
  const isUserCardInfoDialogOpen = computed(() => store.userCardDialog.open)
  const isTurnSummaryDialogOpen = computed(() => store.turnSummaryDialog)

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

      const details = userCardsDetails[item]
      if (!details) return

      power -= userCardsDetails[item].required_power
    })

    return power || 0
  })

  // Dialogs
  const toggleInstructionDialog = function () {
    store.instructionDialog = !store.instructionDialog
  }

  const toggleTurnSummaryDialog = function () {
    store.toggleTurnSummaryDialog()
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
    toggleTurnSummaryDialog,
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
    isTurnSummaryDialogOpen,
    userCardDialogCardName,
    userCardDialogCardInfo,
    toggleUserCardDialog,
    increaseTurnCount
  }
}
