<template>
  <div class="game">
    <GameDetailsDialog />
    <v-row>
      <v-col cols="12" class="d-flex justify-center"> </v-col>
    </v-row>
    <v-row v-if="isGameActive">
      <v-col md="7" sm="7" xs="12">
        <v-card variant="outlined" class="mx-auto" min-width="200">
          <template v-slot:title
            ><span class="text-h5 font-weight-bold text-pink-lighten-1"
              >DDDnD: the adventure begins!</span
            ></template
          >
          <v-card-text
            >Welcome, <span class="font-weight-bold text-yellow">{{ vUsername }}</span
            >, the {{ randomUserDescriptor }} Domain-Driven Design {{ vUserChar }}!<br />
            You have arrived to Company. Your job is to transform the architecture of their current
            system to be more <span class="font-weight-bold text-blue">modular</span>,
            <span class="font-weight-bold text-blue">performant</span>, and
            <span class="font-weight-bold text-blue">stable</span>.</v-card-text
          >
        </v-card>
      </v-col>
      <v-col md="5" sm="5" xs="12">
        <ScoreCard
          group="company"
          title="The company"
          color="purple"
          icon="mdi-map-legend"
          class="mb-4"
        ></ScoreCard>
        <ScoreCard
          group="happiness"
          title="Happiness"
          color="red"
          icon="mdi-heart"
          class="mb-4"
        ></ScoreCard>
        <ScoreCard
          group="system"
          title="The system"
          color="blue"
          icon="mdi-desktop-classic"
        ></ScoreCard>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// import { ref } from 'vue'
import { userDetails } from '@/use/userDetails'
import { scoreDetails } from '@/use/scoreDetails'
import GameDetailsDialog from '@/components/GameDetailsDialog.vue'
import ScoreCard from '@/components/ScoreCard.vue'

const { isGameActive } = scoreDetails()
const { vUsername, vUserChar } = userDetails()
const userDescriptorList = ['magnificent', 'wonderful', 'amazing', 'incredible', 'amazing']
const randomUserDescriptor =
  userDescriptorList[Math.floor(Math.random() * userDescriptorList.length)]

// If game is active, warn before page reload
window.onbeforeunload = function () {
  if (isGameActive) {
    return ''
  }
}
</script>

<script></script>

<style></style>
