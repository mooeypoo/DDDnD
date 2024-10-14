<template>
  <v-card
    min-width="200"
    :width="width"
    class="ma-2 chosencardview"
    color="white"
    variant="outlined"
  >
    <v-img
      height="50"
      :src="`/images/cards/backgrounds/${cardDetails.image}`"
      cover
      class="cardimage d-flex justify-end"
    />
    <v-row no-gutters>
      <v-col>
        <v-card-title class="pa-1 text-center">{{ cardDetails.title }}</v-card-title>
      </v-col>
    </v-row>
    <v-card-item class="pa-1">
      <v-row no-gutters v-for="type in Object.keys(types)" :key="type">
        <v-col v-for="group in Object.keys(cardEffects[type])" :key="group">
          <v-row no-gutters>
            <v-col v-if="cardEffects[type][group].items">
              <ImpactChip
                v-for="(impact, i) in cardEffects[type][group].items"
                :key="i"
                :label="impact.view.label"
                :tooltip="`(${cardDetails.title}) ${cardEffects[type][group].view.label} / ${impact.view.label}: ${impact.value}`"
                :icon="impact.view.icon"
                :value="impact.value"
                :turns="type === 'per_turn' && cardTurns ? cardTurns : impact.turns"
                size="small"
                class="ma-1"
              />
            </v-col>
            <v-col v-else>
              <ImpactChip
                :label="`${cardEffects[type][group].view.label}`"
                :tooltip="`(${cardDetails.title}) ${cardEffects[type][group].view.label}: ${cardEffects[type][group].value}`"
                :icon="cardEffects[type][group].view.icon"
                :value="cardEffects[type][group].value"
                :turns="
                  type === 'per_turn' && cardTurns ? cardTurns : cardEffects[type][group].turns
                "
                size="small"
                class="ma-1"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-card-item>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import ImpactChip from './ImpactChip.vue'

const { getCardImpactDisplay, getCardDisplay } = useDeckAbstraction()
const props = defineProps(['cardID', 'type', 'deck', 'turns'])

// Width
const { name } = useDisplay()
const width = computed(() => {
  // name is reactive and
  // must use .value
  switch (name.value) {
    case 'xs':
    case 'sm':
    case 'md':
      return 250
    case 'lg':
    case 'xl':
    case 'xxl':
      return 300
  }

  return undefined
})

const cardEffects = ref({})
const cardDetails = ref({})
const cardTurns = ref(null)
const types = {
  immediate: 'Immediate Effects',
  per_turn: 'Ongoing Effects'
}

const recalculateCardState = function () {
  cardEffects.value = getCardImpactDisplay(
    props.cardID,
    props.type || 'player',
    props.deck || 'ddd'
  )
  cardDetails.value = getCardDisplay(props.cardID, props.type || 'player', props.deck || 'ddd')

  cardTurns.value = props.turns
  if (cardTurns.value) {
    types.per_turn = `(${props.turns} Turns)`
  } else {
    types.per_turn = cardEffects.value.turns
      ? `(${cardEffects.value.turns?.join(' - ')} Turns)`
      : 'Ongoing Effects'
  }
}
recalculateCardState()

watch(
  () => props.cardID,
  () => recalculateCardState(),
  { deep: true }
)
</script>
