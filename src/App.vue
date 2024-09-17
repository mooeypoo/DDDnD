<template>
  <v-app>
    <v-app-bar color="secondary" image="/images/backgrounds/appbar2.png" class="px-2">
      <v-menu min-width="200px" rounded>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar color="white" variant="outlined" size="large">
              <v-img alt="DDDnD" src="/images/logo/dddnd.png"></v-img>
            </v-avatar>
          </v-btn>
        </template>
        <v-card>
          <v-card-item>
            <v-img alt="DDDnD logo" height="150" src="/images/logo/logo-128px.png"></v-img>
            <div class="mx-auto text-center">
              <p class="text-caption mt-1">A systems architecture adventure!</p>
            </div>
          </v-card-item>
          <!-- <v-card-text>
            <div class="mx-auto text-center">
              <v-divider class="my-3"></v-divider>
              <v-btn variant="text" rounded> Edit Account </v-btn>
              <v-divider class="my-3"></v-divider>
              <v-btn variant="text" rounded> Disconnect </v-btn>
            </div>
          </v-card-text> -->
        </v-card>
      </v-menu>
      <v-spacer />
      <RatingBox value="20" numOfIcons="5" title="Player Power" icon="mdi-star" class="mr-2" />
      <RatingBox value="50" numOfIcons="5" title="Player Influence" />
    </v-app-bar>
    <v-main class="ma-2">
      <v-row>
        <v-col><ScoreBox group="happiness" /></v-col>
        <v-col><ScoreBox group="system" /></v-col>
      </v-row>
    </v-main>
  </v-app>
</template>

<script setup>
// import { ref } from 'vue'
import ScoreBox from '@/components/ScoreBox.vue'
import RatingBox from './components/RatingBox.vue'
// import { storeToRefs } from 'pinia'
// const drawer = ref(true)
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
