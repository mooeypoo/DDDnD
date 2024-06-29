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
        class="bg-surface-light pt-4 pb-0"
        v-html="userCardDialogCardInfo.long"
      ></v-card-text>
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
const { isUserCardInfoDialogOpen, userCardDialogCardInfo, toggleUserCardDialog } = gameDetails()
</script>
