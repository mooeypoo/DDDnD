<template>
  <v-card>
    <v-card-title>{{ visibleTitle }}</v-card-title>
    <v-card-item class="deckview">
      <CardView
        v-for="cardID in allCardIDs"
        :id="cardID"
        :type="typeID"
        :deck="deckID"
        :key="cardID"
        :isAvailable="isAvailable(cardID)"
        :isChosen="isChosen(cardID)"
        class="ma-2"
        @toggle="toggleCard"
      />
    </v-card-item>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import { useGameAbstraction } from '@/use/gameAbstraction'

import CardView from './CardView.vue'
const { getAllCardIDs, getCardRequiredPower } = useDeckAbstraction()
const { isCardChosen, toggleChosenCard, availablePlayerPower, getAllChosenCards } =
  useGameAbstraction()

const props = defineProps(['title', 'type', 'deck'])
const visibleTitle = props.title || 'Card list'
const typeID = props.type || 'player'
const deckID = props.deck || 'ddd'

const allCardIDs = getAllCardIDs(typeID, deckID)

// Card state
const isAvailable = computed(() => (cardID) => {
  return availablePlayerPower.value - getCardRequiredPower(cardID, typeID, deckID) >= 0
})
const isChosen = computed(() => (cardID) => isCardChosen(cardID))

const toggleCard = (cardID, isCardAvailable, isCardChosen) => {
  if (isCardAvailable || isCardChosen) {
    toggleChosenCard(cardID)
  }
}
</script>

<style lang="scss">
.deckview .v-card-item__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
