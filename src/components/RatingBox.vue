<template>
  <v-card :variant="variantValue">
    <v-card-subtitle class="py-0 pt-1 text-center">{{ title }}: {{ value }}%</v-card-subtitle>
    <v-card-item class="pa-2 pt-0 d-flex justify-center">
      <RatingIcon
        v-for="i in numOfIcons"
        :state="active[i]"
        :key="i"
        size="16"
        :icon="props.icon"
      />
    </v-card-item>
  </v-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import RatingIcon from './RatingIcon.vue'

const props = defineProps(['value', 'numOfIcons', 'title', 'icon', 'variant'])

const maxValue = 100
const numOfIcons = isNaN(props.numOfIcons) ? 5 : Number(props.numOfIcons)
const variantValue = props.variant || 'tonal'

const activeIndex = ref(0)
const remainder = ref(0)
const active = ref([])

const update = () => {
  activeIndex.value = Math.floor(props.value / (maxValue / numOfIcons))
  remainder.value = props.value % (maxValue / numOfIcons)
  // Set 'active' state for the relevant number of icons by the value
  for (let i = 0; i < numOfIcons + 1; i++) {
    active.value[i] = i <= activeIndex.value ? 'active' : ''
  }
  // If there is a remainder, make the next icon partially active
  if (remainder.value) {
    active.value[activeIndex.value + 1] = 'partial'
  }
}

update()
watch(
  () => props.value,
  () => {
    update()
  },
  { immediate: true }
)
</script>

<style lang="scss" scoped>
.v-card-subtitle {
  font-size: 70%;
}
</style>
