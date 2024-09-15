<template>
  <div class="home d-flex flex-column justify-center align-center">
    <h1>DDDnD</h1>
    <div class="">An RPG game for <em>Domain Driven Design</em> warriors</div>
    <v-divider></v-divider>
    <v-img :width="300" aspect-ratio="16/9" cover src="/images/logo-big.png" class="my-5"></v-img>
    <RouterLink to="/game"
      ><v-btn
        prepend-icon="mdi-magic-staff"
        append-icon="mdi-magic-staff"
        go="/game"
        variant="elevated"
        color="primary"
        >{{ isGameStarted ? 'Resume game' : 'Start game' }}</v-btn
      ></RouterLink
    >
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
// import { scoreDetails } from '@/use/scoreDetails'
// const { isGameStarted } = scoreDetails()
</script>

<style lang="scss"></style>
