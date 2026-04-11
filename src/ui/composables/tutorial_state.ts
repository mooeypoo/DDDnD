/**
 * Tutorial State Composable
 *
 * Manages tutorial-specific UI state including:
 * - whether the current run is a tutorial
 * - the loaded tutorial script
 * - the current active hint step
 * - hint dismissal
 *
 * This composable is tutorial-only and does not affect main gameplay.
 * It reads tutorial script content and determines which hint to show
 * based on game state triggers.
 */

import { ref, computed, type Ref } from 'vue'
import type { TutorialScript, TutorialStep, TutorialStepTrigger } from '@/domains/content/model/tutorial_types'
import type { Scenario } from '@/domains/content/model/content_types'
import { isTutorialScenario } from '@/domains/content/model/tutorial_types'
import { createTutorialContentProvider } from '@/domains/content/services/tutorial_content_provider'

/** Reactive tutorial state, shared across components in a run */
const isTutorialMode = ref(false)
const tutorialScript = ref<TutorialScript | null>(null)
const currentStepIndex = ref(0)
const dismissedStepIds = ref<Set<string>>(new Set())
const isHintVisible = ref(false)

/**
 * The last step that was shown in the popup.
 * Used to keep content visible in the compact inline panel after the popup is dismissed.
 */
const lastShownStep = ref<TutorialStep | null>(null)

/**
 * Whether the compact inline hint panel should be shown below the scene.
 * True after the popup is dismissed when there is no immediate next popup.
 * Reset to false when the next popup appears.
 */
const showInlineHint = ref(false)

/**
 * Set of triggers that have already fired.
 * Each entry is a string like "run_start" or "turn_start:1".
 * When the user dismisses a hint, we check if the next step's trigger
 * has already fired — if so, we immediately show that step.
 */
const firedTriggers = ref<Set<string>>(new Set())

function triggerKey(type: TutorialStepTrigger['type'], turn?: number): string {
  return turn !== undefined ? `${type}:${turn}` : type
}

function stepTriggerKey(step: TutorialStep): string {
  return triggerKey(step.trigger.type, step.trigger.turn)
}

/**
 * Composable for managing tutorial hint state.
 */
export function useTutorialState() {
  const currentStep = computed<TutorialStep | null>(() => {
    if (!tutorialScript.value) return null
    const step = tutorialScript.value.steps[currentStepIndex.value]
    if (!step) return null
    if (dismissedStepIds.value.has(step.id)) return null
    return step
  })

  const hasMoreSteps = computed(() => {
    if (!tutorialScript.value) return false
    return currentStepIndex.value < tutorialScript.value.steps.length - 1
  })

  const totalSteps = computed(() => tutorialScript.value?.steps.length ?? 0)

  const currentStepNumber = computed(() => currentStepIndex.value + 1)

  /**
   * The card ID the current tutorial step requires the player to play.
   * Reads from the raw step at currentStepIndex (not the currentStep computed)
   * so it persists even after the hint is dismissed, until the next trigger
   * advances the step index.
   */
  const requiredCardId = computed<string | null>(() => {
    if (!tutorialScript.value) return null
    const step = tutorialScript.value.steps[currentStepIndex.value]
    if (!step) return null
    return step.required_card_id ?? null
  })

  /**
   * The highlight target for the current step (e.g. "satchel", "scores").
   * Like requiredCardId, reads from the raw step index so it persists after
   * popup dismissal until the next trigger advances the step.
   */
  const currentStepHighlight = computed<string | null>(() => {
    if (!tutorialScript.value) return null
    const step = tutorialScript.value.steps[currentStepIndex.value]
    if (!step) return null
    return step.highlight ?? null
  })

  /**
   * Whether the current step is the last step in the script.
   */
  const isLastStep = computed(() => {
    if (!tutorialScript.value) return true
    return currentStepIndex.value >= tutorialScript.value.steps.length - 1
  })

  /**
   * Initialize tutorial mode for a scenario.
   * Loads the tutorial script if the scenario is a tutorial.
   */
  async function initTutorial(scenario: Scenario): Promise<void> {
    if (!isTutorialScenario(scenario)) {
      resetTutorial()
      return
    }

    isTutorialMode.value = true
    const provider = createTutorialContentProvider()

    try {
      tutorialScript.value = await provider.loadTutorialScript(
        scenario.tutorial_script_ref
      )
      currentStepIndex.value = 0
      dismissedStepIds.value = new Set()
      isHintVisible.value = false
      lastShownStep.value = null
      showInlineHint.value = false
    } catch (error) {
      console.error('Failed to load tutorial script:', error)
      tutorialScript.value = null
    }
  }

  /**
   * Reset tutorial state (used when leaving tutorial or starting a non-tutorial run).
   */
  function resetTutorial(): void {
    isTutorialMode.value = false
    tutorialScript.value = null
    currentStepIndex.value = 0
    dismissedStepIds.value = new Set()
    isHintVisible.value = false
    firedTriggers.value = new Set()
    lastShownStep.value = null
    showInlineHint.value = false
  }

  /**
   * Dismiss the current hint popup. After dismissal, automatically show the
   * next step as a popup if its trigger has already fired.
   * If no next step is immediately available, activates the compact inline panel.
   */
  function dismissCurrentHint(): void {
    const step = currentStep.value
    if (step) {
      lastShownStep.value = step
      dismissedStepIds.value.add(step.id)
    }
    isHintVisible.value = false

    // Auto-advance: check if the next undismissed step's trigger was already fired
    let advanced = false
    if (tutorialScript.value) {
      for (let i = currentStepIndex.value + 1; i < tutorialScript.value.steps.length; i++) {
        const nextStep = tutorialScript.value.steps[i]
        if (dismissedStepIds.value.has(nextStep.id)) continue

        if (firedTriggers.value.has(stepTriggerKey(nextStep))) {
          currentStepIndex.value = i
          lastShownStep.value = nextStep
          isHintVisible.value = true
          advanced = true
        }
        // Stop at first undismissed step regardless — either it shows or it waits
        break
      }
    }

    if (!advanced) {
      // No immediate next popup — show the compact inline panel as a reminder
      showInlineHint.value = true
    }
  }

  /**
   * Record a game trigger and, if the current step matches, show it.
   * Called by the game store after events like turn_start, turn_end, etc.
   *
   * Triggers are recorded so that when a prior step is dismissed,
   * auto-advance can immediately show the next step whose trigger
   * has already fired.
   */
  function advanceToTrigger(triggerType: TutorialStepTrigger['type'], turn?: number): void {
    if (!tutorialScript.value) return

    // Record that this trigger has fired
    firedTriggers.value.add(triggerKey(triggerType, turn))

    // Only try to show a step if the current step is already dismissed
    // (i.e. no hint is blocking). If a hint is visible, the trigger is
    // just recorded — dismissCurrentHint will auto-advance when ready.
    const current = tutorialScript.value.steps[currentStepIndex.value]
    if (current && !dismissedStepIds.value.has(current.id) && isHintVisible.value) {
      return
    }

    // Find the next undismissed step whose trigger has been fired
    for (let i = currentStepIndex.value; i < tutorialScript.value.steps.length; i++) {
      const step = tutorialScript.value.steps[i]
      if (dismissedStepIds.value.has(step.id)) continue

      if (firedTriggers.value.has(stepTriggerKey(step))) {
        currentStepIndex.value = i
        lastShownStep.value = step
        showInlineHint.value = false
        isHintVisible.value = true
        return
      }
      // Stop at first undismissed step whose trigger hasn't fired yet
      return
    }
  }

  return {
    // State
    isTutorialMode: isTutorialMode as Ref<boolean>,
    tutorialScript: tutorialScript as Ref<TutorialScript | null>,
    currentStep,
    currentStepIndex: currentStepIndex as Ref<number>,
    isHintVisible: isHintVisible as Ref<boolean>,
    totalSteps,
    currentStepNumber,
    hasMoreSteps,
    requiredCardId,
    currentStepHighlight,
    isLastStep,
    lastShownStep: lastShownStep as Ref<TutorialStep | null>,
    showInlineHint: showInlineHint as Ref<boolean>,

    // Actions
    initTutorial,
    resetTutorial,
    dismissCurrentHint,
    advanceToTrigger,
  }
}
