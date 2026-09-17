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
      :handCards="handCardEntries"
      :replaceMode="isConsultMode"
      :selectedHandId="pendingDiscardId"
      :selectedDeckId="pendingDrawId"
      @close="closeGrimoire"
      @inspect="handleInspectFromGrimoire"
      @selectHand="selectConsultHand"
      @selectDeck="selectConsultDeck"
      @randomReplace="beginRandomConsultReplace"
      @confirmReplace="beginChosenConsultReplace"
    />

    <AnnalsPanel
      :isOpen="isAnnalsOpen"
      :turns="annalsTurns"
      :stakeholderNames="stakeholderNames"
      @close="isAnnalsOpen = false"
    />

    <CardDetailsModal
      v-if="modalCardId && modalCard"
      :isOpen="!!modalCardId"
      :card="modalCard"
      :isDisabled="tableLocked"
      :isTutorialLocked="!isConsultMode && isTutorialCardLocked(modalCardId)"
      :isInspectOnly="isModalInspectOnly"
      :availability="modalCardAvailability"
      :stakeholderNames="stakeholderNames"
      :scores="gameStore.turnBriefing?.current_scores"
      :scoreAdjustments="modifierScoreAdjustments"
      :primaryActionLabel="modalPrimaryActionLabel"
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

    <div
      class="play-chamber"
      :class="{
        'is-collapsing': isCollapsing,
        'is-compound-storm': collapseCount > 1,
      }"
    >
      <div class="chamber-glow chamber-atmosphere" aria-hidden="true" />
      <div v-if="isCollapsing" class="chamber-smoke chamber-atmosphere" aria-hidden="true" />
      <div v-if="isCollapsing" class="chamber-ember chamber-atmosphere" aria-hidden="true" />
      <div class="chamber-grain chamber-atmosphere" aria-hidden="true" />

      <WeatherStrip
        :scores="currentScores"
        :currentTurn="gameStore.currentTurn"
        :maxTurns="gameStore.maxTurns"
        :aftershockCount="isAdjourned ? 0 : pendingAftershockCount"
        :highlight="tableHighlight"
        :isTutorial="gameStore.tutorial.isTutorialMode"
      />

      <WarTable
        :actors="stageActors"
        :sceneId="gameplaySceneId"
        :currentBeat="currentBeat"
        :highlight="tableHighlight"
        :scenarioName="scenario?.name"
        :playerName="playerDisplayName"
        :playerClassId="playerClassId"
        :playerClassName="playerClassName"
        :isAdjourned="isAdjourned"
        :beatIndex="theaterBeatIndex"
        :beatCount="theaterBeatCount"
        :fxKind="fxKind"
        :voicingStakeholderId="voicingStakeholderId"
        :fxEventId="fxEventId"
        :fxTone="fxTone"
        :landedCardName="landedCardName"
        :isCollapsing="isCollapsing"
        :collapseCount="collapseCount"
        @continueTheater="continueTheater"
        @skipTheater="handleSkipTheater"
        @viewResults="goToEndScreen"
      />

      <TutorialHintPanel
        v-if="gameStore.tutorial.isTutorialMode && gameStore.tutorial.showInlineHint && gameStore.tutorial.lastShownStep"
        :step="gameStore.tutorial.lastShownStep"
        :stepNumber="gameStore.tutorial.currentStepNumber"
        :totalSteps="gameStore.tutorial.totalSteps"
      />

      <TableTools
        v-if="deckCardEntries.length > 0 || annalsTurns.length > 0"
        :deckCount="deckCardEntries.length"
        :historyCount="annalsTurns.length"
        @openGrimoire="openGrimoire"
        @openAnnals="openAnnals"
      />

      <HandDock
        v-if="!gameStore.isRunComplete"
        :cards="handCardEntries"
        :isDisabled="tableLocked"
        :requiredCardId="tutorialRequiredCardId"
        :consultMode="isConsultMode"
        :canConsult="canConsultArchives"
        @showDetails="handleShowDetails"
        @play="handleHandCardAction"
        @toggleConsult="toggleConsult"
      />

      <TutorialPointerArrow :show="showHandArrow" target="hand" />
    </div>

    <CommitmentFlight :flight="commitmentFlight" />

    <ArchiveReplace
      v-if="archiveOffer"
      :kind="archiveOffer.kind"
      :phase="archiveOffer.phase"
      :outgoing="archiveOffer.outgoing"
      :incoming="archiveOffer.incoming"
      :canCancel="archiveOffer.canCancel"
      :swapping="archiveOffer.swapping"
      @cancel="cancelArchiveReplace"
      @confirm="confirmConsultReplace"
      @accept="acceptArchiveReplace"
    />

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
import { getCollapseWarnings, hasActiveCoupling } from '@/ui/composables/system_coupling'
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
import AnnalsPanel from '@/ui/play/annals_panel.vue'
import CommitmentFlight from '@/ui/play/commitment_flight.vue'
import ArchiveReplace from '@/ui/play/archive_replace.vue'
import { diffHandCards, peekConsultDrawId, type ArchiveReplaceOffer } from '@/ui/play/hand_swap'
import { buildAnnalsTurns } from '@/ui/play/turn_theater'
import { useTurnTheater } from '@/ui/play/use_turn_theater'
import { useCommitmentFlight } from '@/ui/play/use_commitment_flight'

const router = useRouter()
const gameStore = useGameStore()
const {
  currentBeat,
  beatIndex: theaterBeatIndex,
  beatCount: theaterBeatCount,
  isActive: isTheaterActive,
  isComplete: isTheaterComplete,
  fxKind,
  voicingStakeholderId,
  fxEventId,
  fxTone,
  play: playTheater,
  advance: continueTheater,
  skip: skipTheater,
  dismiss: dismissTheater,
} = useTurnTheater()
const {
  flight: commitmentFlight,
  landedName: landedCardName,
  capture: captureCommitment,
  holdCaptured,
  playCaptured: playCommitmentFlight,
  settle: settleCommitment,
  clear: clearCommitment,
} = useCommitmentFlight()

const modalCardId = ref<string | null>(null)
const isConsultMode = ref(false)
const archiveOffer = ref<ArchiveReplaceOffer | null>(null)
const pendingDiscardId = ref<string | null>(null)
const pendingDrawId = ref<string | null>(null)
const pendingTheaterAfterReplace = ref(false)
const pendingForcedReplace = ref<ArchiveReplaceOffer | null>(null)
const isGrimoireOpen = ref(false)
const isAnnalsOpen = ref(false)
const randomAvatarRoles = ref<AvatarRoleId[]>(shuffleAvatarRoles())
const pendingStakeholderBubbles = ref<Record<string, StakeholderSpeechBubblePresentation>>({})
const activeStakeholderBubbles = ref<Record<string, StakeholderSpeechBubblePresentation>>({})

const tableLocked = computed(() => {
  return gameStore.isPlayingTurn || isTheaterActive.value || Boolean(commitmentFlight.value) || Boolean(archiveOffer.value)
})

const scenario = computed(() => gameStore.scenarioBundle?.scenario)
const playerDisplayName = computed(() => gameStore.gameState?.player_profile.display_name)
const playerClassId = computed(() => gameStore.gameState?.player_profile.selected_class_ref?.id)
const playerClassName = computed(() => {
  const classRef = gameStore.gameState?.player_profile.selected_class_ref
  if (!classRef) return undefined
  const exact = gameStore.availableClasses.find(
    (playerClass) => playerClass.id === classRef.id && playerClass.version === classRef.version,
  )?.name
  if (exact) return exact
  const byId = gameStore.availableClasses.find((playerClass) => playerClass.id === classRef.id)?.name
  if (byId) return byId
  return classRef.id.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
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
const collapseWarnings = computed(() => getCollapseWarnings(currentScores.value))
const isCollapsing = computed(() => hasActiveCoupling(currentScores.value))
const collapseCount = computed(() => collapseWarnings.value.length)
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
  const availability = availableCardEntries.value.find((entry) => entry.card.id === modalCardId.value)?.availability
  if (isConsultMode.value && isModalCardInHand.value && availability) {
    return { ...availability, is_playable: true }
  }
  return availability
})

const isModalCardInHand = computed(() => {
  if (!modalCardId.value) return false
  return handCardEntries.value.some((entry) => entry.card.id === modalCardId.value)
})

const isModalCardInDeck = computed(() => {
  if (!modalCardId.value) return false
  return deckCardEntries.value.some((entry) => entry.card.id === modalCardId.value)
})

const isModalInspectOnly = computed(() => {
  if (isConsultMode.value) {
    return !isModalCardInHand.value && !isModalCardInDeck.value
  }
  return !isModalCardInHand.value
})

const modalPrimaryActionLabel = computed(() => {
  if (!isConsultMode.value) return undefined
  if (isModalCardInHand.value) return 'Set aside'
  if (isModalCardInDeck.value) return 'Take this'
  return undefined
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

const theaterNames = computed(() => ({
  cardName: (id: string) => {
    const found = gameStore.scenarioBundle?.cards
    if (!found) return id
    for (const card of found.values()) {
      if (card.id === id) return card.name
    }
    return id
  },
  stakeholderName: (id: string) => stakeholderNames.value[id] ?? id,
}))

const annalsTurns = computed(() => {
  return buildAnnalsTurns(gameStore.gameState?.history ?? [], theaterNames.value)
})

const isAdjourned = computed(() => gameStore.isRunComplete && !isTheaterActive.value)

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

watch([fxKind, currentBeat], ([kind, beat]) => {
  const momentKind = kind ?? beat?.kind
  if (momentKind === 'action' || momentKind === 'consult') {
    void playCommitmentFlight()
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
    if (pendingForcedReplace.value) {
      archiveOffer.value = pendingForcedReplace.value
      pendingForcedReplace.value = null
    }
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

function openGrimoire() {
  isAnnalsOpen.value = false
  isGrimoireOpen.value = true
}

function closeGrimoire() {
  isGrimoireOpen.value = false
  if (isConsultMode.value && !archiveOffer.value) {
    isConsultMode.value = false
    pendingDiscardId.value = null
    pendingDrawId.value = null
  }
}

function openAnnals() {
  isGrimoireOpen.value = false
  isAnnalsOpen.value = true
  if (isConsultMode.value && !archiveOffer.value) {
    isConsultMode.value = false
    pendingDiscardId.value = null
    pendingDrawId.value = null
  }
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

  playTheater(turnResolution, theaterNames.value)

  if (gameStore.isRunComplete) {
    gameStore.get_run_outcome()
  }
}

function snapshotHandIds(): string[] {
  return handCardEntries.value.map((entry) => entry.card.id)
}

function cardLabel(cardId: string): string {
  const fromBriefing = availableCardEntries.value.find((entry) => entry.card.id === cardId)?.card.name
  if (fromBriefing) return fromBriefing
  if (!gameStore.scenarioBundle) return cardId
  for (const card of gameStore.scenarioBundle.cards.values()) {
    if (card.id === cardId) return card.name
  }
  return cardId
}

function labeledCards(ids: string[]) {
  return ids.map((id) => ({ id, name: cardLabel(id) }))
}

function toggleConsult() {
  if (archiveOffer.value) return
  if (isConsultMode.value) {
    isConsultMode.value = false
    pendingDiscardId.value = null
    pendingDrawId.value = null
    isGrimoireOpen.value = false
    return
  }

  isConsultMode.value = true
  isAnnalsOpen.value = false
  isGrimoireOpen.value = true
}

function selectConsultHand(cardId: string) {
  pendingDiscardId.value = cardId
  modalCardId.value = null
}

function selectConsultDeck(cardId: string) {
  pendingDrawId.value = cardId
  modalCardId.value = null
}

function peekRandomDrawId(): string | null {
  const playableDeckIds = deckCardEntries.value
    .filter((entry) => entry.availability?.is_playable !== false)
    .map((entry) => entry.card.id)
  return peekConsultDrawId(
    deckCardEntries.value.map((entry) => entry.card.id),
    playableDeckIds,
  )
}

function openConsultApproval() {
  const discardedId = pendingDiscardId.value
  const drawId = pendingDrawId.value
  if (!discardedId || !drawId) return

  modalCardId.value = null
  isGrimoireOpen.value = false
  archiveOffer.value = {
    kind: 'consult',
    phase: 'confirm',
    outgoing: labeledCards([discardedId]),
    incoming: labeledCards([drawId]),
    canCancel: true,
    swapping: false,
  }
}

function beginChosenConsultReplace() {
  if (!pendingDiscardId.value || !pendingDrawId.value) return
  openConsultApproval()
}

function beginRandomConsultReplace() {
  if (!pendingDiscardId.value) return
  const drawId = peekRandomDrawId()
  if (!drawId) return
  pendingDrawId.value = drawId
  openConsultApproval()
}

function cancelArchiveReplace() {
  const wasConsultApproval = archiveOffer.value?.kind === 'consult' && archiveOffer.value.canCancel
  archiveOffer.value = null
  if (wasConsultApproval) {
    isConsultMode.value = true
    isGrimoireOpen.value = true
    return
  }

  pendingDiscardId.value = null
  pendingDrawId.value = null
}

async function confirmConsultReplace() {
  const discardedId = pendingDiscardId.value
  const drawId = pendingDrawId.value
  if (!discardedId || !drawId) {
    cancelArchiveReplace()
    return
  }

  const previousIds = snapshotHandIds()
  isConsultMode.value = false
  isGrimoireOpen.value = false
  isAnnalsOpen.value = false
  dismissTheater()
  clearCommitment()
  pendingStakeholderBubbles.value = {}
  activeStakeholderBubbles.value = {}
  await gameStore.consult_archives([discardedId], drawId)

  const diff = diffHandCards(previousIds, snapshotHandIds(), { discardedId })
  archiveOffer.value = null
  pendingTheaterAfterReplace.value = false
  pendingForcedReplace.value = diff.unplayableDepartedIds.length > 0
    ? {
        kind: 'forced',
        phase: 'reveal',
        outgoing: labeledCards(diff.unplayableDepartedIds),
        incoming: labeledCards(diff.arrivedIds.filter((id) => id !== drawId)),
        canCancel: false,
        swapping: true,
      }
    : null
  pendingDiscardId.value = null
  pendingDrawId.value = null
  void applyCommittedTurn()
}

function acceptArchiveReplace() {
  archiveOffer.value = null
  if (pendingTheaterAfterReplace.value) {
    pendingTheaterAfterReplace.value = false
    void applyCommittedTurn()
  }
}

async function handleHandCardAction(cardId: string) {
  if (isConsultMode.value) {
    if (handCardEntries.value.some((entry) => entry.card.id === cardId)) {
      selectConsultHand(cardId)
      return
    }
    if (deckCardEntries.value.some((entry) => entry.card.id === cardId)) {
      selectConsultDeck(cardId)
      return
    }
    return
  }

  await handlePlayCard(cardId)
}

function handleSkipTheater() {
  skipTheater()
  settleCommitment()
}

function cardNameInHand(cardId: string): string {
  return handCardEntries.value.find((entry) => entry.card.id === cardId)?.card.name ?? cardId
}

async function handlePlayCard(cardId: string) {
  modalCardId.value = null
  isConsultMode.value = false
  isGrimoireOpen.value = false
  isAnnalsOpen.value = false
  pendingDiscardId.value = null
  pendingDrawId.value = null
  dismissTheater()
  clearCommitment()
  const previousIds = snapshotHandIds()
  captureCommitment(cardId, cardNameInHand(cardId), 'play')
  holdCaptured()
  pendingStakeholderBubbles.value = {}
  activeStakeholderBubbles.value = {}
  await gameStore.play_turn(cardId)
  const diff = diffHandCards(previousIds, snapshotHandIds(), { playedId: cardId })
  pendingForcedReplace.value = diff.unplayableDepartedIds.length > 0
    ? {
        kind: 'forced',
        phase: 'reveal',
        outgoing: labeledCards(diff.unplayableDepartedIds),
        incoming: labeledCards(diff.arrivedIds),
        canCancel: false,
        swapping: true,
      }
    : null
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

.play-chamber > *:not(.chamber-atmosphere) {
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

.play-chamber.is-collapsing .chamber-glow {
  background:
    radial-gradient(ellipse at 50% 12%, rgba(210, 48, 12, 0.38), transparent 46%),
    radial-gradient(ellipse at 18% 80%, rgba(120, 24, 8, 0.32), transparent 42%),
    radial-gradient(ellipse at 82% 78%, rgba(80, 16, 8, 0.28), transparent 44%);
}

.play-chamber.is-compound-storm .chamber-glow {
  background:
    radial-gradient(ellipse at 50% 10%, rgba(255, 40, 8, 0.48), transparent 48%),
    radial-gradient(ellipse at 12% 84%, rgba(140, 16, 4, 0.4), transparent 44%),
    radial-gradient(ellipse at 88% 80%, rgba(96, 8, 4, 0.36), transparent 46%);
}

.chamber-smoke {
  position: absolute;
  inset: -8% 0 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 30% 18%, rgba(48, 16, 10, 0.42), transparent 36%),
    radial-gradient(ellipse at 72% 8%, rgba(28, 10, 6, 0.38), transparent 32%);
  filter: blur(18px);
  animation: chamber-drift 7s ease-in-out infinite;
}

.chamber-ember {
  position: absolute;
  inset: auto 8% 12% 8%;
  height: 42%;
  z-index: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 18% 80%, rgba(255, 140, 48, 0.55) 0 2px, transparent 2.6px),
    radial-gradient(circle at 46% 70%, rgba(255, 80, 24, 0.5) 0 1.6px, transparent 2.2px),
    radial-gradient(circle at 78% 84%, rgba(255, 196, 96, 0.45) 0 1.4px, transparent 2px);
  animation: chamber-sparks 2.6s linear infinite;
  opacity: 0.8;
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

@keyframes chamber-drift {
  0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.72; }
  50% { transform: translate3d(2%, -3%, 0); opacity: 1; }
}

@keyframes chamber-sparks {
  0% { transform: translateY(8px); opacity: 0.35; }
  50% { opacity: 0.9; }
  100% { transform: translateY(-18px); opacity: 0.2; }
}

@media (prefers-reduced-motion: reduce) {
  .chamber-smoke,
  .chamber-ember {
    animation: none;
  }
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

  .play-chamber {
    padding: 0.45rem 0.45rem 1.2rem;
    gap: 0.45rem;
  }
}

@media (max-width: 720px) and (orientation: portrait) {
  .play-session {
    --hand-dock-height: 188px;
  }

  .play-chamber {
    padding: 0.35rem 0.4rem 0.9rem;
    gap: 0.35rem;
  }
}
</style>
