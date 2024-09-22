<template>
  <v-card>
    <v-card-title class="bg-pink-darken-4">Turn actions</v-card-title>
    <v-card-item>
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

// Card state
const toggleCard = (cardID) => {
  toggleChosenCard(cardID)
}
</script>
