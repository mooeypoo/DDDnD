<template>
  <div class="share-view">
    <!-- Valid payload — show result card -->
    <template v-if="sharePayload">
      <div class="share-container">
        <div class="share-hero">
          <h1 class="share-heading">Quest Result</h1>
          <p class="share-subheading">A fellow architect shared their journey</p>
        </div>

        <ShareResultCard :payload="sharePayload" />

        <div class="share-actions">
          <AppButton variant="primary" @click="goPlay">
            <span>🐉</span> Play DDDnD
          </AppButton>
        </div>

        <footer class="share-footer">
          <p class="footer-text">
            DDDnD is a humorous simulation about software architecture decisions.
          </p>
        </footer>
      </div>
    </template>

    <!-- Invalid / missing payload — graceful fallback -->
    <template v-else>
      <div class="share-container share-error-container">
        <div class="error-content">
          <div class="error-icon">🗺️</div>
          <h1 class="error-title">Quest Not Found</h1>
          <p class="error-message">
            {{ errorMessage }}
          </p>
          <p class="error-hint">
            This share link may be expired, incomplete, or from an older version.
          </p>
          <AppButton variant="primary" @click="goPlay">
            <span>🐉</span> Start Your Own Quest
          </AppButton>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { decodeSharePayload, type SharePayload } from '@/domains/reporting/services'
import ShareResultCard from '@/ui/components/results/share_result_card.vue'
import AppButton from '@/ui/components/common/AppButton.vue'

const route = useRoute()
const router = useRouter()

const sharePayload = ref<SharePayload | null>(null)
const errorMessage = ref('The share link could not be decoded.')

onMounted(() => {
  const encoded = route.query.d as string | undefined

  if (!encoded) {
    errorMessage.value = 'No share data found in this link.'
    return
  }

  const result = decodeSharePayload(encoded)

  if (result.ok) {
    sharePayload.value = result.payload
  } else {
    errorMessage.value = result.error
  }
})

function goPlay() {
  router.push('/')
}
</script>

<style scoped>
.share-view {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: var(--space-3xl, 32px) var(--space-xl, 20px);
  background: var(--bg-page, #0b0e1a);
}

.share-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xl, 24px);
  max-width: 480px;
  width: 100%;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Hero ────────────────────────────────────────── */

.share-hero {
  text-align: center;
}

.share-heading {
  font-family: 'Cinzel', serif;
  font-size: var(--text-3xl, 1.875rem);
  font-weight: 700;
  color: var(--text-bright, #edf0f7);
  margin: 0 0 var(--space-sm, 8px);
}

.share-subheading {
  color: var(--text-secondary, #7a8aa4);
  font-size: var(--text-base, 1rem);
  margin: 0;
}

/* ─── Actions ─────────────────────────────────────── */

.share-actions {
  display: flex;
  justify-content: center;
}

/* ─── Footer ──────────────────────────────────────── */

.share-footer {
  text-align: center;
}

.footer-text {
  font-size: var(--text-sm, 0.875rem);
  color: var(--text-muted, #4d5b72);
  margin: 0;
}

/* ─── Error State ─────────────────────────────────── */

.share-error-container {
  text-align: center;
  padding-top: var(--space-4xl, 48px);
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-lg, 16px);
}

.error-icon {
  font-size: 4rem;
  opacity: 0.6;
}

.error-title {
  font-family: 'Cinzel', serif;
  font-size: var(--text-3xl, 1.875rem);
  font-weight: 700;
  color: var(--text-bright, #edf0f7);
  margin: 0;
}

.error-message {
  color: var(--text-secondary, #7a8aa4);
  font-size: var(--text-base, 1rem);
  margin: 0;
  max-width: 360px;
}

.error-hint {
  color: var(--text-muted, #4d5b72);
  font-size: var(--text-sm, 0.875rem);
  font-style: italic;
  margin: 0;
}
</style>
