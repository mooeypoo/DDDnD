<template>
  <v-app>
    <v-app-bar color="secondary" image="/images/backgrounds/appbar2.png" class="px-2">
      <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>

      <v-avatar size="x-large">
        <v-img alt="DDDnD" src="/images/logo/dddnd.png"></v-img>
      </v-avatar>

      <v-spacer />
      <RatingBox value="20" numOfIcons="5" title="Player Power" icon="mdi-star" class="mr-2" />
      <RatingBox value="50" numOfIcons="5" title="Player Influence" />
    </v-app-bar>
    <v-main class="ma-2">
      <v-row>
        <v-col cols="12" sm="6" md="8" lg="9"></v-col>
        <v-col cols="12" sm="6" md="4" lg="3">
          <ScorePanel />
        </v-col>
      </v-row>
    </v-main>
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
            :text="isGameActive ? 'RESTART GAME' : 'START GAME'"
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
  </v-app>
</template>

<script setup>
import { ref, watch } from 'vue'
import ScorePanel from './components/ScorePanel.vue'
import RatingBox from './components/RatingBox.vue'
import { useGameAbstraction } from './use/gameAbstraction'

const { resetGame, isGameActive, setGameActive } = useGameAbstraction()

const startGame = () => {
  if (isGameActive.value) {
    console.log('game is active, check if user wants to restart')
    resetGame()
  } else {
    console.log('game is not active, start a new game')
    setGameActive()
  }
}

const drawer = ref(true)
const group = ref(null)

watch(group, () => {
  drawer.value = false
})
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Kode+Mono:wght@400..700&family=VT323&display=swap');
@import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');

.v-application {
  font-family: 'Kode Mono', monospace;
  background: url('/images/background.png');
  font-weight: 400;
  font-style: normal;
}

// FONTS
.kode-mono-terminal {
  font-family: 'Kode Mono', monospace;
  font-optical-sizing: auto;
  font-weight: 400;
  font-style: normal;
}
.font-terminal {
  font-family: 'VT323', monospace;
  font-weight: 400;
  font-style: normal;
}

html {
  font-size: 90%;
  @media only screen and (min-width: 600px) {
    font-size: 94%;
  }
  @media only screen and (min-width: 1000px) {
    font-size: 98%;
  }
  @media only screen and (min-width: 1200px) {
    font-size: 100%;
  }
}
</style>
