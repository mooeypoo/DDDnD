<template>
  <!-- <v-btn :size="size" text="+5" variant="flat" color="red-darken-4" prepend-icon="mdi-sticker">
    <v-badge color="green-darken-4" content="9"> </v-badge>
  </v-btn> -->
  <v-chip
    :size="size"
    variant="flat"
    :color="`${color}-darken-4`"
    class="mx-2"
    :prepend-icon="icon"
    :append-icon="arrowicon"
  >
    {{ label }}: {{ value }}
    <!-- <v-tooltip activator="parent" class="kode-mono-terminal"
      >{{ cardTitle }}: {{ value }}</v-tooltip
    > -->
  </v-chip>
</template>

<script setup>
const props = defineProps(['size', 'label', 'value', 'icon', 'variant'])
const size = props.size || 'large'

const icon = props.value > 0 ? props.icon.pos : props.icon.neg
const arrowicon = props.value > 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'
const color = props.value > 0 ? 'green' : 'red'
</script>
