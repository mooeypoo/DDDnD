<template>
  <!--
    "Play it" from the Pack Studio (docs/PACK_STUDIO.md §11, D15, D17).
    This tab tells the Studio tab that opened it that it's ready, with a fresh
    nonce; takes the first valid pack from that tab at a trusted origin;
    validates it like any import; and opens the pack's own table. Nothing is
    stored: closing the tab ends the preview.
  -->
  <section class="preview" aria-labelledby="preview-title">
    <h1 id="preview-title" class="preview-title">Playing a pack from the Pack Studio</h1>

    <p v-if="phase === 'no-opener'" class="preview-text">
      This page plays a pack sent by the DDDnD Pack Studio. Open it with <strong>Play it</strong> in the Studio; it can't be opened any other way.
    </p>
    <p v-else-if="phase === 'not-enabled'" class="preview-text">
      Playing packs from the Pack Studio isn't switched on in this version of the game yet. It arrives with the Studio's launch.
    </p>
    <p v-else-if="phase === 'waiting'" class="preview-text" role="status">Waiting for the pack from the Studio…</p>
    <p v-else-if="phase === 'checking'" class="preview-text" role="status">Checking the pack, the same way the game checks any pack you add…</p>
    <p v-else-if="phase === 'no-pack'" class="preview-text" role="alert">
      Nothing arrived from the Studio. Go back to the Studio and press <strong>Play it</strong> again.
    </p>
    <div v-else-if="phase === 'refused'" class="preview-refused" role="alert">
      <p class="preview-text"><strong>{{ refusal.title }}.</strong> Fix these in the Studio, then press Play it again.</p>
      <ul class="preview-problems">
        <li v-for="(problem, index) in refusal.problems.slice(0, 12)" :key="index"><span class="problem-file">{{ problem.file }}</span> {{ problem.message }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { createPreviewReceiver, PREVIEW_MESSAGES } from '@/domains/content/services/preview_handoff'
import type { PackIssue } from '@/domains/content/services/pack_snapshot_builder'
import { packTableRoute } from '@/ui/community/community_routes'
import { loadPreviewPack } from '@/ui/preview/preview_pack'
import { trustedPreviewOrigins } from '@/ui/preview/preview_session'
import { useGameStore } from '@/ui/stores/game_store'

const NO_PACK_AFTER_MS = 15000

const router = useRouter()
const gameStore = useGameStore()
const phase = ref<'no-opener' | 'not-enabled' | 'waiting' | 'checking' | 'no-pack' | 'refused'>('waiting')
const refusal = reactive<{ title: string; problems: PackIssue[] }>({ title: '', problems: [] })

let listener: ((event: MessageEvent) => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

/** 128 random bits, as hex: this page's nonce. */
function newNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

onMounted(() => {
  const opener = window.opener as Window | null
  const origins = trustedPreviewOrigins()
  if (!opener) {
    phase.value = 'no-opener'
    return
  }
  if (origins.length === 0) {
    phase.value = 'not-enabled'
    return
  }

  const nonce = newNonce()
  const receiver = createPreviewReceiver({ trustedOrigins: origins, opener, nonce })
  // Answers go only to the origin the pack came from, which is a trusted one
  const answer = (origin: string, ok: boolean, problems: string[]) => {
    opener.postMessage({ type: PREVIEW_MESSAGES.status, nonce, ok, problems }, origin)
  }

  listener = async (event: MessageEvent) => {
    const bundle = receiver.accept({ origin: event.origin, source: event.source, data: event.data })
    if (bundle === null) return
    if (timer) clearTimeout(timer)
    phase.value = 'checking'
    const result = await loadPreviewPack(bundle, {
      check: (snapshot) => gameStore.check_community_pack(snapshot),
      add: (snapshot) => gameStore.add_preview_pack(snapshot),
    })
    if (!result.ok) {
      refusal.title = result.title
      refusal.problems = result.problems
      phase.value = 'refused'
      answer(event.origin, false, result.problems.map((problem) => `${problem.file}: ${problem.message}`))
      return
    }
    answer(event.origin, true, [])
    await router.replace(packTableRoute(result.packKey))
  }
  window.addEventListener('message', listener)

  // Tell the opener this page is listening: only a trusted origin can receive it
  for (const origin of origins) {
    try {
      opener.postMessage({ type: PREVIEW_MESSAGES.ready, nonce }, origin)
    } catch {
      // The opener is at another origin; postMessage only delivers to the one that matches
    }
  }
  timer = setTimeout(() => {
    if (phase.value === 'waiting') phase.value = 'no-pack'
  }, NO_PACK_AFTER_MS)
})

onBeforeUnmount(() => {
  if (listener) window.removeEventListener('message', listener)
  if (timer) clearTimeout(timer)
})
</script>

<style scoped>
.preview {
  max-width: 44rem;
  margin: 4rem auto;
  padding: 0 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: var(--text-primary);
}

.preview-title {
  margin: 0;
  font-size: 1.75rem;
  color: var(--text-bright);
}

.preview-text {
  margin: 0;
  line-height: 1.6;
}

.preview-problems {
  margin: 0.5rem 0 0;
  padding-left: 1.25rem;
  line-height: 1.6;
}

.problem-file {
  color: var(--text-secondary);
}
</style>
