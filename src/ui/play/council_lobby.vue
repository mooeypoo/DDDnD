<template>
  <div
    class="council-lobby"
    :class="{ 'is-awaiting-chamber': isAwaitingChamber }"
    :aria-busy="isAwaitingChamber"
  >
    <div class="chamber-glow" aria-hidden="true" />
    <div class="chamber-grain" aria-hidden="true" />

    <div class="lobby-body">
    <header class="lobby-mast">
      <GameLogo size="small" />
      <nav class="lobby-plaques" aria-label="Table lore">
        <button type="button" class="plaque-link" @click="$emit('showAbout')">What is this?</button>
        <button type="button" class="plaque-link" @click="$emit('showRules')">How to play</button>
        <button type="button" class="plaque-link" @click="$emit('showDungeonMaster')">Dungeon Master</button>
      </nav>
    </header>

    <section class="quest-deck" :aria-label="deckMode === 'tutorials' ? 'Tutorials' : 'Choose your adventure'">
      <div v-if="tutorials.length > 0" class="deck-toggle" role="tablist" aria-label="Tutorials or adventures">
        <button
          class="deck-tab"
          type="button"
          role="tab"
          :aria-selected="deckMode === 'tutorials'"
          :class="{ selected: deckMode === 'tutorials' }"
          :disabled="isAwaitingChamber"
          @click="setDeckMode('tutorials')"
        >
          Tutorials
        </button>
        <button
          class="deck-tab"
          type="button"
          role="tab"
          :aria-selected="deckMode === 'adventures'"
          :class="{ selected: deckMode === 'adventures' }"
          :disabled="isAwaitingChamber"
          @click="setDeckMode('adventures')"
        >
          Adventures
        </button>
      </div>
      <p class="row-kicker">
        {{ deckMode === 'tutorials' ? 'Learn the ropes' : 'Choose your adventure' }}
      </p>
      <p class="row-blurb">
        {{ deckMode === 'tutorials'
          ? 'Short guided runs that teach the table one piece at a time.'
          : 'Each is a different system: its own starting health, its own council, its own surprises, its own clock. The mark on a plate says how rough the going gets.' }}
      </p>
      <div class="quest-fan" role="list">
        <div
          v-for="(quest, index) in fanQuests"
          :key="quest.id + '-v' + quest.version"
          class="fan-slot"
          :class="{ 'is-selected': isQuestSelected(quest) }"
          :style="fanStyle(index)"
          role="listitem"
        >
          <button
            class="table-quest"
            type="button"
            :class="{ selected: isQuestSelected(quest), 'is-tutorial': quest.isTutorial }"
            :disabled="isAwaitingChamber"
            @click="$emit('selectQuest', quest)"
          >
            <span class="quest-scene" :style="{ backgroundImage: `url(${sceneFor(quest.id)})` }" />
            <span v-if="quest.isTutorial" class="tutorial-mark">Tutorial</span>
            <span
              v-else-if="difficultyFor(quest)"
              class="quest-difficulty"
              :class="`is-${difficultyFor(quest)!.id}`"
              :title="difficultyFor(quest)!.blurb"
            >{{ difficultyFor(quest)!.label }}</span>
            <span class="quest-kicker">{{ quest.turnCount }} turns · {{ councilCountLabel(quest.stakeholderCount) }}</span>
            <span class="quest-name">{{ quest.name }}</span>
          </button>
        </div>
      </div>
    </section>

    <section class="table-stage" aria-label="The council gathers">
      <p class="row-kicker">Join the council</p>
      <div class="table-assembly">
        <div class="table-board">
          <div class="table-grain" />
          <div class="table-inlay">
            <img class="table-map" :src="sceneUrl" alt="" />
            <div class="table-veil" />
            <div v-if="selectedQuest" class="table-brief">
              <p class="table-nameplate">{{ selectedQuest.name }}</p>
              <p class="table-hook">{{ questHook(selectedQuest) }}</p>
              <p v-if="questFlavorLine(selectedQuest)" class="table-flavor">
                {{ questFlavorLine(selectedQuest) }}
              </p>
              <button
                class="brief-more"
                type="button"
                :disabled="isAwaitingChamber"
                @click="briefingOpen = true"
              >
                Read more
              </button>
            </div>
          </div>
        </div>
        <div class="rim-zone">
          <p class="rim-kicker">Choose your class</p>
          <div class="rim-seats" role="list" aria-label="Choose your class">
            <button
              v-for="playerClass in classes"
              :key="playerClass.id"
              class="class-seat"
              type="button"
              role="listitem"
              :class="{ selected: selectedClass?.id === playerClass.id }"
              :aria-pressed="selectedClass?.id === playerClass.id"
              :disabled="isAwaitingChamber"
              @click="$emit('selectClass', playerClass)"
            >
              <ClassPortrait
                :classId="playerClass.id"
                :className="playerClass.name"
                size="md"
                eager
              />
              <span class="seat-name">{{ playerClass.name }}</span>
            </button>
          </div>
        </div>
      </div>
      <p v-if="selectedClass" class="seat-reading">
        <span class="seat-reading-name">{{ selectedClass.name }}</span>
        <span class="seat-reading-affinity">{{ affinityLine(selectedClass.score_affinity) }}</span>
      </p>
      <label class="call-me">
        <span>Call me</span>
        <input
          v-model="nameDraft"
          type="text"
          maxlength="50"
          placeholder="optional"
          :disabled="isAwaitingChamber"
          @input="$emit('update:characterName', nameDraft)"
        />
      </label>
    </section>

    <details v-if="!selectedQuest?.isTutorial" class="harder-table" :open="selectedModifier !== null">
      <summary>Raise the stakes</summary>
      <p class="harder-copy">Optional challenge modifiers from the pack. Standard play uses none.</p>
      <div class="modifier-rail">
        <button
          class="modifier-chip"
          type="button"
          :class="{ selected: selectedModifier === null }"
          :disabled="isAwaitingChamber"
          @click="$emit('selectModifier', null)"
        >
          None
        </button>
        <button
          v-for="modifier in modifiers"
          :key="modifier.id"
          class="modifier-chip"
          type="button"
          :class="{ selected: selectedModifier?.id === modifier.id }"
          :disabled="isAwaitingChamber"
          @click="$emit('selectModifier', modifier)"
        >
          <span class="modifier-name">{{ modifier.name }}</span>
          <span class="modifier-desc">{{ modifier.description }}</span>
        </button>
      </div>
    </details>

    <footer class="lobby-actions">
      <button class="ghost-btn" type="button" :disabled="isAwaitingChamber" @click="$emit('back')">
        Back to the door
      </button>
      <button
        class="sit-btn"
        type="button"
        :disabled="!canSit || isAwaitingChamber"
        @click="$emit('sit')"
      >
        {{ isAwaitingChamber ? 'The council is gathering…' : 'Join this adventure' }}
      </button>
    </footer>
    <QuestBriefingPlaque
      :is-open="briefingOpen"
      :quest="selectedQuest"
      @close="briefingOpen = false"
    />
    </div>

    <div
      v-if="isAwaitingChamber"
      class="chamber-veil"
      role="status"
      aria-live="polite"
    >
      <div class="veil-sigil" aria-hidden="true">
        <span class="veil-ring" />
        <span class="veil-ember" />
      </div>
      <p class="veil-kicker">The council is gathering</p>
      <p class="veil-copy">Lighting the chamber…</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { ChallengeModifier, PlayerClass } from '@/domains/content/model'
import { getClassPortraitUrl } from '@/ui/composables/class_artwork'
import { requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import { resolveGameplaySceneId } from '@/ui/composables/gameplay_stage_presentation'
import { preloadImageUrls } from '@/ui/composables/preload_presentation_assets'
import { classAffinityCopy } from '@/ui/play/class_affinity'
import { councilCountLabel } from '@/ui/play/council_copy'
import { questDifficulty, sortQuestsByDifficulty } from '@/ui/play/quest_difficulty'
import { handFanTransform } from '@/ui/play/card_fan'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import GameLogo from '@/ui/components/branding/game_logo.vue'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'
import QuestBriefingPlaque from '@/ui/play/quest_briefing_plaque.vue'

type DeckMode = 'adventures' | 'tutorials'

const props = defineProps<{
  quests: QuestDisplayModel[]
  tutorials: QuestDisplayModel[]
  classes: PlayerClass[]
  modifiers: ChallengeModifier[]
  selectedQuest: QuestDisplayModel | null
  selectedClass: PlayerClass | null
  selectedModifier: ChallengeModifier | null
  characterName: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  selectQuest: [quest: QuestDisplayModel]
  selectClass: [playerClass: PlayerClass]
  selectModifier: [modifier: ChallengeModifier | null]
  'update:characterName': [value: string]
  sit: []
  back: []
  showAbout: []
  showRules: []
  showDungeonMaster: []
}>()

const nameDraft = ref(props.characterName)
const deckMode = ref<DeckMode>(props.selectedQuest?.isTutorial ? 'tutorials' : 'adventures')
const briefingOpen = ref(false)
const assetsReady = ref(false)

watch(() => props.characterName, (value) => {
  if (value !== nameDraft.value) {
    nameDraft.value = value
  }
})

watch(() => props.selectedQuest, (quest) => {
  briefingOpen.value = false
  if (quest?.isTutorial) {
    deckMode.value = 'tutorials'
    return
  }
  if (quest) {
    deckMode.value = 'adventures'
  }
})

const sceneUrl = computed(() => {
  return requestSceneBackground(resolveGameplaySceneId(props.selectedQuest?.id))
})

const canSit = computed(() => Boolean(props.selectedQuest && props.selectedClass))

const isAwaitingChamber = computed(() => Boolean(props.isLoading) || !assetsReady.value)

const fanQuests = computed(() => {
  return deckMode.value === 'tutorials'
    ? props.tutorials
    : sortQuestsByDifficulty(props.quests)
})

const lobbyAssetKey = computed(() => {
  const questIds = [...props.quests, ...props.tutorials].map((quest) => quest.id).join('|')
  const classIds = props.classes.map((playerClass) => playerClass.id).join('|')
  return `${questIds}::${classIds}`
})

function collectLobbyAssetUrls(): string[] {
  const sceneUrls = [...props.quests, ...props.tutorials].map((quest) => sceneFor(quest.id))
  const portraitUrls = props.classes
    .map((playerClass) => getClassPortraitUrl(playerClass.id))
    .filter((url): url is string => Boolean(url))
  return [...sceneUrls, ...portraitUrls]
}

watch(
  lobbyAssetKey,
  async (_key, _previous, onCleanup) => {
    let cancelled = false
    onCleanup(() => {
      cancelled = true
    })
    assetsReady.value = false
    await preloadImageUrls(collectLobbyAssetUrls())
    if (!cancelled) {
      assetsReady.value = true
    }
  },
  { immediate: true },
)

function setDeckMode(mode: DeckMode) {
  if (mode === 'tutorials' && props.tutorials.length === 0) {
    return
  }

  deckMode.value = mode
  const list = mode === 'tutorials'
    ? props.tutorials
    : sortQuestsByDifficulty(props.quests)
  const alreadyShowing = list.some((quest) => isQuestSelected(quest))
  if (!alreadyShowing && list[0]) {
    emit('selectQuest', list[0])
  }
}

function isQuestSelected(quest: QuestDisplayModel): boolean {
  return props.selectedQuest?.id === quest.id && props.selectedQuest?.version === quest.version
}

function fanStyle(index: number) {
  const { rotate, y } = handFanTransform(index, fanQuests.value.length)
  return {
    transform: `rotate(${rotate}deg) translateY(${y}px)`,
    zIndex: String(index + 1),
  }
}

function sceneFor(scenarioId: string): string {
  return requestSceneBackground(resolveGameplaySceneId(scenarioId))
}

function difficultyFor(quest: QuestDisplayModel) {
  return questDifficulty(quest.id)
}

function questHook(quest: QuestDisplayModel): string {
  return quest.shortDescription || quest.description
}

function questFlavorLine(quest: QuestDisplayModel): string | null {
  const hook = questHook(quest)
  if (!quest.flavorText || quest.flavorText === hook) {
    return null
  }
  return quest.flavorText
}

function affinityLine(scoreId: string | undefined): string {
  if (!scoreId) {
    return 'Identity in the council'
  }
  const shortFromQuests = [...props.quests, ...props.tutorials]
    .map((quest) => quest.startingScoreShortNames?.[scoreId])
    .find((name): name is string => Boolean(name))
  return classAffinityCopy(scoreId, shortFromQuests) ?? 'Identity in the council'
}
</script>

<style scoped>
.council-lobby {
  position: relative;
  min-height: 100dvh;
  padding: 0.8rem 0.9rem 6.5rem;
  color: var(--text-primary);
  overflow-x: hidden;
}

.chamber-glow,
.chamber-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.chamber-glow {
  background:
    radial-gradient(ellipse at 50% 18%, rgba(92, 58, 18, 0.28), transparent 46%),
    radial-gradient(ellipse at 50% 100%, rgba(12, 6, 2, 0.85), transparent 42%);
}

.chamber-grain {
  opacity: 0.18;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
}

.lobby-body,
.lobby-mast,
.table-stage,
.quest-deck,
.harder-table,
.lobby-actions {
  position: relative;
  z-index: 1;
}

.lobby-body {
  display: contents;
}

.council-lobby.is-awaiting-chamber .lobby-body > * {
  visibility: hidden;
}

.chamber-veil {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 0.45rem;
  padding: 1.5rem;
  background:
    radial-gradient(ellipse at 50% 40%, rgba(72, 42, 16, 0.42), transparent 48%),
    rgba(7, 5, 4, 0.94);
  text-align: center;
  pointer-events: auto;
}

.veil-sigil {
  position: relative;
  width: 7rem;
  height: 7rem;
  display: grid;
  place-items: center;
}

.veil-ember {
  width: 4.5rem;
  height: 4.5rem;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 45%, rgba(255, 210, 120, 0.85), rgba(220, 96, 32, 0.2) 48%, transparent 70%);
  box-shadow: 0 0 28px rgba(240, 140, 48, 0.35);
  animation: veil-breathe 1.6s ease-in-out infinite;
}

.veil-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px solid rgba(232, 196, 96, 0.28);
  animation: veil-ring 1.6s ease-in-out infinite;
}

.veil-kicker {
  margin: 0.85rem 0 0;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--dng-title-gold);
}

.veil-copy {
  margin: 0;
  font-size: var(--text-base);
  color: var(--text-secondary);
}

@keyframes veil-breathe {
  0%, 100% { transform: scale(0.92); opacity: 0.72; }
  50% { transform: scale(1.06); opacity: 1; }
}

@keyframes veil-ring {
  0%, 100% { transform: scale(0.88); opacity: 0.35; }
  50% { transform: scale(1.08); opacity: 0.7; }
}

.lobby-mast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.7rem;
}

.lobby-plaques {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.7rem;
}

.plaque-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: #e2c48a;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.quest-deck {
  width: min(920px, 100%);
  margin: 0 auto 0.35rem;
}

.table-stage {
  width: min(920px, 100%);
  margin: 0 auto 1rem;
  text-align: center;
}

.table-assembly {
  position: relative;
  padding-bottom: 4.6rem;
}

.table-board {
  position: relative;
  height: clamp(200px, 32vw, 320px);
  border-radius: 18px 18px 40% 40% / 18px 18px 28px 28px;
  overflow: hidden;
  box-shadow:
    0 28px 48px rgba(0, 0, 0, 0.55),
    inset 0 0 0 2px rgba(176, 132, 42, 0.28);
}

.table-inlay,
.table-grain,
.table-map,
.table-veil {
  position: absolute;
  inset: 0;
}

.table-map {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.86) contrast(1.05);
}

.table-veil {
  background: linear-gradient(180deg, rgba(8, 4, 2, 0.15), rgba(8, 4, 2, 0.55));
}

.table-brief {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 10%;
  z-index: 2;
  padding: 0.65rem 0.8rem 0.7rem;
  border-radius: 8px;
  background: rgba(8, 5, 2, 0.62);
  box-shadow: inset 0 1px 0 rgba(255, 220, 140, 0.12);
}

.table-nameplate {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.2rem;
  line-height: 1.25;
  color: #ffe7b0;
}

.table-hook {
  margin: 0.35rem 0 0;
  color: #f4d8b8;
  font-size: var(--text-base);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.table-flavor {
  margin: 0.3rem 0 0;
  color: #ead58a;
  font-size: var(--text-sm);
  font-style: italic;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.brief-more {
  appearance: none;
  margin-top: 0.45rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f0c060;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.row-kicker {
  margin: 0 0 0.4rem;
  font-size: var(--text-kicker);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f0c060;
  text-align: center;
}

.row-blurb {
  /* The fan lifts its cards into its own padding, so clear it deliberately. */
  margin: 0 auto 2.2rem;
  max-width: 44rem;
  padding: 0 0.9rem;
  font-size: var(--text-sm);
  line-height: 1.55;
  text-align: center;
  color: #c6ab78;
}

.deck-toggle {
  display: flex;
  justify-content: center;
  gap: 0.45rem;
  margin-bottom: 0.55rem;
}

.deck-tab {
  appearance: none;
  padding: 0.4rem 0.95rem;
  border-radius: 999px;
  border: 1px solid rgba(176, 132, 42, 0.4);
  background: rgba(12, 8, 4, 0.72);
  color: #d7b36a;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}

.deck-tab.selected {
  border-color: rgba(240, 208, 96, 0.85);
  background: linear-gradient(180deg, rgba(78, 52, 16, 0.98), rgba(26, 16, 6, 0.96));
  color: var(--dng-title-gold);
}

.modifier-rail {
  display: flex;
  justify-content: safe center;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.45rem;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: rgba(176, 132, 42, 0.45) transparent;
}

.modifier-rail::-webkit-scrollbar {
  height: 4px;
}

.modifier-rail::-webkit-scrollbar-thumb {
  background: rgba(176, 132, 42, 0.45);
  border-radius: 999px;
}

.quest-fan {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  min-height: 292px;
  padding: 2.2rem 0.6rem 1.8rem;
  overflow: visible;
}

.fan-slot {
  margin-left: -2.6rem;
  transform-origin: 50% 110%;
  transition: transform 200ms ease, z-index 0s;
}

.fan-slot:first-child {
  margin-left: 0;
}

.fan-slot:hover,
.fan-slot:focus-within {
  transform: translateY(-16px) rotate(0deg) scale(1.06) !important;
  z-index: 18 !important;
}

.fan-slot.is-selected {
  transform: translateY(-30px) rotate(0deg) scale(1.14) !important;
  z-index: 24 !important;
}

.table-quest,
.modifier-chip {
  appearance: none;
  flex: 0 0 auto;
  scroll-snap-align: start;
  border: 1px solid rgba(176, 132, 42, 0.35);
  background: rgba(12, 8, 4, 0.78);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.table-quest {
  position: relative;
  width: 176px;
  min-height: 228px;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 10px 10px 12px 12px;
  box-shadow:
    0 14px 24px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 214, 120, 0.18);
}

.table-quest.selected,
.modifier-chip.selected {
  border-color: rgba(240, 208, 96, 0.85);
  box-shadow:
    0 0 0 1px rgba(240, 208, 96, 0.28),
    0 18px 32px rgba(0, 0, 0, 0.55);
}

.quest-scene {
  display: block;
  height: 118px;
  background-size: cover;
  background-position: center;
}

.quest-kicker,
.quest-name,
.quest-meta {
  display: block;
  padding: 0 0.6rem;
}

.quest-kicker,
.quest-meta {
  font-size: var(--text-kicker);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #d7b36a;
}

.quest-kicker {
  padding-top: 0.45rem;
}

.quest-name {
  font-family: var(--font-heading);
  color: #ffe7b0;
  padding-bottom: 0.6rem;
  font-size: var(--text-lg);
  line-height: 1.25;
}

.table-quest.is-tutorial {
  border-color: rgba(232, 196, 96, 0.7);
  background:
    linear-gradient(180deg, rgba(72, 48, 14, 0.96), rgba(16, 10, 4, 0.92));
}

.tutorial-mark {
  position: absolute;
  top: 0.55rem;
  left: 0;
  right: 0;
  padding: 0.22rem 0.35rem;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  text-align: center;
  color: #1a1004;
  background: linear-gradient(180deg, #f0c060, #c99428);
}

.quest-difficulty {
  position: absolute;
  top: 0.55rem;
  right: 0.55rem;
  padding: 0.16rem 0.55rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  background: rgba(8, 5, 2, 0.86);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.quest-difficulty.is-easy {
  color: #8fd18f;
}

.quest-difficulty.is-normal {
  color: #f0c060;
}

.quest-difficulty.is-hard {
  color: #e08a6a;
}

.rim-zone {
  position: absolute;
  left: 2%;
  right: 2%;
  bottom: 0;
  z-index: 2;
}

.rim-kicker {
  margin: 0 auto 0.5rem;
  width: fit-content;
  padding: 0.22rem 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(176, 132, 42, 0.45);
  background: rgba(8, 5, 2, 0.78);
  font-size: var(--text-kicker);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f0c060;
}

.rim-seats {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 0.15rem;
  /* Headroom for the selected portrait, which lifts and grows. */
  padding-top: 1.9rem;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.rim-seats::-webkit-scrollbar {
  display: none;
}

.class-seat {
  appearance: none;
  flex: 0 0 auto;
  width: 7.6rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.28rem;
  cursor: pointer;
  filter: grayscale(0.5) brightness(0.6);
  transition: filter 160ms ease;
}

.class-seat :deep(.class-portrait) {
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.class-seat:hover:not(.selected),
.class-seat:focus-visible:not(.selected) {
  filter: grayscale(0.2) brightness(0.85);
}

.class-seat.selected {
  filter: none;
}

.class-seat.selected :deep(.class-portrait) {
  transform: translateY(-0.85rem) scale(1.18);
  box-shadow:
    0 0 0 3px rgba(240, 208, 96, 1),
    0 0 26px rgba(240, 208, 96, 0.55);
}

.class-seat.selected .seat-name {
  background: linear-gradient(180deg, #f0c060, #c99428);
  border-color: #ffdf94;
  color: #1a1004;
  font-weight: 700;
  box-shadow: 0 0 14px rgba(240, 208, 96, 0.35);
}

.seat-name {
  max-width: 7.4rem;
  min-height: 2.5em;
  padding: 0.38rem 0.45rem 0.32rem;
  border-radius: 10px;
  background: rgba(10, 7, 3, 0.82);
  border: 1px solid rgba(176, 132, 42, 0.4);
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  line-height: 1.4;
  text-align: center;
  color: #ffe7b0;
  overflow: visible;
}

.seat-reading {
  margin: 0.7rem auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.seat-reading-name {
  font-family: var(--font-heading);
  color: #ead58a;
  font-size: var(--text-xl);
  line-height: 1.35;
  padding-top: 0.12rem;
}

.seat-reading-affinity {
  font-size: var(--text-base);
  line-height: 1.4;
  color: #ead58a;
}

.call-me {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.7rem auto 0;
  width: min(22rem, 100%);
  font-size: var(--text-sm);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #d7b36a;
}

.call-me input {
  flex: 1;
  appearance: none;
  border: 0;
  border-bottom: 1px solid rgba(176, 132, 42, 0.45);
  background: transparent;
  color: var(--text-bright);
  font-family: var(--font-heading);
  font-size: 1rem;
  text-transform: none;
  letter-spacing: 0;
  padding: 0.2rem 0;
}

.harder-table {
  width: min(920px, 100%);
  margin: 1rem auto 0;
  color: var(--text-secondary);
}

.harder-table summary {
  cursor: pointer;
  font-family: var(--font-heading);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: var(--text-sm);
  color: #e2c48a;
}

.harder-copy {
  font-size: var(--text-base);
  margin: 0.4rem 0 0.55rem;
}

.modifier-chip {
  min-width: 9.5rem;
  max-width: 16rem;
  padding: 0.55rem 0.7rem;
  border-radius: 10px;
}

.modifier-name,
.modifier-desc {
  display: block;
}

.modifier-name {
  font-family: var(--font-heading);
  color: #ffe7b0;
  font-size: var(--text-base);
}

.modifier-desc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: 0.2rem;
}

.lobby-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.7rem;
  width: min(920px, 100%);
  margin: 1.1rem auto 0;
}

.ghost-btn,
.sit-btn {
  appearance: none;
  padding: 0.6rem 1.1rem;
  border-radius: 999px;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.ghost-btn {
  border: 1px solid rgba(176, 132, 42, 0.35);
  background: transparent;
  color: var(--text-secondary);
}

.sit-btn {
  border: 1px solid rgba(232, 196, 96, 0.75);
  background: linear-gradient(180deg, rgba(78, 52, 16, 0.98), rgba(26, 16, 6, 0.96));
  color: var(--dng-title-gold);
}

.sit-btn:disabled,
.ghost-btn:disabled,
.table-quest:disabled,
.class-seat:disabled,
.deck-tab:disabled,
.brief-more:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .table-board {
    height: 200px;
  }

  .table-brief {
    top: 6%;
    padding: 0.45rem 0.55rem;
  }

  .table-nameplate {
    font-size: var(--text-lg);
  }

  .table-hook {
    font-size: var(--text-sm);
    -webkit-line-clamp: 2;
  }

  .table-flavor {
    -webkit-line-clamp: 1;
  }

  /*
   * A phone-height board has no room to seat the council on its rim: the
   * heading would land on top of the quest brief. Drop the picker into flow
   * below the board instead.
   */
  .table-assembly {
    padding-bottom: 0;
  }

  .rim-zone {
    position: static;
    margin-top: 0.9rem;
  }

  /* Centring a row that always overflows puts its first seat out of reach. */
  .rim-seats {
    justify-content: flex-start;
    scroll-snap-type: x proximity;
  }

  .class-seat {
    width: 6.1rem;
    scroll-snap-align: center;
  }

  .class-seat :deep(.class-portrait) {
    width: 56px;
    height: 56px;
  }

  .seat-name {
    max-width: 6rem;
    font-size: var(--text-sm);
  }

  .quest-fan {
    justify-content: flex-start;
    overflow-x: auto;
    min-height: 250px;
    padding: 1.8rem 0.4rem 1.2rem;
    scroll-snap-type: x proximity;
  }

  .fan-slot {
    margin-left: -1.8rem;
    scroll-snap-align: center;
    flex: 0 0 auto;
  }

  .fan-slot:hover,
  .fan-slot:focus-within {
    transform: translateY(-12px) rotate(0deg) scale(1.05) !important;
  }

  .fan-slot.is-selected {
    transform: translateY(-22px) rotate(0deg) scale(1.1) !important;
  }

  .table-quest {
    width: 148px;
    min-height: 200px;
  }

  .quest-scene {
    height: 96px;
  }

  .lobby-actions {
    justify-content: stretch;
  }

  .sit-btn,
  .ghost-btn {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .class-seat,
  .class-seat :deep(.class-portrait),
  .class-seat.selected :deep(.class-portrait),
  .fan-slot,
  .fan-slot.is-selected,
  .fan-slot:hover,
  .fan-slot:focus-within,
  .veil-ember,
  .veil-ring {
    transition: none;
    transform: none !important;
    animation: none;
  }
}
</style>
