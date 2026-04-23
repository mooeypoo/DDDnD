<template>
  <Transition name="notice">
    <div v-if="isVisible" class="mobile-notice" role="status" aria-live="polite">
      <div class="notice-icon" aria-hidden="true">🖥️</div>
      <p class="notice-text">
        <strong>Better on desktop</strong> — this game was designed for larger screens, but is fully playable on mobile.
      </p>
      <button class="notice-dismiss" @click="dismiss" aria-label="Dismiss">×</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

/**
 * Session-scoped mobile UX notice shown on small screens once per tab session.
 */
const STORAGE_KEY = 'dddnd_mobile_notice_dismissed'
const isVisible = ref(false)

function dismiss() {
  isVisible.value = false
  sessionStorage.setItem(STORAGE_KEY, '1')
}

onMounted(() => {
  if (sessionStorage.getItem(STORAGE_KEY)) return
  if (!window.matchMedia('(max-width: 768px)').matches) return
  isVisible.value = true
})
</script>

<style scoped>
.mobile-notice {
  position: fixed;
  bottom: var(--space-lg);
  left: var(--space-md);
  right: var(--space-md);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  background: var(--surface-modal, #1a1a2e);
  border: 1px solid var(--border-accent, #a989fa55);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.notice-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
  line-height: 1.4;
}

.notice-text {
  flex: 1;
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary, #94a3b8);
  line-height: var(--leading-relaxed, 1.6);
}

.notice-text strong {
  color: var(--text-accent, #a989fa);
  font-weight: var(--font-semibold);
}

.notice-dismiss {
  background: none;
  border: none;
  color: var(--text-tertiary, #64748b);
  font-size: var(--text-2xl);
  cursor: pointer;
  padding: 0;
  line-height: 1;
  flex-shrink: 0;
  align-self: center;
  transition: color var(--transition-base);
}

.notice-dismiss:hover {
  color: var(--text-primary, #e2e8f0);
}

.notice-enter-active,
.notice-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.notice-enter-from,
.notice-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
