<template>
  <div class="welcome-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    <DungeonMasterModal :isOpen="gameStore.isDungeonMasterModalOpen" @close="gameStore.closeDungeonMasterModal" />

    <div class="chamber-glow" aria-hidden="true" />
    <div class="chamber-grain" aria-hidden="true" />

    <div class="door-stage">
      <div class="door-table" aria-hidden="true">
        <img class="door-map" :src="sceneUrl" alt="" />
        <div class="door-veil" />
      </div>

      <div class="door-copy">
        <GameLogo size="large" />
        <p class="door-kicker">A council is gathering</p>
        <h1 class="door-title">
          <span>Choose Your Quest.</span>
          <span>Shape the System.</span>
        </h1>
        <p class="door-line">
          Welcome, architecture explorer. The system needs you. Join the council for an
          adventure of software architecture, where every fix costs something
          and the clock never stops.
        </p>

        <ul class="door-scroll">
          <li>
            <span class="scroll-label">Your quest</span>
            <span class="scroll-copy">
              Leave the system stronger than you found it, and keep the council
              with you, before the turns run out.
            </span>
          </li>
          <li>
            <span class="scroll-label">Each turn</span>
            <span class="scroll-copy">
              Play one card — a real architectural decision — then the world may interrupt, and the council answers.
            </span>
          </li>
          <li>
            <span class="scroll-label">The catch</span>
            <span class="scroll-copy">
              Every choice trades something away. Every action has consequences.
            </span>
          </li>
        </ul>

        <p class="door-line door-hook">
          Can you guide your system to a worthy ending?
        </p>

        <button class="sit-btn" type="button" @click="goToSetup()">
          Enter the chamber
        </button>

        <div class="door-ropes">
          <button
            v-if="gameStore.shouldRecommendTutorial"
            type="button"
            class="teach-btn"
            @click="goToSetup('basics')"
          >
            New here? Learn in two minutes
          </button>
          <button v-else type="button" class="rope-link" @click="goToSetup('basics')">Basics tutorial</button>
          <button type="button" class="rope-link" @click="goToSetup('advanced')">Advanced tutorial</button>
        </div>

        <nav class="door-plaques" aria-label="Table lore">
          <button type="button" class="plaque-link" @click="gameStore.openAboutModal">What is this?</button>
          <button type="button" class="plaque-link" @click="gameStore.openRulesModal">How to play</button>
          <button type="button" class="plaque-link" @click="gameStore.openDungeonMasterModal">Dungeon Master</button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import { requestSceneBackground } from '@/ui/composables/presentation_asset_lookup'
import { resolveGameplaySceneId } from '@/ui/composables/gameplay_stage_presentation'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import DungeonMasterModal from '@/ui/components/common/dungeon_master_modal.vue'
import GameLogo from '@/ui/components/branding/game_logo.vue'

/**
 * Chamber door. Presentation only; run setup still lives at /play.
 */
const router = useRouter()
const gameStore = useGameStore()

const sceneUrl = computed(() => requestSceneBackground(resolveGameplaySceneId('monolith_of_mild_despair')))

function goToSetup(tutorialType?: string) {
  if (tutorialType) {
    router.push({ path: '/play', query: { tutorial: tutorialType } })
    return
  }

  router.push('/play')
}
</script>

<style scoped>
.welcome-view {
  position: relative;
  min-height: 100dvh;
  background: #070504;
  color: var(--text-primary);
  overflow-x: hidden;
  padding-bottom: 5.5rem;
}

.chamber-glow,
.chamber-grain {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.chamber-glow {
  background:
    radial-gradient(ellipse at 50% 12%, rgba(110, 68, 18, 0.32), transparent 48%),
    radial-gradient(ellipse at 50% 100%, rgba(8, 4, 2, 0.9), transparent 40%);
}

.chamber-grain {
  opacity: 0.16;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='80' height='80' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
}

.door-stage {
  position: relative;
  z-index: 1;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.4rem 1rem 2rem;
}

.door-table {
  position: absolute;
  inset: 8% 6% 10%;
  border-radius: 18px 18px 46% 46% / 18px 18px 32px 32px;
  overflow: hidden;
  box-shadow:
    0 40px 70px rgba(0, 0, 0, 0.6),
    inset 0 0 0 2px rgba(176, 132, 42, 0.25);
}

.door-map,
.door-veil {
  position: absolute;
  inset: 0;
}

.door-map {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.8) brightness(0.72);
}

.door-veil {
  background: linear-gradient(180deg, rgba(7, 5, 4, 0.15), rgba(7, 5, 4, 0.72));
}

.door-copy {
  position: relative;
  width: min(44rem, 100%);
  padding: 1.15rem 1.35rem 1.25rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  background: rgba(8, 5, 3, 0.72);
  border: 1px solid rgba(176, 132, 42, 0.32);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 220, 140, 0.08);
  clip-path: polygon(0 12px, 16px 0, calc(100% - 20px) 8px, 100% 0, 100% 100%, 14px 100%, 0 calc(100% - 14px));
}

.door-kicker {
  margin: 0.6rem 0 0;
  font-size: var(--text-kicker);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #f0c060;
}

.door-title {
  margin: 0;
  display: flex;
  flex-direction: column;
  font-family: var(--font-heading);
  font-size: clamp(1.7rem, 5.2vw, 2.7rem);
  line-height: 1.12;
  color: #ffe7b0;
}

.door-line {
  margin: 0;
  max-width: 34rem;
  color: #f4d8b8;
  line-height: 1.45;
}

.door-scroll {
  list-style: none;
  width: 100%;
  margin: 0.35rem 0 0.1rem;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
  text-align: left;
}

.door-scroll li {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.7rem 0.8rem 0.8rem;
  background: rgba(20, 13, 5, 0.6);
  border: 1px solid rgba(176, 132, 42, 0.3);
  border-radius: 4px 14px 4px 14px;
  box-shadow: inset 0 1px 0 rgba(255, 220, 140, 0.06);
}

.scroll-label {
  font-family: var(--font-heading);
  font-size: var(--text-kicker);
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #f0c060;
}

.scroll-copy {
  font-size: var(--text-sm);
  line-height: 1.5;
  color: #f4d8b8;
}

.door-hook {
  font-family: var(--font-heading);
  color: #ead58a;
}

.sit-btn {
  appearance: none;
  margin-top: 0.4rem;
  padding: 0.7rem 1.4rem;
  border-radius: 999px;
  border: 1px solid rgba(232, 196, 96, 0.75);
  background: linear-gradient(180deg, rgba(78, 52, 16, 0.98), rgba(26, 16, 6, 0.96));
  color: var(--dng-title-gold);
  font-family: var(--font-heading);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  cursor: pointer;
}

.door-ropes,
.door-plaques {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem 1rem;
}

.rope-link,
.plaque-link {
  appearance: none;
  border: 0;
  background: transparent;
  color: #e2c48a;
  font-family: var(--font-heading);
  cursor: pointer;
}

.rope-link {
  font-size: var(--text-base);
}

.teach-btn {
  appearance: none;
  padding: 0.42rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(232, 196, 96, 0.45);
  background: rgba(24, 16, 7, 0.75);
  color: #f0d69a;
  font-family: var(--font-heading);
  font-size: var(--text-base);
  cursor: pointer;
}

.teach-btn:hover {
  border-color: rgba(232, 196, 96, 0.8);
  color: var(--dng-title-gold);
}

.plaque-link {
  font-size: var(--text-sm);
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

@media (max-width: 720px) {
  .door-copy {
    clip-path: none;
    border-radius: 8px 18px 8px 18px;
    padding: 1rem 1rem 1.1rem;
  }

  .door-title {
    font-size: clamp(1.45rem, 8vw, 2rem);
  }

  /* Below this the three plaques are too narrow to read across. */
  .door-scroll {
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .door-scroll li {
    padding: 0.55rem 0.75rem 0.62rem;
  }
}

</style>
