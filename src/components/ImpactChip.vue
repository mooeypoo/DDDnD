<template>
  <v-chip
    :size="size"
    variant="flat"
    :color="`${color}-darken-4`"
    class="mx-2"
    :prepend-icon="icon"
    :append-icon="arrowicon"
  >
    {{ fullLabel }}
    <v-tooltip v-if="tooltip" activator="parent" class="kode-mono-terminal">
      {{ tooltip }}
    </v-tooltip>
  </v-chip>
</template>

<script setup>
const props = defineProps(['size', 'label', 'tooltip', 'value', 'turns', 'icon', 'variant'])
const size = props.size || 'large'

const icon = props.value > 0 ? props.icon.pos : props.icon.neg
const arrowicon = props.value > 0 ? 'mdi-arrow-up-bold' : 'mdi-arrow-down-bold'
const color = props.value > 0 ? 'green' : 'red'

let fullLabel = `${props.label}: ${props.value}`

if (Array.isArray(props.turns)) {
  fullLabel += ` (${props.turns.join(' - ')} turns)`
} else if (props.turns > 1) {
  fullLabel += ` (${props.turns} turns)`
}
</script>
