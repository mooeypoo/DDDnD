<template>
  <!-- A pack's kind, by its one name (the domain's KIND_NAMES, M4.27) -->
  <span class="kind-pill" :class="kind === 'retelling' ? 'pill-retelling' : 'pill-topic'">{{ KIND_NAMES[kind] }}</span>
</template>

<script setup lang="ts">
import { KIND_NAMES, type DraftKind } from '@/domains/authoring'

defineProps<{ kind: DraftKind }>()
</script>
