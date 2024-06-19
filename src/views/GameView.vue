<template>
  <div class="game">
    <h1>DDDnD: The Adventure!</h1>
    <v-dialog v-if="!isGameActive" v-model="gameDetailsDialog" width="auto" persistent>
      <v-card max-width="400" prepend-icon="mdi-magic-staff" title="Tell us who you are, warrior!">
        <v-text-field label="Warrior name" v-model="vUsername"></v-text-field>

        <v-item-group class="d-inline-flex ga-1" mandatory v-model="vUserChar">
          <v-item v-for="(char, i) in chars" :key="char" v-slot="{ toggle }" :value="char">
            <v-btn
              :color="vUserChar === char ? 'primary' : ''"
              width="auto"
              height="auto"
              @click="toggle"
            >
              <img :src="charImagePaths[i]" />
            </v-btn>
          </v-item>
        </v-item-group>
        <template v-slot:actions>
          <v-btn
            class="ms-auto"
            text="Start game"
            :disabled="!vUserChar || !vUsername"
            @click="checkStartGame"
          ></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { userDetails } from '@/use/userDetails'
import { scoreDetails } from '@/use/scoreDetails'

const gameDetailsDialog = ref(true)
const { chars, charImagePaths, vUsername, vUserChar } = userDetails()
const { isGameActive, startGame } = scoreDetails()

const checkStartGame = function () {
  if (!vUsername || !vUserChar) {
    // Validate
    return false
  }
  startGame()
  gameDetailsDialog.value = false
}

// If game is active, warn before reload
window.onbeforeunload = function () {
  if (isGameActive) {
    return ''
  }
}
</script>

<script></script>

<style></style>
