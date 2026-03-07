<template>
  <div class="game-view">
    <h2>Turn {{ currentTurn }}</h2>
    <!-- TODO: Display scores -->
    <!-- TODO: Display stakeholders -->
    <!-- TODO: Display available cards -->
    <!-- TODO: Display turn history -->
    <!-- TODO: Action selection -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const currentTurn = ref(1)

// TODO: Connect to game store
// TODO: Display turn briefing
// TODO: Handle card selection and turn execution
</script>

<style scoped>
.game-view {
  /* TODO: Add styles */
}
</style>
