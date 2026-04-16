<template>
  <Transition name="surface-fade">
    <div v-if="isOpen" class="surface-overlay" @click="handleBackdropClick">
      <aside
        ref="dialogRef"
        class="surface-side-panel"
        :class="[`side-${side}`]"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        @click.stop
        @keydown="handleDialogKeydown"
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
      </aside>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    side?: 'left' | 'right'
    closeOnBackdrop?: boolean
    closeLabel?: string
  }>(),
  {
    side: 'right',
    closeOnBackdrop: true,
    closeLabel: 'Close side panel',
  }
)

const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLElement | null>(null)
let lastActiveElement: HTMLElement | null = null

const titleId = computed(() => `surface-side-title-${props.title.toLowerCase().replace(/\s+/g, '-')}`)

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

function handleDialogKeydown(event: KeyboardEvent) {
  if (!props.isOpen || event.key !== 'Tab' || !dialogRef.value) {
    return
  }

  const focusable = dialogRef.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
  if (focusable.length === 0) {
    event.preventDefault()
    dialogRef.value.focus()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(
  () => props.isOpen,
  isOpen => {
    if (isOpen) {
      lastActiveElement = document.activeElement as HTMLElement | null
      nextTick(() => {
        if (!dialogRef.value) {
          return
        }
        const firstFocusable = dialogRef.value.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        ;(firstFocusable ?? dialogRef.value).focus()
      })
      return
    }

    if (lastActiveElement && typeof lastActiveElement.focus === 'function') {
      lastActiveElement.focus()
    }
    lastActiveElement = null
  },
  { immediate: true }
)

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.surface-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(2px);
  display: flex;
}

.surface-side-panel {
  width: min(100%, 420px);
  height: 100%;
  background: var(--dng-panel-surface);
  border-left: 1px solid var(--dng-divider);
  border-right: 1px solid var(--dng-divider);
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.surface-side-panel.side-right {
  margin-left: auto;
}

.surface-side-panel.side-left {
  margin-right: auto;
}

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--dng-divider);
}

.surface-title {
  margin: 0;
  color: var(--dng-title-gold);
  font-size: var(--text-lg);
}

.surface-close {
  width: 32px;
  height: 32px;
  border: 1px solid var(--dng-divider);
  border-radius: var(--radius-lg);
  background: rgba(13, 9, 4, 0.45);
  color: var(--dng-footer-muted);
  cursor: pointer;
}

.surface-body {
  flex: 1;
  overflow: auto;
  padding: var(--space-lg);
}

.surface-footer {
  border-top: 1px solid var(--dng-divider);
  padding: var(--space-md) var(--space-lg);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.surface-fade-enter-active,
.surface-fade-leave-active {
  transition: opacity var(--duration-base) var(--ease-standard);
}

.surface-fade-enter-from,
.surface-fade-leave-to {
  opacity: 0;
}
</style>
