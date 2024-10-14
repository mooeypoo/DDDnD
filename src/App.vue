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
      <v-fade-transition>
        <TurnCountBox v-if="isGameActive" class="mr-2" />
      </v-fade-transition>
      <v-fade-transition>
        <RatingBox
          v-if="isGameActive"
          :value="playerMaxPower"
          numOfIcons="5"
          title="Player Power"
          icon="mdi-star"
          class="mr-2"
        />
      </v-fade-transition>
      <v-fade-transition>
        <RatingBox
          v-if="isGameActive"
          :value="playerMaxInfluence"
          numOfIcons="5"
          title="Player Influence"
        />
      </v-fade-transition>
    </v-app-bar>
    <v-main class="ma-2">
      <v-row>
        <v-col v-if="!isGameActive" cols="12">
          <DeckView title="Actions" />
        </v-col>
        <v-col v-if="isGameActive" cols="12" sm="6" md="8" lg="9">
          <TurnActionsView class="mb-2" />
          <DeckView title="Actions" type="player" deck="ddd" />
        </v-col>
        <v-expand-x-transition>
          <v-col v-if="isGameActive" cols="12" sm="6" md="4" lg="3">
            <ScorePanel />
          </v-col>
        </v-expand-x-transition>
      </v-row>
    </v-main>
    <MainSideDrawer v-model="sidedrawer" />
    <AbandonConfirmationDialog />
    <CardDetailsDialog />
    <TurnActionsDialog />
    <!-- <BottomDrawer title="Card list" color="pink"> BLAH </BottomDrawer> -->
  </v-app>
</template>

<script setup>
import { ref, watch } from 'vue'
import ScorePanel from './components/ScorePanel.vue'
import RatingBox from './components/RatingBox.vue'
import MainSideDrawer from './components/MainSideDrawer.vue'
import TurnCountBox from './components/TurnCountBox.vue'
import DeckView from './components/DeckView.vue'
import TurnActionsView from './components/TurnActionsView.vue'
import TurnActionsDialog from './components/TurnActionsDialog.vue'
import AbandonConfirmationDialog from './components/AbandonConfirmationDialog.vue'
import { useGameAbstraction } from '@/use/gameAbstraction'
import CardDetailsDialog from './components/CardDetailsDialog.vue'

const { isGameActive, playerMaxPower, playerMaxInfluence } = useGameAbstraction()

const sidedrawer = ref(false)
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
  background: url('/images/backgrounds/background.png');
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
