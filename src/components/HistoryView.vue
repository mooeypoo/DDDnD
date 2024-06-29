<template>
  <v-card class="mx-auto mt-4" max-width="500">
    <v-card-item class="bg-orange-darken-4">
      <v-card-title> Your adventure </v-card-title>
    </v-card-item>

    <v-divider></v-divider>

    <v-virtual-scroll :items="getLastTenEntries" height="300" item-height="50">
      <template v-slot:default="{ item }">
        <v-list-item>
          <template v-slot:prepend>
            <v-avatar :color="item.color" class="text-white" size="40">
              {{ item.initials }}
            </v-avatar>
          </template>

          <v-list-item-title>{{ item.fullName }}</v-list-item-title>

          <template v-slot:append>
            <v-btn size="small" variant="tonal">
              View User

              <v-icon color="orange-darken-4" end> mdi-open-in-new </v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </template>
    </v-virtual-scroll>
  </v-card>
</template>

<script setup>
import { historyDetails } from '@/use/historyDetails'

const { getLastTenEntries } = historyDetails()
</script>
