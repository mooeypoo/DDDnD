import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/ui/views/welcome_view.vue'
import RunSetupView from '@/ui/views/run_setup_view.vue'
import GameView from '@/ui/views/game_view.vue'
import EndOfRunView from '@/ui/views/end_of_run_view.vue'
import ShareView from '@/ui/views/share_view.vue'
import { useGameStore } from '@/ui/stores/game_store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    }
  ]
})

router.beforeEach(async (to) => {
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
