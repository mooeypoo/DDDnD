<template>
  <span class="badge" :class="badgeClass">
    <span class="badge__dot" aria-hidden="true" />
    <span class="badge__text">{{ normalizedStatus }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
}>()

const normalizedStatus = computed(() => {
  const status = String(props.status || '').toLowerCase()
  if (status === 'warn') {
    return 'warning'
  }
  if (status === 'pass' || status === 'warning' || status === 'critical') {
    return status
  }
  return 'info'
})

const badgeClass = computed(() => `badge--${normalizedStatus.value}`)
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-panel);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-size: 0.72rem;
  font-weight: var(--font-semibold);
}

.badge__dot {
  width: 0.46rem;
  height: 0.46rem;
  border-radius: 999px;
  background: currentColor;
}

.badge--pass {
  color: var(--effect-positive);
  border-color: rgba(52, 211, 153, 0.35);
  background: rgba(52, 211, 153, 0.1);
}

.badge--warning {
  color: var(--effect-warning);
  border-color: rgba(251, 191, 36, 0.35);
  background: rgba(251, 191, 36, 0.1);
}

.badge--critical {
  color: var(--effect-negative);
  border-color: rgba(248, 113, 113, 0.35);
  background: rgba(248, 113, 113, 0.1);
}

.badge--info {
  color: var(--effect-neutral);
  border-color: rgba(96, 165, 250, 0.35);
  background: rgba(96, 165, 250, 0.1);
}
</style>
