<template>
  <!--
    EventDetailsModal — dungeon-family inspection panel for EventCard.

    Uses SurfaceModalPanel as the structural shell (cap + ring + inset + actions).
    The severity accent is threaded as --edm-accent on the content root so the
    section rule and highlights react without shell-level coupling.
    Footer: Close button only. Events are informational — no play action here.
  -->
  <SurfaceModalPanel
    :is-open="isOpen"
    :title="title"
    :subtitle="severitySubtitle"
    @close="emit('close')"
  >
    <!-- ── Body content (teal inset) ───────────────────────────────────── -->
    <div class="edm-body" :style="{ '--edm-accent': severityAccent }">

      <!-- Severity badge row -->
      <div class="edm-preamble">
        <span class="edm-badge" :class="`edm-badge--${severity}`">
          <!-- Sigil: warning triangle at badge scale -->
          <svg class="edm-badge__sigil" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">
            <polygon points="6,0.8 11.2,10.8 0.8,10.8" />
            <line x1="6" y1="5" x2="6" y2="8" stroke="currentColor" stroke-linecap="round" />
            <circle cx="6" cy="9.5" r="0.6" fill="currentColor" stroke="none" />
          </svg>
          {{ severityLabel }}
        </span>
      </div>

      <!-- Description prose -->
      <p class="edm-description">{{ description }}</p>

      <!-- Bronze rule — visual seam between summary and detail data -->
      <div class="edm-rule" aria-hidden="true" />

      <!-- Highlights list -->
      <div v-if="highlights.length" class="edm-section">
        <h3 class="edm-section__title">Event Details</h3>
        <ul class="edm-highlights">
          <li
            v-for="(highlight, index) in highlights"
            :key="index"
            class="edm-highlight-item"
          >
            {{ highlight }}
          </li>
        </ul>
      </div>
    </div>

    <!-- ── Footer: Close only ──────────────────────────────────────────── -->
    <template #footer>
      <button
        type="button"
        class="edm-btn edm-btn--close"
        @click="emit('close')"
      >
        Dismiss
      </button>
    </template>
  </SurfaceModalPanel>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SurfaceModalPanel from '@/ui/components/surfaces/surface_modal_panel.vue'

const SEVERITY_META: Record<string, { label: string; subtitle: string; accent: string }> = {
  low:      { label: 'Low Severity',      subtitle: 'Minor · Informational',  accent: '#60a5fa' },
  medium:   { label: 'Medium Severity',   subtitle: 'Caution · Monitor',      accent: '#fbbf24' },
  high:     { label: 'High Severity',     subtitle: 'Warning · Act Soon',     accent: '#fb923c' },
  critical: { label: 'Critical Severity', subtitle: 'Critical · Act Now',     accent: '#f87171' },
}

const DEFAULT_META = { label: 'Event', subtitle: 'System notification', accent: 'var(--text-secondary)' }

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    title: string
    description: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    highlights?: string[]
  }>(),
  {
    severity: 'medium',
    highlights: () => [],
  }
)

const emit = defineEmits<{
  close: []
}>()

const severityMeta = computed(() => SEVERITY_META[props.severity ?? 'medium'] ?? DEFAULT_META)
const severityLabel    = computed(() => severityMeta.value.label)
const severitySubtitle = computed(() => severityMeta.value.subtitle)
const severityAccent   = computed(() => severityMeta.value.accent)
</script>

<style scoped>
/* ─────────────────────────────────────────────────────────────
   SEVERITY ACCENT

   --edm-accent is set on .edm-body via :style binding.
   Drives: badge text/border, rule color, highlight border-left.
   The SurfaceModalPanel shell (cap, ring, inset frame) is unaffected.
   ───────────────────────────────────────────────────────────── */

/* ─────────────────────────────────────────────────────────────
   BODY REGION
   ───────────────────────────────────────────────────────────── */
.edm-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

/* ─────────────────────────────────────────────────────────────
   PREAMBLE — severity badge
   ───────────────────────────────────────────────────────────── */
.edm-preamble {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.edm-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px var(--space-sm);
  border: 1px solid var(--edm-accent, var(--text-secondary));
  border-radius: var(--radius-full);
  color: var(--edm-accent, var(--text-secondary));
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  background: color-mix(in srgb, var(--edm-accent, var(--text-secondary)) 10%, transparent);
}

.edm-badge__sigil {
  flex-shrink: 0;
}

/* ─────────────────────────────────────────────────────────────
   DESCRIPTION
   ───────────────────────────────────────────────────────────── */
.edm-description {
  margin: 0;
  color: var(--text-primary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
}

/* ─────────────────────────────────────────────────────────────
   RULE — bronze seam
   ───────────────────────────────────────────────────────────── */
.edm-rule {
  height: 1px;
  background: color-mix(in srgb, var(--edm-accent, var(--dng-divider)) 35%, var(--dng-divider));
}

/* ─────────────────────────────────────────────────────────────
   SECTIONS
   ───────────────────────────────────────────────────────────── */
.edm-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.edm-section__title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  letter-spacing: var(--tracking-widest);
  text-transform: uppercase;
  color: var(--dng-subtitle-warm);
}

/* ─────────────────────────────────────────────────────────────
   HIGHLIGHTS LIST
   ───────────────────────────────────────────────────────────── */
.edm-highlights {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.edm-highlight-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-xs);
  padding: 5px var(--space-sm);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  background: rgba(0, 0, 0, 0.18);
  border-left: 2px solid color-mix(in srgb, var(--edm-accent, var(--dng-divider)) 40%, var(--dng-divider));
}

/* ─────────────────────────────────────────────────────────────
   FOOTER BUTTON
   ───────────────────────────────────────────────────────────── */
.edm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  letter-spacing: var(--tracking-normal);
  border-radius: 0;
  cursor: pointer;
  transition: filter 0.12s ease, opacity 0.12s ease;
  border: none;
}

.edm-btn--close {
  background: var(--dng-btn-secondary-bg, rgba(255, 255, 255, 0.06));
  color: var(--dng-footer-muted);
  border: 1px solid var(--dng-btn-secondary-border, rgba(255,255,255,0.08));
}

.edm-btn--close:hover {
  filter: brightness(1.15);
}

.edm-btn--close:active {
  opacity: 0.8;
}

.edm-btn--close:focus-visible {
  outline: 2px solid var(--dng-bracket);
  outline-offset: 2px;
}
</style>
