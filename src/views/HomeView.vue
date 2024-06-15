<script setup>
// import TheWelcome from '../components/TheWelcome.vue'
</script>

<template>
  <div class="home d-flex flex-column justify-center align-center">
    <div class="text-h2">DDDnD</div>
    <div class="">An RPG game for DDD professionals</div>
    <v-divider></v-divider>
    <v-img :width="300" aspect-ratio="16/9" cover src="/images/logo-big.png" class="my-5"></v-img>
    <v-btn prepend-icon="gamepad-circle-left" append-icon="gamepad-circle-right">Start game</v-btn>
  </div>
</template>

<style>
/* @media (min-width: 1024px) {
  .home {
    display: flex;
    align-items: center;
  }
} */
</style>
