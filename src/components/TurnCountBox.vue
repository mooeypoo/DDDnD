<template>
  <v-card variant="tonal">
    <v-card-title class="py-0 pt-1">Turn Count: {{ getTurnCount }}</v-card-title>
  </v-card>
</template>

<script setup>
import { useGameAbstraction } from '@/use/gameAbstraction'
const { getTurnCount } = useGameAbstraction()
</script>
