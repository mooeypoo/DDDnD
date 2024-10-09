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
        <v-table v-for="type in Object.keys(types)" fixed-header density="compact" :key="type">
          <thead>
            <tr>
              <td colspan="2" class="bg-purple-darken-2 text-center pa-2">{{ types[type] }}</td>
            </tr>
          </thead>
          <tbody v-if="Object.keys(cardEffects[type]).length">
            <tr v-for="group in Object.keys(cardEffects[type])" :key="group">
              <td
                v-if="
                  cardEffects[type][group] &&
                  cardEffects[type][group].items &&
                  cardEffects[type][group].view
                "
              >
                {{ cardEffects[type][group].view.label }}
              </td>
              <td v-else></td>
              <td v-if="cardEffects[type][group].items">
                <ImpactChip
                  v-for="(impact, i) in cardEffects[type][group].items"
                  :key="i"
                  :label="impact.view.label"
                  :icon="impact.view.icon"
                  :value="impact.value"
                  :turns="impact.turns"
                  size="small"
                />
              </td>
              <td v-else>
                <ImpactChip
                  :label="cardEffects[type][group].view.label"
                  :icon="cardEffects[type][group].view.icon"
                  :value="cardEffects[type][group].value"
                  :turns="cardEffects[type][group].turns"
                  size="small"
                />
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <!-- empty -->
            <tr>
              <td colspan="2" class="text-center">None</td>
            </tr>
          </tbody>
        </v-table>
        <!-- <v-table v-if="Object.keys(cardEffects.per_turn).length" fixed-header density="compact">
          <thead>
            <tr>
              <td colspan="2" class="bg-purple-darken-2 text-center pa-2">
                Ongoing Effects ({{ turnsString }} Turns)
              </td>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in Object.keys(cardEffects.per_turn)" :key="group">
              <td
                v-if="
                  cardEffects.per_turn[group] &&
                  !cardEffects.per_turn[group].items.length &&
                  cardEffects.per_turn[group].view
                "
              >
                {{ cardEffects.per_turn[group].view.label }}
              </td>
              <td v-if="cardEffects.per_turn[group].items">
                <ImpactChip
                  v-for="(impact, i) in cardEffects.per_turn[group].items"
                  :key="i"
                  :label="impact.view.label"
                  :icon="impact.view.icon"
                  :value="impact.value"
                  :turns="impact.turns"
                  size="small"
                />
              </td>
              <td v-else>
                <ImpactChip
                  :label="cardEffects.per_turn[group].view.label"
                  :icon="cardEffects.per_turn[group].view.icon"
                  :value="cardEffects.per_turn[group].value"
                  :turns="cardEffects.per_turn[group].turns"
                  size="small"
                />
              </td>
            </tr>
          </tbody>
        </v-table> -->
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
const types = {
  immediate: 'Immediate Effects',
  per_turn: 'Ongoing Effects'
}
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

  types.per_turn = `Ongoing Effects (${cardEffects.turns?.join(' - ')} Turns)`
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
