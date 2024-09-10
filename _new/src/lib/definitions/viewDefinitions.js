const viewDefinitions = {
  player: {
    user_power: {
      title: 'Power',
      icon: { pos: 'mdi-star-face', neg: 'mdi-star' }
    },
    influence: {
      title: 'Influence',
      icon: { pos: 'mdi-access-point', neg: 'mdi-access-point' }
    }
  },
  score: {
    happiness: {
      title: 'Happiness',
      icon: { pos: '', neg: '' },
      children: {
        users: {
          title: 'Users',
          icon: { pos: 'mdi-account', neg: 'mdi-account' }
        },
        devs: {
          title: 'Devs',
          icon: { pos: 'mdi-laptop', neg: 'mdi-laptop' }
        }
      }
    },
    system: {
      title: 'System',
      icon: { pos: '', neg: '' },
      children: {
        modularity: {
          title: 'Modularity',
          icon: { pos: 'mdi-puzzle-outline', neg: 'mdi-puzzle-outline' }
        },
        performance: {
          title: 'Performance',
          icon: { pos: 'mdi-clock-outline', neg: 'mdi-clock-outline' }
        },
        bounded_contexts: {
          title: 'Bounded contexts',
          icon: { pos: 'mdi-domain', neg: 'mdi-domain' }
        }
      }
    }
  }
}

export default viewDefinitions
