<template>
  <div class="run-setup-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />
    <CouncilLobby
      :quests="tableQuests"
      :tutorials="tableTutorials"
      :classes="gameStore.availableClasses"
      :modifiers="availableModifiers"
      :selectedQuest="selectedQuest"
      :selectedClass="selectedClass"
      :selectedModifier="selectedModifier"
      :characterName="characterName"
      :isLoading="isPreparing"
      :communityPacksEnabled="communityPacksEnabled"
      :bazaarPack="bazaarPack"
      @selectQuest="selectQuest"
      @selectClass="selectClass"
      @selectModifier="selectModifier"
      @update:characterName="characterName = $event"
      @sit="startRun"
      @back="goBack"
      @showAbout="gameStore.openAboutModal"
      @showRules="gameStore.openRulesModal"
      @showDungeonMaster="gameStore.openDungeonMasterModal"
      @showCommunityPacks="router.push(BAZAAR_PATH)"
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
import { isCommunityPacksEnabled } from '@/ui/config/feature_flags'
import { isFirstPartyPackKey } from '@/domains/content/services/pack_identity'
import { describePackPublisher } from '@/ui/play/community_pack_review'
import { BAZAAR_PATH, packKeyFromParam } from '@/ui/community/community_routes'
import { sortQuestsByDifficulty } from '@/ui/play/quest_difficulty'

/**
 * Without `packKey` this is the council lobby: first-party content only.
 * With it (`/community/<pack key>`), it is that community pack's table: only
 * that pack's scenarios, in the bazaar's look (journal M2.11).
 */
const props = defineProps<{ packKey?: string | string[] }>()

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

const selectedClass = ref<PlayerClass | null>(null)
const selectedQuest = ref<QuestDisplayModel | null>(null)
const selectedModifier = ref<ChallengeModifier | null>(null)
const availableModifiers = ref<ChallengeModifier[]>([])
const characterName = ref('')

/** Community packs (ADR 0009): nothing here renders or runs unless the build flag is on. */
const communityPacksEnabled = isCommunityPacksEnabled()
const tablePackKey = computed(() => (communityPacksEnabled ? packKeyFromParam(props.packKey) : undefined))

/** Quests at this table: the pack's own at a pack table, first-party ones in the lobby. */
function belongsHere(quest: QuestDisplayModel): boolean {
  return tablePackKey.value ? quest.packKey === tablePackKey.value : isFirstPartyPackKey(quest.packKey)
}
const tableQuests = computed(() => gameStore.availableQuests.filter(belongsHere))
const tableTutorials = computed(() => gameStore.availableTutorials.filter(belongsHere))

const tablePack = computed(() => (tablePackKey.value ? gameStore.find_community_pack(tablePackKey.value) : null))
const bazaarPack = computed(() => {
  const pack = tablePack.value
  if (!pack) return null
  return {
    name: pack.manifest.name,
    version: pack.manifest.version,
    description: pack.manifest.description,
    publisher: describePackPublisher(pack).label,
  }
})

if (communityPacksEnabled) {
  // Pack links and saved-run notices belong to the bazaar now (journal M2.11).
  if (typeof route.query.pack === 'string') {
    void router.replace({ path: BAZAAR_PATH, query: { pack: route.query.pack } })
  } else if (!tablePackKey.value) {
    void gameStore.refresh_saved_run_pack_notice().then(() => {
      if (gameStore.savedRunPackNotice) void router.replace(BAZAAR_PATH)
    })
  }
}
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
  const tutorialMatch = tutorialParam
    ? tableTutorials.value.find((tutorial) => {
        const targetOrder = tutorialParam === 'basics' ? 1 : tutorialParam === 'advanced' ? 2 : null
        return targetOrder !== null && tutorial.tutorialOrder === targetOrder
      })
    : undefined

  warmKnownScenarios(tutorialMatch)

  if (tutorialMatch) {
    await launchTutorial(tutorialMatch)
    return
  }

  if (tablePackKey.value && !tablePack.value) {
    // A link to a pack that isn't added here: the bazaar explains and offers to add packs.
    await router.replace({ path: BAZAAR_PATH, query: { missing: '1' } })
    return
  }

  if (!selectedQuest.value) {
    selectedQuest.value = easiestAdventure(tableQuests.value) ?? tableTutorials.value[0] ?? null
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

// Moving from one pack's table to another reuses this view: start fresh.
watch(tablePackKey, () => {
  selectedQuest.value = easiestAdventure(tableQuests.value) ?? tableTutorials.value[0] ?? null
  selectedModifier.value = null
})

watch(tableQuests, (quests) => {
  if (!selectedQuest.value) {
    selectedQuest.value = easiestAdventure(quests)
  }
})

function easiestAdventure(quests: QuestDisplayModel[]): QuestDisplayModel | null {
  return sortQuestsByDifficulty(quests)[0] ?? null
}

function selectClass(playerClass: PlayerClass) {
  selectedClass.value = playerClass
}

function selectQuest(quest: QuestDisplayModel) {
  selectedQuest.value = quest
  warmKnownScenarios(quest)
  if (quest.isTutorial) {
    selectedModifier.value = null
  }
}

function warmKnownScenarios(priority?: QuestDisplayModel | null) {
  const quests = [...tableQuests.value, ...tableTutorials.value]
  const first = priority ?? quests[0]
  if (!first) {
    return
  }

  // The chosen scenario goes first. Other adventures wait until it has
  // finished, so their files do not crowd out the one the player is about to sit.
  void gameStore.warm_scenario_bundle(first.packKey, first.id, first.version).then(() => {
    for (const quest of quests) {
      void gameStore.warm_scenario_bundle(quest.packKey, quest.id, quest.version)
    }
  })
}

function selectModifier(modifier: ChallengeModifier | null) {
  selectedModifier.value = modifier
}

function goBack() {
  router.push(tablePackKey.value ? BAZAAR_PATH : '/')
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
    pack_key: selectedQuest.value.packKey,
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
    pack_key: quest.packKey,
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
