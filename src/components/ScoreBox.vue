<template>
  <v-card variant="elevated" class="mx-auto">
    <v-card-item :class="`bg-${props.color}`">
      <v-card-title>{{ props.title }}</v-card-title>
      <v-card-subtitle v-if="props.subtitle">{{ props.subtitle }}</v-card-subtitle>
    </v-card-item>
    <v-card-item>
      <ScoreLine group="happiness" element="devs" />
    </v-card-item>
    <v-card-text class="bg-secondary pt-4">
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Commodi, ratione debitis quis est
      labore voluptatibus!
    </v-card-text>
  </v-card>
</template>

<script setup>
import ScoreLine from './ScoreLine.vue'
const rawProps = defineProps(['color', 'title', 'subtitle', 'icon'])

const props = {
  color: rawProps.color || 'pink',
  title: rawProps.title || 'Score',
  subtitle: rawProps.subtitle,
  icon: rawProps.icon
}
</script>
