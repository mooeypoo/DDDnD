<template>
  <v-card variant="elevated" class="mx-auto">
    <v-card-item :class="`bg-${titleColor}`">
      <v-card-title>{{ details.label }}</v-card-title>
      <!-- <v-card-subtitle v-if="props.subtitle">{{ props.subtitle }}</v-card-subtitle> -->
    </v-card-item>
    <v-card-item class="bg-secondary pt-4 d-flex justify-space-between">
      <v-row>
        <v-col v-for="elementKey in details.children" :key="elementKey">
          <ScoreLine :group="props.group" :element="elementKey" />
        </v-col>
      </v-row>
    </v-card-item>
    <v-card-text class="bg-secondary pt-4">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ratione debitis quis est
      labore voluptatibus!
    </v-card-text>
  </v-card>
</template>

<script setup>
import ScoreLine from './ScoreLine.vue'
import { scoreDetails } from '@/use/scoreDetails'
const { getScoreGroupDisplayDetails } = scoreDetails()

const props = defineProps(['group'])
// const props = {
//   color: rawProps.color || 'pink',
//   title: rawProps.title || 'Score',
//   subtitle: rawProps.subtitle,
//   icon: rawProps.icon
// }

const details = getScoreGroupDisplayDetails(props.group)
const titleColor = props.color || details.color || 'pink'
</script>
