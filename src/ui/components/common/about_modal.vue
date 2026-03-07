<template>
  <div v-if="isOpen" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h2>About DDDnD</h2>
      <!-- TODO: Add game description -->
      <!-- TODO: Add credits -->
      <button @click="close">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

function close() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  /* TODO: Add modal styles */
}

.modal-content {
  /* TODO: Add modal content styles */
}
</style>
