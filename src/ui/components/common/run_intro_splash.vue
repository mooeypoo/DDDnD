<template>
  <Transition name="splash">
    <div v-if="isOpen" class="splash-overlay" role="dialog" aria-modal="true" aria-label="Quest Briefing">
      <div class="splash-scroll-area">
        <div class="splash-content" @click.stop>

          <!-- Glowing DDDnD logo sigil -->
          <div class="splash-crest" aria-hidden="true">
            <svg class="crest-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
              <defs>
                <filter id="sigil-glow">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
                  <feColorMatrix in="blur" type="matrix"
                    values="0.6 0 0.3 0 0
                            0   0 0.4 0 0
                            0.4 0 1   0 0
                            0   0 0   1 0"
                    result="colored"/>
                  <feMerge>
                    <feMergeNode in="colored"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <g filter="url(#sigil-glow)">
                <!-- Outer castle silhouette -->
                <path class="sigil-outline" d="M 60 55 L 60 45 L 68 45 L 68 55 L 80 55 L 80 35 L 88 35 L 88 45 L 100 45 L 112 45 L 112 35 L 120 35 L 120 55 L 132 55 L 132 45 L 140 45 L 140 55 L 140 165 L 60 165 L 60 55 Z"/>
                <line class="sigil-outline" x1="80" y1="35" x2="80" y2="55"/>
                <line class="sigil-outline" x1="120" y1="35" x2="120" y2="55"/>
                <!-- Core domain -->
                <rect class="sigil-outline" x="85" y="65" width="30" height="35"/>
                <circle class="sigil-node" cx="100" cy="82.5" r="2.5"/>
                <!-- Left bounded context -->
                <rect class="sigil-detail" x="65" y="90" width="18" height="25"/>
                <line class="sigil-detail" x1="74" y1="90" x2="74" y2="115"/>
                <circle class="sigil-node" cx="74" cy="102.5" r="2"/>
                <!-- Right bounded context -->
                <rect class="sigil-detail" x="117" y="90" width="18" height="25"/>
                <line class="sigil-detail" x1="126" y1="90" x2="126" y2="115"/>
                <circle class="sigil-node" cx="126" cy="102.5" r="2"/>
                <!-- Lower tier domains -->
                <rect class="sigil-detail" x="65" y="120" width="18" height="20"/>
                <rect class="sigil-detail" x="91" y="120" width="18" height="20"/>
                <rect class="sigil-detail" x="117" y="120" width="18" height="20"/>
                <!-- Foundation layer -->
                <rect class="sigil-detail" x="65" y="145" width="70" height="15"/>
                <line class="sigil-detail" x1="83" y1="145" x2="83" y2="160"/>
                <line class="sigil-detail" x1="100" y1="145" x2="100" y2="160"/>
                <line class="sigil-detail" x1="117" y1="145" x2="117" y2="160"/>
                <!-- Integration connectors -->
                <line class="sigil-detail" x1="85" y1="82" x2="83" y2="102"/>
                <line class="sigil-detail" x1="115" y1="82" x2="117" y2="102"/>
                <line class="sigil-detail" x1="74" y1="115" x2="74" y2="120"/>
                <line class="sigil-detail" x1="100" y1="100" x2="100" y2="120"/>
                <line class="sigil-detail" x1="126" y1="115" x2="126" y2="120"/>
                <!-- Arcane circle -->
                <circle class="sigil-detail" cx="100" cy="110" r="45" opacity="0.3"/>
              </g>
            </svg>
          </div>

          <!-- Welcome header -->
          <header class="splash-header">
            <ClassPortrait
              v-if="playerClassId"
              class="splash-portrait"
              :classId="playerClassId"
              :className="playerClassName"
              size="lg"
            />
            <div class="splash-header-text">
              <p class="splash-eyebrow">Quest Briefing</p>
              <h2 class="splash-title">
                {{ welcomeHeading }}
              </h2>
              <p class="splash-flavor">
                {{ scenarioName ? `The realm of "${scenarioName}" awaits your command.` : 'A troubled realm awaits your command.' }}
                Read well, brave architect — knowledge is the sharpest blade.
              </p>
            </div>
          </header>

          <!-- Tutorial callout (only shown for tutorials) -->
          <div v-if="isTutorial" class="tutorial-callout">
            <span class="tutorial-callout-icon" aria-hidden="true"><IconScroll :size="18" /></span>
            <div class="tutorial-callout-content">
              <span class="tutorial-callout-title">This is a Guided Tutorial</span>
              <p class="tutorial-callout-text">
                Helpful tips will appear as you play to explain key concepts.
                Follow the guidance — there are no wrong answers here.
              </p>
            </div>
          </div>

          <!-- Divider -->
          <div class="splash-divider" aria-hidden="true">
            <svg viewBox="0 0 200 12" class="divider-svg" xmlns="http://www.w3.org/2000/svg">
              <line x1="10" y1="6" x2="90" y2="6" stroke="var(--dng-divider)" stroke-width="1" stroke-dasharray="4 4"/>
              <circle cx="100" cy="6" r="3" fill="var(--dng-title-gold)" opacity="0.5"/>
              <line x1="110" y1="6" x2="190" y2="6" stroke="var(--dng-divider)" stroke-width="1" stroke-dasharray="4 4"/>
            </svg>
          </div>

          <!-- Scores section -->
          <section class="splash-section">
            <div class="section-header">
              <span class="section-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" class="section-icon-svg" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="10" width="4" height="8" rx="1" fill="var(--metric-maintainability)" opacity="0.8"/>
                  <rect x="8" y="6" width="4" height="12" rx="1" fill="var(--metric-delivery-confidence)" opacity="0.8"/>
                  <rect x="14" y="3" width="4" height="15" rx="1" fill="var(--metric-domain-clarity)" opacity="0.8"/>
                </svg>
              </span>
              <h3 class="section-title">System Ledger</h3>
            </div>
            <p class="section-description">
              These six vital signs reveal the state of the system as you inherit it.
              Raise them through wise decisions, and guard them from falling into ruin.
            </p>
            <div class="scores-grid">
              <div
                v-for="(value, scoreId) in scores"
                :key="scoreId"
                class="score-row"
              >
                <span class="score-icon">{{ getMetricIcon(scoreId as string) }}</span>
                <span class="score-label">{{ getMetricLabel(scoreId as string) }}</span>
                <span class="score-value" :class="getScoreClass(value)">{{ Math.round(value) }}</span>
                <div class="score-bar-track">
                  <div class="score-bar-fill" :class="getScoreClass(value)" :style="{ width: value + '%' }"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- Stakeholders section -->
          <section class="splash-section">
            <div class="section-header">
              <span class="section-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" class="section-icon-svg" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="6" r="3.5" fill="var(--metric-user-trust)" opacity="0.8"/>
                  <path d="M3 17 Q3 12 10 12 Q17 12 17 17" fill="var(--metric-user-trust)" opacity="0.5"/>
                  <circle cx="4" cy="8" r="2" fill="var(--metric-developer-morale)" opacity="0.6"/>
                  <circle cx="16" cy="8" r="2" fill="var(--metric-delivery-confidence)" opacity="0.6"/>
                </svg>
              </span>
              <h3 class="section-title">Stakeholder Pulse</h3>
            </div>
            <p class="section-description">
              Powerful figures watch your every move. Their favour or fury can shift the
              balance of the entire project. Keep an eye on their mood.
            </p>
            <div class="stakeholders-grid">
              <div
                v-for="(data, stakeholderId) in stakeholders"
                :key="stakeholderId"
                class="stakeholder-row"
              >
                <span class="stakeholder-icon">{{ getStakeholderIcon(stakeholderId as string) }}</span>
                <span class="stakeholder-name">{{ formatStakeholderName(stakeholderId as string) }}</span>
                <span class="stakeholder-label" :class="getSatisfactionClass(data.satisfaction)">
                  {{ getSatisfactionLabel(data.satisfaction) }}
                </span>
                <span class="stakeholder-value" :class="getSatisfactionClass(data.satisfaction)">
                  {{ Math.round(data.satisfaction) }}
                </span>
                <div class="stakeholder-bar-track">
                  <div
                    class="stakeholder-bar-fill"
                    :class="getSatisfactionClass(data.satisfaction)"
                    :style="{ width: data.satisfaction + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </section>

          <!-- HUD hint -->
          <div class="splash-hint-box">
            <span class="hint-icon" aria-hidden="true">
              <svg viewBox="0 0 20 20" class="hint-icon-svg" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="none" stroke="var(--dng-divider)" stroke-width="1.5" opacity="0.6"/>
                <text x="10" y="14" text-anchor="middle" fill="var(--dng-footer-muted)" font-size="11" font-weight="bold">i</text>
              </svg>
            </span>
            <p class="hint-text hint-text-wide">
              Both scores and stakeholder status are always visible in the
              <strong>sidebar</strong> on the left side of the screen, fully expanded at a glance.
            </p>
            <p class="hint-text hint-text-narrow">
              Both scores and stakeholder status are always visible in the
              <strong>HUD bar</strong> at the top of the screen. Tap either section
              to expand the full breakdown at any time.
            </p>
          </div>

          <!-- Divider -->
          <div class="splash-divider" aria-hidden="true">
            <svg viewBox="0 0 200 12" class="divider-svg" xmlns="http://www.w3.org/2000/svg">
              <line x1="10" y1="6" x2="90" y2="6" stroke="var(--dng-divider)" stroke-width="1" stroke-dasharray="4 4"/>
              <circle cx="100" cy="6" r="3" fill="var(--dng-title-gold)" opacity="0.5"/>
              <line x1="110" y1="6" x2="190" y2="6" stroke="var(--dng-divider)" stroke-width="1" stroke-dasharray="4 4"/>
            </svg>
          </div>

          <!-- Call to action blurb -->
          <section class="splash-action-blurb">
            <div class="blurb-icon" aria-hidden="true"><IconSatchel :size="28" /></div>
            <p class="blurb-text">
              Open the <strong>Action Satchel</strong> at the bottom of the screen to choose
              architectural scrolls that shape these numbers. Choose wisely —
              some actions carry <em>Architectural Aftershocks</em> that echo in future turns,
              altering scores and stakeholder attitudes when you least expect it.
            </p>
            <p class="blurb-turns">
              You have <strong>{{ maxTurns }} turns</strong> to steer this system toward glory… or ruin.
            </p>
          </section>

          <!-- Start button -->
          <footer class="splash-footer">
            <button class="btn-start-game" type="button" @click="emit('start')">
              <span class="btn-icon" aria-hidden="true">
                <svg viewBox="0 0 20 20" class="btn-start-svg" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="6,3 17,10 6,17" fill="currentColor"/>
                </svg>
              </span>
              <span class="btn-label">Begin Your Quest</span>
            </button>
          </footer>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StakeholderSnapshot, ScoreSnapshot } from '@/domains/simulation/model'
import { getMetricPresentation } from '@/ui/composables/metric_presentation'
import { formatStakeholderName as resolveStakeholderName } from '@/ui/composables/stakeholder_presentation'
import ClassPortrait from '@/ui/components/common/class_portrait.vue'
import IconScroll from '@/ui/components/icons/IconScroll.vue'
import IconSatchel from '@/ui/components/icons/IconSatchel.vue'

const props = defineProps<{
  isOpen: boolean
  playerName?: string
  playerClassName?: string
  playerClassId?: string
  scenarioName?: string
  scores: ScoreSnapshot
  stakeholders: StakeholderSnapshot
  stakeholderNames?: Record<string, string>
  maxTurns: number
  isTutorial?: boolean
}>()

const emit = defineEmits<{
  start: []
}>()

const welcomeHeading = computed(() => {
  const name = props.playerName
  const className = props.playerClassName

  if (name && className) {
    return `Hail, ${name} the ${className}!`
  }
  if (name) {
    return `Hail, ${name}!`
  }
  if (className) {
    return `Hail, brave ${className}!`
  }
  return 'Hail, brave Architect!'
})

function getMetricIcon(scoreId: string): string {
  return getMetricPresentation(scoreId).icon
}

function getMetricLabel(scoreId: string): string {
  return getMetricPresentation(scoreId).label
}

function getScoreClass(value: number): string {
  if (value >= 70) return 'high'
  if (value >= 40) return 'medium'
  if (value >= 20) return 'low'
  return 'critical'
}

const STAKEHOLDER_ICONS: Record<string, string> = {
  cto: '🏛️',
  vp_product: '📋',
  lead_developer: '💻',
  lead_engineer: '💻',
  operations_manager: '⚙️',
  operations_team: '⚙️',
  engineering_team: '🔧',
  product_team: '📦',
  finance_team: '💵',
  users: '👤',
  support_team: '🎧',
  leadership_team: '👔',
}

function getStakeholderIcon(stakeholderId: string): string {
  return STAKEHOLDER_ICONS[stakeholderId] ?? '👤'
}

function formatStakeholderName(stakeholderId: string): string {
  return resolveStakeholderName(stakeholderId, props.stakeholderNames)
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
</script>

<style scoped>
/* ─── Overlay ─── */
.splash-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  z-index: var(--z-modal);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xl) var(--space-lg);
}

.splash-scroll-area {
  width: min(640px, 100%);
  max-height: min(92vh, 900px);
  overflow-y: auto;
  overflow-x: hidden;
  border-radius: var(--radius-2xl);
}

/* ─── Container ─── */
.splash-content {
  background: linear-gradient(160deg, var(--dng-panel-surface) 0%, var(--dng-shell-bg) 100%);
  border: 1px solid var(--dng-bronze-mid);
  border-radius: var(--radius-2xl);
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7), 0 0 60px rgba(168, 120, 32, 0.15);
  width: 100%;
  padding: var(--space-3xl) var(--space-2xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

/* ─── Crest ─── */
.splash-crest {
  display: flex;
  justify-content: center;
}

.crest-svg {
  width: 72px;
  height: 72px;
  color: var(--dng-title-gold);
  animation: sigil-pulse 3s ease-in-out infinite;
}

.sigil-outline {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.sigil-detail {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: square;
  stroke-linejoin: miter;
}

.sigil-node {
  fill: currentColor;
}

@keyframes sigil-pulse {
  0%, 100% { opacity: 0.85; filter: brightness(1); }
  50% { opacity: 1; filter: brightness(1.2); }
}

/* ─── Header ─── */
.splash-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg);
}

.splash-header-text {
  text-align: center;
}

@media (min-width: 768px) {
  .splash-header {
    flex-direction: row;
    text-align: left;
    align-items: center;
  }

  .splash-header-text {
    text-align: left;
  }

  .splash-header-text .splash-flavor {
    margin-inline: 0;
  }
}

.splash-eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-widest);
  color: var(--dng-title-gold);
  margin: 0 0 var(--space-sm) 0;
}

.splash-title {
  font-family: var(--font-heading);
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--dng-title-gold);
  margin: 0 0 var(--space-md) 0;
  line-height: var(--leading-tight);
  overflow-wrap: break-word;
  word-break: break-word;
}

.splash-flavor {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 440px;
  margin-inline: auto;
  overflow-wrap: break-word;
  word-break: break-word;
}

/* ─── Divider ─── */
.splash-divider {
  display: flex;
  justify-content: center;
}

/* ─── Tutorial Callout ─── */
.tutorial-callout {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: rgba(100, 180, 255, 0.08);
  border: 1px solid rgba(100, 180, 255, 0.25);
  border-radius: var(--radius-md);
}

.tutorial-callout-icon {
  font-size: var(--text-xl);
  flex-shrink: 0;
  line-height: 1;
}

.tutorial-callout-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.tutorial-callout-title {
  font-weight: var(--font-semibold);
  font-size: var(--text-sm);
  color: var(--dng-title-gold);
}

.tutorial-callout-text {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.divider-svg {
  width: min(100%, 240px);
  height: 12px;
}

/* ─── Sections ─── */
.splash-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.section-icon {
  flex-shrink: 0;
}

.section-icon-svg {
  width: 22px;
  height: 22px;
}

.section-title {
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--dng-title-gold);
  margin: 0;
}

.section-description {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  line-height: var(--leading-relaxed);
  margin: 0;
}

/* ─── Scores grid ─── */
.scores-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: rgba(13, 9, 4, 0.45);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.score-row {
  display: grid;
  grid-template-columns: auto 1fr auto 80px;
  align-items: center;
  gap: var(--space-sm);
}

.score-icon {
  font-size: var(--text-base);
  line-height: 1;
}

.score-label {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.score-value {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.score-bar-track {
  height: 6px;
  background: var(--dng-shell-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.score-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) var(--ease-decelerate);
}

/* Score tier colors */
.score-value.high, .score-bar-fill.high { color: var(--score-high); background-color: var(--score-high); }
.score-value.medium, .score-bar-fill.medium { color: var(--score-medium); background-color: var(--score-medium); }
.score-value.low, .score-bar-fill.low { color: var(--score-low); background-color: var(--score-low); }
.score-value.critical, .score-bar-fill.critical { color: var(--score-critical); background-color: var(--score-critical); }
.score-value.high, .score-value.medium, .score-value.low, .score-value.critical {
  background-color: transparent;
}

/* ─── Stakeholders grid ─── */
.stakeholders-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background: rgba(13, 9, 4, 0.45);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.stakeholder-row {
  display: grid;
  grid-template-columns: auto 1fr auto auto 60px;
  align-items: center;
  gap: var(--space-sm);
}

.stakeholder-icon {
  font-size: var(--text-base);
  line-height: 1;
}

.stakeholder-name {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stakeholder-label {
  font-size: var(--text-2xs);
  font-weight: var(--font-semibold);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}

.stakeholder-label.supportive { color: var(--satisfaction-supportive); background: var(--effect-positive-bg); }
.stakeholder-label.neutral { color: var(--satisfaction-neutral); background: var(--effect-neutral-bg); }
.stakeholder-label.concerned { color: var(--satisfaction-concerned); background: var(--effect-warning-bg); }
.stakeholder-label.critical { color: var(--satisfaction-critical); background: var(--effect-negative-bg); }

.stakeholder-value {
  font-size: var(--text-sm);
  font-weight: var(--font-bold);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.stakeholder-value.supportive { color: var(--satisfaction-supportive); }
.stakeholder-value.neutral { color: var(--satisfaction-neutral); }
.stakeholder-value.concerned { color: var(--satisfaction-concerned); }
.stakeholder-value.critical { color: var(--satisfaction-critical); }

.stakeholder-bar-track {
  height: 6px;
  background: var(--dng-shell-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.stakeholder-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-bar) var(--ease-decelerate);
}

.stakeholder-bar-fill.supportive { background-color: var(--satisfaction-supportive); }
.stakeholder-bar-fill.neutral { background-color: var(--satisfaction-neutral); }
.stakeholder-bar-fill.concerned { background-color: var(--satisfaction-concerned); }
.stakeholder-bar-fill.critical { background-color: var(--satisfaction-critical); }

/* ─── Hint box ─── */
.splash-hint-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  background: var(--effect-neutral-bg);
  border: 1px solid var(--effect-neutral-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
}

.hint-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.hint-icon-svg {
  width: 20px;
  height: 20px;
}

.hint-text {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  line-height: var(--leading-relaxed);
  margin: 0;
}

.hint-text strong {
  color: var(--dng-title-gold);
}

/* Show sidebar hint on wide screens, HUD bar hint on narrow screens */
.hint-text-wide {
  display: none;
}

.hint-text-narrow {
  display: block;
}

@media (min-width: 1100px) {
  .hint-text-wide {
    display: block;
  }
  .hint-text-narrow {
    display: none;
  }
}

/* ─── Action blurb ─── */
.splash-action-blurb {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}

.blurb-icon {
  font-size: var(--text-3xl);
  line-height: 1;
}

.blurb-text {
  font-size: var(--text-sm);
  color: var(--dng-subtitle-warm);
  line-height: var(--leading-relaxed);
  margin: 0;
  max-width: 460px;
}

.blurb-text strong {
  color: var(--dng-title-gold);
}

.blurb-text em {
  color: var(--dng-bronze-hi);
  font-style: italic;
}

.blurb-turns {
  font-size: var(--text-base);
  color: var(--dng-subtitle-warm);
  font-weight: var(--font-semibold);
  margin: 0;
}

.blurb-turns strong {
  color: var(--dng-title-gold);
}

/* ─── Footer / Start button ─── */
.splash-footer {
  display: flex;
  justify-content: center;
  padding-top: var(--space-md);
}

.btn-start-game {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-3xl);
  background: var(--dng-bronze-mid);
  color: var(--dng-title-gold);
  border: none;
  border-radius: var(--button-radius);
  font-family: var(--font-heading);
  font-size: var(--text-lg);
  font-weight: var(--font-bold);
  letter-spacing: var(--tracking-wide);
  cursor: pointer;
  transition: all var(--transition-slow);
  box-shadow: 0 4px 16px rgba(160, 112, 24, 0.45);
  text-transform: uppercase;
}

.btn-start-game:hover {
  background: var(--dng-bronze-deep);
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(160, 112, 24, 0.65);
}

.btn-start-game:active {
  transform: translateY(0);
}

.btn-start-svg {
  width: 18px;
  height: 18px;
}

/* ─── Transition ─── */
.splash-enter-active,
.splash-leave-active {
  transition: opacity var(--transition-modal);
}

.splash-enter-from,
.splash-leave-to {
  opacity: 0;
}

.splash-enter-active .splash-content {
  transition: transform var(--transition-modal), opacity var(--transition-modal);
}

.splash-enter-from .splash-content {
  transform: scale(0.96) translateY(16px);
  opacity: 0;
}

.splash-leave-active .splash-content {
  transition: transform var(--transition-modal), opacity var(--transition-modal);
}

.splash-leave-to .splash-content {
  transform: scale(0.96) translateY(16px);
  opacity: 0;
}

/* ─── Mobile responsive ─── */
@media (max-width: 768px) {
  .splash-overlay {
    padding: var(--space-md) var(--space-sm);
  }

  .splash-scroll-area {
    max-height: min(94vh, 900px);
  }

  .splash-content {
    padding: var(--space-2xl) var(--space-lg);
    border-radius: var(--dng-chamfer);
  }

  .splash-title {
    font-size: var(--text-xl);
  }

  .score-row {
    grid-template-columns: auto 1fr auto 60px;
  }

  .stakeholder-row {
    grid-template-columns: auto 1fr auto auto 50px;
  }
}

@media (max-width: 480px) {
  .splash-overlay {
    padding: 6px 4px;
    align-items: flex-end;
  }

  .splash-scroll-area {
    max-height: 94vh;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }

  .splash-content {
    padding: var(--space-lg) var(--space-sm);
    gap: var(--space-md);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    overflow-x: hidden;
  }

  /* Constrain portrait so it doesn't push header width */
  .splash-portrait {
    max-width: 64px;
    max-height: 64px;
  }

  .splash-title {
    font-size: var(--text-lg);
  }

  .crest-svg {
    width: 48px;
    height: 48px;
  }

  .score-row {
    grid-template-columns: auto 1fr auto;
    gap: var(--space-xs);
  }

  .score-bar-track {
    display: none;
  }

  .stakeholder-row {
    grid-template-columns: auto 1fr auto auto;
    gap: var(--space-xs);
  }

  .stakeholder-bar-track {
    display: none;
  }

  .stakeholder-label {
    font-size: 9px;
    padding: 2px var(--space-1);
  }

  .btn-start-game {
    padding: var(--space-md) var(--space-2xl);
    font-size: var(--text-base);
  }

  .splash-hint-box {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
