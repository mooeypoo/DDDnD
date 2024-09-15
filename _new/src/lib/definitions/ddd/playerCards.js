// DDD terminology
// ---------------
// Bounded context
// Ubiquitous language
// x Heuristics
// domains
// subdomains
// context mapping
// tactical design
// aggregates
// domain events
// x event sourcing
// model

const dddPlayerCards = {
  eventstorming: {
    meta: {
      title: { short: 'Event Storming', long: 'Workshop: Event Storming' },
      icon: '',
      description: {
        short:
          'Light that fire and gather your allies! Delve into the behavior of your system to find the way forward!',
        long: 'Consult with domain experts and stakeholders to map behaviors domain. Simplify complex processes and find leverage points for implementing improvements.'
      },
      links: [
        {
          text: 'Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Event_storming'
        }
      ]
    },
    requirements: {
      power: 10
    },
    impact: {
      immediate: {
        msg: [],
        score: {
          happiness: {
            devs: -10
          }
        }
      },
      per_turn: {
        msg: [],
        turns: [1, 4],
        score: {
          happiness: {
            devs: 10 // getting happier
          },
          system: {
            bounded_contexts: 10
          }
        },
        player: {
          influence: 5
        }
      },
      delayed: {
        wait_turns: [0], // after turns were finished
        good: {
          msg: ['We found an area where the devs wanted to refactor. A new component is born!'],
          immediate: {
            msg: [''],
            score: {
              happiness: {
                devs: 20
              },
              system: {
                bounded_contexts: 10,
                modularity: 10,
                performance: 10
              }
            }
          },
          per_turn: {}
        },
        bad: {
          // There isn't very bad here except no-effect
          msg: ['The teams will continue thinking about this. Try again soon!'],
          immediate: {},
          per_turn: {}
        }
      }
    }
  },
  heuristics: {
    meta: {
      title: { short: 'Heuristics', long: 'Map and Discover Heuristics' },
      icon: '',
      description: {
        short: "Pull out your magical robes and head to discover The Company's heuristics!",
        long: `Discover and clarify <em>The Company</em>'s heuristics by
      conducting interviews and producing written artifacts that clarify
      and align <em>The Company</em>'s approach and context.`
      },
      links: [
        {
          text: 'DDD Academy',
          url: 'https://ddd.academy/distilling-design-heuristics/'
        }
      ]
    },
    requirements: {
      power: 10
    },
    impact: {
      immediate: {
        msg: [],
        score: {
          happiness: {
            devs: -10,
            users: 10 // improve consistency in communication
          }
        },
        player: {
          influence: 10
        }
      },
      //   per_turn: {
      //     turns: [1, 5],
      //     score: {},
      //     player: {}
      //   },
      delayed: {
        wait_turns: [0, 1], // after turns were finished
        good: {
          msg: [
            'Conversations are starting to happen with shared understanding of the technical space!'
          ],
          immediate: {
            msg: [''],
            score: {
              happiness: {
                devs: 20
              },
              system: {
                bounded_contexts: 10
              }
            }
          }
        },
        bad: {
          // There isn't very bad here except no-effect
          msg: [
            "The process wasn't clear this time. The devs are annoyed at the waste of time. You might need to try again."
          ],
          score: {
            happiness: {
              devs: -10
            },
            system: {
              bounded_contexts: 0
            }
          }
        }
      }
    }
  }
  //   example: {
  //     meta: {
  //       title: { short: '', long: '' },
  //       icon: '',
  //       description: { short: '', long: '' },
  //       links: []
  //     },
  //     requirements: {
  //       power: 0
  //     },
  //     impact: {
  //       immediate: {
  //         msg: [],
  //         score: {},
  //         player: {}
  //       },
  //       per_turn: {
  //         turns: [1, 5],
  //         score: {},
  //         player: {}
  //       },
  //       delayed: {
  //         wait_turns: [0], // after turns were finished
  //         good: {
  //           msg: [],
  //           immediate: {},
  //           per_turn: {}
  //         },
  //         bad: {
  //           // There isn't very bad here except no-effect
  //           msg: [],
  //           immediate: {},
  //           per_turn: {}
  //         }
  //       }
  //     }
  //   }
}

export default dddPlayerCards
