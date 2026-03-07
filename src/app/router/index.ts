import { createRouter, createWebHistory } from 'vue-router'
import WelcomeView from '@/ui/views/welcome_view.vue'
import RunSetupView from '@/ui/views/run_setup_view.vue'
import GameView from '@/ui/views/game_view.vue'
import EndOfRunView from '@/ui/views/end_of_run_view.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'welcome',
      component: WelcomeView
    },
    {
      path: '/setup',
      name: 'setup',
      component: RunSetupView
    },
    {
      path: '/game',
      name: 'game',
      component: GameView
    },
    {
      path: '/result',
      name: 'result',
      component: EndOfRunView
    }
  ]
})

export default router
