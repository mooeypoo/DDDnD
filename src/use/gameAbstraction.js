import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { useDeckAbstraction } from './deckAbstraction'

export function useGameAbstraction() {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { getCardRequiredPower } = useDeckAbstraction()

  const isGameActive = computed(() => gameStore.isActive)
  const setGameActive = function () {
    gameStore.toggleActive(true)
  }

  const resetGame = function () {
    gameStore.reset()
  }

  const getTurnCount = computed(() => gameStore.getTurnCount)
  const increaseTurn = function () {
    gameStore.increaseTurn()
  }

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

  /**
   * Check available player power based on player power and chosen cards
   */
  const availablePlayerPower = computed(() => {
    let result = 0
    gameStore.getChosenCards.forEach((cardId) => {
      result += getCardRequiredPower(cardId)
    })

    return playerStore.getPlayerPower - result
  })

  return {
    resetGame,
    isGameActive,
    setGameActive,
    getTurnCount,
    increaseTurn,
    isCardChosen,
    getAllChosenCards,
    toggleChosenCard,
    availablePlayerPower
  }
}
