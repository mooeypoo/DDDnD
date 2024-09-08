export function langHelper() {
  const scoreViewDetails = {
    user_power: {
      title: 'Power',
      icon: { pos: 'mdi-star-face', neg: 'mdi-star' }
    },
    influence: {
      title: 'Influence',
      icon: { pos: 'mdi-access-point', neg: 'mdi-access-point' }
    },
    // TODO: When 'company' coins / revenue is active, add here
    // company: {},
    happiness: {
      users: {
        title: 'Users',
        icon: { pos: 'mdi-account', neg: 'mdi-account' }
      },
      devs: {
        title: 'Devs',
        icon: { pos: 'mdi-laptop', neg: 'mdi-laptop' }
      }
    },
    system: {
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
    },
    // Group titles and details
    // TODO: The object above should really just
    // include those directly
    _groups: {
      happiness: {
        title: 'Happiness',
        icon: { pos: '', neg: '' }
      },
      system: {
        title: 'System',
        icon: { pos: '', neg: '' }
      }
    }
  }

  const getScoreDisplayLabel = (group, scoreName) => {
    // No group given, empty group -- means top level
    if (!group) {
      return scoreViewDetails[scoreName]
    }

    // Group doesn't exist, or score isn't inside this group
    if (!scoreViewDetails[group] || !scoreViewDetails[group][scoreName]) return null

    // return details
    return scoreViewDetails[group][scoreName]
  }

  return {
    getScoreDisplayLabel
  }
}
