<template>
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
</template>

<script setup>
import { ref } from 'vue'
import { userDetails } from '@/use/userDetails'
import { scoreDetails } from '@/use/scoreDetails'
import { gameDetails } from '@/use/gameDetails'

const { chars, charImagePaths, vUsername, vUserChar } = userDetails()
const { startGame } = scoreDetails()
const { isGameActive, setGameActive } = gameDetails()

const gameDetailsDialog = ref(true)
const checkStartGame = function () {
  if (!vUsername || !vUserChar) {
    // Validate
    return false
  }
  setGameActive()
  startGame()
  gameDetailsDialog.value = false
}
</script>
