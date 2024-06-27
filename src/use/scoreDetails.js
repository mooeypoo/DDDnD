import { computed } from 'vue'
import { useScoreStore } from '@/stores/score'

export function scoreDetails() {
  const store = useScoreStore()

  const isGameActive = computed(() => store.isGameActive)

  const gameStatsForView = computed(() => ({
    architecture: [
      {
        color: store.user_power > 50 ? 'green' : 'white',
        icon: store.user_power > 50 ? 'mdi-star-face' : 'mdi-star',
        title: 'Power',
        value: store.user_power,
        isPercentage: true
      },
      {
        color: store.influence > 50 ? 'green' : 'white',
        icon: 'mdi-access-point',
        title: 'Influence',
        value: store.influence,
        isPercentage: true
      }
    ],
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
        color: store.system.bounded_contexts > 50 ? 'green' : 'white',
        icon: 'mdi-domain',
        title: 'Bounded Contexts',
        value: store.system.bounded_contexts,
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
