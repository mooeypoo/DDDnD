<template>
  <!--
    The confirmation before a member leaves (D21): taking one of the game's
    out of this pack, or deleting the draft's own. Says what goes with them.
    The member page owns the button that opens it.
  -->
  <div class="confirm" role="group" aria-label="Confirm">
    <p class="confirm-text">
      <template v-if="own">Delete “{{ name || 'this member' }}”? Their reactions go with them.</template>
      <template v-else>Take “{{ name }}” out of this pack? They won't take part. Any cards, events or reactions that change how they feel will do nothing, and the checks will note them. The game's original stays as it is.</template>
      <template v-if="affected.length && own"> {{ affected.length === 1 ? 'One of your own items' : `${affected.length} of your own items` }} ({{ affected.map((item) => item.name).join(', ') }}) will stop changing how they feel.</template>
    </p>
    <button type="button" class="button button-quiet" @click="$emit('cancel')">Keep them</button>
    <button type="button" class="button button-danger" @click="$emit('remove')">{{ own ? 'Delete' : 'Take them out' }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { ownItemsNamingAfterRemoval, type DraftPack } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'

const props = defineProps<{ draft: DraftPack; memberRef: VersionRef; name: string; own: boolean }>()
defineEmits<{ remove: []; cancel: [] }>()

/** The draft's own cards, events and reactions that name them and stay. */
const affected = computed(() => ownItemsNamingAfterRemoval(props.draft, props.memberRef))
</script>
