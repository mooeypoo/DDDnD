<template>
  <v-dialog v-model="isTurnSummaryDialogOpen" width="auto">
    <v-card
      color="pink"
      title="Turn summary"
      max-width="400"
      prepend-icon="mdi-information-outline"
    >
      <v-card-item class="bg-surface-light py-4">
        <v-avatar
          v-for="effect in allEffectsArray()"
          :key="effect.key"
          color="primary"
          size="x-large"
        >
          32 <v-tooltip activator="parent">Tooltip</v-tooltip>
        </v-avatar>
      </v-card-item>
      <!-- <v-card-item class="bg-pink-darken-4 pt-0 pb-2">
          <span class="text-overline">Effects</span>
          <v-card-text class="bg-surface-light py-4">
            <v-table density="compact">
              <thead>
                <tr>
                  <td colspan="2" class="text-overline text-pink-lighten-2">One-time effect</td>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="immediate_effect in getEffectView(userCardDialogCardInfo.effect).once"
                  :key="immediate_effect.title"
                >
                  <td class="text-caption">
                    <span v-if="immediate_effect.group">{{
                      getScoreDisplayLabel('_groups', immediate_effect.group).title
                    }}</span>
                  </td>
                  <td class="text-caption">
                    <v-icon :icon="immediate_effect.icon.pos" class="mr-1"></v-icon
                    ><span>{{ immediate_effect.title }}</span>
                  </td>
                  <td class="text-caption">
                    <span>{{ immediate_effect.value }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
            <v-table density="compact" v-if="getEffectView(userCardDialogCardInfo.effect).recurring">
              <thead>
                <tr>
                  <td colspan="2" class="text-pink-lighten-2">
                    <span class="text-overline">Ongoing effect</span>&nbsp;
                    <span>({{ getEffectView(userCardDialogCardInfo.effect).num_turns }} turns)</span>
                  </td>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="ongoing_effect in getEffectView(userCardDialogCardInfo.effect).recurring"
                  :key="ongoing_effect.title"
                >
                  <td class="text-caption">
                    <span v-if="ongoing_effect.group">{{
                      getScoreDisplayLabel('_groups', ongoing_effect.group).title
                    }}</span>
                  </td>
                  <td class="text-caption">
                    <v-icon :icon="ongoing_effect.icon.pos" class="mr-1"></v-icon
                    ><span>{{ ongoing_effect.title }}</span>
                  </td>
                  <td class="text-caption">
                    <span>{{ ongoing_effect.value }}</span>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card-item> -->
    </v-card>
  </v-dialog>
</template>

<script setup>
import { gameDetails } from '@/use/gameDetails'
import { effectDetails } from '@/use/effectDetails'
import { Turns } from '@/use/system/Turns'

//   import { langHelper } from '@/use/langHelper'

//   const { getScoreDisplayLabel } = langHelper()
const { setupEffectStoreParams } = Turns()
const { isTurnSummaryDialogOpen, userCardChoices, userCardDetailsByName } = gameDetails()
const { getCardEffectView } = effectDetails()

const allEffects = () => {
  const result = { immediate: [], ongoing: [] }

  userCardChoices.forEach((cardName) => {
    // Get the entire card details object
    const details = userCardDetailsByName(cardName)

    // ugh it's what Turn does, take it from there

    // Show 'immediate' and 'per turn'
    if (details.effect.once) {
      //   setupEffectStoreParams('user', details.key, details.effect.once, 1).forEach((params) => {
      //     result.immediate.push({
      //       key: details.key + '',
      //       meta: {
      //         card_name: details.name,
      //         card_title: details.title,
      //         card_icon: details.icon,
      //         card_desc: details.short
      //       },
      //       effect_value: ''
      //     })
      //   })
    }
  })
}
</script>
