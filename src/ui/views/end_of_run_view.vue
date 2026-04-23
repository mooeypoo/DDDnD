<template>
  <div class="end-of-run-view">
    <AboutModal :isOpen="gameStore.isAboutModalOpen" @close="gameStore.closeAboutModal" />
    <RulesModal :isOpen="gameStore.isRulesModalOpen" @close="gameStore.closeRulesModal" />
    
    <AppFrame class="end-frame">
      <!-- Outcome Hero -->
      <div class="outcome-hero">
        <div class="hero-decoration">
          <img
            v-if="endingVisualUrl"
            class="celebration-artwork"
            :src="endingVisualUrl"
            alt=""
            aria-hidden="true"
          />
          <div v-else class="celebration-icon">{{ outcome ? getArchetypeIcon(outcome.archetype) : '🎊' }}</div>
        </div>
        
        <h1 class="outcome-title">Journey Complete</h1>

        <!-- Player Identity -->
        <div class="player-identity">
          <ClassPortrait :classId="playerClassId" :className="playerClassName" size="lg" />
          <div class="player-identity-text">
            <div v-if="playerDisplayName" class="player-display-name">{{ playerDisplayName }}</div>
            <div class="player-class-label" :style="{ color: playerAccentColor }">{{ playerClassName }}</div>
          </div>
        </div>

        <!-- Outcome Tier -->
        <div v-if="outcome" class="outcome-tier-badge" :class="getTierClass(displayTierId)">
          <span class="tier-icon">{{ getTierIcon(displayTierId) }}</span>
          <span class="tier-label">{{ formatTier(displayTierId) }}</span>
        </div>

        <!-- Quest Name -->
        <div v-if="scenarioName" class="quest-banner">
          <span class="quest-banner-label">Quest</span>
          <span class="quest-banner-name">{{ scenarioName }}</span>
        </div>
      </div>
      
      <!-- Archetype Display -->
      <div v-if="outcome" class="archetype-card">
        <div class="archetype-visual">
          <img
            v-if="endingVisualUrl"
            class="archetype-artwork"
            :src="endingVisualUrl"
            alt=""
            aria-hidden="true"
          />
          <div v-else class="archetype-icon-wrapper">
            <span class="archetype-icon">{{ getArchetypeIcon(outcome.archetype) }}</span>
          </div>
        </div>
        
        <div class="archetype-content">
          <div class="archetype-label">Your Archetype</div>
          <h2 class="archetype-name">{{ formatArchetype(outcome.archetype) }}</h2>
          <p class="archetype-description">
            {{ getArchetypeDescription(outcome.archetype) }}
          </p>
        </div>
      </div>
      
      <!-- Run Summary Stats -->
      <div class="summary-card">
        <h3 class="card-title">
          <span class="title-icon"><IconBarChart :size="24" /></span>
          Run Summary
        </h3>
        
        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-label">Turns Completed</div>
            <div class="stat-value">{{ outcome?.turns_completed || 0 }}<span class="stat-max">/{{ outcome?.max_turns || 0 }}</span></div>
          </div>
          
          <div class="stat-box">
            <div class="stat-label">Avg. Score</div>
            <div class="stat-value">{{ Math.round(outcome?.score_average || 0) }}</div>
          </div>
          
          <div class="stat-box">
            <div class="stat-label">Completion</div>
            <div class="stat-value stat-completion">{{ formatCompletionReason(outcome?.completion_reason) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Final Scores -->
      <div v-if="gameStore.gameState" class="scores-card">
        <h3 class="card-title">
          <span class="title-icon"><IconBarChart :size="24" /></span>
          Final System Health
        </h3>
        
        <div class="scores-list">
          <div 
            v-for="(value, scoreId) in gameStore.gameState.scores" 
            :key="scoreId"
            class="score-row"
          >
            <div class="score-header">
              <span class="score-name">{{ formatScoreName(scoreId) }}</span>
              <span class="score-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
            </div>
            <div class="score-bar">
              <div class="score-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stakeholder Final State -->
      <div v-if="gameStore.gameState" class="stakeholders-card">
        <h3 class="card-title">
          <span class="title-icon"><IconGroup :size="24" /></span>
          Final Stakeholder States
        </h3>
        
        <div class="stakeholders-list">
          <div 
            v-for="(data, stakeholderId) in gameStore.gameState.stakeholders" 
            :key="stakeholderId"
            class="stakeholder-row"
          >
            <div class="stakeholder-main">
              <img
                class="stakeholder-avatar"
                :src="getStakeholderAvatarUrl(stakeholderId, data.satisfaction)"
                :alt="`${formatStakeholderName(stakeholderId)} avatar`"
              />
              <div class="stakeholder-info">
                <span class="stakeholder-name">{{ formatStakeholderName(stakeholderId) }}</span>
                <span class="stakeholder-label" :class="getSatisfactionClass(data.satisfaction)">
                  {{ getSatisfactionLabel(data.satisfaction) }}
                </span>
              </div>
            </div>
            <div class="stakeholder-value" :class="getSatisfactionClass(data.satisfaction)">
              {{ Math.round(data.satisfaction) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Share Controls -->
      <div class="share-card">
        <h3 class="card-title">
          <span class="title-icon"><IconMegaphone :size="24" /></span>
          Share Your Journey
        </h3>
        
        <div class="share-controls">
          <AppButton variant="secondary" @click="copyShareLink">
            <span>🔗</span> {{ copyButtonLabel }}
          </AppButton>

          <AppButton variant="secondary" @click="downloadShareCard">
            <span>🖼️</span> Download Result Card
          </AppButton>

          <AppButton v-if="hasNativeShare" variant="secondary" @click="nativeShare">
            <span>📲</span> Share…
          </AppButton>
        </div>
      </div>

      <!-- Hidden card for image export -->
      <div class="offscreen-card-wrapper" aria-hidden="true">
        <ShareResultCard v-if="sharePayload" ref="shareCardRef" :payload="sharePayload" />
      </div>
      
      <!-- Actions -->
      <div class="actions-area">
        <AppButton variant="secondary" @click="goHome">
          <span>🏠</span> Return Home
        </AppButton>
        <AppButton variant="primary" @click="playAgain">
          Play Again <span>🔄</span>
        </AppButton>
      </div>

      <!-- Footer Links -->
      <footer class="footer-links">
        <AppButton variant="subtle" @click="gameStore.openAboutModal">
          <span>ℹ️</span> What is this?
        </AppButton>
        <span class="link-separator">•</span>
        <AppButton variant="subtle" @click="gameStore.openRulesModal">
          <span>📖</span> Rules
        </AppButton>
      </footer>
    </AppFrame>
  </div>
</template>

<script setup lang="ts">
/**
 * End-of-run presentation surface.
 *
 * Reads finalized simulation/reporting outputs and provides share actions.
 * Does not own gameplay rule evaluation.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/ui/stores/game_store'
import type { OutcomeArchetypeId } from '@/shared/contracts'
import AboutModal from '@/ui/components/common/about_modal.vue'
import RulesModal from '@/ui/components/common/rules_modal.vue'
import ShareResultCard from '@/ui/components/results/share_result_card.vue'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'
import AppButton from '@/ui/components/common/AppButton.vue'
import AppFrame from '@/ui/components/surfaces/AppFrame.vue'
import IconBarChart from '@/ui/components/icons/IconBarChart.vue'
import IconGroup from '@/ui/components/icons/IconGroup.vue'
import IconMegaphone from '@/ui/components/icons/IconMegaphone.vue'
import { ENDING_VISUAL_ASSETS, type EndingVisualId } from '@/ui/config/presentation_asset_registry'
import { getClassAccentColor } from '@/ui/composables/class_artwork'
import { requestAvatarRoleImage } from '@/ui/composables/presentation_asset_lookup'
import {
  resolveStakeholderAvatarRole,
  resolveStakeholderMood
} from '@/ui/composables/gameplay_stage_presentation'
import {
  buildStakeholderNamesMap,
  formatStakeholderName as resolveStakeholderName
} from '@/ui/composables/stakeholder_presentation'
import { buildSharePayload } from '@/domains/reporting/services/build_share_payload'
import { buildShareUrl, type SharePayload } from '@/domains/reporting/services'

const router = useRouter()
const gameStore = useGameStore()

const outcome = computed(() => gameStore.runOutcome)

const playerClassId = computed(() => gameStore.gameState?.player_profile.selected_class_ref?.id)

const playerClassName = computed(() => {
  const classId = playerClassId.value
  if (!classId) return 'Adventurer'
  return classId
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
})

const playerDisplayName = computed(() => gameStore.gameState?.player_profile.display_name)

const playerAccentColor = computed(() => getClassAccentColor(playerClassId.value))

const scenarioName = computed(() => gameStore.scenarioBundle?.scenario?.name)

const displayTierId = computed(() => outcome.value?.selected_tier_id ?? outcome.value?.tier ?? 'failure')
const endingVisualUrl = computed(() => {
  const archetype = outcome.value?.archetype
  if (!archetype) return undefined

  const endingVisualIds = new Set<EndingVisualId>([
    'boundary_builder',
    'firefighter',
    'system_stabilizer',
    'stakeholder_whisperer',
    'runaway_refactorer'
  ])

  if (!endingVisualIds.has(archetype as EndingVisualId)) {
    return undefined
  }

  return ENDING_VISUAL_ASSETS[archetype as EndingVisualId]
})

const sharePayload = ref<SharePayload | null>(null)
const copyButtonLabel = ref('Copy Share Link')
const shareCardRef = ref<InstanceType<typeof ShareResultCard> | null>(null)
const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

onMounted(() => {
  // Scroll to top when end screen loads
  window.scrollTo(0, 0)
  
  if (!gameStore.hasActiveRun || !gameStore.isRunComplete) {
    router.push('/')
    return
  }
  
  if (!gameStore.runOutcome) {
    gameStore.get_run_outcome()
  }

  // Build share payload from canonical outcome and game state
  if (gameStore.runOutcome && gameStore.gameState) {
    sharePayload.value = buildSharePayload({
      run_outcome: gameStore.runOutcome,
      game_state: gameStore.gameState
    })
  }
})

function formatTier(tier: string): string {
  const labels: Record<string, string> = {
    triumph: 'Triumph',
    success: 'Success',
    survival: 'Survival',
    struggle: 'Struggle',
    collapse: 'Collapse',
    partial_success: 'Partial Success',
    failure: 'Failure'
  }
  return labels[tier] ?? tier.charAt(0).toUpperCase() + tier.slice(1)
}

function getTierIcon(tier: string): string {
  const icons: Record<string, string> = {
    triumph: '🏆',
    success: '✓',
    survival: '🛡️',
    struggle: '⚠️',
    collapse: '💀',
    partial_success: '✓',
    failure: '💀'
  }
  return icons[tier] ?? '🎯'
}

function getTierClass(tier: string): string {
  return `tier-${tier.replace('_', '-')}`
}

function formatArchetype(archetype: OutcomeArchetypeId): string {
  return archetype
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getArchetypeIcon(archetype: OutcomeArchetypeId): string {
  const icons: Record<OutcomeArchetypeId, string> = {
    'boundary_builder': '🏗️',
    'firefighter': '🧯',
    'runaway_refactorer': '♻️',
    'stakeholder_whisperer': '🗣️',
    'system_stabilizer': '⚖️',
    'the_diplomat': '🤝',
    'budget_hawk': '🦅',
    'the_pragmatist': '🔧',
    'the_visionary': '🔭',
    'burnout_machine': '🔥'
  }
  return icons[archetype] || '🎯'
}

function getArchetypeDescription(archetype: OutcomeArchetypeId): string {
  const descriptions: Record<OutcomeArchetypeId, string> = {
    'boundary_builder': 'You focused on establishing clear domain boundaries and architectural structure, laying the foundation for sustainable growth.',
    'firefighter': 'You responded swiftly to immediate crises and kept the system running under pressure, saving the day when it mattered most.',
    'runaway_refactorer': 'You pursued aggressive refactoring and technical excellence, sometimes at the cost of delivery speed.',
    'stakeholder_whisperer': 'You skillfully navigated organizational politics and stakeholder relationships, building consensus for change.',
    'system_stabilizer': 'You brought balance and stability to a chaotic system, carefully managing competing priorities.',
    'the_diplomat': 'You kept every stakeholder at the table, even when the system was on fire.',
    'budget_hawk': 'You proved that good architecture doesn\'t have to break the bank.',
    'the_pragmatist': 'You balanced short-term fixes with long-term investments, never going to extremes.',
    'the_visionary': 'You saw the big picture and reshaped the domain, even when others couldn\'t see why it mattered.',
    'burnout_machine': 'You shipped everything on time, but at what cost? The team is exhausted.'
  }
  return descriptions[archetype] || 'Your architectural journey was unique and shaped by the choices you made.'
}

function formatCompletionReason(reason?: string): string {
  if (!reason) return 'Unknown'

  const formatted: Record<string, string> = {
    max_turns_reached: 'Max Turns Reached',
    failure_condition_met: 'Failure Condition Met'
  }

  if (formatted[reason]) {
    return formatted[reason]
  }

  return reason
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatScoreName(scoreId: string): string {
  return scoreId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const stakeholderNames = computed((): Record<string, string> => {
  return buildStakeholderNamesMap(gameStore.scenarioBundle)
})

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, stakeholderNames.value)
}

function getScoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}

function getSatisfactionLabel(value: number): string {
  if (value >= 70) return 'Supportive'
  if (value >= 50) return 'Neutral'
  if (value >= 30) return 'Concerned'
  return 'Critical'
}

function getSatisfactionClass(value: number): string {
  if (value >= 70) return 'supportive'
  if (value >= 50) return 'neutral'
  if (value >= 30) return 'concerned'
  return 'critical'
}

function getStakeholderAvatarUrl(stakeholderId: string, satisfaction: number): string {
  return requestAvatarRoleImage({
    avatarRole: resolveStakeholderAvatarRole(stakeholderId),
    mood: resolveStakeholderMood(satisfaction)
  })
}

function goHome() {
  gameStore.reset()
  router.push('/')
}

function playAgain() {
  gameStore.reset()
  router.push('/play')
}

// ─── Share actions ─────────────────────────────────

function getShareUrl(): string | null {
  if (!sharePayload.value) return null
  return buildShareUrl(sharePayload.value, window.location.origin)
}

async function copyShareLink() {
  const url = getShareUrl()
  if (!url) return

  try {
    await navigator.clipboard.writeText(url)
    copyButtonLabel.value = 'Copied!'
    setTimeout(() => { copyButtonLabel.value = 'Copy Share Link' }, 2000)
  } catch {
    // Fallback: select from a temporary textarea
    const textarea = document.createElement('textarea')
    textarea.value = url
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copyButtonLabel.value = 'Copied!'
    setTimeout(() => { copyButtonLabel.value = 'Copy Share Link' }, 2000)
  }
}

async function nativeShare() {
  const url = getShareUrl()
  if (!url || !navigator.share) return

  try {
    await navigator.share({
      title: 'My DDDnD Quest Result',
      text: sharePayload.value
        ? `I completed a DDDnD quest as the ${sharePayload.value.arch.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}!`
        : 'Check out my DDDnD quest result!',
      url
    })
  } catch {
    // User cancelled or share failed — no action needed
  }
}

async function downloadShareCard() {
  const el = shareCardRef.value?.cardRef
  if (!el) return

  try {
    const canvas = await renderElementToCanvas(el)
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = 'dddnd-result.png'
    link.href = dataUrl
    link.click()
  } catch {
    // Image export failed — silently degrade
  }
}

/**
 * Lightweight client-side element-to-canvas renderer.
 *
 * Uses the SVG foreignObject technique:
 *   1. Serialize the DOM subtree to XHTML
 *   2. Wrap it in an SVG foreignObject
 *   3. Draw the SVG onto a canvas
 *
 * Images referenced by URL are converted to inline data URLs
 * before serialization so they survive the foreignObject context.
 */
async function renderElementToCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const width = el.offsetWidth
  const height = el.offsetHeight
  const scale = 2 // retina-quality

  // Clone and inline computed styles for the card
  const clone = el.cloneNode(true) as HTMLElement
  inlineComputedStyles(el, clone)

  // Convert <img> sources to inline data URLs so they render
  // inside the foreignObject (URL-based images won't load in a data-URI SVG)
  await inlineImageSources(clone)

  const serializer = new XMLSerializer()
  const xhtml = serializer.serializeToString(clone)

  const svgMarkup = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        ${xhtml}
      </foreignObject>
    </svg>`

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')!
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = reject
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgMarkup)
  })
}

/**
 * Fetch image sources and convert them to inline data URLs.
 * Necessary for the foreignObject→canvas technique because images
 * referenced by URL won't load inside a data-URI SVG context.
 */
async function inlineImageSources(el: HTMLElement): Promise<void> {
  const images = el.querySelectorAll('img')
  await Promise.all(Array.from(images).map(async (img) => {
    const src = img.getAttribute('src')
    if (!src || src.startsWith('data:')) return
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
      img.setAttribute('src', dataUrl)
    } catch {
      // If conversion fails, leave original src — it may not render in the export
    }
  }))
}

function inlineComputedStyles(source: Element, target: Element) {
  const computed = window.getComputedStyle(source)
  const targetEl = target as HTMLElement
  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i]
    targetEl.style.setProperty(prop, computed.getPropertyValue(prop))
  }
  const sourceChildren = source.children
  const targetChildren = target.children
  for (let i = 0; i < sourceChildren.length; i++) {
    if (targetChildren[i]) {
      inlineComputedStyles(sourceChildren[i], targetChildren[i])
    }
  }
}
</script>

<style scoped>
.end-of-run-view {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    var(--dng-shell-bg) 0%, 
    var(--dng-shell-bg) 50%, 
    rgba(16, 11, 5, 0.9) 100%
  );
  padding: var(--space-3xl) var(--space-2xl);
}

.end-frame {
  max-width: 1000px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out;
}

/* Override AppFrame body gap for end-of-run section spacing */
.end-frame :deep(.dungeon-frame__body) {
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
  padding: var(--space-2xl);
}

/* Outcome Hero */
.outcome-hero {
  text-align: center;
  padding: var(--space-4xl) var(--space-2xl) var(--space-2xl);
  position: relative;
  overflow: hidden;
}

.hero-decoration {
  margin-bottom: var(--space-xl);
}

.celebration-artwork {
  width: min(420px, 100%);
  max-height: 180px;
  object-fit: contain;
  display: inline-block;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.35));
  animation: fadeInUp 0.6s ease-out;
}

.celebration-icon {
  font-size: 4rem;
  animation: celebrate 1.5s ease-in-out;
}

.outcome-title {
  color: var(--dng-title-gold);
  font-size: var(--text-5xl);
  margin: 0 0 var(--space-xl) 0;
  font-weight: var(--font-black);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Player Identity */
.player-identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.player-identity-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
}

.player-display-name {
  color: var(--dng-title-gold);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}

.player-class-label {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.outcome-tier-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg) var(--space-3xl);
  border-radius: var(--radius-lg);
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  box-shadow: var(--shadow-lg);
}

.tier-icon {
  font-size: var(--text-3xl);
}

.tier-triumph {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.25) 0%, rgba(16, 185, 129, 0.35) 100%);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.4);
}

.tier-success {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.18) 0%, rgba(16, 185, 129, 0.25) 100%);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.tier-survival {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.18) 0%, rgba(59, 130, 246, 0.25) 100%);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.tier-partial-success {
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.18) 0%, rgba(59, 130, 246, 0.25) 100%);
  color: #60a5fa;
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.tier-struggle {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.18) 0%, rgba(245, 158, 11, 0.25) 100%);
  color: #fbbf24;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.tier-collapse {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.18) 0%, rgba(239, 68, 68, 0.25) 100%);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.tier-failure {
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.18) 0%, rgba(239, 68, 68, 0.25) 100%);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

/* Quest Banner */
.quest-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  font-size: var(--text-lg);
}

.quest-banner-label {
  color: var(--dng-subtitle-warm);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
}

.quest-banner-name {
  color: var(--dng-subtitle-warm);
  font-weight: var(--font-semibold);
}

/* Archetype Card */
.archetype-card {
  background: var(--dng-panel-surface);
  border: 2px solid var(--dng-bronze-mid);
  border-radius: var(--radius-xl);
  padding: var(--space-3xl);
  text-align: center;
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(10px);
}

.archetype-visual {
  margin-bottom: var(--space-2xl);
}

.archetype-artwork {
  width: min(420px, 100%);
  max-height: 260px;
  object-fit: contain;
  display: inline-block;
  filter: drop-shadow(0 10px 24px rgba(0, 0, 0, 0.35));
}

.archetype-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--dng-bronze-deep) 0%, var(--dng-bronze-mid) 100%);
  box-shadow: 0 8px 24px rgba(160, 112, 24, 0.45);
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.archetype-icon {
  font-size: 4rem;
}

.archetype-label {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-sm);
}

.archetype-name {
  color: var(--dng-title-gold);
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
  margin: 0 0 var(--space-lg) 0;
}

.archetype-description {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-lg);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 700px;
  margin-left: auto;
  margin-right: auto;
}

/* Card Base Styles */
.summary-card,
.scores-card,
.stakeholders-card,
.share-card {
  background: var(--dng-panel-surface);
  border: 2px solid var(--dng-divider);
  border-radius: var(--radius-xl);
  padding: var(--space-2xl);
  box-shadow: var(--shadow-md);
  backdrop-filter: blur(10px);
}

.card-title {
  color: var(--dng-title-gold);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  margin: 0 0 var(--space-xl) 0;
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.title-icon {
  font-size: var(--text-3xl);
}

/* Summary Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-xl);
}

.stat-box {
  text-align: center;
  padding: var(--space-xl);
  background: rgba(13, 9, 4, 0.45);
  border-radius: var(--radius-lg);
  border: 1px solid var(--dng-divider);
}

.stat-label {
  color: var(--dng-footer-muted);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
  font-weight: var(--font-semibold);
}

.stat-value {
  color: var(--dng-title-gold);
  font-size: var(--text-4xl);
  font-weight: var(--font-black);
}

.stat-max {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-2xl);
}

.stat-completion {
  font-size: var(--text-2xl);
}

/* Scores List */
.scores-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.score-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.score-name {
  color: var(--dng-subtitle-warm);
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}

.score-value {
  font-size: var(--text-2xl);
  font-weight: var(--font-black);
}

.score-value.critical {
  color: var(--score-critical);
}

.score-value.low {
  color: var(--score-low);
}

.score-value.medium {
  color: var(--score-medium);
}

.score-value.high {
  color: var(--score-high);
}

.score-bar {
  height: 12px;
  background: var(--dng-shell-bg);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.score-fill {
  height: 100%;
  border-radius: var(--radius-md);
  transition: width 1s ease-out;
}

.score-fill.critical {
  background: var(--score-critical);
}

.score-fill.low {
  background: var(--score-low);
}

.score-fill.medium {
  background: var(--score-medium);
}

.score-fill.high {
  background: var(--score-high);
}

/* Stakeholders List */
.stakeholders-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.stakeholder-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-lg);
  background: rgba(13, 9, 4, 0.45);
  border-radius: var(--radius-lg);
  border: 1px solid var(--dng-divider);
}

.stakeholder-main {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  min-width: 0;
}

.stakeholder-avatar {
  width: 42px;
  height: 42px;
  object-fit: contain;
  border-radius: 50%;
  border: 1px solid var(--dng-divider);
  background: rgba(13, 9, 4, 0.6);
  flex-shrink: 0;
}

.stakeholder-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  min-width: 0;
}

.stakeholder-name {
  color: var(--dng-subtitle-warm);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
}

.stakeholder-label {
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
}

.stakeholder-label.critical {
  color: var(--satisfaction-critical);
}

.stakeholder-label.concerned {
  color: var(--satisfaction-concerned);
}

.stakeholder-label.neutral {
  color: var(--satisfaction-neutral);
}

.stakeholder-label.supportive {
  color: var(--satisfaction-supportive);
}

.stakeholder-value {
  font-size: var(--text-3xl);
  font-weight: var(--font-black);
}

.stakeholder-value.critical {
  color: var(--satisfaction-critical);
}

.stakeholder-value.concerned {
  color: var(--satisfaction-concerned);
}

.stakeholder-value.neutral {
  color: var(--satisfaction-neutral);
}

.stakeholder-value.supportive {
  color: var(--satisfaction-supportive);
}

/* Share Controls */
.share-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* Offscreen card for image export */
.offscreen-card-wrapper {
  position: fixed;
  left: -9999px;
  top: -9999px;
  pointer-events: none;
}

/* Actions */
.actions-area {
  display: flex;
  gap: var(--space-lg);
  justify-content: center;
  padding-top: var(--space-lg);
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  /* removed — replaced by AppButton */
}

/* Footer Links */
.footer-links {
  text-align: center;
  padding-top: var(--space-xl);
  border-top: 1px solid var(--dng-divider);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.link-separator {
  color: var(--dng-footer-muted);
  user-select: none;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes celebrate {
  0%, 100% {
    transform: scale(1) rotate(0deg);
  }
  25% {
    transform: scale(1.2) rotate(-15deg);
  }
  75% {
    transform: scale(1.2) rotate(15deg);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .end-of-run-view {
    padding: var(--space-xl) var(--space-lg);
  }
  
  .outcome-title {
    font-size: var(--text-4xl);
  }
  
  .outcome-tier-badge {
    font-size: var(--text-xl);
    padding: var(--space-md) var(--space-2xl);
  }
  
  .archetype-name {
    font-size: var(--text-2xl);
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .actions-area {
    flex-direction: column-reverse;
    width: 100%;
  }

  .actions-area :deep(.dungeon-btn) {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .archetype-icon-wrapper {
    width: 100px;
    height: 100px;
  }
  
  .archetype-icon {
    font-size: 3rem;
  }
}
</style>
