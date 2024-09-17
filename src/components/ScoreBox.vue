<template>
  <v-card variant="elevated" class="mx-auto">
    <v-card-item :class="`bg-${titleColor}`">
      <v-row>
        <v-col
          ><v-card-title>{{ details.label }}</v-card-title></v-col
        >
        <v-col v-if="details.icon" class="text-right"><v-icon :icon="details.icon" /></v-col>
      </v-row>

      <!-- <v-card-subtitle v-if="props.subtitle">{{ props.subtitle }}</v-card-subtitle> -->
    </v-card-item>
    <v-card-item v-for="elementKey in details.children" :key="elementKey" class="bg-surface">
      <!-- <v-row>
        <v-col v-for="elementKey in details.children" :key="elementKey" class="pt-0"> -->
      <ScoreLine :group="props.group" :element="elementKey" />
      <!-- </v-col>
      </v-row> -->
    </v-card-item>
    <!-- <v-card-text class="bg-secondary pt-4">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ratione debitis quis est
      labore voluptatibus!
    </v-card-text> -->
  </v-card>
</template>

<script setup>
import ScoreLine from './ScoreLine.vue'
import { scoreDetails } from '@/use/scoreDetails'
const { getScoreGroupDisplayDetails } = scoreDetails()

const props = defineProps(['group'])

const details = getScoreGroupDisplayDetails(props.group)

// Allow overriding color from details, and set a default if no color exists
const titleColor = props.color || details.color || 'pink'
</script>
