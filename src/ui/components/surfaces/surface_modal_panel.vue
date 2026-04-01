<template>
  <Transition name="surface-fade">
    <div
      v-if="isOpen"
      class="surface-overlay"
      @click="handleBackdropClick"
    >
      <section
        class="surface-modal"
        :class="[`size-${size}`]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.stop
      >
        <header class="surface-header">
          <h2 :id="titleId" class="surface-title">{{ title }}</h2>
          <button class="surface-close" type="button" :aria-label="closeLabel" @click="emit('close')">×</button>
        </header>

        <div class="surface-body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="surface-footer">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    size?: 'sm' | 'md' | 'lg'
    closeOnBackdrop?: boolean
    closeLabel?: string
  }>(),
  {
    size: 'md',
    closeOnBackdrop: true,
    closeLabel: 'Close panel',
  }
)

const emit = defineEmits<{
  close: []
}>()

const titleId = computed(() => `surface-modal-title-${props.title.toLowerCase().replace(/\s+/g, '-')}`)

function handleBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close')
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (props.isOpen && event.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.surface-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
  background: var(--surface-overlay);
  backdrop-filter: blur(4px);
}

.surface-modal {
  width: min(100%, 720px);
  max-height: 92vh;
  overflow: auto;
  border: 1px solid var(--border-panel);
  border-radius: var(--radius-2xl);
  background: var(--surface-modal);
  box-shadow: var(--shadow-overlay);
}

.surface-modal.size-sm {
  width: min(100%, 520px);
}

.surface-modal.size-lg {
  width: min(100%, 900px);
}

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-xl);
  border-bottom: 1px solid var(--border-subtle);
}

.surface-title {
  margin: 0;
  color: var(--text-bright);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
}

.surface-close {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-inset);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: var(--text-xl);
  line-height: 1;
}

.surface-close:hover {
  color: var(--text-bright);
  border-color: var(--border-focus);
}

.surface-body {
  padding: var(--space-xl);
  color: var(--text-primary);
}

.surface-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  padding: var(--space-lg) var(--space-xl);
  border-top: 1px solid var(--border-subtle);
}

.surface-fade-enter-active,
.surface-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}

.surface-fade-enter-from,
.surface-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .surface-overlay {
    padding: var(--space-md);
  }

  .surface-header,
  .surface-body,
  .surface-footer {
    padding: var(--space-lg);
  }
}
</style>
