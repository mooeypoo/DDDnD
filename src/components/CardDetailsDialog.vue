<template>
  <v-dialog v-model="isCardDetailsDialogOpen" max-width="500">
    <v-card>
      <v-card-title class="bg-pink-darken-4">Details: {{ cardDisplay.title }}</v-card-title>
      <v-card-subtitle class="py-2 px-4">{{ cardDisplay.subtitle }}</v-card-subtitle>
      <v-card-text class="py-2" v-html="description"></v-card-text>
      <v-card-title class="bg-pink-darken-4"> Effects </v-card-title>
      <v-card-item>
        <ImpactChip></ImpactChip>
      </v-card-item>
      <v-card-actions>
        <v-btn @click="closeCardDetailsDialog">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { watch } from 'vue'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import { useUITogglesAbstraction } from '@/use/uiTogglesAbstraction'
import ImpactChip from './ImpactChip.vue'

const { getCardDisplay, getCardImmediateImpacts, getCardPerTurnImpacts } = useDeckAbstraction()
const { isCardDetailsDialogOpen, cardDetailsDialogData, closeCardDetailsDialog } =
  useUITogglesAbstraction()

let cardDisplay = {}
let cardEffects = []
let description = ''
const recalculateCardState = function () {
  cardDisplay = getCardDisplay(
    cardDetailsDialogData.value.cardID,
    cardDetailsDialogData.value.type,
    cardDetailsDialogData.value.deck
  )
  description = cardDisplay.description?.long

  cardEffects = {
    immediate: getCardImmediateImpacts(
      cardDetailsDialogData.value.cardID,
      cardDetailsDialogData.value.type,
      cardDetailsDialogData.value.deck
    ),
    per_turn: getCardPerTurnImpacts(
      cardDetailsDialogData.value.cardID,
      cardDetailsDialogData.value.type,
      cardDetailsDialogData.value.deck
    )
  }
  console.log('cardEffects', cardEffects)
}

// re-Update the details when the state changes
recalculateCardState()
watch(isCardDetailsDialogOpen, () => recalculateCardState(), { deep: true })
</script>
