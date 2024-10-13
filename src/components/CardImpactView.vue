<template>
  <v-table v-for="type in Object.keys(types)" fixed-header density="compact" :key="type">
    <thead>
      <tr>
        <td colspan="2" class="bg-purple-darken-2 text-center pa-2">{{ types[type] }}</td>
      </tr>
    </thead>
    <tbody v-if="cardEffects[type] && Object.keys(cardEffects[type]).length">
      <tr v-for="group in Object.keys(cardEffects[type])" :key="group">
        <td
          v-if="
            cardEffects[type][group] &&
            cardEffects[type][group].items &&
            cardEffects[type][group].view
          "
        >
          {{ cardEffects[type][group].view.label }}
        </td>
        <td v-else></td>
        <td v-if="cardEffects[type][group].items">
          <ImpactChip
            v-for="(impact, i) in cardEffects[type][group].items"
            :key="i"
            :label="impact.view.label"
            :icon="impact.view.icon"
            :value="impact.value"
            :turns="impact.turns"
            size="small"
          />
        </td>
        <td v-else>
          <ImpactChip
            :label="cardEffects[type][group].view.label"
            :icon="cardEffects[type][group].view.icon"
            :value="cardEffects[type][group].value"
            :turns="cardEffects[type][group].turns"
            size="small"
          />
        </td>
      </tr>
    </tbody>
    <tbody v-else>
      <!-- empty -->
      <tr>
        <td colspan="2" class="text-center">None</td>
      </tr>
    </tbody>
  </v-table>
</template>
<script setup>
import { watch } from 'vue'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import ImpactChip from './ImpactChip.vue'

const { getCardImpactDisplay } = useDeckAbstraction()
const props = defineProps(['cardID', 'type', 'deck'])

let cardEffects = {}
const types = {
  immediate: 'Immediate Effects',
  per_turn: 'Ongoing Effects'
}
const recalculateCardState = function () {
  cardEffects = getCardImpactDisplay(props.cardID, props.type || 'player', props.deck || 'ddd')

  if (cardEffects.turns) {
    types.per_turn = cardEffects.turns
      ? `Ongoing Effects (${cardEffects.turns?.join(' - ')} Turns)`
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
