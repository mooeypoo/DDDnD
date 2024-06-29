<template>
  <div class="game">
    <GameDetailsDialog />
    <UserCardInfoDialog />
    <v-row v-if="isGameActive">
      <v-col md="7" sm="7" xs="12">
        <ActionsView />
        <HistoryView />
      </v-col>
      <v-col md="5" sm="5" xs="12">
        <ScoreCard v-for="card in scoreCards" :key="card.group" v-bind="card" class="mb-4" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// import { computed, ref } from 'vue'
import { gameDetails } from '@/use/gameDetails'
import GameDetailsDialog from '@/components/GameDetailsDialog.vue'
import UserCardInfoDialog from '@/components/UserCardInfoDialog.vue'
import ActionsView from '@/components/ActionsView.vue'
import HistoryView from '@/components/HistoryView.vue'
import ScoreCard from '@/components/ScoreGroupView.vue'

// const expand = ref(false)
const { isGameActive } = gameDetails()

// Score cards
const scoreCards = [
  {
    group: 'architecture',
    title: 'Architect',
    color: 'green',
    icon: 'mdi-account-star'
  },
  {
    group: 'company',
    title: 'The company',
    color: 'purple',
    icon: 'mdi-map-legend'
  },
  {
    group: 'happiness',
    title: 'Happiness',
    color: 'red',
    icon: 'mdi-heart'
  },
  {
    group: 'system',
    title: 'The system',
    color: 'blue',
    icon: 'mdi-desktop-classic'
  }
]

// If game is active, warn before page reload
window.onbeforeunload = function () {
  if (isGameActive) {
    return ''
  }
}
</script>

<style lang="scss"></style>
