<template>
  <div class="editor">
    <div class="editor-head">
      <div class="editor-head-text">
        <span class="editor-kicker">Pack</span>
        <h1 class="editor-title">Pack details</h1>
      </div>
    </div>

    <section class="editor-section" aria-labelledby="details-players">
      <h2 id="details-players" class="editor-section-title">What players see</h2>
      <label class="field">Pack name
        <input :value="draft.name" maxlength="80" @input="update({ name: value($event) })" />
      </label>
      <label class="field">Description
        <textarea :value="draft.description" rows="3" maxlength="500" @input="update({ description: value($event) })"></textarea>
        <span class="field-hint">Shown in the bazaar and on the review before a player imports your pack.</span>
      </label>
      <label class="field">Your name, as the author
        <input :value="draft.authors[0]?.name ?? ''" maxlength="80" autocomplete="name" @input="updateAuthor(value($event))" />
        <span class="field-hint">Players see it next to the pack. Every pack needs one.</span>
      </label>
    </section>

    <section class="editor-section" aria-labelledby="details-license">
      <h2 id="details-license" class="editor-section-title">License</h2>
      <div class="license-choices" role="radiogroup" aria-labelledby="details-license">
        <label v-for="choice in licenses" :key="choice.id" class="license-choice">
          <input type="radio" name="license" :checked="choice.id === license.id" @change="emit('change', withLicense(draft, choice.id))" />
          <span class="license-text">
            <span class="license-id">{{ choice.id }}<template v-if="choice.same_as_game">, like the game</template></span>
            <span class="field-hint">{{ choice.words }}</span>
          </span>
        </label>
      </div>
      <p class="field-hint">
        Packs that build on DDDnD's base game use the GPL, like the game. Players see the license before they import your pack.
        Changing it after an export makes the next export a new version.
      </p>
    </section>

    <section class="editor-section" aria-labelledby="details-ids">
      <h2 id="details-ids" class="editor-section-title">Behind the scenes</h2>
      <label class="field">Prefix for new content
        <input :value="draft.prefix" maxlength="16" spellcheck="false" @change="update({ prefix: value($event) })" />
        <span class="field-hint">
          The Studio names everything you create with this, such as <code>{{ draft.prefix }}_your_card</code>,
          so it never clashes with the game's content. Changing it affects only what you create next.
        </span>
      </label>
      <p class="facts">
        Exports as <strong>{{ draft.prefix }}</strong>, an extension of DDDnD's base game.
        <template v-if="release.state !== 'never'">{{ release.imported ? 'Imported' : 'Last exported' }} as version <strong>{{ release.version }}</strong>.</template>
        <template v-else>Not exported yet.</template>
        You choose the version when you export.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { draftLicense, licenseChoices, releaseState, updateDraftDetails, withLicense, type DraftPack } from '@/domains/authoring'

const props = defineProps<{ draft: DraftPack }>()
const emit = defineEmits<{ change: [draft: DraftPack] }>()
const license = computed(() => draftLicense(props.draft))
const release = computed(() => releaseState(props.draft))
const licenses = licenseChoices()

function value(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function update(details: Parameters<typeof updateDraftDetails>[1]) {
  emit('change', updateDraftDetails(props.draft, details))
}

function updateAuthor(name: string) {
  const rest = props.draft.authors.slice(1)
  update({ authors: name.trim() ? [{ ...props.draft.authors[0], name }, ...rest] : rest })
}
</script>

<style scoped>
.license-choices {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.license-choice {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  cursor: pointer;
}

.license-choice input {
  flex: none;
  width: 1.125rem;
  height: 1.125rem;
  margin-top: 0.2rem;
  accent-color: var(--forge-gold);
}

.license-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.license-id {
  color: var(--forge-text-bright);
  font-weight: 500;
}




.facts {
  margin: 0;
  font-size: 0.875rem;
  color: var(--forge-text-secondary);
}

.facts strong {
  color: var(--forge-text);
}

code {
  font-family: var(--forge-font-mono);
  font-size: 0.85em;
  color: var(--forge-text);
}
</style>
