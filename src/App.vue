<template>
  <v-app>
    <v-app-bar color="secondary" image="/images/backgrounds/appbar2.png">
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
    </v-app-bar>
    <v-main class="ma-2">
      <ScoreBox title="A score box" />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import ScoreBox from '@/components/ScoreBox.vue'
// import { storeToRefs } from 'pinia'
// const drawer = ref(true)
</script>

<style>
.v-application {
  background: url('/images/background.png');
}
</style>
