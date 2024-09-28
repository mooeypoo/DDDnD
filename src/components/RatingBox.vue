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
import RatingIcon from './RatingIcon.vue'

const props = defineProps(['value', 'numOfIcons', 'title', 'icon', 'variant'])

const maxValue = 100
const numOfIcons = isNaN(props.numOfIcons) ? 5 : Number(props.numOfIcons)
const value = isNaN(props.value) ? 0 : props.value
const variantValue = props.variant || 'tonal'
// TODO: Something's wrong when the value equals 'max' value (100%)
// seems 4/5 icons are lit without the last one...

// Return an array of certain amount of 'active' and 'partial' items, to be then
// used to set an array of RatingIcon components states on/off based on the given
// value. This is very similar to a star rating widget functionality.
const active = []
const activeIndex = Math.floor(value / (maxValue / numOfIcons))
const remainder = value % (maxValue / numOfIcons)

// Set 'active' state for the relevant number of icons by the value
for (let i = 0; i < numOfIcons; i++) {
  active[i] = i <= activeIndex ? 'active' : ''
}

// If there is a remainder, make the next icon partially active
if (remainder) {
  active[activeIndex + 1] = 'partial'
}
</script>

<style lang="scss" scoped>
.v-card-subtitle {
  font-size: 70%;
}
</style>
