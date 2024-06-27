<template>
  <v-card
    :variant="cardStyle.variant"
    :color="cardStyle.color"
    class="d-flex flex-column align-center"
  >
    <v-card-title class="px-2">{{ displayName }}</v-card-title>
    <v-card-item class="py-0 my-0">
      <v-rating
        :model-value="1"
        v-bind="props"
        :color="isActive ? 'black' : 'pink'"
        density="compact"
        size="small"
        half-increments
        readonly
      >
      </v-rating>
    </v-card-item>
    <v-card-text class="py-0 my-0">
      <v-avatar>
        <v-img :src="`/images/cards/${name}.png`"></v-img>
      </v-avatar>
    </v-card-text>
    <v-card-actions class="py-2 my-0 userCardActions">
      <v-btn
        size="small"
        :color="isActive ? 'black' : ''"
        :variant="isActive ? 'flat' : 'plain'"
        :disabled="availablePower <= 0 ? true : false"
        @click="toggleCard(name)"
        >{{ isActive ? 'Remove' : 'Add' }}</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
const props = defineProps(['name'])
import { gameDetails } from '@/use/gameDetails'
const { toggleCard, userCardChoices, availablePower } = gameDetails()

const displayName = ref('')
const isActive = computed(() => {
  return userCardChoices.value.indexOf(props.name) > -1
})

const cardStyle = computed(() => {
  if (isActive.value === true) {
    return {
      color: 'primary',
      variant: 'elevated'
    }
  }

  if (availablePower <= 0) {
    // The card is muted / no more power
    return {
      color: 'blue',
      variant: 'outlined'
    }
  }

  return {
    color: '',
    variant: 'outlined'
  }
})

const capitalize = (str) => str[0].toUpperCase() + str.slice(1)
displayName.value = capitalize(props.name)
</script>

<style lang="scss">
.v-card-actions.userCardActions {
  min-height: 0;
}
</style>
