<template>
  <v-card min-width="100" class="ma-2 chosencardview" width="150" color="white" variant="outlined">
    <v-img
      height="100"
      :src="`/images/cards/backgrounds/${details.image}`"
      cover
      class="cardimage d-flex justify-end"
    />
    <v-row @click="show = !show" no-gutters class="">
      <v-col>
        <v-card-title class="pa-2 text-center">{{ details.title }}</v-card-title>
      </v-col>
    </v-row>
    <v-card-actions class="d-flex justify-center bg-surface">
      <v-btn variant="outlined" size="x-small" icon="mdi-help"></v-btn>
      <v-btn
        variant="outlined"
        color="primary"
        size="x-small"
        prepend-icon="mdi-card-bulleted"
        @click="toggleCard()"
        text="REMOVE"
      />
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { useDeckAbstraction } from '@/use/deckAbstraction'

const props = defineProps(['id', 'type', 'deck'])

// Card details
const { getCardDisplay } = useDeckAbstraction()
const details = getCardDisplay(props.id, props.type, props.deck)

// Emit when card is toggled
const emit = defineEmits(['toggle'])
const toggleCard = function () {
  emit('toggle', props.id, props.isAvailable, props.isChosen)
}

// Listed to state changes
</script>

<style lang="scss">
.chosencardview {
  .v-card-title {
    text-wrap: wrap;
    line-height: 1em;
  }
}
</style>
