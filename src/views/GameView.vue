<template>
  <div class="game">
    <GameDetailsDialog />
    <v-row>
      <v-col cols="12" class="d-flex justify-center"> </v-col>
    </v-row>
    <v-row v-if="isGameActive">
      <v-col md="7" sm="7" xs="12">
        <v-card class="mx-auto" max-width="500">
          <v-card-item class="bg-pink-darken-4">
            <v-card-title> Your inventory </v-card-title>
          </v-card-item>
          <v-card-item>
            <v-card color="blue" variant="elevated" max-width="150">
              <v-card-item>
                <div>
                  <!-- <div class="text-overline mb-1">
                    {{ variant }}
                  </div> -->
                  <div class="text-h6 mb-1">Headline</div>
                  <div class="text-caption">Greyhound divisely hello coldly fonwderfully</div>
                </div>
              </v-card-item>
            </v-card>
          </v-card-item>

          <!-- <template v-slot:append>
              <v-btn color="white" icon="mdi-plus" size="small"></v-btn>
            </template> -->
          <!-- </v-card-item> -->
        </v-card>

        <v-card class="mx-auto mt-4" max-width="500">
          <v-card-item class="bg-orange-darken-4">
            <v-card-title> Your adventure </v-card-title>

            <!-- <template v-slot:append>
              <v-btn color="white" icon="mdi-plus" size="small"></v-btn>
            </template> -->
          </v-card-item>

          <v-card-text class="pt-4">
            Your goal is to transform The System to be more
            <span class="text-blue-lighten-1">performant</span>,
            <span class="text-blue-lighten-1">modular</span>, and
            <span class="text-blue-lighten-1">stable</span>.
          </v-card-text>

          <v-divider></v-divider>

          <v-virtual-scroll :items="getLastTenEntries" height="300" item-height="50">
            <template v-slot:default="{ item }">
              <v-list-item>
                <template v-slot:prepend>
                  <v-avatar :color="item.color" class="text-white" size="40">
                    {{ item.initials }}
                  </v-avatar>
                </template>

                <v-list-item-title>{{ item.fullName }}</v-list-item-title>

                <template v-slot:append>
                  <v-btn size="small" variant="tonal">
                    View User

                    <v-icon color="orange-darken-4" end> mdi-open-in-new </v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </template>
          </v-virtual-scroll>
        </v-card>

        <!-- <v-card variant="outlined" class="mx-auto mb-5" min-width="200">
            <template v-slot:title
              ><span class="text-h5 font-weight-bold text-pink-lighten-1"
                >DDDnD: the adventure begins!</span
              ></template
            >
            <v-card-text
              >Welcome, <span class="font-weight-bold text-yellow">{{ vUsername }}</span
              >, the {{ randomUserDescriptor }} Domain-Driven Design {{ vUserChar }}!<br />
              You have arrived to THE COMPANY. Your job is to transform the architecture of their
              current system to be more <span class="font-weight-bold text-blue">modular</span>,
              <span class="font-weight-bold text-blue">performant</span>, and
              <span class="font-weight-bold text-blue">stable</span>.</v-card-text
            >
          </v-card> -->
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
// import { watch } from 'vue'
// import { userDetails } from '@/use/userDetails'
// import { scoreDetails } from '@/use/scoreDetails'
import { gameDetails } from '@/use/gameDetails'
import { historyDetails } from '@/use/historyDetails'
import GameDetailsDialog from '@/components/GameDetailsDialog.vue'
import ScoreCard from '@/components/ScoreCard.vue'

const { isGameActive } = gameDetails()
const { getLastTenEntries } = historyDetails()

// If game is active, warn before page reload
window.onbeforeunload = function () {
  if (isGameActive) {
    return ''
  }
}
</script>

<script></script>

<style></style>
