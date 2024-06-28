export function userCards() {
  // DDD terminology
  // ---------------
  // Bounded context
  // Ubiquitous language
  // Heuristics
  // domains
  // subdomains
  // context mapping
  // tactical design
  // aggregates
  // domain events
  // event sourcing
  // model
  const cards = {
    eventsourcing: {
      name: 'Event Sourcing',
      title: 'Workshop: Event Sourcing',
      icon: '',
      short:
        'Light that fire and gather your allies! Delve into the behavior of your system to find the way forward!',
      long: 'Consult with domain experts and stakeholders to map behaviors of the system. Find leverage points for improvement and alignment on how things work, and how they could work.',
      link: '',
      required_power: 10,
      effect: {
        once: {
          happiness: {
            devs: -10
          }
        },
        per_turn: {
          turns: 2,
          cost: 100,
          happiness: {
            devs: 10 // getting happier
          },
          system: {
            bounded_contexts: 10
          },
          influence: 5
        },
        outcome: {
          wait_turns: 0, // after turns were finished
          good: {
            msg: ['We found an area where the devs wanted to refactor. A new component is born!'],
            happiness: {
              devs: 20
            },
            system: {
              bounded_contexts: 10,
              modularity: 10,
              performance: 10
            }
          },
          bad: {
            // There isn't very bad here except no-effect
            msg: ['The teams will continue thinking about this. Try again soon!'],
            happiness: {},
            system: {}
          }
        }
      }
    },
    heuristics: {
      name: 'Heuristics',
      title: 'Map and Discover Heuristics',
      icon: '',
      short: "Pull out your magical robes and head to discover The Company's heuristics!",
      long: `Discover and clarify <em>The Company</em>'s heuristics by
      conducting interviews and producing written artifacts that clarify
      and align <em>The Company</em>'s approach and context.`,
      link: '',
      required_power: 10,
      effect: {
        once: {
          happiness: {
            devs: -10
          }
        },
        per_turn: {
          turns: 5,
          cost: 500,
          system: {}
        },
        outcome: {
          wait_turns: 1, // after turns were finished
          good: {
            msg: [
              'Conversations are starting to happen with shared understanding of the technical space!'
            ],
            happiness: {
              devs: 20
            },
            system: {
              bounded_contexts: 10
            }
          },
          bad: {
            msg: [
              "The process wasn't clear this time. The devs are annoyed at the waste of time. You might need to try again."
            ],
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

  return {
    cards
  }
}
