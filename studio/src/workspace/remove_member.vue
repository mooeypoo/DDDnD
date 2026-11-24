<template>
  <!--
    Taking a member out of the scenario, or deleting the draft's own (D21).
    Says what goes with them before it happens.
  -->
  <div class="actions">
    <p v-if="lastSeat" class="field-hint">A council needs at least one member: seat someone else before taking {{ name || 'them' }} out.</p>
    <template v-else-if="!confirming">
      <button type="button" class="button button-quiet" @click="confirming = true">{{ own ? 'Delete this member' : 'Take them out of the scenario' }}</button>
    </template>
    <div v-else class="confirm" role="group" aria-label="Confirm">
      <p class="confirm-text">
        <template v-if="own">Delete “{{ name || 'this member' }}”? Their reactions go with them.</template>
        <template v-else>Take “{{ name }}” out? They won't take part. Any cards, events or reactions that change how they feel will do nothing; Notes, under Checks, will list them. The base game itself is unchanged.</template>
        <template v-if="affected.length && own"> {{ affected.length === 1 ? 'One of your own items' : `${affected.length} of your own items` }} ({{ affected.map((item) => item.name).join(', ') }}) will stop changing how they feel.</template>
      </p>
      <div class="confirm-buttons">
        <button type="button" class="button button-quiet" @click="confirming = false">{{ own ? 'Keep them' : 'Keep them seated' }}</button>
        <button type="button" class="button button-danger" @click="$emit('remove')">{{ own ? 'Delete' : 'Take them out' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { ownReactionsTo, type DraftPack } from '@/domains/authoring'
import type { VersionRef } from '@/domains/content/model'

const props = defineProps<{ draft: DraftPack; memberRef: VersionRef; name: string; own: boolean; lastSeat: boolean }>()
defineEmits<{ remove: [] }>()

const confirming = ref(false)
watch(() => props.memberRef.id, () => {
  confirming.value = false
})

/** The draft's own cards, events and reactions that name them, except their own reactions (those go too). */
const affected = computed(() => {
  const ownRules = new Set(props.own ? props.draft.content.stakeholders[props.memberRef.id]?.reaction_rule_refs.map((ref) => ref.id) : [])
  return ownReactionsTo(props.draft, props.memberRef.id).filter((item) => !(item.section === 'stakeholder_reaction_rules' && ownRules.has(item.id)))
})
</script>

<style scoped>
.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.actions > .button {
  align-self: flex-start;
}

.confirm {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  max-width: 44rem;
}

.confirm-text {
  margin: 0;
  color: var(--forge-text-bright);
}

.confirm-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
