<template>
  <v-card
    :variant="cardStyle.variant"
    :color="cardStyle.color"
    class="d-flex flex-column align-center"
  >
    <v-card-title class="text-body-1 px-2">{{ displayName }}</v-card-title>
    <v-card-item class="py-0 my-0">
      <v-rating
        :model-value="1"
        v-bind="props"
        :color="isActive ? 'black' : 'pink'"
        density="compact"
        size="small"
        half-increments
        readonly
      >
      </v-rating>
    </v-card-item>
    <!-- <v-card-text class="py-0 my-0">
      <v-avatar>
        <v-img :src="`/images/cards/${name}.png`"></v-img>
      </v-avatar>
    </v-card-text> -->
    <v-card-actions class="py-2 my-0 px-4 userCardActions">
      <v-btn
        size="x-small"
        :color="isActive ? 'primary' : ''"
        variant="flat"
        @click="openUserCardInfoDialog(name)"
        >INFO</v-btn
      >
      <v-btn
        size="x-small"
        :color="isActive ? 'black' : ''"
        :variant="isActive ? 'outlined' : 'plain'"
        :disabled="cardStyle.buttonDisabled"
        @click="toggleCard(name)"
        >{{ cardStyle.buttonText
        }}<v-icon v-if="cardStyle.buttonIcon" :icon="cardStyle.buttonIcon"></v-icon
      ></v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps(['name'])
import { gameDetails } from '@/use/gameDetails'
const {
  toggleCard,
  userCardChoices,
  cardDisplayName,
  availablePower,
  userCardDialogCardName,
  toggleUserCardDialog
} = gameDetails()

const displayName = cardDisplayName(props.name)
const isActive = computed(() => {
  return userCardChoices.value.indexOf(props.name) > -1
})

const openUserCardInfoDialog = function (name) {
  // set the data
  userCardDialogCardName.value = name
  toggleUserCardDialog()
}

const cardStyle = computed(() => {
  if (isActive.value === true) {
    return {
      color: 'primary',
      variant: 'elevated',
      buttonDisabled: false,
      buttonText: 'Remove'
    }
  }
  if (availablePower.value <= 0) {
    // The card is muted / no more power
    return {
      color: 'blue',
      variant: 'outlined',
      buttonDisabled: true,
      buttonText: '',
      buttonIcon: 'mdi-power-plug-off'
    }
  }

  return {
    color: '',
    variant: 'outlined',
    buttonDisabled: false,
    buttonText: 'Add'
  }
})

// const capitalize = (str) => str[0].toUpperCase() + str.slice(1)
// displayName.value = capitalize(props.name)
</script>

<style lang="scss">
.v-card-actions.userCardActions {
  min-height: 0;
}
</style>
