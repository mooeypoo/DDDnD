<template>
  <section class="surface-frame" :class="variantClass">
    <header v-if="title || $slots.headerActions" class="frame-header">
      <div>
        <h3 v-if="title" class="frame-title">{{ title }}</h3>
        <p v-if="subtitle" class="frame-subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.headerActions" class="frame-header-actions">
        <slot name="headerActions" />
      </div>
    </header>

    <div class="frame-body">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="frame-footer">
      <slot name="footer" />
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    variant?: 'default' | 'soft' | 'emphasis'
  }>(),
  {
    variant: 'default',
  }
)

const variantClass = computed(() => `variant-${props.variant}`)
</script>

<style scoped>
.surface-frame {
  border: 1px solid var(--border-panel);
  border-radius: var(--radius-2xl);
  background: var(--surface-panel);
  box-shadow: var(--shadow-panel);
}

.surface-frame.variant-soft {
  background: var(--bg-secondary);
  border-color: var(--border-subtle);
}

.surface-frame.variant-emphasis {
  border-color: var(--border-accent);
}

.frame-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-md) var(--space-lg);
}

.frame-title {
  margin: 0;
  color: var(--text-bright);
  font-size: var(--text-base);
}

.frame-subtitle {
  margin: var(--space-xs) 0 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
}

.frame-body {
  padding: var(--space-lg);
}

.frame-footer {
  border-top: 1px solid var(--border-subtle);
  padding: var(--space-md) var(--space-lg);
}
</style>
