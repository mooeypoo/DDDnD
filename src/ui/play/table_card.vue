<template>
  <article
    class="table-card"
    :class="[
      `category-${categoryId}`,
      {
        'is-disabled': isCardDisabled,
        'is-locked': isTutorialLocked,
        'is-highlighted': isTutorialHighlighted,
        'is-inspect-only': isInspectOnly,
      },
    ]"
  >
    <button
      class="table-card-face"
      type="button"
      :disabled="isDisabled"
      :aria-label="`Inspect ${card.name}`"
      @click="$emit('showDetails')"
    >
      <span class="table-card-ribbon">{{ categoryLabel }}</span>
      <h3 class="table-card-title">{{ card.name }}</h3>
      <ul v-if="primaryEffects.length" class="table-card-effects">
        <li
          v-for="change in primaryEffects"
          :key="`${change.score_id}-${change.delta}`"
          :class="change.delta >= 0 ? 'gain' : 'loss'"
        >
          {{ change.delta > 0 ? '+' : '' }}{{ change.delta }} {{ shortLabelFor(change.score_id) }}
        </li>
      </ul>
      <p v-else class="table-card-empty">No immediate score shift</p>
    </button>

    <button
      v-if="!isInspectOnly"
      class="table-card-play"
      type="button"
      :disabled="isCardDisabled"
      :aria-label="playHint"
      @click="$emit('play', card.id)"
    >
      {{ playLabel }}
    </button>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { Card } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import { useCategoryPresentation } from '@/ui/composables/category_presentation'
import { useScoreLabels } from '@/ui/composables/use_score_labels'

const props = defineProps<{
  card: Card
  availability?: TurnBriefingActionSummary
  isDisabled?: boolean
  isTutorialLocked?: boolean
  isTutorialHighlighted?: boolean
  isInspectOnly?: boolean
  primaryActionLabel?: string
}>()

defineEmits<{
  play: [cardId: string]
  showDetails: []
}>()

const scoreLabels = useScoreLabels()

const { categoryId, categoryLabel } = useCategoryPresentation(
  computed(() => props.card.style_tags ?? []),
)

const primaryEffects = computed(() => props.card.score_changes.slice(0, 3))

const isCardDisabled = computed(() => {
  return Boolean(
    props.isDisabled
    || props.isTutorialLocked
    || (props.availability ? !props.availability.is_playable : false),
  )
})

const playLabel = computed(() => {
  if (props.primaryActionLabel) {
    return props.primaryActionLabel
  }

  if (props.isDisabled) {
    return 'Resolving'
  }

  if (props.isTutorialLocked) {
    return 'Locked'
  }

  if (!props.availability || props.availability.is_playable) {
    return 'Play'
  }

  return 'Held'
})

const playHint = computed(() => {
  if (props.primaryActionLabel) {
    return `${props.primaryActionLabel} ${props.card.name}`
  }

  return `Play ${props.card.name}`
})

function shortLabelFor(scoreId: string): string {
  return scoreLabels.short(scoreId)
}
</script>

<style scoped>
.table-card {
  width: 148px;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(180deg, #2a1c0c 0%, #161008 100%);
  border: 1px solid rgba(196, 148, 48, 0.55);
  border-radius: 10px 10px 12px 12px;
  box-shadow:
    0 14px 24px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 214, 120, 0.18);
  overflow: hidden;
  --card-accent: var(--text-secondary);
}

.table-card.category-refactor { --card-accent: var(--category-refactor); }
.table-card.category-infrastructure { --card-accent: var(--category-infrastructure); }
.table-card.category-team { --card-accent: var(--category-team); }
.table-card.category-process { --card-accent: var(--category-process); }
.table-card.category-fix { --card-accent: var(--category-fix); }

.table-card.is-highlighted {
  outline: 2px solid #f0d060;
  box-shadow:
    0 0 0 4px rgba(240, 208, 96, 0.22),
    0 16px 28px rgba(0, 0, 0, 0.5);
}

.table-card.is-disabled,
.table-card.is-locked {
  filter: saturate(0.7) brightness(0.86);
}

.table-card-face {
  appearance: none;
  border: 0;
  background:
    linear-gradient(180deg, color-mix(in oklab, var(--card-accent), #1a1208 78%) 0%, #120c06 38%, #0c0905 100%);
  color: inherit;
  text-align: left;
  padding: 0.55rem 0.6rem 0.5rem;
  min-height: 158px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.table-card-face:focus-visible {
  outline: 2px solid #f0d060;
  outline-offset: -3px;
}

.table-card-ribbon {
  align-self: flex-start;
  font-size: var(--text-kicker);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--card-accent), #fff 18%);
  border-bottom: 1px solid color-mix(in oklab, var(--card-accent), transparent 45%);
  padding-bottom: 0.15rem;
}

.table-card-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  line-height: 1.2;
  color: var(--text-bright);
  letter-spacing: 0.01em;
}

.table-card-effects {
  list-style: none;
  margin: auto 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.table-card-effects li {
  font-size: var(--text-sm);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.table-card-effects .gain {
  color: #b7e0c0;
}

.table-card-effects .loss {
  color: #f0a098;
}

.table-card-empty {
  margin: auto 0 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.table-card-play {
  appearance: none;
  border: 0;
  border-top: 1px solid rgba(196, 148, 48, 0.35);
  background: rgba(8, 6, 2, 0.72);
  color: var(--dng-title-gold);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
}

.table-card-play:disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

.table-card-play:not(:disabled):hover {
  background: rgba(48, 32, 8, 0.9);
}

@media (max-width: 720px) {
  .table-card {
    width: 122px;
  }

  .table-card-face {
    min-height: 132px;
    padding: 0.45rem 0.45rem 0.4rem;
  }

  .table-card-title {
    font-size: var(--text-base);
  }
}
</style>
