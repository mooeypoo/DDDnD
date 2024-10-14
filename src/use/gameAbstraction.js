import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { usePlayerStore } from '@/stores/player'
import { useDeckAbstraction } from './deckAbstraction'

export function useGameAbstraction() {
  const gameStore = useGameStore()
  const playerStore = usePlayerStore()
  const { getCardRequiredPower, getCardImpactTurns, chooseRandomTurn } = useDeckAbstraction()

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

  // GAME TURNS
  const preparePlayerTurn = (deckID = 'ddd') => {
    const details = { turns: {} }
    // Go over cards to figure out 'per_turn' turns
    getAllChosenCards.value.forEach((cardId) => {
      const turnsArr = getCardImpactTurns(cardId, 'player', deckID)
      details.turns[cardId] = chooseRandomTurn(turnsArr)
    })

    return details
  }

  const executePlayerTurn = () => {
    // Go over chosen cards
    const immediate = []
    const ongoing = []
    const delayed = []
    gameStore.getChosenCards.forEach((cardId) => {})
    // - Get all immediate effects
    // - Get all ongoing effects -> how many turns
    // - Get all delayed effects -> store for later
    // Update card list state
    // - Go over ongoing effect;
    //   - apply + reduce turn by 1
    //   - delete from list if turns=0
    // - Go over delayed effects
    //   - reduce turns by 1
    //   - if turns=0, choose good/bad + apply effects
    // Decide if system card should be applied
    // Decide if user power should be increased
  }

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
    playerMaxInfluence,
    preparePlayerTurn
  }
}
