<template>
  <v-navigation-drawer v-model="drawer" temporary>
    <v-card>
      <v-card-item>
        <v-img alt="DDDnD logo" height="150" src="/images/logo/logo-128px.png"></v-img>
        <div class="mx-auto text-center">
          <p class="text-caption mt-1">A systems architecture adventure!</p>
        </div>
      </v-card-item>
      <v-card-item class="d-flex justify-center">
        <!-- START/RESTART GAME BUTTON -->
        <v-btn
          color="gray"
          variant="outlined"
          @click="startGame()"
          :text="isGameActive ? 'ABANDON GAME' : 'START GAME'"
        ></v-btn>
      </v-card-item>
      <v-card-item> </v-card-item>
    </v-card>
    <v-divider />
    <v-list density="compact" nav>
      <v-list-subheader>INFORMATION</v-list-subheader>
      <v-list-item
        prepend-icon="mdi-book-open-variant-outline"
        title="Instructions"
        value="instructions"
      ></v-list-item>

      <v-spacer />
      <v-list-subheader>CREDITS</v-list-subheader>
      <v-list-item
        link
        title="View source code"
        value="code"
        href="https://github.com/mooeypoo/dddnd"
        target="_blank"
      >
        <template v-slot:prepend>
          <v-avatar size="small"><v-icon size="x-large">mdi-github</v-icon></v-avatar>
        </template></v-list-item
      >
      <v-list-item
        link
        title="Made by Moriel"
        value="moriel"
        href="https://moriel.tech"
        target="_blank"
      >
        <template v-slot:prepend>
          <v-avatar size="small"><v-img src="/images/moriel-100px.png" /></v-avatar>
        </template>
      </v-list-item>
      <!-- <v-list-item color="primary" prepend-icon="mdi-book-open-variant-outline">
              <v-list-item-title>Instructions</v-list-item-title>
            </v-list-item> -->
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useGameAbstraction } from '../use/gameAbstraction'
import { useUITogglesAbstraction } from '../use/uiTogglesAbstraction'

const { isGameActive, setGameActive } = useGameAbstraction()
const { toggleAbandonConfirmationDialog } = useUITogglesAbstraction()

const startGame = () => {
  if (isGameActive.value) {
    // Abandon game
    // Load the 'are you sure' dialog
    toggleAbandonConfirmationDialog(true)
  } else {
    // Start the game
    setGameActive()
    drawer.value = false
  }
}

const drawer = defineModel()
const group = ref(null)

watch(group, () => {
  drawer.value = false
})
</script>
