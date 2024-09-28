import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'

export function usePlayerAbstraction() {
  const playerStore = usePlayerStore()

  const playerInfluence = computed({
    get() {
      return playerStore.getPlayerInfluence()
    },
    set(value) {
      playerStore.setPlayerInfluence(value)
    }
  })

  const playerPower = computed({
    get() {
      return playerStore.getPlayerPower()
    },
    set(value) {
      playerStore.setPlayerPower(value)
    }
  })

  return {
    playerInfluence,
    playerPower
  }
}
