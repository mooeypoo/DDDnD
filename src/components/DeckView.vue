<template>
  <v-card>
    <v-card-title>{{ visibleTitle }}</v-card-title>
    <v-card-item class="deckview">
      <CardView v-for="cardId in allCards" :id="cardId" :key="cardId" class="ma-2" />
    </v-card-item>
  </v-card>
</template>

<script setup>
// import { ref } from 'vue'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import CardView from './CardView.vue'
const { getAllCardIDs } = useDeckAbstraction()

const props = defineProps(['title', 'type', 'deck'])
const visibleTitle = props.title || 'Card list'
const typeID = props.type || 'player'
const deckID = props.deck || 'ddd'

const allCards = getAllCardIDs(typeID, deckID)
</script>

<style lang="scss">
.deckview .v-card-item__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
