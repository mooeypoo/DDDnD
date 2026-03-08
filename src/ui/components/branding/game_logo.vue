<template>
  <div class="game-logo" :class="sizeClass">
    <LogoSigil :size="sigilSize" />
    <div class="logo-text">
      <div class="logo-title">DDDnD</div>
      <div class="logo-subtitle">Domain-Driven Design n' Dragons</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import LogoSigil from './logo_sigil.vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium'
})

const sizeClass = computed(() => `size-${props.size}`)

const sigilSize = computed(() => {
  if (props.size === 'small') return 'small'
  if (props.size === 'large') return 'large'
  return 'medium'
})
</script>

<style scoped>
.game-logo {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xs);
}

.logo-title {
  font-family: var(--font-display);
  font-weight: 700;
  color: var(--text-bright);
  letter-spacing: 0.05em;
  line-height: 1;
}

.logo-subtitle {
  font-family: var(--font-body);
  font-weight: 400;
  color: var(--text-secondary);
  line-height: 1.2;
}

/* Size variations */
.game-logo.size-small .logo-title {
  font-size: var(--text-lg);
}

.game-logo.size-small .logo-subtitle {
  font-size: var(--text-2xs);
}

.game-logo.size-medium .logo-title {
  font-size: var(--text-2xl);
}

.game-logo.size-medium .logo-subtitle {
  font-size: var(--text-xs);
}

.game-logo.size-large .logo-title {
  font-size: var(--text-4xl);
}

.game-logo.size-large .logo-subtitle {
  font-size: var(--text-sm);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .game-logo {
    gap: var(--space-sm);
  }
  
  .game-logo.size-medium .logo-title {
    font-size: var(--text-xl);
  }
  
  .game-logo.size-medium .logo-subtitle {
    font-size: var(--text-2xs);
  }
  
  .game-logo.size-large .logo-title {
    font-size: var(--text-3xl);
  }
  
  .game-logo.size-large .logo-subtitle {
    font-size: var(--text-xs);
  }
}
</style>
