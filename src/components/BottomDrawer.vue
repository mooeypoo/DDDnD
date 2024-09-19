<template>
  <v-navigation-drawer location="bottom" v-model="drawer" temporary>
    <v-card :color="color">
      <v-card-title @click.stop="drawer = !drawer"> {{ title }} </v-card-title>
    </v-card>
    <v-card>
      <v-card-item>
        <slot></slot>
      </v-card-item>
    </v-card>
  </v-navigation-drawer>
  <!-- Trigger -->
  <v-navigation-drawer location="bottom" permanent>
    <v-card :color="color">
      <v-card-title @click.stop="drawer = !drawer">{{ title }}</v-card-title>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps(['title', 'color'])
const color = props.color || 'pink'

const drawer = ref(false)
</script>
