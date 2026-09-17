<template>
  <div class="run-setup-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />

    <CouncilLobby
      :quests="gameStore.availableQuests"
      :tutorials="gameStore.availableTutorials"
      :classes="gameStore.availableClasses"
      :modifiers="availableModifiers"
      :selectedQuest="selectedQuest"
      :selectedClass="selectedClass"
      :selectedModifier="selectedModifier"
      :characterName="characterName"
      :isLoading="isPreparing"
      @selectQuest="selectQuest"
      @selectClass="selectClass"
      @selectModifier="selectModifier"
      @update:characterName="characterName = $event"
      @sit="startRun"
      @back="goBack"
      @showAbout="gameStore.openAboutModal"
      @showRules="gameStore.openRulesModal"
      @showDungeonMaster="gameStore.openDungeonMasterModal"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * Council lobby for quest / playerClass / modifier selection.
 *
 * Presentation only. Run creation stays on the store via start_new_run.
 */
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { PlayerClass, ChallengeModifier } from '@/domains/content/model'
import type { QuestDisplayModel } from '@/ui/types/quest_display_model'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'
import CouncilLobby from '@/ui/play/council_lobby.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const selectedClass = ref<PlayerClass | null>(null)
const selectedQuest = ref<QuestDisplayModel | null>(null)
const selectedModifier = ref<ChallengeModifier | null>(null)
const availableModifiers = ref<ChallengeModifier[]>([])
const characterName = ref('')
const isLoadingClasses = ref(false)
const isLoadingQuests = ref(false)
const isLoadingTutorials = ref(false)
const isLoadingModifiers = ref(false)

const isPreparing = computed(() => {
  return (
    gameStore.isLoadingBundle
    || isLoadingClasses.value
    || isLoadingQuests.value
    || isLoadingTutorials.value
    || isLoadingModifiers.value
  )
})

onMounted(async () => {
  if (gameStore.availableClasses.length === 0) {
    isLoadingClasses.value = true
    try {
      await gameStore.load_available_classes()
    } finally {
      isLoadingClasses.value = false
    }
  }

  if (gameStore.availableTutorials.length === 0) {
    isLoadingTutorials.value = true
    try {
      await gameStore.load_available_tutorials()
    } finally {
      isLoadingTutorials.value = false
    }
  }

  if (gameStore.availableQuests.length === 0) {
    isLoadingQuests.value = true
    try {
      await gameStore.load_available_quests()
    } finally {
      isLoadingQuests.value = false
    }
  }

  isLoadingModifiers.value = true
  try {
    await gameStore.load_available_challenge_modifiers?.()
    availableModifiers.value = gameStore.availableChallengeModifiers ?? []
  } catch {
    availableModifiers.value = []
  } finally {
    isLoadingModifiers.value = false
  }

  const tutorialParam = route.query.tutorial as string | undefined
  if (tutorialParam && gameStore.availableTutorials.length > 0) {
    const targetOrder = tutorialParam === 'basics' ? 1 : tutorialParam === 'advanced' ? 2 : null
    if (targetOrder !== null) {
      const match = gameStore.availableTutorials.find((tutorial) => tutorial.tutorialOrder === targetOrder)
      if (match) {
        await launchTutorial(match)
        return
      }
    }
  }

  if (!selectedQuest.value && gameStore.availableQuests.length > 0) {
    selectedQuest.value = gameStore.availableQuests[0]
  }

  if (!selectedClass.value && gameStore.availableClasses.length > 0) {
    selectedClass.value = gameStore.availableClasses[0]
  }
})

watch(
  () => gameStore.availableClasses,
  (classes) => {
    if (!selectedClass.value && classes.length > 0) {
      selectedClass.value = classes[0]
    }
  },
)

watch(
  () => gameStore.availableQuests,
  (quests) => {
    if (!selectedQuest.value && quests.length > 0) {
      selectedQuest.value = quests[0]
    }
  },
)

function selectClass(playerClass: PlayerClass) {
  selectedClass.value = playerClass
}

function selectQuest(quest: QuestDisplayModel) {
  selectedQuest.value = quest
  if (quest.isTutorial) {
    selectedModifier.value = null
  }
}

function selectModifier(modifier: ChallengeModifier | null) {
  selectedModifier.value = modifier
}

function goBack() {
  router.push('/')
}

async function startRun() {
  if (!selectedClass.value || !selectedQuest.value) return

  const modifierRef =
    selectedQuest.value.isTutorial || !selectedModifier.value
      ? undefined
      : {
          id: selectedModifier.value.id,
          version: selectedModifier.value.version,
        }

  await gameStore.start_new_run({
    scenario_id: selectedQuest.value.id,
    scenario_version: selectedQuest.value.version,
    selected_class_ref: {
      id: selectedClass.value.id,
      version: selectedClass.value.version,
    },
    ...(modifierRef ? { selected_challenge_modifier_ref: modifierRef } : {}),
    character_name: characterName.value || undefined,
    is_tutorial: selectedQuest.value.isTutorial ?? false,
  })

  router.push('/game')
}

async function launchTutorial(quest: QuestDisplayModel) {
  const fallbackClass = selectedClass.value ?? gameStore.availableClasses[0]
  if (!fallbackClass) return

  await gameStore.start_new_run({
    scenario_id: quest.id,
    scenario_version: quest.version,
    selected_class_ref: {
      id: fallbackClass.id,
      version: fallbackClass.version,
    },
    is_tutorial: true,
  })

  router.push('/game')
}
</script>

<style scoped>
.run-setup-view {
  min-height: 100dvh;
  background: #070504;
}
</style>
