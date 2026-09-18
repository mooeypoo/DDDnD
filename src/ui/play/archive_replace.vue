<template>
  <div
    class="archive-replace"
    :class="[`kind-${kind}`, `phase-${phase}`, { 'is-swapping': swapping }]"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
  >
    <div class="archive-veil" @click="canCancel && $emit('cancel')" />

    <section class="archive-book">
      <p class="archive-kicker">{{ kicker }}</p>
      <h2 :id="titleId" class="archive-title" tabindex="-1">{{ title }}</h2>
      <p class="archive-copy">{{ copy }}</p>

      <div class="archive-stage" aria-hidden="true">
        <div class="shelf-stack">
          <span v-for="n in 5" :key="n" class="shelf-page" />
        </div>

        <article
          v-if="outgoing[0]"
          class="swap-card outgoing"
          :class="{ flying: swapping || phase === 'reveal' }"
        >
          <p class="swap-kicker">{{ outgoingKicker }}</p>
          <h3>{{ outgoing[0].name }}</h3>
        </article>

        <article
          v-if="incoming[0]"
          class="swap-card incoming"
          :class="{ arriving: swapping || phase === 'confirm' }"
        >
          <p class="swap-kicker">From the Grimoire</p>
          <h3>{{ incoming[0].name }}</h3>
        </article>
      </div>

      <ul v-if="outgoing.length > 1 || incoming.length > 1" class="archive-extra">
        <li v-for="card in extraOutgoing" :key="`out-${card.id}`">
          Also returns: {{ card.name }}
        </li>
        <li v-for="card in extraIncoming" :key="`in-${card.id}`">
          Also enters: {{ card.name }}
        </li>
      </ul>

      <div class="archive-actions">
        <button
          v-if="canCancel"
          class="archive-cancel"
          type="button"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button
          class="archive-confirm"
          type="button"
          @click="handlePrimary"
        >
          {{ primaryLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'

import type { ArchiveReplaceKind, ArchiveReplacePhase } from '@/ui/play/hand_swap'
import { consultApprovalTitle } from '@/ui/play/hand_swap'

const props = defineProps<{
  kind: ArchiveReplaceKind
  phase: ArchiveReplacePhase
  outgoing: Array<{ id: string; name: string }>
  incoming: Array<{ id: string; name: string }>
  canCancel: boolean
  swapping?: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
  accept: []
}>()

const titleId = 'archive-replace-title'

const kicker = computed(() => {
  return props.kind === 'forced' ? 'Hand must stay six' : 'Spend this turn'
})

const title = computed(() => {
  if (props.phase === 'confirm' && props.outgoing[0] && props.incoming[0]) {
    return consultApprovalTitle(props.outgoing[0].name, props.incoming[0].name)
  }
  if (props.phase === 'confirm') return 'Replace a card in hand'
  return props.kind === 'forced' ? 'The archives return a page' : 'A page from the Grimoire'
})

const copy = computed(() => {
  if (props.phase === 'confirm') {
    return incomingCopy.value
      ? `${outgoingCopy.value} ${incomingCopy.value} enters your hand. Aftershocks and random events still land. You may cancel until you replace.`
      : 'Mark a hand card and choose a Grimoire page, then approve the swap. Aftershocks and random events still land while you look.'
  }

  if (props.kind === 'forced') {
    return incomingCopy.value
      ? `${outgoingCopy.value} It can no longer be held. ${incomingCopy.value} takes its place. This cannot be dismissed.`
      : `${outgoingCopy.value} It can no longer be held, and the shelves have no replacement yet.`
  }

  return incomingCopy.value
    ? `${outgoingCopy.value} ${incomingCopy.value} takes its place.`
    : `${outgoingCopy.value}`
})

const outgoingCopy = computed(() => {
  const names = props.outgoing.map((card) => card.name)
  if (names.length === 0) return 'A card leaves your hand.'
  if (names.length === 1) return `${names[0]} returns to the shelves.`
  return `${names.join(', ')} return to the shelves.`
})

const incomingCopy = computed(() => {
  const names = props.incoming.map((card) => card.name)
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  return names.join(', ')
})

const outgoingKicker = computed(() => {
  return props.kind === 'forced' ? 'No longer legal' : 'Set aside'
})

const extraOutgoing = computed(() => props.outgoing.slice(1))
const extraIncoming = computed(() => props.incoming.slice(1))

const primaryLabel = computed(() => {
  if (props.phase === 'confirm') return 'Replace and continue'
  if (props.incoming.length > 0) return 'Take this card'
  return 'Continue'
})

function handlePrimary() {
  if (props.phase === 'confirm') {
    emit('confirm')
    return
  }

  emit('accept')
}

onMounted(() => {
  document.getElementById(titleId)?.focus?.()
})
</script>

<style scoped>
.archive-replace {
  position: fixed;
  inset: 0;
  z-index: 900;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.archive-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(72, 42, 12, 0.35), transparent 46%),
    rgba(6, 3, 1, 0.78);
}

.archive-book {
  position: relative;
  width: min(520px, 100%);
  padding: 1.15rem 1.2rem 1.1rem;
  background:
    linear-gradient(165deg, rgba(62, 38, 14, 0.97) 0%, rgba(16, 10, 5, 0.97) 100%);
  border: 1px solid rgba(232, 196, 96, 0.55);
  box-shadow:
    0 0 0 1px rgba(8, 4, 2, 0.7),
    0 28px 48px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 220, 140, 0.18);
  clip-path: polygon(0 10px, 14px 0, calc(100% - 18px) 6px, 100% 0, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.archive-kicker {
  margin: 0;
  font-size: var(--text-kicker);
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #f0c060;
}

.archive-title {
  margin: 0.2rem 0 0.35rem;
  font-family: var(--font-heading);
  font-size: 1.35rem;
  color: #ffe7b0;
}

.archive-copy {
  margin: 0 0 0.9rem;
  font-size: var(--text-base);
  line-height: 1.45;
  color: #f4d8b8;
}

.archive-stage {
  position: relative;
  min-height: 9.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.7rem;
  align-items: end;
  margin-bottom: 0.85rem;
}

.shelf-stack {
  position: absolute;
  inset: auto 8% 0 8%;
  height: 3.2rem;
  display: flex;
  gap: 0.35rem;
  opacity: 0.55;
}

.shelf-page {
  flex: 1;
  border-radius: 2px 8px 2px 2px;
  background: linear-gradient(90deg, #c4a36a, #7a5a28);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.35);
}

.swap-card {
  position: relative;
  z-index: 1;
  min-height: 7.4rem;
  padding: 0.7rem 0.75rem;
  border-radius: 10px 10px 12px 12px;
  background: linear-gradient(180deg, #2a1c0c 0%, #161008 100%);
  border: 1px solid rgba(196, 148, 48, 0.55);
  box-shadow: 0 14px 24px rgba(0, 0, 0, 0.45);
}

.swap-card.outgoing.flying {
  transform: translate(-12%, 18%) rotate(-12deg) scale(0.78);
  opacity: 0.72;
  transition: transform 720ms cubic-bezier(0.22, 0.84, 0.28, 1), opacity 720ms ease;
}

.swap-card.incoming {
  border-color: rgba(240, 208, 96, 0.85);
  box-shadow:
    0 0 22px rgba(232, 196, 96, 0.4),
    0 14px 24px rgba(0, 0, 0, 0.45);
  animation: page-lift 720ms cubic-bezier(0.22, 0.84, 0.28, 1) both;
}

.swap-kicker {
  margin: 0 0 0.35rem;
  font-size: var(--text-kicker);
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f0c060;
}

.swap-card h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 1.02rem;
  line-height: 1.2;
  color: var(--text-bright);
}

.archive-extra {
  list-style: none;
  margin: 0 0 0.8rem;
  padding: 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.archive-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.55rem;
}

.archive-cancel,
.archive-confirm {
  appearance: none;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  font-family: var(--font-heading);
  font-size: var(--text-sm);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
}

.archive-cancel {
  border: 1px solid rgba(176, 132, 42, 0.4);
  background: transparent;
  color: var(--text-secondary);
}

.archive-confirm {
  border: 1px solid rgba(232, 196, 96, 0.7);
  background: rgba(42, 30, 12, 0.95);
  color: var(--dng-title-gold);
}

.kind-forced .archive-book {
  border-color: rgba(240, 140, 88, 0.6);
}

@media (max-width: 720px) {
  .archive-book {
    padding: 0.95rem 0.9rem 0.9rem;
    clip-path: none;
    border-radius: 6px 18px 6px 18px;
  }

  .archive-title {
    font-size: 1.15rem;
  }

  .archive-stage {
    grid-template-columns: 1fr;
    min-height: 0;
  }

  .swap-card.outgoing.flying {
    transform: translate(8%, 10%) rotate(-8deg) scale(0.86);
  }
}

@keyframes page-lift {
  from { transform: translateY(18px) scale(0.86); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .swap-card.outgoing.flying,
  .swap-card.incoming {
    animation: none;
    transition: none;
    transform: none;
    opacity: 1;
  }
}
</style>
