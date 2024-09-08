import { computed } from 'vue'
import { useScoreStore } from '@/stores/score'
import { langHelper } from '@/use/langHelper'
export function scoreDetails() {
  const store = useScoreStore()
  const { getScoreDisplayLabel } = langHelper()
  const isGameActive = computed(() => store.isGameActive)

  const gameStatsForView = computed(() => ({
    architecture: [
      {
        color: store.user_power > 50 ? 'green' : 'white',
        icon: store.user_power > 50 ? 'mdi-star-face' : 'mdi-star',
        title: getScoreDisplayLabel('', 'user_power').title,
        value: store.user_power,
        isPercentage: true
      },
      {
        color: store.influence > 50 ? 'green' : 'white',
        icon: 'mdi-access-point',
        title: getScoreDisplayLabel('', 'influence').title,
        value: store.influence,
        isPercentage: true
      }
    ],
    // company: [
    //   {
    //     color: store.coins > 0 ? 'yellow' : 'red',
    //     icon: 'mdi-hand-coin',
    //     title: 'Coins',
    //     value: store.coins
    //   },
    //   {
    //     color: store.revenue > 0 ? 'green' : 'red',
    //     icon: 'mdi-purse',
    //     title: 'Revenue',
    //     value: store.revenue
    //   }
    // ],
    happiness: [
      {
        color: store.happiness.users > 50 ? 'green' : 'red',
        icon: 'mdi-account',
        title: getScoreDisplayLabel('happiness', 'users').title,
        value: store.happiness.users,
        isPercentage: true
      },
      {
        color: store.happiness.devs > 50 ? 'green' : 'red',
        icon: 'mdi-laptop',
        title: getScoreDisplayLabel('happiness', 'devs').title,
        value: store.happiness.devs,
        isPercentage: true
      }
    ],
    system: [
      {
        color: store.system.modularity > 50 ? 'green' : 'white',
        icon: 'mdi-puzzle-outline',
        title: getScoreDisplayLabel('system', 'modularity').title,
        value: store.system.modularity,
        isPercentage: true
      },
      {
        color: store.system.performance > 50 ? 'green' : 'white',
        icon: 'mdi-clock-outline',
        title: getScoreDisplayLabel('system', 'performance').title,
        value: store.system.performance,
        isPercentage: true
      },
      {
        color: store.system.bounded_contexts > 50 ? 'green' : 'white',
        icon: 'mdi-domain',
        title: getScoreDisplayLabel('system', 'bounded_contexts').title,
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
