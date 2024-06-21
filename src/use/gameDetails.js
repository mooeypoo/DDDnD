import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

export function gameDetails() {
  const store = useGameStore()

  const isGameActive = computed(() => store.isActive)
  const isInstructionDialogOpen = computed(() => store.instructionDialog)
  const setGameActive = function () {
    store.active = true
  }
  const toggleInstructionDialog = function () {
    store.instructionDialog = !store.instructionDialog
  }

  return {
    isGameActive,
    setGameActive,
    toggleInstructionDialog,
    isInstructionDialogOpen
  }
}
