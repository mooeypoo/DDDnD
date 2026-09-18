<template>
  <!-- Legacy satchel play stage. `/game` defaults to the war table; append ?stage=legacy to render this view. -->
  <div class="game-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />
    <CardDetailsModal
      v-if="modalCardId && modalCard"
      :isOpen="!!modalCardId"
      :card="modalCard"
      :isDisabled="gameStore.isPlayingTurn"
      :isTutorialLocked="!isConsultMode && isTutorialCardLocked(modalCardId)"
      :isInspectOnly="!isModalCardInHand"
      :availability="modalCardAvailability"
      :stakeholderNames="stakeholderNames"
      :scores="gameStore.turnBriefing?.current_scores"
      :scoreAdjustments="modifierScoreAdjustments"
      @close="modalCardId = null"
      @play="handleHandCardAction"
    />

    <RunIntroSplash
      :isOpen="gameStore.isIntroSplashOpen"
      :playerName="playerDisplayName"
      :playerClassName="playerClassName"
      :playerClassId="playerClassId"
      :scenarioName="scenario?.name"
      :flavorText="scenario?.flavor_text ?? scenario?.description"
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
      :isOpen="gameStore.isTutorialCompleteSplashOpen"
      :currentScenarioId="scenario?.id ?? ''"
      :availableTutorials="gameStore.availableTutorials"
      @launchTutorial="handleLaunchAnotherTutorial"
      @startRealGame="handleStartRealGame"
    />

    <SurfaceModalPanel
      :is-open="isScenarioInfoOpen"
      :title="scenarioInfoTitle"
      size="md"
      @close="closeScenarioInfo"
    >
      <div class="scenario-info-body">
        <template v-if="!isScenarioInfoExpanded">
          <p class="scenario-info-summary">{{ scenarioShortDescription }}</p>

          <div class="scenario-info-facts">
            <div v-for="fact in scenarioQuickFacts" :key="fact.label" class="scenario-info-fact">
              <span class="scenario-info-fact-label">{{ fact.label }}</span>
              <span class="scenario-info-fact-value">{{ fact.value }}</span>
            </div>
          </div>

          <p class="scenario-info-nudge">
            Want the full briefing? Expand for the detailed scenario introduction.
          </p>
        </template>

        <template v-else>
          <section class="scenario-info-section">
            <div class="section-header scenario-info-section-header">
              <span class="section-icon" aria-hidden="true">📖</span>
              <h3 class="section-title">Scenario Introduction</h3>
            </div>
            <p v-if="scenario?.description" class="scenario-info-desc">{{ scenario.description }}</p>
            <p v-if="scenario?.flavor_text" class="scenario-info-flavor">"{{ scenario.flavor_text }}"</p>
          </section>

          <section class="scenario-info-section">
            <div class="section-header scenario-info-section-header">
              <span class="section-icon" aria-hidden="true">📊</span>
              <h3 class="section-title">System Ledger</h3>
            </div>
            <p class="scenario-info-section-copy">
              These are the starting system conditions for this run.
            </p>
            <div class="scenario-info-score-grid">
              <div
                v-for="(value, scoreId) in scenarioScoreSnapshot"
                :key="scoreId"
                class="scenario-info-metric"
              >
                <span class="scenario-info-metric-icon">{{ getMetricIcon(scoreId) }}</span>
                <span class="scenario-info-metric-label">{{ getMetricLabel(scoreId) }}</span>
                <span class="scenario-info-metric-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
              </div>
            </div>
          </section>

          <section class="scenario-info-section">
            <div class="section-header scenario-info-section-header">
              <span class="section-icon" aria-hidden="true">👥</span>
              <h3 class="section-title">The council</h3>
            </div>
            <p class="scenario-info-section-copy">
              These are the people on the council who will react to your decisions.
            </p>
            <div class="scenario-info-stakeholder-grid">
              <div
                v-for="(data, stakeholderId) in scenarioStakeholderSnapshot"
                :key="stakeholderId"
                class="scenario-info-stakeholder"
              >
                <span class="scenario-info-stakeholder-icon">{{ getStakeholderIcon(stakeholderId) }}</span>
                <span class="scenario-info-stakeholder-name">{{ formatStakeholderName(stakeholderId) }}</span>
                <span class="scenario-info-stakeholder-value" :class="getSatisfactionClass(data.satisfaction)">{{ Math.round(data.satisfaction) }}</span>
              </div>
            </div>
          </section>
        </template>
      </div>
      <template #footer>
        <AppButton variant="subtle" @click="toggleScenarioInfoDetails">
          {{ isScenarioInfoExpanded ? 'Back to summary' : 'More details' }}
        </AppButton>
        <AppButton variant="primary" @click="closeScenarioInfo">Got it!</AppButton>
      </template>
    </SurfaceModalPanel>

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

    <div ref="gameShellEl" class="game-shell" :class="{ 'drawer-open': isSatchelOpen }">
      <div ref="headerSentinelEl" class="play-header-sentinel" aria-hidden="true"></div>
      <header class="play-header" :class="{ 'is-stuck': isHeaderStuck, 'is-collapsed': isHeaderCollapsedView }">
        <div v-if="isHeaderCollapsedView" class="header-collapsed-row">
          <p class="turn-pill turn-pill-collapsed">Turn {{ gameStore.currentTurn }} / {{ gameStore.maxTurns }}</p>

          <div class="header-indicators header-indicators-collapsed" v-if="gameStore.turnBriefing && !gameStore.isRunComplete">
            <span class="header-pill header-pill-compact actions-pill" :title="`${currentAvailableActions} action card${currentAvailableActions === 1 ? '' : 's'} available`">
              ⚔️ {{ currentAvailableActions }}
            </span>
            <span
              v-if="pendingAftershockCount > 0"
              class="header-pill header-pill-compact aftershock-pill"
              :title="`${pendingAftershockCount} delayed effect${pendingAftershockCount === 1 ? '' : 's'} resolving this turn`"
            >
              ⚡ {{ pendingAftershockCount }}
            </span>
            <span
              v-if="isLowTurns"
              class="header-pill header-pill-compact low-turns-pill"
              :title="`${turnsRemaining} turn${turnsRemaining === 1 ? '' : 's'} remaining`"
            >
              ⏰ {{ turnsRemaining }}
            </span>
            <button
              v-if="hiddenScoreStateVisible"
              class="header-pill header-pill-compact score-state-pill score-state-pill-button"
              :class="hiddenScoreState.cssClass"
              :title="hiddenScoreStateTitle"
              type="button"
              :aria-label="hiddenScoreStateTitle"
              @click="setHeaderCollapsed(false)"
            >
              ◉ Expand for scores
            </button>
          </div>

          <button
            class="header-collapse-btn"
            type="button"
            :aria-expanded="false"
            aria-label="Expand gameplay HUD"
            @click="setHeaderCollapsed(false)"
          >
            <span class="collapse-btn-icon" aria-hidden="true">▾</span>
            <span class="collapse-btn-label">Expand HUD</span>
          </button>
        </div>

        <div v-else class="header-row">
          <p class="turn-pill">Turn {{ gameStore.currentTurn }} / {{ gameStore.maxTurns }}</p>

          <button
            v-if="scenario?.name"
            class="scenario-pill"
            @click="openScenarioInfo"
            :title="'View scenario info: ' + scenario.name"
          >
            <span class="scenario-pill-icon">📜</span>
            <span class="scenario-pill-name">{{ scenario.name }}</span>
            <span class="scenario-pill-info">ⓘ</span>
          </button>

          <!-- Action / aftershock indicators — always visible -->
          <div class="header-indicators" v-if="gameStore.turnBriefing && !gameStore.isRunComplete">
            <span class="header-pill actions-pill">
              ⚔️ {{ currentAvailableActions }} action{{ currentAvailableActions === 1 ? '' : 's' }}
            </span>
            <span v-if="pendingAftershockCount > 0" class="header-pill aftershock-pill">
              ⚡ {{ pendingAftershockCount }} aftershock{{ pendingAftershockCount === 1 ? '' : 's' }}
            </span>
            <span v-if="isLowTurns" class="header-pill low-turns-pill">
              ⏰ {{ turnsRemaining }} turn{{ turnsRemaining === 1 ? '' : 's' }} left
            </span>
          </div>

          <!-- Scores + stakeholders: hidden on desktop where sidebar is visible -->
          <div v-if="!isSidebarVisible" class="header-stat-zone">
            <ScoreHud
              v-if="gameStore.turnBriefing?.current_scores"
              :scores="gameStore.turnBriefing.current_scores"
            />
            <StakeholderHud
              v-if="gameStore.gameState?.stakeholders"
              :stakeholders="gameStore.gameState.stakeholders"
              :stakeholderNames="stakeholderNames"
            />
          </div>

          <button
            v-if="!isSidebarVisible"
            class="header-collapse-btn"
            type="button"
            :aria-expanded="true"
            aria-label="Collapse gameplay HUD"
            @click="setHeaderCollapsed(true)"
          >
            <span class="collapse-btn-icon" aria-hidden="true">▴</span>
            <span class="collapse-btn-label">Collapse HUD</span>
          </button>
        </div>
      </header>

      <div class="play-body">
        <div v-if="isSidebarVisible" class="play-sidebar-wrapper">
          <GameHudSidebar
            :currentTurn="gameStore.currentTurn"
            :maxTurns="gameStore.maxTurns"
            :scores="gameStore.turnBriefing?.current_scores"
            :stakeholders="gameStore.gameState?.stakeholders"
            :stakeholderNames="stakeholderNames"
            :playerClassId="playerClassId"
            :playerClassName="playerClassName"
            :playerName="playerDisplayName"
          />
        </div>

      <main class="play-main">
          <!-- Scene: full width of main column -->
          <section class="stage-section">
            <SceneStage :scene-id="gameplaySceneId" :actors="stageActors" />
            <!-- Aftershock float badge: top-right overlay on the scene -->
            <Transition name="aftershock-badge">
              <div
                v-if="gameStore.turnBriefing && !gameStore.isRunComplete && pendingAftershockCount > 0"
                class="aftershock-alert"
              >
                <span class="alert-icon">⚡</span>
                <div class="alert-content">
                  <div class="alert-title">Aftershocks Incoming</div>
                  <div class="alert-message">{{ pendingAftershockCount }} delayed effect{{ pendingAftershockCount > 1 ? 's' : '' }} this turn</div>
                </div>
              </div>
            </Transition>
            <!-- System coupling badge: top-left overlay on the scene when card gains are reduced -->
            <Transition name="coupling-badge">
              <button
                v-if="hasActiveCardEffects && !gameStore.isRunComplete && gameStore.turnBriefing"
                class="coupling-effects-badge"
                @click="activeEffectsPopupOpen = true"
                :aria-label="`${collapseWarnings.length} active system effect${collapseWarnings.length > 1 ? 's' : ''} reducing card gains — click for details`"
              >
                <IconSpell class="coupling-badge-icon" :size="14" />
                <div class="coupling-badge-content">
                  <div class="coupling-badge-title">System Coupling</div>
                  <div class="coupling-badge-sub">{{ collapseWarnings.length }} effect{{ collapseWarnings.length > 1 ? 's' : '' }} active</div>
                </div>
              </button>
            </Transition>
          </section>

          <!-- Below-scene: single column, width-capped -->
          <div class="below-scene">
            <!-- Low-turns warning -->
            <div v-if="isLowTurns && gameStore.turnBriefing && !gameStore.isRunComplete" class="low-turns-inline">
              <span class="low-turns-icon">⏰</span>
              <div class="low-turns-body">
                <span class="low-turns-title">Turns Running Low</span>
                <span class="low-turns-msg">Only {{ turnsRemaining }} turn{{ turnsRemaining === 1 ? '' : 's' }} remaining — make them count.</span>
              </div>
            </div>

            <!-- Collapsible turn resolution summary -->
            <div
              v-if="gameStore.lastTurnResolution?.turn_resolution_context"
              class="resolution-summary"
              :class="{ expanded: isResolutionExpanded }"
            >
              <button class="resolution-summary-header" @click="isResolutionExpanded = !isResolutionExpanded">
                <span class="resolution-summary-icon">⚔️</span>
                <span class="resolution-summary-title">Turn {{ gameStore.lastTurnResolution.turn_resolution_context.turn_number }} Resolution</span>
                <span class="resolution-summary-toggle" aria-hidden="true">{{ isResolutionExpanded ? '▲' : '▼' }}</span>
              </button>
              <Transition name="resolution-expand">
                <div v-if="isResolutionExpanded" class="resolution-summary-body">
                  <TurnResolutionPanel
                    :turnResolution="gameStore.lastTurnResolution.turn_resolution_context"
                    :stakeholderNames="stakeholderNames"
                  />
                </div>
              </Transition>
            </div>

            <TutorialHintPanel
              v-if="gameStore.tutorial.isTutorialMode && gameStore.tutorial.showInlineHint && gameStore.tutorial.lastShownStep"
              :step="gameStore.tutorial.lastShownStep"
              :stepNumber="gameStore.tutorial.currentStepNumber"
              :totalSteps="gameStore.tutorial.totalSteps"
            />

            <div v-if="gameStore.isRunComplete" class="run-complete-card">
              <div class="complete-icon">🏁</div>
              <h2 class="complete-title">Run Complete!</h2>
              <p class="complete-message">Your architectural journey has reached its conclusion.</p>
              <AppButton
                label="View Results"
                variant="primary"
                @click="goToEndScreen"
              />
            </div>

          </div>
        </main>
      </div>
    </div>

    <!-- Turn resolution popup -->
    <Transition name="resolution-popup">
      <div
        v-if="resolutionPopupOpen && gameStore.lastTurnResolution?.turn_resolution_context"
        class="resolution-popup-backdrop"
        @click.self="dismissResolutionPopup"
      >
        <div class="resolution-popup-panel">
          <div class="resolution-popup-scroll">
            <TurnResolutionPanel
              :turnResolution="gameStore.lastTurnResolution.turn_resolution_context"
              :stakeholderNames="stakeholderNames"
            />
          </div>
          <div class="resolution-popup-footer">
            <AppButton label="Continue" variant="primary" @click="dismissResolutionPopup" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Tutorial hint popup -->
    <Transition name="tutorial-popup">
      <div
        v-if="gameStore.tutorial.isTutorialMode && gameStore.tutorial.isHintVisible && gameStore.tutorial.currentStep"
        class="tutorial-popup-backdrop"
      >
        <div class="tutorial-popup-panel" role="dialog" aria-modal="true" aria-labelledby="tutorial-popup-title">
          <div class="tutorial-popup-header">
            <span class="tutorial-popup-icon" aria-hidden="true">📖</span>
            <h3 id="tutorial-popup-title" class="tutorial-popup-title">{{ gameStore.tutorial.currentStep.title }}</h3>
            <span v-if="gameStore.tutorial.totalSteps > 0" class="tutorial-popup-counter">
              {{ gameStore.tutorial.currentStepNumber }}&thinsp;/&thinsp;{{ gameStore.tutorial.totalSteps }}
            </span>
          </div>
          <div class="tutorial-popup-body">
            <p class="tutorial-popup-message">{{ gameStore.tutorial.currentStep.message }}</p>
          </div>
          <div class="tutorial-popup-footer">
            <AppButton
              :label="gameStore.tutorial.isLastStep ? 'Got it' : 'Next →'"
              variant="primary"
              @click="gameStore.tutorial.dismissCurrentHint()"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Run complete popup -->
    <Transition name="run-complete-popup">
      <div
        v-if="runCompletePopupOpen"
        class="run-complete-popup-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="run-complete-popup-title"
      >
        <div class="run-complete-popup-panel">
          <div class="run-complete-popup-header">
            <span class="run-complete-popup-icon" aria-hidden="true">🏁</span>
            <h3 id="run-complete-popup-title" class="run-complete-popup-title">Run Complete!</h3>
          </div>
          <div class="run-complete-popup-body">
            <p class="run-complete-popup-message">
              Your architectural journey has reached its conclusion.
            </p>
          </div>
          <div class="run-complete-popup-footer">
            <AppButton
              label="Stay Here"
              variant="secondary"
              @click="runCompletePopupOpen = false"
            />
            <AppButton
              label="View Results"
              variant="primary"
              @click="goToEndScreen"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- System coupling effects popup: explains active card-gain modifiers -->
    <Transition name="coupling-popup">
      <div
        v-if="activeEffectsPopupOpen"
        class="coupling-popup-backdrop"
        @click.self="activeEffectsPopupOpen = false"
      >
        <div class="coupling-popup-panel" role="dialog" aria-modal="true" aria-labelledby="coupling-popup-title">
          <div class="coupling-popup-header">
            <IconSpell :size="20" class="coupling-popup-icon" />
            <h3 id="coupling-popup-title" class="coupling-popup-title">System Coupling Active</h3>
          </div>
          <div class="coupling-popup-body">
            <p class="coupling-popup-intro">
              One or more system dimensions have collapsed below critical thresholds.
              Positive gains from architectural cards are currently being reduced.
            </p>
            <div
              v-for="effect in detailedCouplingEffects"
              :key="effect.triggerScoreId"
              class="coupling-effect-item"
            >
              <div class="coupling-effect-header">
                <span class="coupling-effect-icon">{{ effect.icon }}</span>
                <div class="coupling-effect-header-text">
                  <div class="coupling-effect-title">{{ effect.title }}</div>
                  <div class="coupling-effect-desc">{{ effect.description }}</div>
                </div>
              </div>
              <div class="coupling-effect-score-info">
                {{ getMetricPresentation(effect.triggerScoreId).label }} is at
                <strong>{{ effect.currentValue }}</strong>
                (collapses below {{ effect.threshold }})
              </div>
              <div v-if="effect.affected_score_ids.length > 0" class="coupling-affected-scores">
                <span class="coupling-affected-label">Affected gains:</span>
                <div class="coupling-affected-list">
                  <span
                    v-for="scoreId in effect.affected_score_ids"
                    :key="scoreId"
                    class="coupling-affected-score"
                  >
                    {{ getMetricPresentation(scoreId).label }}
                    <span class="coupling-reduction">−{{ Math.round((1 - effect.multiplier) * 100) }}%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="coupling-popup-footer">
            <AppButton label="Got it" variant="primary" @click="activeEffectsPopupOpen = false" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- Glowing pointer arrow: floats above the satchel when player must pick a card -->
    <TutorialPointerArrow :show="showSatchelArrow" />

    <SatchelToggleButton
      v-if="!gameStore.isRunComplete && !isSatchelOpen"
      :totalCards="handCardEntries.length"
      :playableCards="playableCardCount"
      @open="isSatchelOpen = true"
    />

    <CardSatchelDrawer
      v-if="!gameStore.isRunComplete"
      v-model:isOpen="isSatchelOpen"
      :totalCards="handCardEntries.length"
      :playableCards="playableCardCount"
    >
      <template #toolbar>
        <SatchelToolbar
          v-if="handCardEntries.length > 0"
          :availableCategories="availableCategories"
          :affectedMetrics="affectedMetrics"
          v-model:activeCategory="satchelCategory"
          v-model:activeSort="satchelSort"
        />
        <div v-if="canConsultArchives" class="consult-bar">
          <p class="consult-copy">
            {{ isConsultMode
              ? 'Choose one hand card to set aside. Aftershocks and random events still land.'
              : 'Spend this turn searching the remaining scrolls instead of committing a move.' }}
          </p>
          <AppButton
            v-if="!isConsultMode"
            label="Consult the Archives"
            variant="secondary"
            :disabled="gameStore.isPlayingTurn"
            @click="isConsultMode = true"
          />
          <AppButton
            v-else
            label="Cancel search"
            variant="subtle"
            :disabled="gameStore.isPlayingTurn"
            @click="isConsultMode = false"
          />
        </div>
      </template>

      <ActionCard
        v-for="entry in filteredSortedCards"
        :key="entry.card.id + '-v' + entry.card.version"
        :card="entry.card"
        :availability="entry.availability"
        :isDisabled="gameStore.isPlayingTurn"
        :isTutorialLocked="!isConsultMode && isTutorialCardLocked(entry.card.id)"
        :isTutorialHighlighted="!isConsultMode && isTutorialCardHighlighted(entry.card.id)"
        :primaryActionLabel="isConsultMode ? 'Set aside' : undefined"
        :scores="gameStore.turnBriefing?.current_scores"
        @showDetails="handleShowDetails(entry.card.id)"
        @play="handleHandCardAction"
      />

      <template #after>
        <section v-if="deckCardEntries.length > 0" class="grimoire-section" aria-label="Grimoire">
          <h3 class="grimoire-title">Grimoire</h3>
          <p class="grimoire-copy">Inspect the remaining deck. These cards are not legal to play until drawn.</p>
          <div class="cards-grid">
            <ActionCard
              v-for="entry in deckCardEntries"
              :key="'grimoire-' + entry.card.id + '-v' + entry.card.version"
              :card="entry.card"
              :availability="entry.availability"
              :isInspectOnly="true"
              :scores="gameStore.turnBriefing?.current_scores"
              @showDetails="handleShowDetails(entry.card.id)"
            />
          </div>
        </section>
      </template>
    </CardSatchelDrawer>
  </div>
</template>

<script setup lang="ts">
/**
 * Primary in-run gameplay surface.
 *
 * This view orchestrates UI composition and user interactions using game store
 * outputs. Gameplay rules remain simulation-domain responsibilities.
 */
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { Card } from '@/domains/content/model'
import { versionRefKey } from '@/domains/content/model'
import type { TurnBriefingActionSummary } from '@/domains/simulation'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import { buildStakeholderNamesMap } from '@/ui/composables/stakeholder_presentation'
import { getCollapseWarnings, hasActiveCoupling } from '@/ui/composables/system_coupling'
import { getActiveCouplingEffects } from '@/domains/simulation'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { resolveScenarioShortDescription } from '@/ui/composables/scenario_presentation'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'
import {
  buildGameplayStageActors,
  pickRandomSceneId,
  shuffleAvatarRoles,
  type StakeholderSpeechBubblePresentation,
} from '@/ui/composables/gameplay_stage_presentation'
import { buildStakeholderSpeechBubbles } from '@/ui/composables/stakeholder_reaction_bubbles'
import type { AvatarRoleId, SceneBackgroundId } from '@/ui/config/presentation_asset_types'
import ActionCard from '@/ui/components/cards/action_card.vue'
import CardSatchelDrawer from '@/ui/components/cards/card_satchel_drawer.vue'
import SatchelToolbar from '@/ui/components/cards/satchel_toolbar.vue'
import TurnResolutionPanel from '@/ui/components/turn/turn_resolution_panel.vue'
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
import StakeholderHud from '@/ui/components/stakeholders/stakeholder_hud.vue'
import ScoreHud from '@/ui/components/scores/score_hud.vue'
import SceneStage from '@/ui/components/gameplay/scene_stage.vue'
import SatchelToggleButton from '@/ui/components/cards/satchel_toggle_button.vue'
import GameHudSidebar from '@/ui/components/common/game_hud_sidebar.vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
import IconSpell from '@/ui/components/icons/IconSpell.vue'
import {
  filterByCategory,
  sortCards,
  getAvailableCategories,
  getAffectedMetrics,
} from '@/ui/composables/card_filter_sort'
import type { CategoryFilter, SortOption } from '@/ui/composables/card_filter_sort'

const router = useRouter()
const gameStore = useGameStore()

const modalCardId = ref<string | null>(null)
const isSatchelOpen = ref(false)
const resolutionPopupOpen = ref(false)
const isResolutionExpanded = ref(false)
const isScenarioInfoOpen = ref(false)
const isScenarioInfoExpanded = ref(false)
const activeEffectsPopupOpen = ref(false)
const runCompletePopupOpen = ref(false)
const randomSceneId = ref<SceneBackgroundId>(pickRandomSceneId())
const randomAvatarRoles = ref<AvatarRoleId[]>(shuffleAvatarRoles())
const satchelCategory = ref<CategoryFilter>('all')
const satchelSort = ref<SortOption>('default')
const isConsultMode = ref(false)
const pendingStakeholderBubbles = ref<Record<string, StakeholderSpeechBubblePresentation>>({})
const activeStakeholderBubbles = ref<Record<string, StakeholderSpeechBubblePresentation>>({})
const gameShellEl = ref<HTMLElement | null>(null)
const headerSentinelEl = ref<HTMLElement | null>(null)
const isSidebarVisible = ref(false)
const isHeaderStuck = ref(false)
const isHeaderCollapsed = ref(false)

const MIN_MAIN_COLUMN_WIDTH_PX = 700
const DEFAULT_SIDEBAR_WIDTH_PX = 280
const DEFAULT_COLUMN_GAP_PX = 12
const HEADER_COLLAPSE_STORAGE_KEY = 'dddnd:game-hud-collapsed'

let shellResizeObserver: ResizeObserver | null = null
let headerStickObserver: IntersectionObserver | null = null
let sidebarWidthPx = DEFAULT_SIDEBAR_WIDTH_PX
let columnGapPx = DEFAULT_COLUMN_GAP_PX

function readPxToken(tokenName: string, fallbackPx: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim()
  if (!raw) return fallbackPx

  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallbackPx
}

function updateSidebarVisibility(shellWidth?: number): void {
  const width = shellWidth ?? gameShellEl.value?.clientWidth ?? 0
  const minShellWidthForSidebar = sidebarWidthPx + columnGapPx + MIN_MAIN_COLUMN_WIDTH_PX
  isSidebarVisible.value = width >= minShellWidthForSidebar
}

function refreshSidebarLayout(shellWidth?: number): void {
  sidebarWidthPx = readPxToken('--layout-sidebar-width', DEFAULT_SIDEBAR_WIDTH_PX)
  columnGapPx = readPxToken('--space-md', DEFAULT_COLUMN_GAP_PX)
  updateSidebarVisibility(shellWidth)
}

function handleWindowResize(): void {
  refreshSidebarLayout()
}

const isHeaderCollapsedView = computed(() => {
  return isHeaderCollapsed.value && !isSidebarVisible.value
})

function setHeaderCollapsed(collapsed: boolean): void {
  isHeaderCollapsed.value = collapsed
}

const scenario = computed(() => gameStore.scenarioBundle?.scenario)

const playerDisplayName = computed(() => gameStore.gameState?.player_profile.display_name)

const playerClassName = computed(() => {
  const classRef = gameStore.gameState?.player_profile.selected_class_ref
  if (!classRef) return undefined
  const found = gameStore.availableClasses.find(
    c => c.id === classRef.id && c.version === classRef.version
  )
  return found?.name
})

const playerClassId = computed(() => {
  return gameStore.gameState?.player_profile.selected_class_ref?.id
})

function getMetricIcon(scoreId: string): string {
  return getMetricPresentation(scoreId).icon
}

function getMetricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label
}

function getScoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}

const STAKEHOLDER_ICONS: Record<string, string> = {
  cto: '🏛️',
  vp_product: '📋',
  lead_developer: '💻',
  lead_engineer: '💻',
  operations_manager: '⚙️',
  operations_team: '⚙️',
  engineering_team: '🔧',
  product_team: '📦',
  finance_team: '💵',
  users: '👤',
  support_team: '🎧',
  leadership_team: '👔',
}

function getStakeholderIcon(stakeholderId: string): string {
  return STAKEHOLDER_ICONS[stakeholderId] ?? '👤'
}

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, gameStore.scenarioBundle?.scenario ? stakeholderNames.value : undefined)
}

function getSatisfactionClass(value: number): string {
  if (value >= 70) return 'supportive'
  if (value >= 50) return 'neutral'
  if (value >= 30) return 'concerned'
  return 'critical'
}

const scenarioShortDescription = computed(() => {
  if (!scenario.value) return 'A troubled realm awaits your command.'
  return resolveScenarioShortDescription(scenario.value)
})

const scenarioInfoTitle = computed(() => {
  if (!scenario.value) return 'Scenario'
  return isScenarioInfoExpanded.value ? `${scenario.value.name} · Introduction` : scenario.value.name
})

const scenarioScoreSnapshot = computed(() => {
  return gameStore.gameState?.scores ?? scenario.value?.starting_scores ?? {}
})

const scenarioStakeholderSnapshot = computed(() => {
  return gameStore.gameState?.stakeholders ?? {}
})

const scenarioQuickFacts = computed(() => {
  return [
    { label: 'Turns', value: `${gameStore.maxTurns}` },
    { label: 'Scores', value: `${Object.keys(scenarioScoreSnapshot.value).length}` },
    { label: 'The council', value: `${Object.keys(scenarioStakeholderSnapshot.value).length}` },
    { label: 'Cards', value: `${gameStore.scenarioBundle?.cards.size ?? 0}` },
  ]
})

const activeChallengeModifier = computed(() => {
  const modifierRef = gameStore.gameState?.player_profile.challenge_modifier_ref
  if (!modifierRef) {
    return null
  }

  return gameStore.availableChallengeModifiers.find(
    modifier => modifier.id === modifierRef.id && modifier.version === modifierRef.version
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
    if (typeof adjustment !== 'number' || adjustment === 0) {
      continue
    }

    const adjustedValue = Math.max(0, Math.min(100, baseValue + adjustment))
    if (adjustedValue === baseValue) {
      continue
    }

    result[scoreId] = {
      base: baseValue,
      adjusted: adjustedValue,
      modifierName,
    }
  }

  return result
})

const turnsRemaining = computed(() => {
  return Math.max(0, gameStore.maxTurns - gameStore.currentTurn + 1)
})

const isLowTurns = computed(() => {
  if (gameStore.tutorial?.isTutorialMode) return false
  return turnsRemaining.value > 0 && turnsRemaining.value <= 3
})

const gameplaySceneId = computed(() => randomSceneId.value)

const currentAvailableActions = computed(() => {
  return gameStore.turnBriefing?.available_action_card_ids.length ?? 0
})

const pendingAftershockCount = computed(() => {
  return gameStore.turnBriefing?.pending_delayed_effects_resolving_this_turn.length ?? 0
})

const currentScores = computed(() => gameStore.turnBriefing?.current_scores ?? {})

const hiddenScoreState = computed(() => {
  const values = Object.values(currentScores.value)
  if (!values.length) return { label: 'Unknown', cssClass: '' }

  const min = Math.min(...values)
  if (min < 20) return { label: 'Critical', cssClass: 'status-critical' }
  if (min < 40) return { label: 'Warning', cssClass: 'status-warning' }
  if (min < 60) return { label: 'Caution', cssClass: 'status-caution' }
  return { label: 'Stable', cssClass: 'status-stable' }
})

const hiddenScoreStateVisible = computed(() => {
  return gameStore.turnBriefing && !gameStore.isRunComplete && Object.keys(currentScores.value).length > 0
})

const hiddenScoreStateTitle = computed(() => {
  return 'System scores are hidden in the collapsed HUD. Expand to view the full score panel.'
})

const collapseWarnings = computed(() => getCollapseWarnings(currentScores.value))

const hasActiveCardEffects = computed(() => hasActiveCoupling(currentScores.value))

const detailedCouplingEffects = computed(() => {
  const warnings = getCollapseWarnings(currentScores.value)
  const effects = getActiveCouplingEffects(currentScores.value)
  return warnings.map(w => {
    const effect = effects.find(e => e.trigger_score_id === w.triggerScoreId)
    return {
      ...w,
      affected_score_ids: effect?.affected_score_ids ?? [],
      multiplier: effect?.multiplier ?? 1
    }
  })
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
      versionRefKey({ id: summary.card_id, version: summary.card_version })
    )
    if (card) {
      cards.push({
        card,
        availability: availabilitySummaryByKey.value.get(
          versionRefKey({ id: summary.card_id, version: summary.card_version })
        ),
      })
    }
  }

  return cards
}

const handCardEntries = computed(() => cardsFromSummaries(gameStore.turnBriefing?.hand_action_summaries ?? []))
const deckCardEntries = computed(() => cardsFromSummaries(gameStore.turnBriefing?.deck_action_summaries ?? []))
const availableCardEntries = computed(() => [...handCardEntries.value, ...deckCardEntries.value])

const playableCardCount = computed(() => {
  return handCardEntries.value.filter(
    entry => !entry.availability || entry.availability.is_playable
  ).length
})

const availableCategories = computed(() => getAvailableCategories(handCardEntries.value))
const affectedMetrics = computed(() => getAffectedMetrics(handCardEntries.value))

const filteredSortedCards = computed(() => {
  const filtered = filterByCategory(handCardEntries.value, satchelCategory.value)
  return sortCards(filtered, satchelSort.value)
})

const tutorialRequiredCardId = computed(() => gameStore.tutorial.requiredCardId ?? null)

function isTutorialCardLocked(cardId: string): boolean {
  return tutorialRequiredCardId.value !== null && cardId !== tutorialRequiredCardId.value
}

function isTutorialCardHighlighted(cardId: string): boolean {
  return tutorialRequiredCardId.value !== null && cardId === tutorialRequiredCardId.value
}

const modalCard = computed(() => {
  if (!modalCardId.value || !gameStore.scenarioBundle) {
    return null
  }

  return availableCardEntries.value.find(entry => entry.card.id === modalCardId.value)?.card || null
})

const modalCardAvailability = computed(() => {
  if (!modalCardId.value) {
    return undefined
  }

  return availableCardEntries.value.find(entry => entry.card.id === modalCardId.value)?.availability
})

const isModalCardInHand = computed(() => {
  if (!modalCardId.value) {
    return false
  }

  return handCardEntries.value.some(entry => entry.card.id === modalCardId.value)
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

watch(scenario, (newScenario, oldScenario) => {
  if (newScenario?.id !== oldScenario?.id) {
    randomSceneId.value = pickRandomSceneId()
    randomAvatarRoles.value = shuffleAvatarRoles()
  }
}, { immediate: false })

watch(isHeaderCollapsed, (collapsed) => {
  try {
    localStorage.setItem(HEADER_COLLAPSE_STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    // Ignore persistence failures in constrained browser contexts.
  }
})

watch(isSidebarVisible, (visible) => {
  if (visible) {
    isHeaderCollapsed.value = false
  }
})

onMounted(() => {
  if (!gameStore.hasActiveRun) {
    router.push('/play')
    return
  }

  // Ensure gameplay starts at the top instead of restoring a stale scroll position.
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

  try {
    isHeaderCollapsed.value = localStorage.getItem(HEADER_COLLAPSE_STORAGE_KEY) === '1'
  } catch {
    isHeaderCollapsed.value = false
  }

  refreshSidebarLayout()
  window.addEventListener('resize', handleWindowResize)

  if (gameShellEl.value) {
    shellResizeObserver = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width
      refreshSidebarLayout(nextWidth)
    })
    shellResizeObserver.observe(gameShellEl.value)
  }

  if (headerSentinelEl.value) {
    headerStickObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        isHeaderStuck.value = entry ? entry.intersectionRatio < 1 : false
      },
      {
        threshold: [1],
        rootMargin: '-8px 0px 0px 0px',
      }
    )
    headerStickObserver.observe(headerSentinelEl.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleWindowResize)
  shellResizeObserver?.disconnect()
  shellResizeObserver = null
  headerStickObserver?.disconnect()
  headerStickObserver = null
})

function handleResetRun() {
  gameStore.reset()
  router.push('/play')
}

function openScenarioInfo() {
  isScenarioInfoExpanded.value = false
  isScenarioInfoOpen.value = true
}

function closeScenarioInfo() {
  isScenarioInfoOpen.value = false
  isScenarioInfoExpanded.value = false
}

function toggleScenarioInfoDetails() {
  isScenarioInfoExpanded.value = !isScenarioInfoExpanded.value
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

const canConsultArchives = computed(() => gameStore.turnBriefing?.can_consult_archives === true)

async function applyCommittedTurn() {
  const turnResolution = gameStore.lastTurnResolution?.turn_resolution_context

  if (turnResolution) {
    pendingStakeholderBubbles.value = buildStakeholderSpeechBubbles(
      turnResolution.stakeholder_resolution.reactions,
      turnResolution.turn_number,
    )
    resolutionPopupOpen.value = true
    isResolutionExpanded.value = false
  }

  if (gameStore.isRunComplete) {
    gameStore.get_run_outcome()
    if (!gameStore.tutorial.isTutorialMode && !turnResolution) {
      runCompletePopupOpen.value = true
    }
    await nextTick()
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
  isSatchelOpen.value = false
  isConsultMode.value = false
  activeStakeholderBubbles.value = {}
  pendingStakeholderBubbles.value = {}
  await gameStore.play_turn(cardId)
  await applyCommittedTurn()
}

async function handleConsultCard(cardId: string) {
  modalCardId.value = null
  isSatchelOpen.value = false
  isConsultMode.value = false
  activeStakeholderBubbles.value = {}
  pendingStakeholderBubbles.value = {}
  await gameStore.consult_archives([cardId])
  await applyCommittedTurn()
}

function dismissResolutionPopup() {
  resolutionPopupOpen.value = false
  activeStakeholderBubbles.value = pendingStakeholderBubbles.value
  pendingStakeholderBubbles.value = {}

  if (gameStore.isRunComplete && !gameStore.tutorial.isTutorialMode) {
    runCompletePopupOpen.value = true
  }
}

const showSatchelArrow = computed(() => {
  return (
    gameStore.tutorial.isTutorialMode &&
    !gameStore.tutorial.isHintVisible &&
    !isSatchelOpen.value &&
    (gameStore.tutorial.requiredCardId !== null || gameStore.tutorial.currentStepHighlight === 'satchel')
  )
})

function goToEndScreen() {
  runCompletePopupOpen.value = false
  router.push('/end')
}
</script>

<style scoped>
.game-view {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 12%, rgba(101, 123, 181, 0.18) 0%, transparent 45%),
    radial-gradient(circle at 84% 16%, rgba(77, 111, 92, 0.2) 0%, transparent 40%),
    linear-gradient(180deg, #0d1019 0%, #121827 48%, #111420 100%);
  /* Account for iPhone home bar with safe-area-inset-bottom */
  padding-bottom: max(
    calc(var(--drawer-handle-height) + var(--space-lg)),
    calc(var(--drawer-handle-height) + env(safe-area-inset-bottom, var(--space-lg)))
  );
}

.game-shell {
  width: min(1280px, 100% - 2rem);
  margin: 0 auto;
  padding: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  overflow-anchor: none;
}

.play-header-sentinel {
  position: relative;
  height: 1px;
  margin-top: -1px;
  pointer-events: none;
}

.play-header {
  position: sticky;
  top: 0.4rem;
  z-index: var(--z-drawer);
  background: rgba(9, 11, 20, 0.68);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  backdrop-filter: blur(8px);
  box-shadow: var(--shadow-panel);
  padding: 0.65rem 0.8rem;
  overflow-anchor: none;
  transition: padding var(--duration-fast) var(--ease-standard),
              background var(--duration-fast) var(--ease-standard),
              box-shadow var(--duration-fast) var(--ease-standard),
              border-color var(--duration-fast) var(--ease-standard);
}

.play-header.is-stuck {
  padding: 0.5rem 0.7rem;
  background: rgba(9, 11, 20, 0.86);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
  border-color: color-mix(in oklab, var(--border-subtle), rgba(255, 255, 255, 0.2) 18%);
}

.play-header.is-collapsed {
  padding: 0.45rem 0.65rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex-wrap: wrap;
  min-width: 0;
}

.header-collapsed-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-width: 0;
}

.turn-pill {
  margin: 0;
  color: var(--text-bright);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  font-weight: var(--font-semibold);
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  background: rgba(255, 255, 255, 0.04);
}

.turn-pill-collapsed {
  padding: 0.2rem 0.5rem;
  font-size: 10px;
}

.scenario-pill {
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid color-mix(in oklab, var(--dng-bronze-mid, #a07018), transparent 50%);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  background: rgba(160, 112, 24, 0.08);
  color: var(--text-warm, #c4a96a);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.scenario-pill:hover {
  background: rgba(160, 112, 24, 0.18);
  border-color: color-mix(in oklab, var(--dng-bronze-mid, #a07018), transparent 25%);
}

.scenario-pill:focus-visible {
  outline: 2px solid var(--border-focus, rgba(38, 212, 185, 0.70));
  outline-offset: 2px;
}

.scenario-pill-icon {
  font-size: 0.85em;
}

.scenario-pill-name {
  max-width: 18ch;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scenario-pill-info {
  font-size: 0.8em;
  opacity: 0.6;
}

.scenario-info-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.scenario-info-summary {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: 1.65;
}

.scenario-info-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
}

.scenario-info-fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-sm);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.scenario-info-fact-label {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-muted);
}

.scenario-info-fact-value {
  font-size: var(--text-sm);
  color: var(--text-bright);
  font-weight: var(--font-semibold);
}

.scenario-info-nudge {
  margin: 0;
  color: var(--dng-footer-muted);
  font-size: var(--text-xs);
  line-height: 1.5;
}

.scenario-info-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding: var(--space-sm) 0;
}

.scenario-info-section-header {
  margin-bottom: 0;
}

.scenario-info-section-copy {
  margin: 0;
  color: var(--dng-subtitle-warm);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.scenario-info-score-grid,
.scenario-info-stakeholder-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-sm);
}

.scenario-info-metric,
.scenario-info-stakeholder {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
}

.scenario-info-metric-icon,
.scenario-info-stakeholder-icon {
  line-height: 1;
}

.scenario-info-metric-label,
.scenario-info-stakeholder-name {
  min-width: 0;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scenario-info-metric-value,
.scenario-info-stakeholder-value {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
}

.scenario-info-metric-value.high,
.scenario-info-stakeholder-value.supportive { color: var(--score-high); }
.scenario-info-metric-value.medium,
.scenario-info-stakeholder-value.neutral { color: var(--score-medium); }
.scenario-info-metric-value.low,
.scenario-info-stakeholder-value.concerned { color: var(--score-low); }
.scenario-info-metric-value.critical,
.scenario-info-stakeholder-value.critical { color: var(--score-critical); }

@media (max-width: 640px) {
  .scenario-info-facts,
  .scenario-info-score-grid,
  .scenario-info-stakeholder-grid {
    grid-template-columns: 1fr;
  }
}

.scenario-info-desc {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: 1.6;
}

.scenario-info-flavor {
  margin: 0;
  color: var(--text-dim);
  font-style: italic;
  font-size: var(--text-sm);
  border-left: 2px solid var(--border-subtle);
  padding-left: 0.8rem;
}

.header-indicators {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.header-indicators-collapsed {
  gap: 0.3rem;
}

.header-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  background: rgba(255, 255, 255, 0.04);
  white-space: nowrap;
}

.header-pill-compact {
  padding: 0.15rem 0.45rem;
  font-size: 10px;
  min-width: 0;
}

.score-state-pill {
  letter-spacing: 0.02em;
}

.score-state-pill-button {
  appearance: none;
  cursor: pointer;
  font: inherit;
  text-transform: none;
}

.score-state-pill-button:hover {
  filter: brightness(1.08);
}

.score-state-pill-button:focus-visible {
  outline: 2px solid var(--border-focus, rgba(38, 212, 185, 0.7));
  outline-offset: 2px;
}

.score-state-pill.status-critical { color: var(--score-critical); border-color: color-mix(in oklab, var(--score-critical), transparent 45%); background: rgba(248, 113, 113, 0.08); }
.score-state-pill.status-warning { color: var(--score-low); border-color: color-mix(in oklab, var(--score-low), transparent 45%); background: rgba(251, 191, 36, 0.08); }
.score-state-pill.status-caution { color: var(--score-medium); border-color: color-mix(in oklab, var(--score-medium), transparent 45%); background: rgba(96, 165, 250, 0.08); }
.score-state-pill.status-stable { color: var(--score-high); border-color: color-mix(in oklab, var(--score-high), transparent 45%); background: rgba(52, 211, 153, 0.08); }

.header-collapse-btn {
  all: unset;
  box-sizing: border-box;
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  cursor: pointer;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.03);
  transition: border-color var(--duration-fast) var(--ease-standard),
              color var(--duration-fast) var(--ease-standard),
              background var(--duration-fast) var(--ease-standard);
}

.header-collapse-btn:hover {
  color: var(--text-bright);
  border-color: color-mix(in oklab, var(--dng-bronze-mid), transparent 35%);
  background: rgba(160, 112, 24, 0.12);
}

.header-collapse-btn:focus-visible {
  outline: 2px solid var(--border-focus, rgba(38, 212, 185, 0.7));
  outline-offset: 2px;
}

.collapse-btn-icon {
  font-size: 0.75em;
  line-height: 1;
}

.collapse-btn-label {
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.actions-pill {
  color: var(--text-bright);
  border-color: color-mix(in oklab, var(--dng-bronze-mid), transparent 40%);
  background: rgba(160, 112, 24, 0.1);
}

.aftershock-pill {
  color: var(--effect-warning);
  border-color: var(--effect-warning-border);
  background: var(--effect-warning-bg);
}

.low-turns-pill {
  color: var(--effect-warning);
  border-color: var(--effect-warning-border);
  background: var(--effect-warning-bg);
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}

.score-strip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
}

.score-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--border-subtle);
  border-radius: 999px;
  padding: 0.25rem 0.5rem 0.32rem;
  background: rgba(255, 255, 255, 0.04);
  position: relative;
  overflow: hidden;
}

.score-chip.high    { border-color: color-mix(in oklab, var(--score-high),     transparent 55%); }
.score-chip.medium  { border-color: color-mix(in oklab, var(--score-medium),   transparent 55%); }
.score-chip.low     { border-color: color-mix(in oklab, var(--score-low),      transparent 45%); }
.score-chip.critical { border-color: color-mix(in oklab, var(--score-critical), transparent 35%); }

.score-chip-label {
  color: var(--text-secondary);
  font-size: 10px;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.score-chip-value {
  color: var(--text-accent);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
}

.score-chip.high .score-chip-value    { color: var(--score-high); }
.score-chip.medium .score-chip-value  { color: var(--score-medium); }
.score-chip.low .score-chip-value     { color: var(--score-low); }
.score-chip.critical .score-chip-value { color: var(--score-critical); }

.score-chip-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: var(--chip-fill, 0%);
  transition: width var(--duration-bar) cubic-bezier(0.4, 0, 0.2, 1);
}

.score-chip.high .score-chip-bar    { background: var(--score-high); }
.score-chip.medium .score-chip-bar  { background: var(--score-medium); }
.score-chip.low .score-chip-bar     { background: var(--score-low); }
.score-chip.critical .score-chip-bar { background: var(--score-critical); }

.play-body {
  display: flex;
  align-items: start;
  gap: var(--space-md);
}

.play-sidebar-wrapper {
  display: block;
  flex-shrink: 0;
}

.play-sidebar-wrapper :deep(.hud-sidebar) {
  border-right: none;
  border: 1px solid var(--hud-border);
  border-radius: 14px;
  top: 60px;
  height: calc(100vh - 60px);
}

.header-stat-zone {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  flex-wrap: wrap;
  flex: 1 0 100%;
  width: 100%;
  margin-left: 0;
  min-width: 0;
}

.header-stat-zone > * {
  flex: 1 1 320px;
  min-width: 0;
}

.play-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.stage-section {
  width: 100%;
  position: relative;
}

.below-scene {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  max-width: 680px;
}

.low-turns-inline {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: linear-gradient(135deg, var(--effect-warning-bg), rgba(255, 152, 0, 0.06));
  border: 2px solid var(--effect-warning-border);
  border-radius: 12px;
  padding: 0.65rem 0.85rem;
  animation: pulse-warning 2s ease-in-out infinite;
}

.low-turns-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.low-turns-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.low-turns-title {
  color: var(--effect-warning);
  font-size: var(--text-xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.low-turns-msg {
  color: var(--effect-warning);
  font-size: var(--text-sm);
}

.aftershock-alert {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: linear-gradient(135deg, rgba(20, 12, 0, 0.82) 0%, rgba(30, 18, 0, 0.78) 100%);
  border: 1px solid var(--effect-warning-border);
  border-radius: 10px;
  padding: 0.4rem 0.65rem;
  backdrop-filter: blur(6px);
  pointer-events: none;
  max-width: 220px;
}

.alert-icon {
  font-size: var(--text-sm);
  line-height: 1;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  color: var(--effect-warning);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}

.run-complete-card {
  background: rgba(11, 15, 25, 0.9);
  border: 1px solid var(--border-accent);
  border-radius: 14px;
  padding: 1.25rem;
  text-align: center;
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.complete-icon {
  font-size: 2rem;
}

.complete-title {
  color: var(--text-bright);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0;
}

.complete-message {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0;
}

.alert-message {
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  white-space: nowrap;
}

/* ─── Run complete popup ─── */
.run-complete-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(4, 6, 14, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.run-complete-popup-panel {
  width: min(480px, 100%);
  display: flex;
  flex-direction: column;
  background: var(--surface-modal, #0d1019);
  border: 1px solid color-mix(in oklab, var(--border-accent, #a989fa), transparent 22%);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75);
  overflow: hidden;
}

.run-complete-popup-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem 1.25rem 0.75rem;
  background: rgba(169, 137, 250, 0.08);
  border-bottom: 1px solid color-mix(in oklab, var(--border-accent, #a989fa), transparent 72%);
}

.run-complete-popup-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.run-complete-popup-title {
  margin: 0;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.run-complete-popup-body {
  padding: 1rem 1.25rem 0.9rem;
}

.run-complete-popup-message {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.run-complete-popup-footer {
  flex-shrink: 0;
  padding: 0.75rem 1.25rem 1rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
  background: rgba(8, 11, 19, 0.5);
}

.run-complete-popup-enter-active {
  transition: opacity 0.2s var(--ease-decelerate), transform 0.2s var(--ease-decelerate);
}

.run-complete-popup-leave-active {
  transition: opacity 0.14s var(--ease-accelerate), transform 0.14s var(--ease-accelerate);
}

.run-complete-popup-enter-from,
.run-complete-popup-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(6px);
}

@media (max-width: 768px) {
  .game-shell {
    width: min(1280px, 100% - 1rem);
  }

  .header-collapse-btn {
    padding: 0.18rem 0.5rem;
    font-size: 10px;
  }

  .turn-pill-collapsed,
  .header-pill-compact {
    font-size: 9px;
  }

  .aftershock-alert {
    max-width: 160px;
    padding: 0.3rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .run-complete-popup-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .run-complete-popup-panel {
    width: 100%;
    border-radius: 18px 18px 0 0;
  }

  .collapse-btn-label {
    display: none;
  }
}

.aftershock-badge-enter-active {
  transition: opacity 0.2s var(--ease-decelerate), transform 0.2s var(--ease-decelerate);
}
.aftershock-badge-leave-active {
  transition: opacity 0.15s var(--ease-accelerate), transform 0.15s var(--ease-accelerate);
}
.aftershock-badge-enter-from,
.aftershock-badge-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.95);
}

/* ─── Resolution collapsible summary ─── */
.resolution-summary {
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  background: rgba(8, 11, 19, 0.52);
}

.resolution-summary.expanded {
  border-color: var(--border-accent);
}

.resolution-summary-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 0.85rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.resolution-summary-header:hover {
  background: rgba(255, 255, 255, 0.04);
}

.resolution-summary-icon {
  font-size: var(--text-sm);
  flex-shrink: 0;
}

.resolution-summary-title {
  flex: 1;
  color: var(--text-secondary);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.resolution-summary-toggle {
  font-size: var(--text-xs);
  color: var(--text-muted);
  flex-shrink: 0;
}

.resolution-summary-body {
  border-top: 1px solid var(--border-subtle);
}

.resolution-summary-body :deep(.turn-resolution-panel) {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.resolution-expand-enter-active {
  transition: opacity var(--duration-fast) var(--ease-decelerate),
              transform var(--duration-fast) var(--ease-decelerate);
}
.resolution-expand-leave-active {
  transition: opacity var(--duration-instant) var(--ease-accelerate),
              transform var(--duration-instant) var(--ease-accelerate);
}
.resolution-expand-enter-from,
.resolution-expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ─── Resolution popup ─── */
.resolution-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(4, 6, 14, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.resolution-popup-panel {
  width: min(600px, 100%);
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  background: var(--surface-modal);
  border: 1px solid var(--border-accent);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.7);
  overflow: hidden;
}

.resolution-popup-scroll {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--border-subtle) transparent;
}

.resolution-popup-scroll :deep(.turn-resolution-panel) {
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.resolution-popup-footer {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  background: rgba(8, 11, 19, 0.6);
}

.resolution-popup-enter-active {
  transition: opacity 0.18s var(--ease-decelerate),
              transform 0.18s var(--ease-decelerate);
}
.resolution-popup-leave-active {
  transition: opacity 0.12s var(--ease-accelerate),
              transform 0.12s var(--ease-accelerate);
}
.resolution-popup-enter-from,
.resolution-popup-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (max-width: 480px) {
  /* Resolution popup: full-width sheet from bottom */
  .resolution-popup-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .resolution-popup-panel {
    width: 100%;
    max-height: 86vh;
    border-radius: 18px 18px 0 0;
  }

  /* Play header: tighten pills at narrow width */
  .header-pill,
  .turn-pill {
    font-size: 9px;
    padding: 0.2rem 0.4rem;
  }

  .score-chip-label {
    display: none;
  }
}

/* ─── Tutorial hint popup ─── */
.tutorial-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(4, 6, 14, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.tutorial-popup-panel {
  width: min(520px, 100%);
  display: flex;
  flex-direction: column;
  background: var(--surface-modal, #0d1019);
  border: 1px solid color-mix(in oklab, var(--dng-bronze-mid, #b8860b), transparent 30%);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(200, 155, 20, 0.08);
  overflow: hidden;
}

.tutorial-popup-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem 1.25rem 0.75rem;
  background: rgba(200, 155, 20, 0.06);
  border-bottom: 1px solid color-mix(in oklab, var(--dng-bronze-mid, #b8860b), transparent 65%);
}

.tutorial-popup-icon {
  font-size: var(--text-lg);
  flex-shrink: 0;
}

.tutorial-popup-title {
  flex: 1;
  margin: 0;
  color: var(--dng-title-gold, #c8981e);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.tutorial-popup-counter {
  color: var(--text-muted);
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

.tutorial-popup-body {
  padding: 1.1rem 1.25rem 0.9rem;
}

.tutorial-popup-message {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
}

.tutorial-popup-footer {
  flex-shrink: 0;
  padding: 0.75rem 1.25rem 1rem;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  background: rgba(8, 11, 19, 0.5);
}

.tutorial-popup-enter-active {
  transition: opacity 0.2s var(--ease-decelerate, ease),
              transform 0.2s var(--ease-decelerate, ease);
}
.tutorial-popup-leave-active {
  transition: opacity 0.14s var(--ease-accelerate, ease),
              transform 0.14s var(--ease-accelerate, ease);
}
.tutorial-popup-enter-from,
.tutorial-popup-leave-to {
  opacity: 0;
  transform: scale(0.97) translateY(6px);
}

@media (max-width: 480px) {
  .tutorial-popup-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .tutorial-popup-panel {
    width: 100%;
    border-radius: 18px 18px 0 0;
  }
}

/* ─── System coupling badge (scene overlay, top-left) ─── */
.coupling-effects-badge {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  background: linear-gradient(135deg, rgba(35, 15, 60, 0.88) 0%, rgba(22, 10, 45, 0.84) 100%);
  border: 1px solid rgba(169, 137, 250, 0.45);
  border-radius: 10px;
  padding: 0.4rem 0.65rem;
  backdrop-filter: blur(6px);
  cursor: pointer;
  max-width: 200px;
  color: var(--text-accent);
  transition: border-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
  animation: coupling-pulse 3s ease-in-out infinite;
}

.coupling-effects-badge:hover {
  border-color: rgba(169, 137, 250, 0.72);
  background: linear-gradient(135deg, rgba(50, 22, 80, 0.92) 0%, rgba(32, 14, 60, 0.88) 100%);
  animation: none;
  box-shadow: 0 0 0 4px rgba(169, 137, 250, 0.18), 0 4px 14px rgba(0, 0, 0, 0.45);
}

@keyframes coupling-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(169, 137, 250, 0), 0 4px 12px rgba(0, 0, 0, 0.4); }
  50%       { box-shadow: 0 0 0 4px rgba(169, 137, 250, 0.14), 0 4px 12px rgba(0, 0, 0, 0.4); }
}

.coupling-badge-icon {
  flex-shrink: 0;
  color: var(--text-accent);
}

.coupling-badge-content {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.coupling-badge-title {
  color: var(--text-accent);
  font-size: var(--text-2xs);
  font-weight: var(--font-bold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  white-space: nowrap;
}

.coupling-badge-sub {
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  white-space: nowrap;
}

.coupling-badge-enter-active {
  transition: opacity 0.2s var(--ease-decelerate), transform 0.2s var(--ease-decelerate);
}
.coupling-badge-leave-active {
  transition: opacity 0.15s var(--ease-accelerate), transform 0.15s var(--ease-accelerate);
}
.coupling-badge-enter-from,
.coupling-badge-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.95);
}

/* ─── System coupling popup ─── */
.coupling-popup-backdrop {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  background: rgba(4, 6, 14, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.coupling-popup-panel {
  width: min(520px, 100%);
  max-height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
  background: var(--surface-modal, #0d1019);
  border: 1px solid rgba(169, 137, 250, 0.42);
  border-radius: 18px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(169, 137, 250, 0.08);
  overflow: hidden;
}

.coupling-popup-header {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 1rem 1.25rem 0.75rem;
  background: rgba(60, 20, 100, 0.15);
  border-bottom: 1px solid rgba(169, 137, 250, 0.2);
}

.coupling-popup-icon {
  color: var(--text-accent);
  flex-shrink: 0;
}

.coupling-popup-title {
  flex: 1;
  margin: 0;
  color: var(--text-accent);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-tight);
}

.coupling-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  scrollbar-width: thin;
  scrollbar-color: var(--border-subtle) transparent;
}

.coupling-popup-intro {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin: 0;
  line-height: 1.55;
}

.coupling-effect-item {
  background: rgba(169, 137, 250, 0.05);
  border: 1px solid rgba(169, 137, 250, 0.2);
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.coupling-effect-header {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
}

.coupling-effect-icon {
  font-size: 1.15rem;
  flex-shrink: 0;
  line-height: 1.2;
}

.coupling-effect-header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.coupling-effect-title {
  color: var(--text-bright);
  font-weight: var(--font-bold);
  font-size: var(--text-sm);
}

.coupling-effect-desc {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.coupling-effect-score-info {
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding-left: 1.7rem;
  font-variant-numeric: tabular-nums;
}

.coupling-effect-score-info strong {
  color: var(--effect-negative);
}

.coupling-affected-scores {
  padding-left: 1.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.coupling-affected-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.coupling-affected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.coupling-affected-score {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(169, 137, 250, 0.1);
  border: 1px solid rgba(169, 137, 250, 0.22);
  border-radius: 6px;
  padding: 0.2rem 0.45rem;
  font-size: var(--text-xs);
  color: var(--text-primary);
}

.coupling-reduction {
  color: var(--effect-warning);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
}

.coupling-popup-footer {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  justify-content: flex-end;
  background: rgba(8, 11, 19, 0.6);
}

.coupling-popup-enter-active {
  transition: opacity 0.18s var(--ease-decelerate), transform 0.18s var(--ease-decelerate);
}
.coupling-popup-leave-active {
  transition: opacity 0.12s var(--ease-accelerate), transform 0.12s var(--ease-accelerate);
}
.coupling-popup-enter-from,
.coupling-popup-leave-to {
  opacity: 0;
  transform: scale(0.97);
}

@media (max-width: 480px) {
  .coupling-popup-backdrop {
    padding: 0;
    align-items: flex-end;
  }

  .coupling-popup-panel {
    width: 100%;
    max-height: 86vh;
    border-radius: 18px 18px 0 0;
  }

  .coupling-effects-badge {
    max-width: 160px;
    padding: 0.3rem 0.5rem;
  }
}

.consult-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin: var(--space-md) 0;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--dng-bronze-mid);
  background: color-mix(in srgb, var(--dng-shell-bg) 88%, black);
}

.consult-copy,
.grimoire-copy {
  margin: 0;
  flex: 1 1 16rem;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.grimoire-section {
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid color-mix(in srgb, var(--dng-bronze-mid) 55%, transparent);
}

.grimoire-title {
  margin: 0 0 var(--space-xs);
  color: var(--dng-title-gold);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.grimoire-section .cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-lg);
  margin-top: var(--space-md);
}

@media (max-width: 480px) {
  .grimoire-section .cards-grid {
    grid-template-columns: 1fr;
  }
}
</style>
