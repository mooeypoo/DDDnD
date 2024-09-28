<template>
  <v-avatar :size="size" :color="bgcolor" class="mr-1"
    ><v-icon :size="iconSize" :color="color">{{ icon }}</v-icon></v-avatar
  >
</template>

<script setup>
const props = defineProps(['state', 'size', 'icon'])
const size = props.size || 'x-small'
const icon = props.icon || 'mdi-sword'

let iconSize = props.size || 'x-small'
if (!isNaN(size)) {
  iconSize = size - 4
}

let bgcolor = 'grey-darken-4'
let color = 'grey-darken-2'

if (props.state === 'active') {
  bgcolor = 'orange-darken-4'
  color = 'yellow'
} else if (props.state === 'partial') {
  bgcolor = 'grey-darken-2'
  color = 'yellow-darken-2'
}
</script>
