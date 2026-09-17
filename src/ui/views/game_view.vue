<template>
  <PlaySession v-if="useWarTable" />
  <LegacyGameView v-else />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import PlaySession from '@/ui/play/play_session.vue'
import LegacyGameView from '@/ui/views/legacy_game_view.vue'
import { isWarTableEnabled } from '@/ui/play/use_war_table_flag'

/**
 * `/game` play-shell switch.
 *
 * Defaults to the war table. `?stage=legacy` restores the satchel stage.
 */
const route = useRoute()
const useWarTable = computed(() => isWarTableEnabled(route.query.stage))
</script>
