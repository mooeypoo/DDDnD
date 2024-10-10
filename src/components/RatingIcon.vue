<template>
  <v-avatar :size="size" :color="bgcolor" class="mr-1"
    ><v-icon :size="iconSize" :color="color">{{ icon }}</v-icon></v-avatar
  >
</template>

<script setup>
import { ref, watch } from 'vue'
const props = defineProps(['state', 'size', 'icon'])
const size = props.size || 'x-small'
const icon = props.icon || 'mdi-sword'

let iconSize = props.size || 'x-small'
if (!isNaN(size)) {
  iconSize = size - 4
}

let bgcolor = ref('grey-darken-4')
let color = ref('grey-darken-2')

const update = () => {
  if (props.state === 'active') {
    bgcolor.value = 'orange-darken-4'
    color.value = 'yellow'
  } else if (props.state === 'partial') {
    bgcolor.value = 'grey-darken-2'
    color.value = 'yellow-darken-2'
  } else {
    // "Off" state
    bgcolor.value = 'grey-darken-4'
    color.value = 'grey-darken-2'
  }
}

watch(
  () => props.state,
  () => {
    update()
  },
  { immediate: true }
)
</script>
