<template>
  <v-card
    :width="width"
    :color="isCardChosen(id) ? 'blue' : ''"
    :variant="isCardChosen(id) ? 'outlined' : 'elevated'"
    min-width="250"
    class="ma-2 cardview"
  >
    <v-img
      height="100"
      :src="coverImage"
      color="black"
      cover
      class="d-flex justify-end"
      @click="isGameActive && isCardAvailable() ? toggleCard() : null"
    >
    </v-img>
    <!-- <v-expand-transition>
      <v-img v-if="show" height="250" :src="coverImage" color="black" cover> </v-img>
      <v-img v-else height="100" :src="coverImage" color="black" cover> </v-img>
    </v-expand-transition> -->
    <v-row @click="show = !show" no-gutters :class="isCardChosen(id) ? 'bg-grey-darken-3' : ''">
      <v-col>
        <v-card-title class="px-2 py-0">{{ meta.title }}</v-card-title>
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
    <v-row @click="show = !show" no-gutters :class="isCardChosen(id) ? 'bg-grey-darken-3' : ''">
      <v-col>
        <v-card-subtitle class="px-2 pb-2">{{ meta.subtitle }}</v-card-subtitle></v-col
      >
    </v-row>
    <v-expand-transition>
      <div v-show="show" class="bg-surface">
        <RatingBox
          :value="meta.power"
          variant="flat"
          numOfIcons="10"
          title="Power required"
          icon="mdi-star"
          class="mx-auto"
          width="250"
        />
        <v-divider></v-divider>
        <v-card-item class="bg-surface">{{ meta.description.short }}</v-card-item>
        <v-card-actions v-if="isGameActive" class="d-flex justify-center bg-surface">
          <v-btn variant="outlined" size="small" prepend-icon="mdi-help">INFO</v-btn>
          <v-btn
            :variant="isCardChosen(id) ? 'text' : 'outlined'"
            :color="isCardChosen(id) ? 'primary' : ''"
            size="small"
            prepend-icon="mdi-card-bulleted"
            @click="toggleCard()"
            :text="isCardChosen(id) ? 'REMOVE' : 'ADD'"
            :disabled="!isCardChosen(id) && !isCardAvailable()"
          />
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useDeckAbstraction } from '@/use/deckAbstraction'
import { useGameAbstraction } from '@/use/gameAbstraction'

import RatingBox from './RatingBox.vue'

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
const { getCardDisplay } = useDeckAbstraction()
const { isGameActive, isCardChosen, toggleChosenCard, availablePlayerPower } = useGameAbstraction()

const props = defineProps(['id', 'type', 'image', 'available'])
const typeID = props.type || 'player'

const meta = getCardDisplay(props.id, typeID)

const show = ref(false)

const imageName = props.image || meta.image || 'forest-stream-night.png'
const coverImage = `/images/cards/backgrounds/${imageName}`

const toggleCard = () => {
  toggleChosenCard(props.id)
}

const isCardAvailable = () => {
  return availablePlayerPower.value >= meta.power
}
</script>

<style lang="scss">
.cardview {
  .v-card-subtitle {
    text-wrap: wrap;
  }
}
</style>
