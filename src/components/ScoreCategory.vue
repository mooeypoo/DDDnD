<template>
  <v-card variant="elevated" class="mx-auto">
    <v-card-item :class="`bg-${titleColor} cardTitle py-1`">
      <v-row no-gutters>
        <v-col>
          <v-card-title>{{ details.label }}</v-card-title>
        </v-col>
        <v-col v-if="details.icon" class="text-right"><v-icon :icon="details.icon" /></v-col>
      </v-row>
    </v-card-item>
    <v-card-item v-for="elementKey in details.children" :key="elementKey" class="bg-surface pa-2">
      <ScoreLine :group="props.group" :element="elementKey" />
    </v-card-item>
  </v-card>
</template>

<script setup>
import ScoreLine from './ScoreLine.vue'
import { useScoreAbstraction } from '@/use/scoreAbstraction'
const { getScoreGroupDisplayDetails } = useScoreAbstraction()

const props = defineProps(['group'])

const details = getScoreGroupDisplayDetails(props.group)

// Allow overriding color from details, and set a default if no color exists
const titleColor = props.color || details.color || 'pink'
</script>

<style lang="scss" scoped>
.cardTitle,
.v-card-title {
  font-size: 95%;
}
</style>
