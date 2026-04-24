<template>
  <div class="metric">
    <div class="metric__header">
      <span class="metric__label">{{ label }}</span>
      <span class="metric__value">{{ displayValue }}</span>
    </div>
    <div class="metric__track" role="presentation">
      <div class="metric__fill" :style="{ width: `${clampedPercent}%` }" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: number
  max?: number
  suffix?: string
}>()

const maxValue = computed(() => (props.max && props.max > 0 ? props.max : 100))
const clampedPercent = computed(() => {
  const pct = (props.value / maxValue.value) * 100
  return Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0))
})

const displayValue = computed(() => `${props.value.toFixed(1)}${props.suffix ?? ''}`)
</script>

<style scoped>
.metric {
  display: grid;
  gap: 0.35rem;
}

.metric__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}

.metric__label {
  color: var(--text-primary);
  font-size: 0.9rem;
}

.metric__value {
  color: var(--text-bright);
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
}

.metric__track {
  width: 100%;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.metric__fill {
  height: 100%;
  background: linear-gradient(90deg, var(--metric-domain-clarity), var(--text-accent));
  transition: width 220ms ease;
}
</style>
