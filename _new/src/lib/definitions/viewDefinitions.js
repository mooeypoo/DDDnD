const viewDefinitions = {
  player: {
    user_power: {
      label: 'Power',
      icon: { pos: 'mdi-star-face', neg: 'mdi-star' }
    },
    influence: {
      label: 'Influence',
      icon: { pos: 'mdi-access-point', neg: 'mdi-access-point' }
    }
  },
  score: {
    happiness: {
      label: 'Happiness',
      icon: { pos: '', neg: '' },
      children: {
        users: {
          label: 'Users',
          icon: { pos: 'mdi-account', neg: 'mdi-account' }
        },
        devs: {
          label: 'Devs',
          icon: { pos: 'mdi-laptop', neg: 'mdi-laptop' }
        }
      }
    },
    system: {
      label: 'System',
      icon: { pos: '', neg: '' },
      children: {
        modularity: {
          label: 'Modularity',
          icon: { pos: 'mdi-puzzle-outline', neg: 'mdi-puzzle-outline' }
        },
        performance: {
          label: 'Performance',
          icon: { pos: 'mdi-clock-outline', neg: 'mdi-clock-outline' }
        },
        bounded_contexts: {
          label: 'Bounded contexts',
          icon: { pos: 'mdi-domain', neg: 'mdi-domain' }
        }
      }
    }
  }
}

export default viewDefinitions
