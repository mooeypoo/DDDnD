<template>
  <v-dialog v-model="isAbandonConfirmDialog" max-width="600">
    <v-card>
      <v-card-title class="bg-red-lighten-1">Are you sure?</v-card-title>
      <v-card-item>
        Are you sure you want to abandon the game in progress?
        <span class="text-red-lighten-1 font-weight-black"> This action cannot be undone!</span>
      </v-card-item>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn
          text="No! I want to keep playing!"
          variant="outlined"
          color="green"
          @click="toggleAbandonConfirmationDialog(false)"
        ></v-btn>
        <v-btn @click="confirm()" variant="elevated" color="red">Yes! Abandon game!</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useUITogglesAbstraction } from '../use/uiTogglesAbstraction'
import { useGameAbstraction } from '../use/gameAbstraction'
const { isAbandonConfirmDialog, toggleAbandonConfirmationDialog } = useUITogglesAbstraction()
const { resetGame } = useGameAbstraction()

const confirm = () => {
  resetGame()
  toggleAbandonConfirmationDialog(false)
}
</script>
