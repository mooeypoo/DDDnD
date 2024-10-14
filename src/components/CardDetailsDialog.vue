<template>
  <v-dialog v-model="isCardDetailsDialogOpen" max-width="500" class="carddetails">
    <v-card>
      <v-card-title class="bg-pink-darken-4">Details: {{ cardDisplay.title }}</v-card-title>
      <v-img
        height="250"
        :src="`/images/cards/backgrounds/${img}`"
        color="black"
        cover
        class="cardimage d-flex align-end"
        @click="toggleCard()"
      >
        <v-card
          width="60%"
          variant="tonal"
          class="carddetails-description mx-auto my-5 align-self-end"
        >
          <v-card-text v-html="desc.short"></v-card-text>
        </v-card>
      </v-img>
      <v-card-subtitle class="py-2 px-4 text-center">{{ cardDisplay.subtitle }}</v-card-subtitle>
      <v-card-text class="py-2" v-html="desc.long"></v-card-text>
      <v-card-title class="bg-pink-darken-4"> Effects </v-card-title>
      <v-card-item>
        <CardImpactView :cardID="cardID" :type="cardType" :deck="cardDeck" />
      </v-card-item>
      <v-card-actions>
        <v-btn @click="closeCardDetailsDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import { useUITogglesAbstraction } from '@/use/uiTogglesAbstraction'
import CardImpactView from './CardImpactView.vue'

const { getCardDisplay } = useDeckAbstraction()
const { isCardDetailsDialogOpen, cardDetailsDialogData, closeCardDetailsDialog } =
  useUITogglesAbstraction()

let cardDisplay = {}
// let cardEffects = {}
let desc = {}
let img = ref('')

const cardID = computed(() => cardDetailsDialogData.value.cardID)
const cardType = computed(() => cardDetailsDialogData.value.type)
const cardDeck = computed(() => cardDetailsDialogData.value.deck)
const recalculateCardState = function () {
  cardDisplay = getCardDisplay(
    cardDetailsDialogData.value.cardID,
    cardDetailsDialogData.value.type,
    cardDetailsDialogData.value.deck
  )
  desc = {
    long: cardDisplay.description?.long || '',
    short: cardDisplay.description?.short || ''
  }
  img.value = cardDisplay.image || 'dragon-incinirating-bugs.jpeg'
}

// re-Update the details when the state changes
recalculateCardState()
watch(isCardDetailsDialogOpen, () => recalculateCardState(), { deep: true })
</script>

<style lang="scss">
.carddetails {
  img {
    opacity: 0.6;
  }
  &-description {
    background-color: #000000a1;
  }
}
</style>
