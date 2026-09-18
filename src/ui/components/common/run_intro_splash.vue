<template>
  <Transition name="splash">
    <div
      v-if="isOpen"
      class="table-briefing"
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-briefing-title"
    >
      <div class="briefing-veil" />
      <section class="briefing-plaque">
        <p class="briefing-kicker">The council gathers</p>
        <h2 id="table-briefing-title" class="briefing-title">{{ scenarioName || 'A troubled quest' }}</h2>
        <p class="briefing-hail">{{ welcomeHeading }}</p>
        <p v-if="flavorText" class="briefing-flavor">{{ flavorText }}</p>

        <dl class="briefing-teach">
          <dt>Your charge</dt>
          <dd>{{ chargeLine }}</dd>
          <dt>How a turn goes</dt>
          <dd>{{ turnShapeLine }}</dd>
          <dt>The catch</dt>
          <dd>{{ tradeoffLine }}</dd>
        </dl>

        <p v-if="challengeModifierName" class="briefing-modifier">
          Raised stakes: {{ challengeModifierName }}
        </p>
        <p v-if="isTutorial" class="briefing-tutorial">
          This is a guided tutorial. Tips will appear as the adventure unfolds. There are no wrong answers here.
        </p>
        <button class="briefing-start" type="button" @click="emit('start')">
          Join the adventure
        </button>
        <button
          v-if="showTutorialInvite"
          class="briefing-tutorial-link"
          type="button"
          @click="emit('startTutorial')"
        >
          First time? The Basics tutorial takes two minutes.
        </button>
        <label v-if="!isTutorial" class="briefing-mute">
          <input type="checkbox" :checked="isMuted" @change="handleMuteChange" />
          <span>Don’t show this briefing again</span>
        </label>
      </section>
    </div>
  </Transition>
</template>

<script setup lang="ts">
/**
 * Opening table moment. Presentation of engine starting state already on the
 * war table (weather vials, seats). Does not invent scores or legality.
 */
import { computed, ref } from 'vue'
import type { StakeholderSnapshot, ScoreSnapshot } from '@/domains/simulation/model'
import { describeCharge, TRADEOFF_LINE, TURN_SHAPE_LINE } from '@/ui/play/run_briefing'

const props = defineProps<{
  isOpen: boolean
  playerName?: string
  playerClassName?: string
  playerClassId?: string
  scenarioName?: string
  flavorText?: string
  scores: ScoreSnapshot
  challengeModifierName?: string
  scoreAdjustments?: Record<string, { base: number; adjusted: number; modifierName: string }>
  stakeholders: StakeholderSnapshot
  stakeholderNames?: Record<string, string>
  maxTurns: number
  isTutorial?: boolean
  /** Offer the tutorial to players who have never finished one. */
  showTutorialInvite?: boolean
}>()

const emit = defineEmits<{
  start: []
  startTutorial: []
  muteBriefing: [muted: boolean]
}>()

const isMuted = ref(false)

const chargeLine = computed(() => describeCharge(props.scores, props.maxTurns))
const turnShapeLine = TURN_SHAPE_LINE
const tradeoffLine = TRADEOFF_LINE

function handleMuteChange(event: Event) {
  isMuted.value = (event.target as HTMLInputElement).checked
  emit('muteBriefing', isMuted.value)
}

const welcomeHeading = computed(() => {
  const name = props.playerName
  const className = props.playerClassName

  if (name && className) {
    return `${name}, ${className}`
  }
  if (name) {
    return name
  }
  if (className) {
    return className
  }
  return 'Architect'
})
</script>

<style scoped>
.table-briefing {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: grid;
  place-items: end center;
  padding: 0 1rem 7.5rem;
  pointer-events: none;
}

.briefing-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 70%, rgba(12, 6, 2, 0.18), transparent 48%),
    linear-gradient(180deg, transparent 42%, rgba(7, 5, 4, 0.45) 100%);
}

.briefing-plaque {
  position: relative;
  pointer-events: auto;
  width: min(30rem, 100%);
  /* Bottom-anchored on desktop: leave room for the 7.5rem stage offset. */
  max-height: calc(100dvh - 8.5rem);
  overflow-y: auto;
  padding: 1rem 1.1rem 1rem;
  background:
    linear-gradient(165deg, rgba(62, 38, 14, 0.96) 0%, rgba(16, 10, 5, 0.96) 100%);
  border: 1px solid rgba(232, 196, 96, 0.55);
  box-shadow:
    0 22px 40px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 220, 140, 0.16);
  clip-path: polygon(0 10px, 14px 0, calc(100% - 18px) 6px, 100% 0, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.briefing-kicker {
  margin: 0;
  font-size: var(--text-kicker);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f0c060;
}

.briefing-title {
  margin: 0.2rem 0 0.25rem;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: #ffe7b0;
}

.briefing-hail,
.briefing-flavor,
.briefing-modifier,
.briefing-tutorial {
  margin: 0 0 0.4rem;
  color: #f4d8b8;
  font-size: var(--text-base);
  line-height: 1.45;
}

.briefing-hail {
  font-family: var(--font-heading);
  color: #ead58a;
}

.briefing-teach {
  margin: 0.5rem 0 0.6rem;
  padding: 0.6rem 0 0;
  border-top: 1px solid rgba(232, 196, 96, 0.28);
}

.briefing-teach dt {
  font-family: var(--font-heading);
  font-size: var(--text-kicker);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f0c060;
}

.briefing-teach dd {
  margin: 0.1rem 0 0.55rem;
  color: #f4d8b8;
  font-size: var(--text-base);
  line-height: 1.45;
}

.briefing-teach dd:last-child {
  margin-bottom: 0;
}

.briefing-tutorial-link {
  appearance: none;
  margin-top: 0.5rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #ead58a;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;
}

.briefing-mute {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.6rem;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
}

.briefing-mute input {
  accent-color: #d8ab48;
  cursor: pointer;
}

.briefing-start {
  appearance: none;
  margin-top: 0.35rem;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(232, 196, 96, 0.7);
  background: rgba(42, 30, 12, 0.95);
  color: var(--dng-title-gold);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.splash-enter-active,
.splash-leave-active {
  transition: opacity 220ms ease;
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .table-briefing {
    place-items: center;
    padding: 1rem;
  }

  .briefing-plaque {
    clip-path: none;
    border-radius: 8px 18px 8px 18px;
    max-height: calc(100dvh - 2rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .splash-enter-active,
  .splash-leave-active {
    transition: none;
  }
}
</style>
