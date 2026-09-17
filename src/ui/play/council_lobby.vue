<template>
  <div class="council-lobby">
    <div class="chamber-glow" aria-hidden="true" />
    <div class="chamber-grain" aria-hidden="true" />

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
          :disabled="isLoading"
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
          :disabled="isLoading"
          @click="setDeckMode('adventures')"
        >
          Adventures
        </button>
      </div>
      <p class="row-kicker">
        {{ deckMode === 'tutorials' ? 'Learn the ropes' : 'Choose your adventure' }}
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
            :disabled="isLoading"
            @click="$emit('selectQuest', quest)"
          >
            <span class="quest-scene" :style="{ backgroundImage: `url(${sceneFor(quest.id)})` }" />
            <span v-if="quest.isTutorial" class="tutorial-mark">Tutorial</span>
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
                :disabled="isLoading"
                @click="briefingOpen = true"
              >
                Read more
              </button>
            </div>
          </div>
        </div>
        <div class="rim-seats" role="list" aria-label="Choose your class">
          <button
            v-for="playerClass in classes"
            :key="playerClass.id"
            class="class-seat"
            type="button"
            role="listitem"
            :class="{ selected: selectedClass?.id === playerClass.id }"
            :aria-pressed="selectedClass?.id === playerClass.id"
            :disabled="isLoading"
            @click="$emit('selectClass', playerClass)"
          >
            <ClassPortrait
              :classId="playerClass.id"
              :className="playerClass.name"
              size="md"
            />
            <span class="seat-name">{{ playerClass.name }}</span>
          </button>
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
          :disabled="isLoading"
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
          :disabled="isLoading"
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
          :disabled="isLoading"
          @click="$emit('selectModifier', modifier)"
        >
          <span class="modifier-name">{{ modifier.name }}</span>
          <span class="modifier-desc">{{ modifier.description }}</span>
        </button>
      </div>
    </details>

    <footer class="lobby-actions">
      <button class="ghost-btn" type="button" :disabled="isLoading" @click="$emit('back')">
        Back to the door
      </button>
      <button
        class="sit-btn"
        type="button"
        :disabled="!canSit || isLoading"
        @click="$emit('sit')"
      >
        {{ isLoading ? 'The council is gathering…' : 'Join this adventure' }}
      </button>
    </footer>
    <QuestBriefingPlaque
      :is-open="briefingOpen"
      :quest="selectedQuest"
      @close="briefingOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { ChallengeModifier, PlayerClass } from '@/domains/content/model'
import { requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import { resolveGameplaySceneId } from '@/ui/composables/gameplay_stage_presentation'
import { classAffinityCopy } from '@/ui/play/class_affinity'
import { councilCountLabel } from '@/ui/play/council_copy'
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

const fanQuests = computed(() => {
  return deckMode.value === 'tutorials' ? props.tutorials : props.quests
})

function setDeckMode(mode: DeckMode) {
  if (mode === 'tutorials' && props.tutorials.length === 0) {
    return
  }

  deckMode.value = mode
  const list = mode === 'tutorials' ? props.tutorials : props.quests
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
  return classAffinityCopy(scoreId) ?? 'Identity in the council'
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

.lobby-mast,
.table-stage,
.quest-deck,
.harder-table,
.lobby-actions {
  position: relative;
  z-index: 1;
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

.rim-seats {
  position: absolute;
  left: 2%;
  right: 2%;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 0.15rem;
  padding-top: 1.2rem;
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
  filter: grayscale(0.28) brightness(0.78);
  transition: filter 160ms ease;
}

.class-seat :deep(.class-portrait) {
  transition: transform 160ms ease, box-shadow 160ms ease;
}

.class-seat.selected {
  filter: none;
}

.class-seat.selected :deep(.class-portrait) {
  transform: translateY(-0.7rem);
  box-shadow:
    0 0 0 2px rgba(240, 208, 96, 0.9),
    0 0 18px rgba(240, 208, 96, 0.38);
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

  .table-assembly {
    padding-bottom: 4.4rem;
  }

  .class-seat {
    width: 6.1rem;
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
  .fan-slot:focus-within {
    transition: none;
    transform: none !important;
  }
}
</style>
