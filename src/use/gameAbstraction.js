import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

export function useGameAbstraction() {
  const gameStore = useGameStore()

  const isGameActive = computed(() => gameStore.isActive)
  const setGameActive = function () {
    gameStore.toggleActive(true)
  }
  const resetGame = function () {
    gameStore.reset()
  }

  return {
    resetGame,
    isGameActive,
    setGameActive
  }
}
