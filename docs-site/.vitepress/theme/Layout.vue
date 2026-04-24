<template>
  <component :is="layout">
    <template v-for="(_, name) in $slots" #[name]="slotData">
      <slot :name="name" v-bind="slotData || {}" />
    </template>
  </component>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'

const layout = DefaultTheme.Layout
</script>
