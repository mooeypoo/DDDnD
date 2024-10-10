import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { useDeckAbstraction } from './deckAbstraction'

export function useGameAbstraction() {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { getCardRequiredPower } = useDeckAbstraction()

  // Game active
  const isGameActive = computed(() => gameStore.isActive)
  const setGameActive = function () {
    gameStore.toggleActive(true)
  }

  const resetGame = function () {
    gameStore.reset()
  }

  // Turns
  const getTurnCount = computed(() => gameStore.getTurnCount)
  const increaseTurn = function () {
    gameStore.increaseTurn()
  }

  // Chosen cards
  const getAllChosenCards = computed(() => gameStore.chosenCards)
  const isCardChosen = function (cardId) {
    return gameStore.getChosenCards.indexOf(cardId) > -1
  }

  const toggleChosenCard = function (cardId) {
    if (isCardChosen(cardId)) {
      gameStore.removeChosenCard(cardId)
    } else {
      gameStore.addChosenCard(cardId)
    }
  }

  // Power

  // Check available player power based on player power and chosen cards
  const availablePlayerPower = computed(() => {
    let result = 0
    gameStore.getChosenCards.forEach((cardId) => {
      result += getCardRequiredPower(cardId)
    })

    return playerStore.getPlayerPower - result
  })

  const playerMaxPower = computed(() => playerStore.getPlayerPower)
  const playerMaxInfluence = computed(() => playerStore.getPlayerInfluence)

  return {
    resetGame,
    isGameActive,
    setGameActive,
    getTurnCount,
    increaseTurn,
    isCardChosen,
    getAllChosenCards,
    toggleChosenCard,
    availablePlayerPower,
    playerMaxPower,
    playerMaxInfluence
  }
}
