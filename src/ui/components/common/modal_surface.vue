<template>
  <div v-if="isOpen" class="modal-surface-overlay" @click="emit('close')">
    <section class="modal-surface" role="dialog" aria-modal="true" :aria-label="title" @click.stop>
      <header class="modal-surface-header">
        <h3 class="modal-surface-title">{{ title }}</h3>
        <button class="modal-surface-close" type="button" @click="emit('close')" aria-label="Close">×</button>
      </header>

      <div class="modal-surface-body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="modal-surface-footer">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    isOpen?: boolean
    title: string
  }>(),
  {
    isOpen: true
  }
)

const emit = defineEmits<{
  close: []
}>()
</script>

<style scoped>
.modal-surface-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl);
  background: var(--surface-overlay);
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.modal-surface {
  width: min(680px, 100%);
  max-height: min(88vh, 900px);
  overflow: auto;
  background: var(--surface-modal);
  border: 1px solid var(--border-accent);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-overlay);
}

.modal-surface-header,
.modal-surface-footer {
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-subtle);
}

.modal-surface-footer {
  border-bottom: none;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.modal-surface-body {
  padding: var(--space-xl);
  color: var(--text-primary);
}

.modal-surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
}

.modal-surface-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.modal-surface-close {
  border: 1px solid var(--border-subtle);
  background: var(--bg-inset);
  color: var(--text-secondary);
  border-radius: var(--radius-md);
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: var(--text-xl);
  line-height: 1;
  transition: all var(--transition-fast);
}

.modal-surface-close:hover {
  border-color: var(--border-focus);
  color: var(--text-bright);
  background: var(--bg-overlay);
}
</style>
