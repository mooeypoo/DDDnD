<template>
  <v-card color="secondary">
    <v-card-title class="py-2">Score</v-card-title>
    <v-card-item class="pb-2 pt-0">
      <ScoreCategory group="happiness" class="mb-0" />
    </v-card-item>
    <v-card-item class="pt-0">
      <ScoreCategory group="system" class="mt-0" />
    </v-card-item>
  </v-card>
</template>

<script setup>
import ScoreCategory from '@/components/ScoreCategory.vue'
</script>
