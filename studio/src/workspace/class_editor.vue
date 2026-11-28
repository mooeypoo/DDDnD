<template>
  <!--
    One of a topic's own classes (M4.19): who a player can be at the table.
    A favourite score gets +1 every turn; no favourite fits any table. The
    rules are the domain's (play_rules.ts).
  -->
  <div v-if="playerClass" class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Class · {{ ownWord() }}</span>
        <h1 class="editor-title">{{ playerClass.name || 'Unnamed class' }}</h1>
      </div>
      <div class="head-actions">
        <button v-if="!confirming" type="button" class="button button-danger" :disabled="!deletion.ok" @click="confirming = true">Delete</button>
      </div>
      <p v-if="!deletion.ok" class="field-hint head-confirm">{{ deletion.reason }}</p>
      <div v-if="confirming" class="head-confirm confirm" role="group" aria-label="Confirm">
        <p class="confirm-text">Delete “{{ playerClass.name || 'this class' }}”? Players can't choose it any more.</p>
        <button type="button" class="button button-quiet" @click="confirming = false">Keep it</button>
        <button type="button" class="button button-danger" @click="remove">Delete</button>
      </div>
    </div>

    <p v-if="missing.length" class="to-fill-in" role="note"><span class="to-fill-in-dot" aria-hidden="true"></span>To fill in: {{ missing.join(' and ') }}. Fine while you work; the pack needs them before you export.</p>

    <section class="editor-section" aria-labelledby="class-words">
      <h2 id="class-words" class="editor-section-title">What players read</h2>
      <label class="field">Name
        <input data-field="name" :value="playerClass.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" />
        <span class="field-hint">Who the player is at the table: "Pager Paladin", "Signal Seer".</span>
      </label>
      <label class="field">Who they are, in a sentence
        <textarea data-field="description" :value="playerClass.description" rows="2" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
      </label>
      <label class="field">Flavor (optional)
        <input data-field="flavor_text" :value="playerClass.flavor_text ?? ''" :maxlength="limits.text.flavor_text" @input="emitChange(withOptionalText(playerClass, 'flavor_text', text($event)))" />
      </label>
    </section>

    <section class="editor-section" aria-labelledby="class-favourite">
      <h2 id="class-favourite" class="editor-section-title">Favourite score</h2>
      <label class="field field-short">Favourite score
        <select data-field="score_affinity" :value="playerClass.score_affinity ?? ''" @change="setFavourite(($event.target as HTMLSelectElement).value)">
          <option value="">None</option>
          <option v-for="option in scoreOptions" :key="option.id" :value="option.id">{{ option.name }}</option>
        </select>
      </label>
      <p class="plain"><span class="plain-lead">In plain words:</span> {{ describeClass(playerClass, names) }}.</p>
      <p class="field-hint">A class plays every card the same way; its favourite score just gets a little every turn. Classes with different favourites make different runs.</p>
    </section>
  </div>
  <p v-else class="loading" role="status">That class isn't in this pack.</p>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { classDeletion, describeClass, putContent, removeOwnClass, setClassFavourite, toFillIn, withOptionalText, type DraftPack } from '@/domains/authoring'
import type { PlayerClass } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'
import { ownWord } from '@studio/state/studio_state'

interface Option { id: string; name: string }

const props = defineProps<{ draft: DraftPack; classId: string; scoreOptions: Option[] }>()
const emit = defineEmits<{ change: [draft: DraftPack]; removed: [] }>()

const limits = CONTENT_LIMITS
const confirming = ref(false)
watch(() => props.classId, () => {
  confirming.value = false
})

const playerClass = computed(() => props.draft.content.classes[props.classId] as PlayerClass | undefined)
const deletion = computed(() => classDeletion(props.draft, props.classId))
const names = computed(() => ({ scores: Object.fromEntries(props.scoreOptions.map((option) => [option.id, option.name])) }))
const missing = computed(() => {
  const entry = toFillIn(props.draft).find((item) => item.section === 'classes' && item.ref.id === props.classId)
  return (entry?.missing ?? []).map((part) => (part === 'name' ? 'a name of its own' : 'who they are, in a sentence'))
})

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function emitChange(next: PlayerClass) {
  emit('change', putContent(props.draft, 'classes', next))
}

function set(patch: Partial<PlayerClass>) {
  if (playerClass.value) emitChange({ ...playerClass.value, ...patch })
}

function setFavourite(scoreId: string) {
  emit('change', setClassFavourite(props.draft, props.classId, scoreId || null))
}

function remove() {
  emit('change', removeOwnClass(props.draft, props.classId))
  emit('removed')
}
</script>

<style scoped>
.field-short select {
  min-height: 2.5rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(160, 112, 24, 0.5);
  background: var(--forge-ground);
  color: var(--forge-text-bright);
  font: inherit;
}

.field-short {
  max-width: 18rem;
}
</style>
