<template>
  <v-card class="mx-auto">
    <v-card-text class="bg-pink-darken-4">
      <v-row align="center" class="mx-0">
        <v-col xs="12" sm="3" md="3" lg="3" class="py-0"
          ><span class="text-subtitle-1">Actions</span></v-col
        >
        <v-col class="d-flex justify-center flex-grow-1 py-0"
          ><div class="text-grey">Available Power</div>
          <v-rating
            :model-value="powerLevel"
            :color="availablePower > 0 ? 'amber' : 'grey-darken-3'"
            density="compact"
            size="small"
            readonly
          ></v-rating
        ></v-col>
      </v-row>
    </v-card-text>
    <v-card-item class="d-flex justify-center">
      <v-btn
        :disabled="!userCardChoices.length"
        rounded="xl"
        size="x-large"
        :color="userCardChoices.length ? 'pink' : ''"
        :variant="userCardChoices.length ? 'elevated' : 'plain'"
        @click="execute()"
        >Play turn</v-btn
      >
    </v-card-item>
    <v-card-item>
      <v-row>
        <v-col v-for="cardName in allUserCardsListByPower" :key="cardName" md="4" sm="6" xs="12">
          <ActionCard :name="cardName" />
        </v-col>
      </v-row>
    </v-card-item>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import ActionCard from '@/components/ActionCard.vue'
import { gameDetails } from '@/use/gameDetails'
import { Turns } from '@/use/system/Turns'

const { availablePower, allUserCardsListByPower, userCardChoices, increaseTurnCount } =
  gameDetails()
const { prepareCards } = Turns()

const powerLevel = computed(() => {
  return Math.round(availablePower.value / 10)
})

const execute = () => {
  // Prepare and process the current card choices for the user
  prepareCards(userCardChoices)

  // Apply effects for chosen cards

  // Choose system action
  // Display system action choice
  // Process system card(s)
  // Apply effects for system cards

  // Check whether there are specific turn effects (per turn number)

  // Count another turn
  increaseTurnCount()

  // Re-enable next turn: reset user choice cards + re-enable the button
}
</script>
