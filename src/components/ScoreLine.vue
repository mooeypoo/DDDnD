<template>
  <v-row>
    <v-col>{{ details }} </v-col>
  </v-row>
</template>

<script setup>
import { scoreDetails } from '@/use/scoreDetails'
const { scoreElementValue } = scoreDetails()

// This should identify the element in ViewManager and in the store
const props = defineProps(['group', 'element'])
const details = scoreElementValue(props.group, props.element)
</script>
