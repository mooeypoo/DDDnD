<template>
  <v-card
    min-width="250"
    class="ma-2 cardview"
    :class="[isAvailable ? 'available' : 'notavailable', isChosen ? 'chosen' : 'notchosen']"
    :width="width"
    :color="cardColor"
    :variant="cardVariant"
  >
    <v-img
      height="100"
      :src="`/images/cards/backgrounds/${details.image}`"
      color="black"
      cover
      class="cardimage d-flex justify-end"
      @click="toggleCard()"
    />
    <v-row @click="show = !show" no-gutters :class="isChosen ? 'bg-blue-darken-3' : ''">
      <v-col>
        <v-card-title class="px-2 py-0">{{ details.title }}</v-card-title>
      </v-col>
      <v-col cols="2" class="text-right pr-1">
        <v-btn
          density="compact"
          variant="outlined"
          color="grey"
          size="small"
          :icon="show ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        ></v-btn>
      </v-col>
    </v-row>
    <v-row @click="show = !show" no-gutters :class="isChosen ? 'bg-blue-darken-3' : ''">
      <v-col>
        <v-card-subtitle class="px-2 pb-2">{{ details.subtitle }}</v-card-subtitle>
      </v-col>
    </v-row>
    <v-expand-transition>
      <div v-show="show" class="bg-surface">
        <RatingBox
          :value="details.power"
          variant="flat"
          numOfIcons="10"
          title="Power required"
          icon="mdi-star"
          class="mx-auto"
          width="250"
        />
        <v-divider></v-divider>
        <v-card-item class="bg-surface">{{ details.description.short }}</v-card-item>
        <v-card-actions class="d-flex justify-center bg-surface">
          <v-btn variant="outlined" size="small" prepend-icon="mdi-help" @click="triggerInfoCard()"
            >INFO</v-btn
          >
          <v-btn
            v-if="actionable"
            variant="outlined"
            :color="isChosen ? 'primary' : ''"
            size="small"
            prepend-icon="mdi-card-bulleted"
            @click="toggleCard()"
            :text="isChosen ? 'REMOVE' : !isAvailable ? 'Not enough power' : 'ADD TO TURN ACTIONS'"
            :disabled="!isChosen && !isAvailable"
          />
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import RatingBox from './RatingBox.vue'

const props = defineProps(['id', 'type', 'deck', 'isAvailable', 'isChosen', 'actionable'])
const emit = defineEmits(['toggle', 'info'])

const show = ref(false)

// Width
const { name } = useDisplay()
const width = computed(() => {
  // name is reactive and
  // must use .value
  switch (name.value) {
    case 'xs':
      return 500
    case 'sm':
    case 'md':
    case 'lg':
    case 'xl':
    case 'xxl':
      return 400
  }

  return undefined
})

// Card details
const { getCardDisplay } = useDeckAbstraction()
const details = getCardDisplay(props.id, props.type, props.deck)

// Card display for the states
const cardColor = ref('')
const cardVariant = ref('elevated')
const recalculateCardState = () => {
  if (props.isChosen) {
    cardColor.value = 'blue'
    cardVariant.value = 'outlined'
  } else if (!props.isAvailable) {
    cardColor.value = 'white'
    cardVariant.value = 'tonal'
  } else {
    cardColor.value = ''
    cardVariant.value = 'elevated'
  }
}
// Emit when card is toggled
const toggleCard = function () {
  emit('toggle', props.id, props.isAvailable, props.isChosen)
}
const triggerInfoCard = function () {
  emit('info', props.id, props.type, props.deck)
}

// Listed to state changes
recalculateCardState()
watch(
  () => props.isAvailable,
  () => recalculateCardState()
)
watch(
  () => props.isChosen,
  () => recalculateCardState()
)
</script>

<style lang="scss">
.cardview {
  .v-card-subtitle {
    text-wrap: wrap;
  }

  &.notavailable:not(.chosen) {
    opacity: 0.7;
    img {
      opacity: 0.5;
    }
  }
}
</style>
