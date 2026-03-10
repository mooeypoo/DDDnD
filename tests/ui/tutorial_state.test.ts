/**
 * Tutorial State Composable Tests
 *
 * Tests for the tutorial hint system state management.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Scenario } from '@/domains/content/model/content_types'
import type { TutorialScript } from '@/domains/content/model/tutorial_types'
import { isTutorialScenario } from '@/domains/content/model/tutorial_types'

// -- isTutorialScenario type guard --

describe('isTutorialScenario', () => {
  const baseScenario: Scenario = {
    id: 'normal',
    version: 1,
    name: 'Normal',
    description: 'A normal scenario',
    short_description: 'Normal',
    flavor_text: '',
    max_turns: 5,
    starting_scores: { clarity: 50 },
    score_refs: [{ id: 'clarity', version: 1 }],
    stakeholder_refs: [],
    card_refs: [],
    event_refs: []
  }

  it('returns false for a scenario without tutorial fields', () => {
    expect(isTutorialScenario(baseScenario)).toBe(false)
  })

  it('returns false when is_tutorial is false', () => {
    expect(isTutorialScenario({ ...baseScenario, is_tutorial: false })).toBe(false)
  })

  it('returns true when is_tutorial is true even without script ref', () => {
    expect(isTutorialScenario({ ...baseScenario, is_tutorial: true })).toBe(true)
  })

  it('returns true for a fully-configured tutorial scenario', () => {
    const tutorialScenario = {
      ...baseScenario,
      is_tutorial: true,
      tutorial_order: 1,
      tutorial_script_ref: { id: 'basics_script', version: 1 }
    }
    expect(isTutorialScenario(tutorialScenario)).toBe(true)
  })
})

// -- Tutorial state composable --
// We need to test the composable in isolation, but since it uses module-level
// refs, we re-import it freshly for each test by dynamic import + vi.resetModules.

describe('useTutorialState', () => {
  const mockScript: TutorialScript = {
    id: 'test_script',
    version: 1,
    name: 'Test Script',
    description: 'A test tutorial script',
    steps: [
      {
        id: 'step_welcome',
        trigger: { type: 'run_start' },
        title: 'Welcome',
        message: 'Welcome to the tutorial!',
        highlight: null
      },
      {
        id: 'step_action',
        trigger: { type: 'turn_start', turn: 1 },
        title: 'Choose an Action',
        message: 'Pick an action card.',
        highlight: 'satchel',
        required_card_id: 'tutorial_plan_ahead'
      },
      {
        id: 'step_scores',
        trigger: { type: 'turn_end', turn: 1 },
        title: 'Score Changes',
        message: 'Your scores changed.',
        highlight: 'scores'
      },
      {
        id: 'step_complete',
        trigger: { type: 'run_end' },
        title: 'Tutorial Complete',
        message: 'You finished!',
        highlight: null
      }
    ]
  }

  const tutorialScenario: Scenario = {
    id: 'tutorial_basics',
    version: 1,
    name: 'Basics',
    description: 'Tutorial basics',
    short_description: 'Basics',
    flavor_text: '',
    max_turns: 3,
    starting_scores: { system_health: 50 },
    score_refs: [{ id: 'system_health', version: 1 }],
    stakeholder_refs: [],
    card_refs: [],
    event_refs: [],
    is_tutorial: true,
    tutorial_order: 1,
    tutorial_script_ref: { id: 'test_script', version: 1 }
  }

  beforeEach(() => {
    vi.resetModules()
  })

  async function getComposable() {
    // Mock the tutorial content provider to return our mock script
    vi.doMock('@/domains/content/services/tutorial_content_provider', () => ({
      createTutorialContentProvider: () => ({
        loadTutorialScript: vi.fn().mockResolvedValue(mockScript),
        loadScenario: vi.fn(),
        loadScore: vi.fn(),
        loadStakeholder: vi.fn(),
        loadStakeholderReactionRule: vi.fn(),
        loadCard: vi.fn(),
        loadEvent: vi.fn(),
        loadDelayedEffect: vi.fn(),
        loadOutcomeTier: vi.fn(),
        loadOutcomeArchetype: vi.fn(),
        loadPlayerClass: vi.fn()
      })
    }))

    const module = await import('@/ui/composables/tutorial_state')
    return module.useTutorialState()
  }

  it('starts with tutorial mode disabled', async () => {
    const tutorial = await getComposable()

    expect(tutorial.isTutorialMode.value).toBe(false)
    expect(tutorial.currentStep.value).toBeNull()
    expect(tutorial.totalSteps.value).toBe(0)
    expect(tutorial.isHintVisible.value).toBe(false)
  })

  it('initializes tutorial mode for a tutorial scenario', async () => {
    const tutorial = await getComposable()

    await tutorial.initTutorial(tutorialScenario)

    expect(tutorial.isTutorialMode.value).toBe(true)
    expect(tutorial.totalSteps.value).toBe(4)
    expect(tutorial.currentStepNumber.value).toBe(1)
    expect(tutorial.currentStep.value?.id).toBe('step_welcome')
    // Hint is not visible until advanceToTrigger fires a matching trigger
    expect(tutorial.isHintVisible.value).toBe(false)
  })

  it('does not initialize for a non-tutorial scenario', async () => {
    const tutorial = await getComposable()
    const normalScenario: Scenario = {
      ...tutorialScenario,
      is_tutorial: undefined,
      tutorial_script_ref: undefined
    }

    await tutorial.initTutorial(normalScenario)

    expect(tutorial.isTutorialMode.value).toBe(false)
    expect(tutorial.currentStep.value).toBeNull()
  })

  it('dismisses current hint and hides it', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    // Make hint visible by firing the matching trigger
    tutorial.advanceToTrigger('run_start')
    expect(tutorial.isHintVisible.value).toBe(true)

    tutorial.dismissCurrentHint()

    expect(tutorial.isHintVisible.value).toBe(false)
    // The step should now be null because its ID was added to dismissed set
    expect(tutorial.currentStep.value).toBeNull()
  })

  it('advances to matching trigger step', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    // Dismiss first step
    tutorial.dismissCurrentHint()

    // Advance to turn_start turn 1
    tutorial.advanceToTrigger('turn_start', 1)

    expect(tutorial.currentStep.value?.id).toBe('step_action')
    expect(tutorial.isHintVisible.value).toBe(true)
    expect(tutorial.currentStepNumber.value).toBe(2)
  })

  it('advances through multiple triggers in order', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    // run_start → step_welcome
    expect(tutorial.currentStep.value?.id).toBe('step_welcome')
    tutorial.dismissCurrentHint()

    // turn_start turn 1 → step_action
    tutorial.advanceToTrigger('turn_start', 1)
    expect(tutorial.currentStep.value?.id).toBe('step_action')
    tutorial.dismissCurrentHint()

    // turn_end turn 1 → step_scores
    tutorial.advanceToTrigger('turn_end', 1)
    expect(tutorial.currentStep.value?.id).toBe('step_scores')
    tutorial.dismissCurrentHint()

    // run_end → step_complete
    tutorial.advanceToTrigger('run_end')
    expect(tutorial.currentStep.value?.id).toBe('step_complete')
  })

  it('does not advance to a non-matching trigger', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    tutorial.dismissCurrentHint()

    // turn_start turn 2 should not match step with turn: 1
    tutorial.advanceToTrigger('turn_start', 2)
    expect(tutorial.currentStep.value).toBeNull()
    expect(tutorial.isHintVisible.value).toBe(false)
  })

  it('resets tutorial state completely', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    expect(tutorial.isTutorialMode.value).toBe(true)

    tutorial.resetTutorial()

    expect(tutorial.isTutorialMode.value).toBe(false)
    expect(tutorial.currentStep.value).toBeNull()
    expect(tutorial.totalSteps.value).toBe(0)
    expect(tutorial.isHintVisible.value).toBe(false)
  })

  it('reports hasMoreSteps correctly', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    // At step 0 of 4 → has more
    expect(tutorial.hasMoreSteps.value).toBe(true)

    // Advance to last step
    tutorial.dismissCurrentHint()
    tutorial.advanceToTrigger('turn_start', 1)
    tutorial.dismissCurrentHint()
    tutorial.advanceToTrigger('turn_end', 1)
    tutorial.dismissCurrentHint()
    tutorial.advanceToTrigger('run_end')

    // At step 3 (last) → no more
    expect(tutorial.hasMoreSteps.value).toBe(false)
  })

  it('records triggers and auto-advances when prior hint is dismissed', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    // Fire run_start → shows step 0 (Welcome)
    tutorial.advanceToTrigger('run_start')
    expect(tutorial.currentStep.value?.id).toBe('step_welcome')
    expect(tutorial.isHintVisible.value).toBe(true)

    // Fire turn_start:1 while Welcome hint is visible → should NOT advance
    tutorial.advanceToTrigger('turn_start', 1)
    expect(tutorial.currentStep.value?.id).toBe('step_welcome')
    expect(tutorial.isHintVisible.value).toBe(true)

    // Dismiss Welcome → should auto-advance to step_action (turn_start:1 already recorded)
    tutorial.dismissCurrentHint()
    expect(tutorial.currentStep.value?.id).toBe('step_action')
    expect(tutorial.isHintVisible.value).toBe(true)
  })

  it('exposes requiredCardId from current step even after hint is dismissed', async () => {
    const tutorial = await getComposable()
    await tutorial.initTutorial(tutorialScenario)

    // Before any trigger, step 0 (welcome) has no required_card_id
    expect(tutorial.requiredCardId.value).toBeNull()

    // Fire run_start → step 0 visible, no required card
    tutorial.advanceToTrigger('run_start')
    expect(tutorial.requiredCardId.value).toBeNull()

    // Fire turn_start:1 (recorded but blocked by visible hint)
    tutorial.advanceToTrigger('turn_start', 1)
    expect(tutorial.requiredCardId.value).toBeNull()

    // Dismiss welcome → auto-advance to step_action which has required_card_id
    tutorial.dismissCurrentHint()
    expect(tutorial.currentStep.value?.id).toBe('step_action')
    expect(tutorial.requiredCardId.value).toBe('tutorial_plan_ahead')

    // Dismiss the action hint — requiredCardId persists because step index hasn't advanced
    tutorial.dismissCurrentHint()
    expect(tutorial.currentStep.value).toBeNull()
    expect(tutorial.requiredCardId.value).toBe('tutorial_plan_ahead')

    // Now turn_end:1 fires → advances to step_scores (no required_card_id)
    tutorial.advanceToTrigger('turn_end', 1)
    expect(tutorial.currentStep.value?.id).toBe('step_scores')
    expect(tutorial.requiredCardId.value).toBeNull()
  })
})
