<template>
  <!--
    The guided round's own panels (§5), for the steps that have no editor of
    their own yet: writing the first card or event, checking, playing.
    Everything else in the round is the workspace's editors.
  -->
  <section class="editor" :aria-labelledby="`round-${step}`">
    <template v-if="step === 'cards' || step === 'surprises'">
      <div class="editor-head">
        <div class="editor-head-text">
          <span class="editor-kicker">Guided round</span>
          <h1 :id="`round-${step}`" class="editor-title">{{ step === 'cards' ? 'Your first card' : 'Your first surprise' }}</h1>
        </div>
      </div>
      <p class="field-hint">{{ step === 'cards' ? 'Think of a meeting where your team argued about what to do next. What did someone propose?' : 'Think of a week that went sideways, or one that went better than anyone planned.' }}</p>
      <button type="button" class="button button-primary start" @click="$emit('createNew', step === 'cards' ? 'cards' : 'events')">{{ step === 'cards' ? 'Write a card' : 'Write an event' }}</button>
    </template>

    <!-- A topic's first score or ending (§5): made from here, then the workspace's editor -->
    <template v-else-if="step === 'scores' || step === 'endings'">
      <div class="editor-head">
        <div class="editor-head-text">
          <span class="editor-kicker">Guided round</span>
          <h1 :id="`round-${step}`" class="editor-title">{{ step === 'scores' ? 'Your first score' : 'Your first ending' }}</h1>
        </div>
      </div>
      <p class="field-hint">{{ step === 'scores' ? 'Think of what someone in your field worries about losing when the pressure is on. That\'s a score.' : 'Think of a leader you\'ve worked with. What were they known for, and what did the numbers look like by the end?' }}</p>
      <button type="button" class="button button-primary start" @click="step === 'scores' ? $emit('createScore') : $emit('createEnding')">{{ step === 'scores' ? 'Name a score' : 'Write an ending' }}</button>
    </template>

    <template v-else-if="step === 'check'">
      <div class="editor-head">
        <div class="editor-head-text">
          <span class="editor-kicker">Guided round</span>
          <h1 :id="`round-${step}`" class="editor-title">The game's checks</h1>
        </div>
      </div>
      <ChecksPanel :state="checkState" :issues="issues" :draft="draft" @goTo="(target) => $emit('goTo', target)" />
      <p v-if="checkState === 'done' && issues.length === 0" class="field-hint">Nothing to fix. Your pack would import in the game as it is.</p>
    </template>

    <template v-else-if="step === 'play'">
      <div class="editor-head">
        <div class="editor-head-text">
          <span class="editor-kicker">Guided round</span>
          <h1 :id="`round-${step}`" class="editor-title">Your pack, in the game</h1>
        </div>
      </div>
      <div class="play-row">
        <button type="button" class="button button-primary" :disabled="!playLive || playing || !checksClean" @click="$emit('play')">▶ Play it</button>
        <span v-if="playText" class="field-hint" role="status">{{ playText }}</span>
      </div>
      <p v-if="checkState === 'checking' || checkState === 'idle'" class="field-hint working">Checking the pack…</p>
      <p v-else-if="!checksClean" class="field-hint">Fix what the checks list first: the step before this one.</p>
      <p class="field-hint">
        Then, whenever you're ready, export it to share: a pack file players import in the game, or a zip for GitHub.
        <button type="button" class="link-button" @click="$emit('export')">Open the export page</button>
      </p>
      <p class="field-hint">When you finish the round, your pack opens in the full workspace, with everything you made. You can keep editing it there.</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { DeckSection, DraftPack, PackIssue, RoundStep } from '@/domains/authoring'
import type { CheckState } from '@studio/state/studio_state'
import ChecksPanel, { type IssueTarget } from '@studio/workspace/checks_panel.vue'

defineProps<{
  draft: DraftPack
  step: RoundStep
  checkState: CheckState
  issues: PackIssue[]
  checksClean: boolean
  playLive: boolean
  playing: boolean
  playText: string
}>()
defineEmits<{ createNew: [section: DeckSection]; createScore: []; createEnding: []; goTo: [target: IssueTarget]; play: []; export: [] }>()
</script>

<style scoped>
.start {
  align-self: flex-start;
}

.play-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}
</style>
