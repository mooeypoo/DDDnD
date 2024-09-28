<template>
  <v-dialog v-model="isCardDetailsDialogOpen" max-width="500" class="carddetails">
    <v-card>
      <v-card-title class="bg-pink-darken-4">Details: {{ cardDisplay.title }}</v-card-title>
      <v-img
        height="250"
        :src="`/images/cards/backgrounds/dragon-incinirating-bugs.jpeg`"
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
        <v-table density="compact">
          <tbody>
            <tr>
              <td colspan="2">Immediate effects</td>
            </tr>
            <tr v-for="group in Object.keys(cardEffects.immediate)" :key="group">
              <!-- <td
                v-if="
                  group !== '_' &&
                  cardEffects.immediate[group] &&
                  cardEffects.immediate[group].display
                "
              >
                {{ cardEffects.immediate[group].display.label }}
              </td> -->
              <td></td>
              <td>
                <ImpactChip
                  v-for="(impact, i) in cardEffects.immediate[group].items"
                  :key="i"
                  :cardTitle="cardDisplay.title"
                  :context="impact.context"
                  :group="group === '_' ? '' : group"
                  :display="impact.display"
                  :value="impact.value"
                  size="large"
                />
              </td>
            </tr>
            <tr v-if="cardEffects.per_turn">
              <td colspan="2">Ongoing effects ({{ turnsString }} turns)</td>
            </tr>
            <tr
              v-if="cardEffects.per_turn"
              v-for="group in Object.keys(cardEffects.per_turn)"
              :key="group"
            >
              <!-- <td v-if="group !== '_'">
                {{ cardEffects.per_turn[group].display.label }}
              </td> -->
              <td></td>
              <td>
                <ImpactChip
                  v-for="(impact, i) in cardEffects.per_turn[group].items"
                  :key="i"
                  :cardTitle="cardDisplay.title"
                  :context="impact.context"
                  :group="group === '_' ? '' : group"
                  :display="impact.display"
                  :value="impact.value"
                  size="large"
                />
              </td>
            </tr>
          </tbody>
        </v-table>
        <!-- <ImpactChip
          v-for="(impact, i) in cardEffects.immediate.list"
          :key="i"
          :context="impact.context"
          :score="impact.score"
          size="large"
        /> -->
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

const { getCardDisplay, getCardImpactDisplay } = useDeckAbstraction()
const { isCardDetailsDialogOpen, cardDetailsDialogData, closeCardDetailsDialog } =
  useUITogglesAbstraction()

let cardDisplay = {}
let cardEffects = {}
let desc = {}
let turnsString = ''
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

  cardEffects = getCardImpactDisplay(
    cardDetailsDialogData.value.cardID,
    cardDetailsDialogData.value.type,
    cardDetailsDialogData.value.deck
  )
  debugger
  turnsString = cardEffects.per_turn?.turns?.join(' - ')
  console.log('cardEffects', cardEffects)
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
