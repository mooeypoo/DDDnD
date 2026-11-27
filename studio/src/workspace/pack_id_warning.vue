<template>
  <!--
    The pack's id changed since its last export (M4.23): to players that's a
    different pack. Shown on pack details, where the prefix is changed, and
    on the export page, where it would take effect. The domain's
    packIdChange decides; this only says it and offers to change it back.
  -->
  <div v-if="change" class="nudge pack-id-warning" role="note">
    <p><strong>This exports as a different pack.</strong> {{ words }}</p>
    <button type="button" class="button button-quiet" @click="$emit('change', keepReleasedPackId(draft))">Change it back to “{{ change.released }}”</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { describePackIdChange, keepReleasedPackId, packIdChange, type DraftPack } from '@/domains/authoring'

const props = defineProps<{ draft: DraftPack }>()
defineEmits<{ change: [draft: DraftPack] }>()

const change = computed(() => packIdChange(props.draft))
const words = computed(() => (change.value ? describePackIdChange(change.value, props.draft.released?.version ?? '') : ''))
</script>

<style scoped>
.pack-id-warning {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.625rem;
}

.pack-id-warning p {
  margin: 0;
  line-height: 1.55;
}
</style>
