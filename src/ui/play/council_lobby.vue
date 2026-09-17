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

    <section class="table-stage" aria-label="The table you will sit at">
      <div class="table-assembly">
        <div class="table-board">
          <div class="table-grain" />
          <div class="table-inlay">
            <img class="table-map" :src="sceneUrl" alt="" />
            <div class="table-veil" />
          </div>
        </div>
        <div class="rim-seats" role="list" aria-label="Take a seat">
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
      <p class="table-nameplate">{{ selectedQuest?.name ?? 'Choose a table' }}</p>
      <p v-if="selectedQuest" class="table-flavor">
        {{ selectedQuest.flavorText || selectedQuest.shortDescription || selectedQuest.description }}
      </p>
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

    <section v-if="tutorials.length > 0" class="rope-row" aria-label="Learn the ropes">
      <p class="row-kicker">Learn the ropes</p>
      <div class="quest-rail">
        <button
          v-for="tutorial in tutorials"
          :key="'tutorial-' + tutorial.id + '-v' + tutorial.version"
          class="table-quest is-tutorial"
          type="button"
          :disabled="isLoading"
          @click="$emit('launchTutorial', tutorial)"
        >
          <span class="quest-kicker">Tutorial</span>
          <span class="quest-name">{{ tutorial.name }}</span>
          <span class="quest-meta">{{ tutorial.turnCount }} turns</span>
        </button>
      </div>
    </section>

    <section class="quest-row" aria-label="Choose a quest">
      <p class="row-kicker">Choose the table</p>
      <div class="quest-rail">
        <button
          v-for="quest in quests"
          :key="quest.id + '-v' + quest.version"
          class="table-quest"
          type="button"
          :class="{ selected: isQuestSelected(quest) }"
          :disabled="isLoading"
          @click="$emit('selectQuest', quest)"
        >
          <span class="quest-scene" :style="{ backgroundImage: `url(${sceneFor(quest.id)})` }" />
          <span class="quest-kicker">{{ quest.turnCount }} turns · {{ quest.stakeholderCount }} voices</span>
          <span class="quest-name">{{ quest.name }}</span>
        </button>
      </div>
    </section>

    <details class="harder-table" :open="selectedModifier !== null">
      <summary>Harder table</summary>
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
        {{ isLoading ? 'The table is being set…' : 'Sit at this table' }}
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import type { ChallengeModifier, PlayerClass } from '@/domains/content/model'
import { requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import { resolveGameplaySceneId } from '@/ui/composables/gameplay_stage_presentation'
import { classAffinityCopy } from '@/ui/play/class_affinity'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import GameLogo from '@/ui/components/branding/game_logo.vue'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'

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

defineEmits<{
  selectQuest: [quest: QuestDisplayModel]
  selectClass: [playerClass: PlayerClass]
  selectModifier: [modifier: ChallengeModifier | null]
  launchTutorial: [quest: QuestDisplayModel]
  'update:characterName': [value: string]
  sit: []
  back: []
  showAbout: []
  showRules: []
  showDungeonMaster: []
}>()

const nameDraft = ref(props.characterName)

watch(() => props.characterName, (value) => {
  if (value !== nameDraft.value) {
    nameDraft.value = value
  }
})

const sceneUrl = computed(() => {
  return requestSceneBackground(resolveGameplaySceneId(props.selectedQuest?.id))
})

const canSit = computed(() => Boolean(props.selectedQuest && props.selectedClass))

function isQuestSelected(quest: QuestDisplayModel): boolean {
  return props.selectedQuest?.id === quest.id && props.selectedQuest?.version === quest.version
}

function sceneFor(scenarioId: string): string {
  return requestSceneBackground(resolveGameplaySceneId(scenarioId))
}

function affinityLine(scoreId: string | undefined): string {
  return classAffinityCopy(scoreId) ?? 'Identity at the table'
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
.rope-row,
.quest-row,
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
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  cursor: pointer;
}

.table-stage {
  width: min(920px, 100%);
  margin: 0 auto 1rem;
  text-align: center;
}

.table-assembly {
  position: relative;
  padding-bottom: 3.6rem;
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

.table-nameplate {
  margin: 0.7rem 0 0.2rem;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: #ffe7b0;
}

.table-flavor {
  margin: 0 auto;
  max-width: 42rem;
  color: #f4d8b8;
  font-size: 0.92rem;
  line-height: 1.4;
}

.row-kicker {
  margin: 0 0 0.4rem;
  font-size: 0.62rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f0c060;
}

.quest-rail,
.modifier-rail {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  padding-bottom: 0.45rem;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: rgba(176, 132, 42, 0.45) transparent;
}

.quest-rail::-webkit-scrollbar,
.modifier-rail::-webkit-scrollbar {
  height: 4px;
}

.quest-rail::-webkit-scrollbar-thumb,
.modifier-rail::-webkit-scrollbar-thumb {
  background: rgba(176, 132, 42, 0.45);
  border-radius: 999px;
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
  width: min(220px, 72vw);
  padding: 0;
  overflow: hidden;
  border-radius: 12px;
}

.table-quest.selected,
.modifier-chip.selected {
  border-color: rgba(240, 208, 96, 0.85);
  box-shadow: 0 0 0 1px rgba(240, 208, 96, 0.28);
}

.quest-scene {
  display: block;
  height: 72px;
  background-size: cover;
  background-position: center;
}

.quest-kicker,
.quest-name,
.quest-meta {
  display: block;
  padding: 0 0.7rem;
}

.quest-kicker,
.quest-meta {
  font-size: 0.62rem;
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
  padding-bottom: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.2;
}

.is-tutorial {
  width: min(16rem, 78vw);
  min-width: 14rem;
  padding: 0.7rem 0.8rem;
}

.is-tutorial .quest-name {
  white-space: normal;
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
  overflow-x: auto;
  scrollbar-width: none;
}

.rim-seats::-webkit-scrollbar {
  display: none;
}

.class-seat {
  appearance: none;
  flex: 0 0 auto;
  width: 6.4rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  cursor: pointer;
  filter: grayscale(0.28) brightness(0.78);
  transform: translateY(0);
  transition: transform 160ms ease, filter 160ms ease;
}

.class-seat.selected {
  filter: none;
  transform: translateY(-0.7rem);
}

.class-seat.selected :deep(.class-portrait) {
  box-shadow:
    0 0 0 2px rgba(240, 208, 96, 0.9),
    0 0 18px rgba(240, 208, 96, 0.38);
}

.seat-name {
  max-width: 6.2rem;
  padding: 0.12rem 0.35rem 0.18rem;
  border-radius: 999px;
  background: rgba(10, 7, 3, 0.82);
  border: 1px solid rgba(176, 132, 42, 0.4);
  font-family: var(--font-heading);
  font-size: 0.62rem;
  line-height: 1.2;
  text-align: center;
  color: #ffe7b0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.seat-reading {
  margin: 0.55rem auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.seat-reading-name {
  font-family: var(--font-heading);
  color: #ead58a;
  font-size: 0.95rem;
}

.seat-reading-affinity {
  font-size: 0.72rem;
  color: #d7b36a;
}

.call-me {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0.7rem auto 0;
  width: min(22rem, 100%);
  font-size: 0.78rem;
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
  font-size: 0.72rem;
  color: #e2c48a;
}

.harder-copy {
  font-size: 0.82rem;
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
  font-size: 0.82rem;
}

.modifier-desc {
  font-size: 0.72rem;
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
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-family: var(--font-heading);
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
.class-seat:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .table-board {
    height: 176px;
  }

  .table-assembly {
    padding-bottom: 3.1rem;
  }

  .class-seat {
    width: 4.6rem;
  }

  .class-seat :deep(.class-portrait) {
    width: 48px;
    height: 48px;
  }

  .seat-name {
    max-width: 4.5rem;
    font-size: 0.52rem;
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
  .class-seat.selected {
    transition: none;
    transform: none;
  }
}
</style>
