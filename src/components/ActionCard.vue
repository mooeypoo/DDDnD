<template>
  <v-card
    :variant="isActive ? 'elevated' : 'outlined'"
    :color="isActive ? 'primary' : ''"
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
    <v-card-text>
      <v-avatar>
        <v-img :src="`/images/cards/${name}.png`"></v-img>
      </v-avatar>
    </v-card-text>
    <v-card-actions>
      <v-btn
        :color="isActive ? 'black' : ''"
        :variant="isActive ? 'flat' : 'plain'"
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
const { toggleCard, userCardChoices } = gameDetails()

const displayName = ref('')
const isActive = computed(() => {
  return userCardChoices.value.indexOf(props.name) > -1
})

const capitalize = (str) => str[0].toUpperCase() + str.slice(1)
displayName.value = capitalize(props.name)
</script>
