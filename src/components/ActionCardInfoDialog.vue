<template>
  <v-dialog v-model="isUserCardInfoDialogOpen" width="auto">
    <v-card
      color="pink"
      :title="userCardDialogCardInfo.title"
      max-width="400"
      prepend-icon="mdi-information-outline"
    >
      <v-card-text
        class="bg-surface-light pt-4 pb-0"
        v-html="userCardDialogCardInfo.short"
      ></v-card-text>
      <v-card-text
        class="bg-surface-light pt-4 pb-2"
        v-html="userCardDialogCardInfo.long"
      ></v-card-text>
      <v-card-item class="bg-pink-darken-4 py-0">
        <span class="text-overline">Effects</span>
        {{ getEffectView(userCardDialogCardInfo.effect) }}
        <!-- <v-card-text class="bg-surface-light pt-4">
          <v-row>
            <v-col cols="12">
              <v-row
                v-for="immediate_effect in getEffectView(userCardDialogCardInfo.effect)"
                :key="immediate_effect"
              >
                <v-col v-if="!immediate_effect.isPercentage" class="text-caption"
                  ><v-icon
                    :color="immediate_effect.color"
                    :icon="immediate_effect.icon"
                    class="mr-1"
                  ></v-icon
                  ><span>{{ immediate_effect.title }}</span></v-col
                >
                <v-col
                  v-if="!immediate_effect.isPercentage"
                  :style="'color: ' + immediate_effect.color"
                >
                  <span class="font-weight-black">{{ immediate_effect.value }}</span>
                </v-col>
                <v-col v-if="immediate_effect.isPercentage" cols="12" sm="5" class="text-caption"
                  ><v-icon
                    :color="immediate_effect.color"
                    :icon="immediate_effect.icon"
                    class="mr-1"
                  ></v-icon
                  ><span>{{ immediate_effect.title }}</span></v-col
                >
                <v-col v-if="immediate_effect.isPercentage" class="d-flex align-center">
                  <v-progress-linear
                    bg-color="pink-lighten-3"
                    :color="immediate_effect.color"
                    :modelValue="immediate_effect.value"
                    rounded
                  ></v-progress-linear>
                  <v-badge
                    v-if="immediate_effect.isPercentage"
                    :color="immediate_effect.color"
                    :content="immediate_effect.value + '%'"
                    inline
                  ></v-badge>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
        </v-card-text> -->
      </v-card-item>
      <v-card-actions class="bg-surface-light pt-4">
        <v-btn
          v-if="userCardDialogCardInfo.link"
          color="pink-lighten-3"
          :href="userCardDialogCardInfo.link"
          prepend-icon="mdi-open-in-new"
          target="_blank"
          >Read more</v-btn
        >
        <v-btn @click="toggleUserCardDialog">Close</v-btn></v-card-actions
      >
    </v-card>
  </v-dialog>
</template>

<script setup>
import { gameDetails } from '@/use/gameDetails'
import { langHelper } from '@/use/langHelper'

const { getScoreDisplayDetails } = langHelper()
const { isUserCardInfoDialogOpen, userCardDialogCardInfo, toggleUserCardDialog, cardDefinition } =
  gameDetails()

const getEffectView = function (cardEffectObj) {
  if (!cardEffectObj) return []
  if (!userCardDialogCardInfo) return []

  const output = {
    once: [],
    recurring: []
  }

  if (cardEffectObj.once) {
    output.once = _getOutputViewArr(cardEffectObj.once)
  }

  if (cardEffectObj.per_turn && cardEffectObj.per_turn.effect) {
    output.recurring = _getOutputViewArr(cardEffectObj.per_turn.effect)
    // TODO: Add the range of turns the recurring effect is active for
  }

  return output
}

const _getOutputViewArr = (obj) => {
  const output = []
  Object.keys(obj).forEach((groupKey) => {
    const groupContent = obj[groupKey]
    if (typeof groupContent === 'object') {
      // this is a group that has subitems.
      // go over the sub items
      Object.keys(groupContent).forEach((key) => {
        output.push({
          ...getScoreDisplayDetails(groupKey, key),
          value: groupContent[key]
        })
      })
    } else {
      // this is a direct item without a group
      output.push({
        ...getScoreDisplayDetails('', groupKey),
        value: groupContent
      })
    }
  })
  return output
}
</script>
