import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/ui/views/welcome_view.vue'
import RunSetupView from '@/ui/views/run_setup_view.vue'
import GameView from '@/ui/views/game_view.vue'
import EndOfRunView from '@/ui/views/end_of_run_view.vue'
import ShareView from '@/ui/views/share_view.vue'
import CommunityBazaarView from '@/ui/views/community_bazaar_view.vue'
import PreviewView from '@/ui/views/preview_view.vue'
import { PREVIEW_PATH } from '@/domains/content/services/preview_handoff'
import { isPreviewSession } from '@/ui/preview/preview_session'
import { useGameStore } from '@/ui/stores/game_store'

/**
 * Application router configuration.
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (to.name === 'game') {
      return { top: 0, left: 0 }
    }

    if (savedPosition) {
      return savedPosition
    }

    return { top: 0, left: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomeView
    },
    {
      path: '/play',
      name: 'play',
      component: RunSetupView
    },
    {
      // Community packs (ADR 0009 flag; journal M2.11): the bazaar, then one table per pack.
      path: '/community',
      name: 'community',
      component: CommunityBazaarView,
    },
    {
      path: '/community/:packKey+',
      name: 'community-pack',
      component: RunSetupView,
      props: true,
    },
    {
      path: '/game',
      name: 'game',
      component: GameView
    },
    {
      path: '/end',
      name: 'end',
      component: EndOfRunView
    },
    {
      path: '/share',
      name: 'share',
      component: ShareView
    },
    {
      // "Play it" from the Pack Studio (docs/PACK_STUDIO.md §11): a pack in memory, nothing saved
      path: PREVIEW_PATH,
      name: 'preview',
      component: PreviewView
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

/**
 * Navigation guard for run-dependent routes.
 *
 * Attempts restoring a saved run before allowing access to in-run pages.
 */
router.beforeEach(async (to) => {
  // A preview tab (D15): the preview, the pack's table, the run and its results. Nothing else,
  // and never a saved run: without a run in memory, back to the preview.
  if (isPreviewSession()) {
    if (to.name === 'preview' || to.name === 'community-pack') return true
    if ((to.name === 'game' || to.name === 'end') && useGameStore().hasActiveRun) return true
    return { path: PREVIEW_PATH }
  }

  if (to.name !== 'game' && to.name !== 'end') {
    return true
  }

  const gameStore = useGameStore()
  if (gameStore.hasActiveRun) {
    return true
  }

  const restored = await gameStore.restore_saved_run()
  if (!restored) {
    return { path: '/' }
  }

  if (to.name === 'end' && !gameStore.isRunComplete) {
    return { path: '/game' }
  }

  return true
})

export default router
