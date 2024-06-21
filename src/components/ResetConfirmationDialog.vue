<template>
  <v-dialog v-if="isGameActive" v-model="isResetDialogOpen" persistent>
    <v-card
      prepend-icon="mdi-map-marker"
      text="Are you sure you want to restart the game? All data will be erased. This cannot be undone!"
      title="Restart the game"
    >
      <template v-slot:actions>
        <v-spacer></v-spacer>

        <v-btn color="green" variant="outlined" @click="toggleResetDialog">
          No! Continue playing
        </v-btn>
        <v-btn color="red" variant="flat" @click="doReset"> Yes, restart!</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
// import { router } from 'vue'
import { defineEmits } from 'vue'
import { gameDetails } from '@/use/gameDetails'
const emit = defineEmits(['resetComplete'])
const { isGameActive, reset, toggleResetDialog, isResetDialogOpen } = gameDetails()

const doReset = function () {
  reset()
  toggleResetDialog()
  emit('resetComplete')
}
</script>
