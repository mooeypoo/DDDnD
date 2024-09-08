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
      <v-card-item class="bg-pink-darken-4 pt-0 pb-2">
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
                v-for="immediate_effect in getCardEffectView(userCardDialogCardInfo.effect).once"
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
          <v-table
            density="compact"
            v-if="getCardEffectView(userCardDialogCardInfo.effect).recurring"
          >
            <thead>
              <tr>
                <td colspan="2" class="text-pink-lighten-2">
                  <span class="text-overline">Ongoing effect</span>&nbsp;
                  <span
                    >({{ getCardEffectView(userCardDialogCardInfo.effect).num_turns }} turns)</span
                  >
                </td>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="ongoing_effect in getCardEffectView(userCardDialogCardInfo.effect).recurring"
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
import { effectDetails } from '@/use/effectDetails'
import { langHelper } from '@/use/langHelper'

const { getScoreDisplayLabel } = langHelper()
const { isUserCardInfoDialogOpen, userCardDialogCardInfo, toggleUserCardDialog, cardDefinition } =
  gameDetails()
const { getCardEffectView } = effectDetails()
</script>
