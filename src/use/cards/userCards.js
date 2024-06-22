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
  const tier1cards = [
    {
      title: 'Define Heuristics',
      icon: '',
      short: "Pull out your magical robes and head to discover The Company's heuristics!",
      long: `Discover and clarify <em>The Company</em>'s heuristics by
      conducting interviews and producing written artifacts that clarify
      the context of <em>The Company</em>'s approach.`,
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
            happiness: {
              devs: 20
            },
            system: {
              bounded_contexts: 10
            }
          },
          bad: {
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
  ]
  return {
    tier1cards
  }
}
