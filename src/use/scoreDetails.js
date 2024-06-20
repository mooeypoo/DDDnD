import { computed } from 'vue'
import { useScoreStore } from '@/stores/score'

export function scoreDetails() {
  const store = useScoreStore()

  const isGameActive = computed(() => store.isGameActive)

  const gameStatsForView = computed(() => ({
    company: [
      {
        color: store.coins > 0 ? 'yellow' : 'red',
        icon: 'mdi-hand-coin',
        title: 'Coins',
        value: store.coins
      },
      {
        color: store.revenue > 0 ? 'green' : 'red',
        icon: 'mdi-purse',
        title: 'Revenue',
        value: store.revenue
      }
    ],
    happiness: [
      {
        color: store.happiness.users > 50 ? 'green' : 'red',
        icon: 'mdi-account',
        title: 'Users',
        value: store.happiness.users,
        isPercentage: true
      },
      {
        color: store.happiness.devs > 50 ? 'green' : 'red',
        icon: 'mdi-laptop',
        title: 'Devs',
        value: store.happiness.devs,
        isPercentage: true
      }
    ],
    system: [
      {
        color: store.system.modularity > 50 ? 'green' : 'white',
        icon: 'mdi-puzzle-outline',
        title: 'Modularity',
        value: store.system.modularity,
        isPercentage: true
      },
      {
        color: store.system.performance > 50 ? 'green' : 'white',
        icon: 'mdi-clock-outline',
        title: 'Performance',
        value: store.system.performance,
        isPercentage: true
      },
      {
        color: store.system.stability > 50 ? 'green' : 'white',
        icon: 'mdi-domain',
        title: 'Stability',
        value: store.system.stability,
        isPercentage: true
      }
    ]
  }))

  const startGame = function () {
    store.startGame()
  }
  return {
    isGameActive,
    startGame,
    gameStatsForView
  }
}
