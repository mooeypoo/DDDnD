# Data-Driven Quest Selection Implementation Notes

Date: March 8, 2026
Task: Make quest selection data-driven from scenario JSON content using a UI-owned list of scenario refs

Canonical companions:

- [AGENT.md](../AGENT.md) for routing and terminology guardrails
- [ARCHITECTURE.md](../ARCHITECTURE.md) for UI/domain separation
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md) for presentation roadmap coordination

Terminology note:

- Use `playerClass`, `endingType`, and `avatarRole` for new UI/presentation work.
- Keep legacy `archetype` wording only where tied to existing content or code compatibility.

## Summary

The run setup screen has been successfully refactored to display **data-driven, selectable quest cards** instead of a hard-coded scenario presentation. Quest availability is now controlled by an explicit **UI-owned configuration**, and the selected quest is passed to the game engine during run initialization.

## Architecture Overview

### 1. Available Quests Configuration

**File:** `src/ui/config/available_quests.ts`

This is the **UI-owned source of truth** for which scenarios appear on the setup screen. It contains an explicit list of scenario references:

```typescript
export const AVAILABLE_QUESTS: VersionRef[] = [
  {
    id: 'monolith_of_mild_despair',
    version: 1
  }
  // Future quests can be added here
]
```

**Key principles:**
- This is a **presentation-layer choice**, not a domain-wide declaration
- Different UI implementations (web, terminal, etc.) can have independent quest lists
- Only entries in this config are exposed on the setup page
- No descriptive text is duplicated here — only identifiers

### 2. ID/Version Resolution

**File:** `src/ui/services/quest_loader.ts`

The quest loader resolves `{ id, version }` references to actual scenario JSON files using the existing content provider:

```
{ id: 'monolith_of_mild_despair', version: 1 }
  ↓
/content/scenarios/monolith_of_mild_despair-v1.json
  ↓
Scenario content type
```

This respects the repository's established **CONTENT_VERSIONING.md** conventions:
- Filename format: `{id}-v{version}.json`
- Internal metadata must match filename/version
- Version ref key is automatically formatted as `{id}-v{version}`

### 3. Scenario Content to Display Model

**File:** `src/ui/types/quest_display_model.ts`

A lightweight, **presentational-only** type that extracts quest card display information from loaded scenario content:

```typescript
interface QuestDisplayModel {
  id: string
  version: number
  name: string
  description: string
  shortDescription?: string
  flavorText?: string
  turnCount: number
  stakeholderCount: number
  actionCardCount: number
}
```

This is derived from `Scenario` through the transformation in `quest_loader.ts`:

- `scenario.name` → `quest.name`
- `scenario.description` → `quest.description`
- `scenario.short_description` → `quest.shortDescription`
- `scenario.max_turns` → `quest.turnCount`
- `scenario.stakeholder_refs.length` → `quest.stakeholderCount`
- `scenario.card_refs.length` → `quest.actionCardCount`

**Key principles:**
- No simulation logic or gameplay rules here
- Only display/presentation information
- Stats are derived from available scenario metadata
- Graceful fallback if optional fields are missing

### 4. Game Store Integration

**File:** `src/ui/stores/game_store.ts`

Added new state and action:

```typescript
// New state
const availableQuests = ref<QuestDisplayModel[]>([])
const isLoadingQuests = ref(false)

// New action
async function load_available_quests() {
  isLoadingQuests.value = true
  try {
    const quests = await loadQuestDisplayModels(AVAILABLE_QUESTS)
    availableQuests.value = quests
  } finally {
    isLoadingQuests.value = false
  }
}
```

The game store:
- Uses the UI config to determine which scenarios to load
- Calls the quest loader service to fetch and transform content
- Exposes available quests to the UI layer
- Maintains loading state for UI feedback

### 5. Setup Screen Refactoring

**File:** `src/ui/views/run_setup_view.vue`

#### Before
- Hard-coded single scenario/quest display: "The Monolith of Mild Despair"
- Scenario details hard-wired in the template
- Start button could always proceed with fixed scenario_id

#### After
- Dynamic quest loading on mount
- Multiple quest cards rendered from `gameStore.availableQuests`
- Auto-selects first available quest (convenient for MVP single-quest case)
- Selectable quest cards with visual feedback
- Start button now requires both class AND quest selection
- Used selected quest's `id` and `version` when calling `start_new_run()`

**Template changes:**
- Replaced hard-coded `scenario-card` with data-driven `quest-grid` and `quest-card` buttons
- Added empty state and loading states
- Quest stats displayed conditionally based on available data
- Responsive grid layout scales from 1 → many quests

**Script changes:**
```typescript
const selectedQuest = ref<QuestDisplayModel | null>(null)

onMounted(async () => {
  // Load quests if not already loaded
  if (gameStore.availableQuests.length === 0) {
    await gameStore.load_available_quests()
    // Auto-select first quest
    if (gameStore.availableQuests.length > 0) {
      selectedQuest.value = gameStore.availableQuests[0]
    }
  }
})

async function startRun() {
  if (!selectedClass.value || !selectedQuest.value) return
  
  await gameStore.start_new_run({
    scenario_id: selectedQuest.value.id,              // From selected quest
    scenario_version: selectedQuest.value.version,    // From selected quest
    // ... class and character name as before
  })
}
```

## Content Loading Flow

```
AVAILABLE_QUESTS (UI config)
  ↓
loadQuestDisplayModels()
  ↓
For each quest reference:
  • createContentProvider().loadScenario(ref)
  • Transform Scenario → QuestDisplayModel
  • On error: skip quietly, log in dev
  ↓
availableQuests = [QuestDisplayModel[], ...]
  ↓
View renders quest cards
  ↓
User selects quest
  ↓
start_new_run() uses selected quest id/version
```

## Resilience & Error Handling

1. **Individual quest load failures:** If a configured quest fails to load, it is skipped and remaining quests are displayed
2. **All quests fail:** Empty state shown; user sees diagnostic message
3. **Missing optional fields:** Stats are rendered conditionally; missing descriptions don't break the card
4. **Development debugging:** Errors are logged to console with context

## Player-Facing Language

- "Choose a Quest" – maintains in-universe terminology in player-facing UI
- Internal code and config continue to use "scenario" when referring to engine/content
- Badge text "Official Campaign" identifies quests as curated scenarios

## Testing

### Quest Loader Tests (`tests/ui/quest_loader.test.ts`)
- ✓ Loads single quest and transforms to display model
- ✓ Loads multiple quests with graceful error handling
- ✓ Handles all-fail case
- ✓ Derives stats correctly from scenario metadata

### Game Store Tests (`tests/ui/game_store_orchestration.test.ts`)
- ✓ Added test for `load_available_quests()` action
- ✓ Verifies quests are loaded from UI config
- ✓ Validates display model structure
- ✓ All existing store tests continue to pass

### Storybook Stories (`stories/game/RunSetupView.stories.ts`)
- Default: Both quests and classes loaded, ready for selection
- LoadingQuests: Shows loading state with spinner
- SingleQuest: MVP scenario with one available quest
- MultipleQuests: Future expansion with multiple available quests
- NoQuestsAvailable: Error state with empty quests

## Files Created/Modified

### Created
- `src/ui/config/available_quests.ts` – UI-owned quest list
- `src/ui/types/quest_display_model.ts` – Presentational type
- `src/ui/services/quest_loader.ts` – Content loading & transformation
- `tests/ui/quest_loader.test.ts` – Quest loader unit tests
- `stories/game/RunSetupView.stories.ts` – Storybook stories

### Modified
- `src/ui/stores/game_store.ts` – Added quest loading functionality
- `src/ui/views/run_setup_view.vue` – Refactored to use data-driven quests
- `tests/ui/game_store_orchestration.test.ts` – Added quest loading test

## Acceptance Criteria - Validation

✅ Setup page no longer hard-codes quest/scenario presentation  
✅ Available quests controlled by explicit UI-owned config (`available_quests.ts`)  
✅ Configured `{ id, version }` entries resolve to real scenario JSON files  
✅ Quest cards rendered from loaded scenario content  
✅ User can select quest via button interaction  
✅ Selected quest determines scenario in `start_new_run()`  
✅ UI works cleanly with one quest, scales to multiple  
✅ Player-facing text uses "Quest"  
✅ No simulation logic moved into UI  
✅ Gameplay behavior unchanged except selected scenario is used  

## Future Extensibility

### Adding New Quests

1. Create scenario content file: `/content/scenarios/{id}-v{version}.json`
2. Add entry to `AVAILABLE_QUESTS` config:
   ```typescript
   export const AVAILABLE_QUESTS: VersionRef[] = [
     { id: 'monolith_of_mild_despair', version: 1 },
     { id: 'microservice_migration_maze', version: 1 },  // New
   ]
   ```
3. No view changes needed; UI automatically picks it up

### Alternative UIs

A terminal-based UI could define its own quest list:
```typescript
// terminal-ui/config/available_quests.ts
export const AVAILABLE_QUESTS: VersionRef[] = [
  { id: 'monolith_of_mild_despair', version: 1 },
  { id: 'some_scenario', version: 1 }
  // Different from web UI, intentionally
]
```

### Versioned Scenarios

When a scenario is versioned (gameplay behavior change):
1. New file created: `/content/scenarios/{id}-v{version}.json`
2. Update config if desired: change `version` in `AVAILABLE_QUESTS`
3. Old runs continue to replay correctly (scenario bundle resolution via version ref)

## Design Decisions

### Why UI-Owned Configuration?

The available quest list is a **presentation-layer choice**, not a domain rule. It determines what content this particular UI exposes, not what content is universally available. This allows:
- Web UI to show quests appropriate for its UX
- Terminal UI to show different quests
- Future mobile UI to show curated subset
- Independent iteration on UI vs. content library

### Why Transformation to QuestDisplayModel?

Rather than passing raw `Scenario` objects to the view:
- Decouples view from domain content structure
- Makes it explicit what the view needs
- Easier to change display logic without touching content schema
- Helps prevent accidentally exposing internal game logic to UI

### Why Graceful Degradation?

If a quest fails to load:
- Don't crash the entire setup screen
- Show empowering feedback (empty state, available quests that loaded)
- Log errors for development debugging
- Resilience over strictness for production

## Performance Considerations

- Quests loaded in parallel: `Promise.allSettled()` waits for all
- Single query to content provider per quest (no N+1)
- Loaded once on mount, cached in store (no reload on re-render)
- Stats computed at load time (O(1) on display)

## Compatibility

✅ Works with existing `createContentProvider()` system  
✅ Respects CONTENT_VERSIONING.md filename conventions  
✅ Compatible with existing scenario bundle resolution  
✅ No changes to simulation engine needed  
✅ Backward compatible with game state serialization  

## Summary

Quest selection is now **fully data-driven**, controlled by explicit **UI-owned configuration**, with scenario content seamlessly resolved, transformed, and presented. The setup screen scales naturally from MVP (single quest) to multiple quests, with robust error handling and clear separation between presentation logic and simulation behavior.
