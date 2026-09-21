<template>
  <p v-if="loading" class="meta muted">Loading audit meta...</p>
  <p v-else-if="error" class="meta muted">{{ error }}</p>
  <p v-else class="meta">
    Player-true bots · {{ runCount }} runs per adventure · seed {{ seed }}
    <span v-if="generatedAt"> · generated {{ generatedAt }}</span>
  </p>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { withBase } from 'vitepress'

const loading = ref(true)
const error = ref<string | null>(null)
const runCount = ref<number | string>('n/a')
const seed = ref('n/a')
const generatedAt = ref('')

onMounted(async () => {
  try {
    const response = await fetch(withBase('/data/audit-report.json'))
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = await response.json()
    runCount.value = payload.meta?.run_count ?? 'n/a'
    seed.value = payload.meta?.seed ?? 'n/a'
    generatedAt.value = payload.meta?.generated_at
      ? new Date(payload.meta.generated_at).toISOString().slice(0, 10)
      : ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.meta {
  margin: 0 0 var(--space-4);
  font-size: 1rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.muted {
  color: var(--text-secondary);
}
</style>
