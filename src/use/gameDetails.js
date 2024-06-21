import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useScoreStore } from '@/stores/score'
import { useUserStore } from '@/stores/user'
import { useHistoryStore } from '@/stores/history'
import { useEffectsStore } from '@/stores/effects'

export function gameDetails() {
  const store = useGameStore()
  // Other stores
  const effectsStore = useEffectsStore()
  const scoreStore = useScoreStore()
  const userStore = useUserStore()
  const historyStore = useHistoryStore()

  const isGameActive = computed(() => store.isActive)
  const isInstructionDialogOpen = computed(() => store.instructionDialog)
  const isResetDialogOpen = computed(() => store.resetDialog)

  const setGameActive = function () {
    store.toggleActive(true)
  }
  const toggleInstructionDialog = function () {
    store.instructionDialog = !store.instructionDialog
  }

  const toggleResetDialog = function () {
    store.resetDialog = !store.resetDialog
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
    isResetDialogOpen
  }
}
