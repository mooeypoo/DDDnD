<template>
  <div class="editor">
    <div class="editor-head">
      <span class="editor-kicker">Scenario</span>
      <h1 class="editor-title">{{ scenario.name || 'Untitled scenario' }}</h1>
    </div>

    <section class="editor-section" aria-labelledby="scenario-story">
      <h2 id="scenario-story" class="editor-section-title">The story</h2>
      <label class="field">Name
        <input :value="scenario.name" :maxlength="limits.text.name" @input="set({ name: text($event) })" />
      </label>
      <label class="field">One-line summary
        <input :value="scenario.short_description ?? ''" :maxlength="limits.text.short_description" @input="setOptional('short_description', text($event))" />
        <span class="field-hint">Shown on the adventure's card at the table.</span>
      </label>
      <label class="field">The situation
        <textarea :value="scenario.description" rows="4" :maxlength="limits.text.description" @input="set({ description: text($event) })"></textarea>
        <span class="field-hint">What the player walks into: the system, the pressure, what's at stake.</span>
      </label>
      <label class="field">Flavor (optional)
        <input :value="scenario.flavor_text ?? ''" :maxlength="limits.text.flavor_text" @input="setOptional('flavor_text', text($event))" />
      </label>
    </section>

    <section class="editor-section" aria-labelledby="scenario-start">
      <h2 id="scenario-start" class="editor-section-title">How it starts</h2>
      <label class="field field-short">Turns
        <input type="number" :value="scenario.max_turns" :min="limits.numbers.max_turns.min" :max="limits.numbers.max_turns.max" step="1" @change="setTurns($event)" />
      </label>
      <fieldset class="scores">
        <legend class="field">Starting health, 0 to 100</legend>
        <div class="score-grid">
          <label v-for="ref in scenario.score_refs" :key="ref.id" class="field">
            {{ scoreNames[ref.id] ?? ref.id }}
            <input type="number" min="0" max="100" step="1" :value="scenario.starting_scores[ref.id] ?? 0" @change="setScore(ref.id, $event)" />
          </label>
        </div>
      </fieldset>
      <p class="field-hint">
        The copy starts with the original's numbers, so it plays exactly like it. Changing the turns or the starting health
        changes how hard it is; the balance lab (a later release) will show by how much.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Scenario } from '@/domains/content/model'
import { CONTENT_LIMITS } from '@/domains/content/validation/content_limits'

const props = defineProps<{ scenario: Scenario; scoreNames: Record<string, string> }>()
const emit = defineEmits<{ change: [scenario: Scenario] }>()

const limits = CONTENT_LIMITS

function text(event: Event): string {
  return (event.target as HTMLInputElement | HTMLTextAreaElement).value
}

function set(fields: Partial<Scenario>) {
  emit('change', { ...props.scenario, ...fields })
}

/** Optional text: an empty field removes it, so the file stays tidy. */
function setOptional(field: 'short_description' | 'flavor_text', value: string) {
  const next = { ...props.scenario }
  if (value.trim()) next[field] = value
  else delete next[field]
  emit('change', next)
}

function wholeNumber(event: Event, min: number, max: number): number | null {
  const parsed = Number.parseInt((event.target as HTMLInputElement).value, 10)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : null
}

function setTurns(event: Event) {
  const turns = wholeNumber(event, limits.numbers.max_turns.min, limits.numbers.max_turns.max)
  if (turns !== null) set({ max_turns: turns })
}

function setScore(scoreId: string, event: Event) {
  const value = wholeNumber(event, 0, 100)
  if (value !== null) set({ starting_scores: { ...props.scenario.starting_scores, [scoreId]: value } })
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.editor-kicker {
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--forge-text-secondary);
}

.editor-title {
  font-size: 1.875rem;
  font-weight: 600;
  color: var(--forge-gold);
}

.field-short {
  max-width: 8rem;
}

.scores {
  margin: 0;
  padding: 0;
  border: none;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.75rem;
  margin-top: 0.5rem;
}
</style>
