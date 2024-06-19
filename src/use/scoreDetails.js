import { computed } from 'vue'
import { useScoreStore } from '@/stores/score'

export function scoreDetails() {
  const store = useScoreStore()

  const isGameActive = computed(() => store.isGameActive)

  const startGame = function () {
    store.startGame()
  }
  return {
    isGameActive,
    startGame
  }
}
