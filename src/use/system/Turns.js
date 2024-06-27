import { useEffectsStore } from '@/stores/effects'

export function Turns() {
  const effectsStore = useEffectsStore()

  const runTurn = function () {
    // TODO: Keep record of the actual card names in play
    //       so that we can display them on the UI
    // Operation:
    // RANDOM events (system cards)
    // - run randomizer to decide if there's a random event this turn
    // - if there is, randomize which card the system uses
    //
    // TODO: Somewhere, the user needs to see that a user card happened
    //       and what card it is
    //
    // Go over chosen user cards + system card:
    // - ADD TO ONGOING LIST (for one-time effect, set turns=1)
    // - ADD TO DELAYED LIST (turns = delayed.turns + immediate.turns)
    //
    // GET EXISTING MODIFIERS
    //
    // PROCESS OUTCOME LIST:
    // - Foreach outcome, decrease turns
    // - If turns = 0
    //      - run randomizer --> 'positive' or 'negative' result
    //      - adjust with 'influence' for positive/negative
    //      - add effect (either positive or negative) to ONGOING with turns = 1
    //
    // GO OVER AND APPLY ONGOING LIST
    // - APPLY ALL ONGOING + MODIFIERS
    // - REDUCE TURNS -1
    // - IF TURNS=0 REMOVE FROM ONGOING
    //
    // == DECIDE ON SYSTEM ACTION ==
    // - Run randomizer to decide if system card should apply
    // - if system card applies, apply its cards
  }

  return {}
}
