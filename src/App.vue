<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" permanent width="80">
      <div class="d-flex justify-center pa-4">
        <v-avatar image="./images/logo-small.png" />
      </div>

      <!-- <v-btn class="text-none" size="x-small" stacked tile variant="text" width="80">
        <v-badge content="39" floating>
          <v-icon>mdi-account-circle</v-icon>
        </v-badge>

        <div class="mt-1">Friends</div>
      </v-btn> -->
      <v-btn
        class="text-none mb-2"
        prepend-icon="mdi-help-circle-outline"
        size="x-small"
        stacked
        text="Instructions"
        tile
        variant="text"
        width="80"
        @click="toggleInstructionDialog"
      />
      <v-btn
        v-if="isGameActive"
        class="text-none"
        prepend-icon="mdi-autorenew"
        size="x-small"
        stacked
        text="Restart"
        tile
        variant="text"
        width="80"
        @click="toggleResetDialog"
      />
      <!-- <template #append>
        <div class="d-flex justify-center pa-4">
          <v-btn icon variant="text" href="https://moriel.tech">
            <v-avatar image="/images/moriel-150px.jpg" />
          </v-btn>
        </div>
      </template> -->
    </v-navigation-drawer>

    <v-app-bar :elevation="2" title="DDDnD">
      <template #prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer" />
      </template>
      <v-spacer />
      <template #append>
        <span v-if="isGameActive" class="px-2">{{ vUsername }}</span>
        <v-spacer v-if="isGameActive" />
        <v-avatar v-if="isGameActive" :image="userAvatarPath" />
      </template>
    </v-app-bar>

    <v-main>
      <v-container>
        <RouterView />
      </v-container>
      <!-- <div class="pa-4">
        <h2 class="text-h4 font-weight-bold mb-4">Dashboard</h2>

        <v-sheet border="dashed md" color="surface-light" height="500" rounded="lg" width="100%" />
      </div> -->
    </v-main>
    <InstructionsDialog />
    <ResetConfirmationDialog @resetComplete="$router.push({ name: 'home' })" />
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
// import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'
import InstructionsDialog from '@/components/InstructionsDialog.vue'
import ResetConfirmationDialog from '@/components/ResetConfirmationDialog.vue'
import { userDetails } from '@/use/userDetails'
import { gameDetails } from '@/use/gameDetails'

const { toggleInstructionDialog, toggleResetDialog, isGameActive } = gameDetails()

const { userAvatarPath, vUsername } = userDetails()
const drawer = ref(true)
</script>

<style scoped></style>
