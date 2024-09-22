<template>
  <v-card variant="outlined" min-height="300" class="turnactionsview">
    <v-card-title class="bg-surface-light pt-4">Turn actions</v-card-title>
    <v-card-item class="d-flex">
      <ChosenCardView
        v-for="cardID in getAllChosenCards"
        :id="cardID"
        :type="typeID"
        :deck="deckID"
        :key="cardID"
        class="ma-2"
        @toggle="toggleCard"
      />
    </v-card-item>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useGameAbstraction } from '@/use/gameAbstraction'
import ChosenCardView from './ChosenCardView.vue'

const { getAllChosenCards, toggleChosenCard } = useGameAbstraction()
const props = defineProps(['type', 'deck'])
const typeID = props.type || 'player'
const deckID = props.deck || 'ddd'

// Card state
const toggleCard = (cardID) => {
  toggleChosenCard(cardID)
}
</script>

<style lang="scss">
.turnactionsview .v-card-item__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
