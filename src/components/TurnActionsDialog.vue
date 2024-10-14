<template>
  <v-dialog class="turnActionsDialog" v-model="isTurnActionsDialog" persistent max-width="800">
    <v-card>
      <v-card-title class="bg-pink-darken-4">Turn summary</v-card-title>
      <v-card-item>
        <v-row justify="center">
          <v-col md="12" lg="6" v-for="cardID in getAllChosenCards" :key="cardID" class="pa-2 ma-0">
            <v-scale-transition>
              <CardImpactCompactView
                v-if="showImpacts[cardID]"
                :cardID="cardID"
                :type="type"
                :deck="deck"
                :turns="cardTurns[cardID]"
              />
            </v-scale-transition>
          </v-col>
        </v-row>
      </v-card-item>
      <v-card-actions>
        <v-btn @click="toggleTurnActionsDialog(false)">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useUITogglesAbstraction } from '../use/uiTogglesAbstraction'
import { useGameAbstraction } from '@/use/gameAbstraction'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import CardImpactCompactView from './CardImpactCompactView.vue'

const { isTurnActionsDialog, toggleTurnActionsDialog } = useUITogglesAbstraction()
const { getAllChosenCards, preparePlayerTurn } = useGameAbstraction()
// const { chooseRandomTurn, getCardImpactTurns } = useDeckAbstraction()

const props = defineProps(['type', 'deck'])
const typeID = props.type || 'player'
const deckID = props.deck || 'ddd'

let showImpacts = ref({})
const cardTurns = ref({})

const timer = (ms) => new Promise((res) => setTimeout(res, ms))

// Run animations
async function runLoadAnimations() {
  if (isTurnActionsDialog.value) {
    const details = preparePlayerTurn(deckID)
    getAllChosenCards.value.forEach(async (cardId, index) => {
      // Apply randomly chosen turn from within the range
      cardTurns.value[cardId] = details.turns[cardId]

      await timer(200 * (index + 1))
      showImpacts.value[cardId] = true
    })
  } else {
    showImpacts.value = {}
  }
}

runLoadAnimations()
watch(isTurnActionsDialog, () => runLoadAnimations(), { deep: true })
</script>

<style lang="scss">
// .turnActionsDialog .v-card-item__content {
//   display: flex;
//   flex-wrap: wrap;
//   justify-content: space-between;
// }

// .turnActionsDialog {
//   .v-card-item__content {
//     display: flex;
//   }
// }
</style>
