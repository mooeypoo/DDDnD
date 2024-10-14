<template>
  <v-card variant="outlined" min-height="300" class="turnactionsview">
    <v-card-title class="bg-surface-light pt-2">
      <v-row no-gutters>
        <v-col class="flex-grow-1 flex-shrink-0">Turn actions</v-col>
        <v-col class="flex-grow-0 flex-shrink-1">
          <v-btn
            text="Play turn!"
            :disabled="isPlayTurnButtonDisabled"
            @click="executePlayerTurn"
          />
        </v-col>
      </v-row>
    </v-card-title>
    <v-card-subtitle
      >Available player power: {{ availablePlayerPower }}% / {{ playerMaxPower }}%</v-card-subtitle
    >
    <v-card-item class="d-flex pa-2">
      <ChosenCardView
        v-for="cardID in getAllChosenCards"
        :id="cardID"
        :type="typeID"
        :deck="deckID"
        :key="cardID"
        class="ma-2"
        @toggle="toggleCard"
        @info="launchInfoDialog"
      />
    </v-card-item>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { useGameAbstraction } from '@/use/gameAbstraction'
import { useUITogglesAbstraction } from '@/use/uiTogglesAbstraction'
import ChosenCardView from './ChosenCardView.vue'

const { getAllChosenCards, toggleChosenCard, availablePlayerPower, playerMaxPower } =
  useGameAbstraction()
const { openCardDetailsDialog, toggleTurnActionsDialog } = useUITogglesAbstraction()

const props = defineProps(['type', 'deck'])
const typeID = props.type || 'player'
const deckID = props.deck || 'ddd'

// Card state
const toggleCard = (cardID) => {
  toggleChosenCard(cardID)
}
const launchInfoDialog = function (cardID, type, deck) {
  openCardDetailsDialog(cardID, type, deck)
}

// Play button state
const isPlayTurnButtonDisabled = computed(() => !getAllChosenCards.value.length)

const executePlayerTurn = () => {
  toggleTurnActionsDialog(true)
}
</script>

<style lang="scss">
.turnactionsview .v-card-item__content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
</style>
