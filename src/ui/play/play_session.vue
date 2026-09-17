<template>
  <div class="play-session">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />

    <RunIntroSplash
      :isOpen="gameStore.isIntroSplashOpen"
      :playerName="playerDisplayName"
      :playerClassName="playerClassName"
      :playerClassId="playerClassId"
      :scenarioName="scenario?.name"
      :scores="gameStore.gameState?.scores ?? {}"
      :challengeModifierName="activeChallengeModifier?.name"
      :scoreAdjustments="modifierScoreAdjustments"
      :stakeholders="gameStore.gameState?.stakeholders ?? {}"
      :stakeholderNames="stakeholderNames"
      :maxTurns="gameStore.maxTurns"
      :isTutorial="gameStore.tutorial.isTutorialMode"
      @start="gameStore.dismissIntroSplash"
    />

    <TutorialCompleteSplash
      :isOpen="gameStore.isTutorialCompleteSplashOpen && !isTheaterActive"
      :currentScenarioId="scenario?.id ?? ''"
      :availableTutorials="gameStore.availableTutorials"
      @launchTutorial="handleLaunchAnotherTutorial"
      @startRealGame="handleStartRealGame"
    />

    <GrimoirePanel
      :isOpen="isGrimoireOpen"
      :cards="deckCardEntries"
      @close="isGrimoireOpen = false"
      @inspect="handleInspectFromGrimoire"
    />

    <CardDetailsModal
      v-if="modalCardId && modalCard"
      :isOpen="!!modalCardId"
      :card="modalCard"
      :isDisabled="tableLocked"
      :isTutorialLocked="!isConsultMode && isTutorialCardLocked(modalCardId)"
      :isInspectOnly="!isModalCardInHand"
      :availability="modalCardAvailability"
      :stakeholderNames="stakeholderNames"
      :scores="gameStore.turnBriefing?.current_scores"
      :scoreAdjustments="modifierScoreAdjustments"
      :primaryActionLabel="isConsultMode && isModalCardInHand ? 'Set aside' : undefined"
      @close="modalCardId = null"
      @play="handleHandCardAction"
    />

    <GameMasthead
      @show-rules="gameStore.openRulesModal"
      @show-about="gameStore.openAboutModal"
      @show-dungeon-master="gameStore.openDungeonMasterModal"
      @reset-run="handleResetRun"
    />

    <TutorialExitBar
      :isTutorial="gameStore.tutorial.isTutorialMode"
      @leave="handleLeaveTutorial"
    />

    <div class="play-chamber">
      <div class="chamber-glow" aria-hidden="true" />
      <div class="chamber-grain" aria-hidden="true" />

      <WeatherStrip
        :scores="currentScores"
        :currentTurn="gameStore.currentTurn"
        :maxTurns="gameStore.maxTurns"
        :aftershockCount="pendingAftershockCount"
        :highlight="tableHighlight"
      />

      <p v-if="isConsultMode" class="consult-banner" role="status">
        Choose one hand card to set aside. The system keeps moving.
      </p>

      <WarTable
        :actors="stageActors"
        :sceneId="gameplaySceneId"
        :currentBeat="currentBeat"
        :highlight="tableHighlight"
        @skipTheater="skipTheater"
      />

      <TutorialHintPanel
        v-if="gameStore.tutorial.isTutorialMode && gameStore.tutorial.showInlineHint && gameStore.tutorial.lastShownStep"
        :step="gameStore.tutorial.lastShownStep"
        :stepNumber="gameStore.tutorial.currentStepNumber"
        :totalSteps="gameStore.tutorial.totalSteps"
      />

      <TableTools
        v-if="!gameStore.isRunComplete && (canConsultArchives || deckCardEntries.length > 0)"
        :canConsult="canConsultArchives"
        :consultMode="isConsultMode"
        :deckCount="deckCardEntries.length"
        :disabled="tableLocked"
        @toggleConsult="isConsultMode = !isConsultMode"
        @openGrimoire="isGrimoireOpen = true"
      />

      <HandDock
        v-if="!gameStore.isRunComplete"
        :cards="handCardEntries"
        :isDisabled="tableLocked"
        :requiredCardId="tutorialRequiredCardId"
        :consultMode="isConsultMode"
        @showDetails="handleShowDetails"
        @play="handleHandCardAction"
      />

      <TutorialPointerArrow :show="showHandArrow" target="hand" />

      <div v-if="gameStore.isRunComplete" class="adjourn-card">
        <p class="adjourn-kicker">The council adjourns</p>
        <h2>Run complete</h2>
        <p>Your architectural journey has reached its conclusion.</p>
        <AppButton label="View Results" variant="primary" @click="goToEndScreen" />
      </div>
    </div>

    <Transition name="tutorial-popup">
      <div
        v-if="showTutorialPopup"
        class="tutorial-popup-backdrop"
      >
        <div class="tutorial-popup-panel" role="dialog" aria-modal="true" aria-labelledby="play-tutorial-title">
          <div class="tutorial-popup-header">
            <h3 id="play-tutorial-title">{{ gameStore.tutorial.currentStep?.title }}</h3>
            <span v-if="gameStore.tutorial.totalSteps > 0">
              {{ gameStore.tutorial.currentStepNumber }}/{{ gameStore.tutorial.totalSteps }}
            </span>
          </div>
          <p>{{ gameStore.tutorial.currentStep?.message }}</p>
          <AppButton
            :label="gameStore.tutorial.isLastStep ? 'Got it' : 'Next →'"
            variant="primary"
            @click="gameStore.tutorial.dismissCurrentHint()"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import type { Card } from '@/domains/content/model'
import { versionRefKey } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import { useGameStore } from '@/ui/stores/game_store'
import { buildStakeholderNamesMap } from '@/ui/composables/stakeholder_presentation'
import {
  buildGameplayStageActors,
  resolveGameplaySceneId,
  shuffleAvatarRoles,
  type StakeholderSpeechBubblePresentation,
} from '@/ui/composables/gameplay_stage_presentation'
import { buildStakeholderSpeechBubbles } from '@/ui/composables/stakeholder_reaction_bubbles'
import type { AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'
import CardDetailsModal from '@/ui/components/cards/card_details_modal.vue'
import GameMasthead from '@/ui/components/branding/game_masthead.vue'
import RunIntroSplash from '@/ui/components/common/run_intro_splash.vue'
import TutorialHintPanel from '@/ui/components/tutorial/tutorial_hint_panel.vue'
import TutorialExitBar from '@/ui/components/tutorial/tutorial_exit_bar.vue'
import TutorialCompleteSplash from '@/ui/components/tutorial/tutorial_complete_splash.vue'
import TutorialPointerArrow from '@/ui/components/tutorial/tutorial_pointer_arrow.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
import WeatherStrip from '@/ui/play/weather_strip.vue'
import WarTable from '@/ui/play/war_table.vue'
import HandDock from '@/ui/play/hand_dock.vue'
import TableTools from '@/ui/play/table_tools.vue'
import GrimoirePanel from '@/ui/play/grimoire_panel.vue'
import { useTurnTheater } from '@/ui/play/use_turn_theater'

const router = useRouter()
const gameStore = useGameStore()
const {
  currentBeat,
  isActive: isTheaterActive,
  isComplete: isTheaterComplete,
  play: playTheater,
  skip: skipTheater,
  dismiss: dismissTheater,
} = useTurnTheater()

const modalCardId = ref<string | null>(null)
const isConsultMode = ref(false)
const isGrimoireOpen = ref(false)
const randomAvatarRoles = ref<AvatarRoleId[]>(shuffleAvatarRoles())
const pendingStakeholderBubbles = ref<Record<string, StakeholderSpeechBubblePresentation>>({})
const activeStakeholderBubbles = ref<Record<string, StakeholderSpeechBubblePresentation>>({})

const tableLocked = computed(() => gameStore.isPlayingTurn || isTheaterActive.value)

const scenario = computed(() => gameStore.scenarioBundle?.scenario)
const playerDisplayName = computed(() => gameStore.gameState?.player_profile.display_name)
const playerClassId = computed(() => gameStore.gameState?.player_profile.selected_class_ref?.id)
const playerClassName = computed(() => {
  const classRef = gameStore.gameState?.player_profile.selected_class_ref
  if (!classRef) return undefined
  return gameStore.availableClasses.find(
    (playerClass) => playerClass.id === classRef.id && playerClass.version === classRef.version,
  )?.name
})

const activeChallengeModifier = computed(() => {
  const modifierRef = gameStore.gameState?.player_profile.challenge_modifier_ref
  if (!modifierRef) return null
  return gameStore.availableChallengeModifiers.find(
    (modifier) => modifier.id === modifierRef.id && modifier.version === modifierRef.version,
  ) ?? null
})

const modifierScoreAdjustments = computed(() => {
  const scenarioScores = scenario.value?.starting_scores
  const scoreAdjustments = activeChallengeModifier.value?.score_adjustments
  const modifierName = activeChallengeModifier.value?.name
  if (!scenarioScores || !scoreAdjustments || !modifierName) {
    return {}
  }

  const result: Record<string, { base: number; adjusted: number; modifierName: string }> = {}
  for (const [scoreId, baseValue] of Object.entries(scenarioScores)) {
    const adjustment = scoreAdjustments[scoreId]
    if (typeof adjustment !== 'number' || adjustment === 0) continue
    const adjustedValue = Math.max(0, Math.min(100, baseValue + adjustment))
    if (adjustedValue === baseValue) continue
    result[scoreId] = { base: baseValue, adjusted: adjustedValue, modifierName }
  }
  return result
})

const currentScores = computed(() => gameStore.turnBriefing?.current_scores ?? {})
const pendingAftershockCount = computed(() => {
  return gameStore.turnBriefing?.pending_delayed_effects_resolving_this_turn.length ?? 0
})

const gameplaySceneId = computed<SceneBackgroundId>(() => {
  return resolveGameplaySceneId(scenario.value?.id)
})

const availabilitySummaryByKey = computed(() => {
  const entries = new Map<string, TurnBriefingActionSummary>()
  for (const summary of [
    ...(gameStore.turnBriefing?.hand_action_summaries ?? []),
    ...(gameStore.turnBriefing?.deck_action_summaries ?? []),
    ...(gameStore.turnBriefing?.available_action_summaries ?? []),
  ]) {
    entries.set(versionRefKey({ id: summary.card_id, version: summary.card_version }), summary)
  }
  return entries
})

function cardsFromSummaries(summaries: TurnBriefingActionSummary[]) {
  if (!gameStore.scenarioBundle) {
    return [] as Array<{ card: Card; availability: TurnBriefingActionSummary | undefined }>
  }

  const cards: Array<{ card: Card; availability: TurnBriefingActionSummary | undefined }> = []
  for (const summary of summaries) {
    const card = gameStore.scenarioBundle.cards.get(
      versionRefKey({ id: summary.card_id, version: summary.card_version }),
    )
    if (card) {
      cards.push({
        card,
        availability: availabilitySummaryByKey.value.get(
          versionRefKey({ id: summary.card_id, version: summary.card_version }),
        ),
      })
    }
  }
  return cards
}

const handCardEntries = computed(() => cardsFromSummaries(gameStore.turnBriefing?.hand_action_summaries ?? []))
const deckCardEntries = computed(() => cardsFromSummaries(gameStore.turnBriefing?.deck_action_summaries ?? []))
const availableCardEntries = computed(() => [...handCardEntries.value, ...deckCardEntries.value])

const tutorialRequiredCardId = computed(() => gameStore.tutorial.requiredCardId ?? null)

function isTutorialCardLocked(cardId: string): boolean {
  return tutorialRequiredCardId.value !== null && cardId !== tutorialRequiredCardId.value
}

const modalCard = computed(() => {
  if (!modalCardId.value || !gameStore.scenarioBundle) return null
  return availableCardEntries.value.find((entry) => entry.card.id === modalCardId.value)?.card ?? null
})

const modalCardAvailability = computed(() => {
  if (!modalCardId.value) return undefined
  return availableCardEntries.value.find((entry) => entry.card.id === modalCardId.value)?.availability
})

const isModalCardInHand = computed(() => {
  if (!modalCardId.value) return false
  return handCardEntries.value.some((entry) => entry.card.id === modalCardId.value)
})

const stakeholderNames = computed((): Record<string, string> => {
  return buildStakeholderNamesMap(gameStore.scenarioBundle)
})

const stageActors = computed(() => {
  return buildGameplayStageActors(
    gameStore.gameState?.stakeholders,
    stakeholderNames.value,
    randomAvatarRoles.value,
    activeStakeholderBubbles.value,
  )
})

const canConsultArchives = computed(() => gameStore.turnBriefing?.can_consult_archives === true)

const tableHighlight = computed(() => {
  if (!gameStore.tutorial.isTutorialMode || gameStore.tutorial.isHintVisible || isTheaterActive.value) {
    return null
  }

  return gameStore.tutorial.currentStepHighlight
})

const showTutorialPopup = computed(() => {
  return (
    gameStore.tutorial.isTutorialMode
    && gameStore.tutorial.isHintVisible
    && Boolean(gameStore.tutorial.currentStep)
    && !isTheaterActive.value
  )
})

const showHandArrow = computed(() => {
  if (!gameStore.tutorial.isTutorialMode || gameStore.tutorial.isHintVisible || isTheaterActive.value) {
    return false
  }

  if (tutorialRequiredCardId.value) {
    return true
  }

  const highlight = gameStore.tutorial.currentStepHighlight
  return highlight === 'hand' || highlight === 'satchel'
})

watch(scenario, (newScenario, oldScenario) => {
  if (newScenario?.id !== oldScenario?.id) {
    randomAvatarRoles.value = shuffleAvatarRoles()
  }
})

watch(currentBeat, (beat) => {
  if (beat?.kind === 'stakeholder' && beat.stakeholder_id) {
    const bubble = pendingStakeholderBubbles.value[beat.stakeholder_id]
    activeStakeholderBubbles.value = bubble ? { [beat.stakeholder_id]: bubble } : {}
  }
})

watch(isTheaterComplete, (done) => {
  if (done) {
    activeStakeholderBubbles.value = pendingStakeholderBubbles.value
  }
})

onMounted(() => {
  if (!gameStore.hasActiveRun) {
    router.push('/play')
    return
  }

  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
})

function handleResetRun() {
  gameStore.reset()
  router.push('/play')
}

function handleLeaveTutorial() {
  gameStore.reset()
  router.push('/play')
}

async function handleLaunchAnotherTutorial(tutorial: QuestDisplayModel) {
  gameStore.isTutorialCompleteSplashOpen = false
  gameStore.reset()

  const fallbackClass = gameStore.availableClasses[0]
  if (!fallbackClass) {
    router.push('/play')
    return
  }

  await gameStore.start_new_run({
    scenario_id: tutorial.id,
    scenario_version: tutorial.version,
    selected_class_ref: {
      id: fallbackClass.id,
      version: fallbackClass.version,
    },
    is_tutorial: true,
  })
}

function handleStartRealGame() {
  gameStore.isTutorialCompleteSplashOpen = false
  gameStore.reset()
  router.push('/play')
}

function handleShowDetails(cardId: string) {
  modalCardId.value = cardId
}

function handleInspectFromGrimoire(cardId: string) {
  modalCardId.value = cardId
}

async function applyCommittedTurn() {
  const turnResolution = gameStore.lastTurnResolution?.turn_resolution_context
  if (!turnResolution) {
    if (gameStore.isRunComplete) {
      gameStore.get_run_outcome()
    }
    return
  }

  pendingStakeholderBubbles.value = buildStakeholderSpeechBubbles(
    turnResolution.stakeholder_resolution.reactions,
    turnResolution.turn_number,
  )
  activeStakeholderBubbles.value = {}

  playTheater(turnResolution, {
    cardName: (id) => {
      const found = gameStore.scenarioBundle?.cards
      if (!found) return id
      for (const card of found.values()) {
        if (card.id === id) return card.name
      }
      return id
    },
    stakeholderName: (id) => stakeholderNames.value[id] ?? id,
  })

  if (gameStore.isRunComplete) {
    gameStore.get_run_outcome()
  }
}

async function handleHandCardAction(cardId: string) {
  if (isConsultMode.value) {
    await handleConsultCard(cardId)
    return
  }

  await handlePlayCard(cardId)
}

async function handlePlayCard(cardId: string) {
  modalCardId.value = null
  isConsultMode.value = false
  isGrimoireOpen.value = false
  dismissTheater()
  pendingStakeholderBubbles.value = {}
  activeStakeholderBubbles.value = {}
  await gameStore.play_turn(cardId)
  await applyCommittedTurn()
}

async function handleConsultCard(cardId: string) {
  modalCardId.value = null
  isConsultMode.value = false
  isGrimoireOpen.value = false
  dismissTheater()
  pendingStakeholderBubbles.value = {}
  activeStakeholderBubbles.value = {}
  await gameStore.consult_archives([cardId])
  await applyCommittedTurn()
}

function goToEndScreen() {
  router.push('/end')
}
</script>

<style scoped>
.play-session {
  min-height: 100dvh;
  background: #070504;
  color: var(--text-primary);
  --hand-dock-height: 260px;
  overflow-x: hidden;
}

.play-chamber {
  position: relative;
  width: min(1120px, 100%);
  margin: 0 auto;
  padding: 0.7rem 0.7rem 2.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.play-chamber > *:not(.chamber-glow):not(.chamber-grain) {
  position: relative;
  z-index: 1;
}

.chamber-glow {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(176, 108, 28, 0.22), transparent 42%),
    radial-gradient(ellipse at 50% 72%, rgba(18, 48, 56, 0.28), transparent 48%);
}

.chamber-grain {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.18;
  background-image: radial-gradient(rgba(255, 220, 140, 0.22) 0.5px, transparent 0.7px);
  background-size: 3px 3px;
}

.consult-banner {
  position: relative;
  z-index: 1;
  margin: 0;
  text-align: center;
  font-family: var(--font-heading);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  color: var(--dng-title-gold);
}

.adjourn-card {
  position: relative;
  z-index: 1;
  margin: 0 auto;
  width: min(420px, 100%);
  text-align: center;
  padding: 1.2rem 1rem;
  border: 1px solid rgba(176, 132, 42, 0.4);
  background: rgba(10, 8, 4, 0.82);
}

.adjourn-kicker {
  margin: 0 0 0.3rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.68rem;
  color: var(--dng-title-gold);
}

.tutorial-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(6, 4, 2, 0.72);
  display: grid;
  place-items: center;
  padding: 1rem;
}

.tutorial-popup-panel {
  width: min(420px, 100%);
  padding: 1.1rem 1.1rem 1rem;
  border: 1px solid rgba(176, 132, 42, 0.45);
  background: #120e08;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.tutorial-popup-header {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: baseline;
}

.tutorial-popup-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.tutorial-popup-enter-active,
.tutorial-popup-leave-active {
  transition: opacity 180ms ease;
}

.tutorial-popup-enter-from,
.tutorial-popup-leave-to {
  opacity: 0;
}

@media (max-width: 720px) {
  .play-session {
    --hand-dock-height: 210px;
  }
}
</style>
