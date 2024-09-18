<template>
  <v-app>
    <v-app-bar color="secondary" image="/images/backgrounds/appbar2.png" class="px-2">
      <v-app-bar-nav-icon
        variant="text"
        @click.stop="sidedrawer = !sidedrawer"
      ></v-app-bar-nav-icon>

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
    <MainSideDrawer v-model="sidedrawer" />
    <!-- bottom drawer -->
    <v-navigation-drawer location="bottom" v-model="bottomdrawer" temporary>
      <v-card color="pink">
        <v-card-title @click.stop="bottomdrawer = !bottomdrawer">
          <!-- <v-btn @click.stop="bottomdrawer = !bottomdrawer">Close</v-btn> -->
          Card list
        </v-card-title>
      </v-card>

      <v-card>
        <v-card-title>Card list</v-card-title>
        <v-card-item>foo bar</v-card-item>
      </v-card>
    </v-navigation-drawer>
    <v-navigation-drawer location="bottom" permanent>
      <v-card color="pink">
        <v-card-title @click.stop="bottomdrawer = !bottomdrawer">
          <!-- <v-btn @click.stop="bottomdrawer = !bottomdrawer">Close</v-btn> -->
          Card list
        </v-card-title>
      </v-card>
    </v-navigation-drawer>
  </v-app>
</template>

<script setup>
import { ref, watch } from 'vue'
import ScorePanel from './components/ScorePanel.vue'
import RatingBox from './components/RatingBox.vue'
import MainSideDrawer from './components/MainSideDrawer.vue'

const sidedrawer = ref(false)
const bottomdrawer = ref(false)
const group = ref(null)

watch(group, () => {
  sidedrawer.value = false
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
