<script setup>
// import TheWelcome from '../components/TheWelcome.vue'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="home d-flex flex-column justify-center align-center">
    <div class="text-h2">DDDnD</div>
    <div class="">An RPG game for <em>Domain Driven Design</em> warriors</div>
    <v-divider></v-divider>
    <v-img :width="300" aspect-ratio="16/9" cover src="/images/logo-big.png" class="my-5"></v-img>
    <RouterLink to="/game"
      ><v-btn prepend-icon="gamepad-circle-left" append-icon="gamepad-circle-right" go="/game"
        >Start game</v-btn
      ></RouterLink
    >
  </div>
</template>

<style>
/* .home {
  width: 100%;
} */
</style>
