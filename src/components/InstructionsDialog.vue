<template>
  <v-dialog width="auto" max-width="600" v-model="isInstructionDialogOpen">
    <v-card :prependAvater="userAvatarPath" color="indigo">
      <template v-slot:title>
        <span>Game instructions</span>
      </template>
      <v-card-text class="pa-4 bg-surface" v-if="vUsername">
        Hello, <span class="text-red-lighten-1">{{ vUsername }}</span
        >, the <span class="text-red-lighten-1">{{ randomUserDescriptor }}</span> Domain-Driven
        Design <span class="text-red-lighten-1">{{ vUserChar }}</span
        >!
      </v-card-text>
      <v-card-text class="py-4 px-4 m-0 bg-surface">
        You have been hired at <span class="text-green-lighten-1">The Company</span> to transform
        their technical systems. Your goal is to evolve the architecture to make the system more
        <span class="text-blue-lighten-1">performant</span>,
        <span class="text-blue-lighten-1">modular</span>, and
        <span class="text-blue-lighten-1">stable</span>.
      </v-card-text>
      <v-card-text class="text-h5 px-4 py-2 bg-surface">Turns</v-card-text>

      <v-card-actions class="justify-end bg-surface">
        <v-btn text="Close" @click="toggleInstructionDialog"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { watch, ref } from 'vue'
import { userDetails } from '@/use/userDetails'
import { gameDetails } from '@/use/gameDetails'

const { userAvatarPath, vUsername, vUserChar } = userDetails()
const { toggleInstructionDialog, isInstructionDialogOpen } = gameDetails()

// Random descriptor
const userDescriptorList = [
  'magnificent',
  'wonderful',
  'amazing',
  'incredible',
  'wonderous',
  'brave',
  'valiant',
  'incredible'
]
const randomizeDescriptor = () =>
  userDescriptorList[Math.floor(Math.random() * userDescriptorList.length)]
const randomUserDescriptor = ref(randomizeDescriptor())

watch(isInstructionDialogOpen, (val) => {
  if (!val) return
  randomUserDescriptor.value = randomizeDescriptor()
})
</script>
