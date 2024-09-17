<template>
  <v-card variant="tonal" v-bind="props">
    <v-card-subtitle class="py-0 pt-1">Player Power: {{ power }}%</v-card-subtitle>
    <v-card-item class="pa-1 pt-0 d-flex justify-center">
      <SwordIcon v-for="i in numOfSwords" :state="active[i]" :key="i" size="16" />
    </v-card-item>
  </v-card>
</template>

<script setup>
import SwordIcon from './SwordIcon.vue'

// Calculate power from the prop; power should be 0 to 10 (percentage)
const props = defineProps(['power', 'swords'])

const power = isNaN(props.power) ? 0 : props.power
const maxPowerValue = 100
const numOfSwords = isNaN(props.swords) ? 5 : Number(props.swords)
const activeIndex = Math.floor(power / (maxPowerValue / numOfSwords))
const remainder = power % (maxPowerValue / numOfSwords)

const active = []
// Set 'active' state for the relevant number of sword icons
for (let i = 0; i < numOfSwords; i++) {
  active[i] = i <= activeIndex ? 'active' : ''
}

// If there is a remainder, make the next sword partially active
if (remainder) {
  active[activeIndex + 1] = 'partial'
}
</script>
