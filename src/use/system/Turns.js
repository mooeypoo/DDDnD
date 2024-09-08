import { useEffectsStore } from '@/stores/effects'
import { useScoreStore } from '@/stores/score'
import { gameDetails } from '@/use/gameDetails'
import { userCards } from '@/use/cards/userCards'

export function Turns() {
  const { userCardsDetails } = userCards()
  const effectsStore = useEffectsStore()
  const scoreStore = useScoreStore()
  const { userCardChoices } = gameDetails()

  const _getRandomWithinRange = (min, max) => {
    return Math.round(Math.random() * (max - min) + min)
  }
  /**
   * Choose whether the outcome is good or bad
   * This *should* depend on random plus some modifiers
   * like the level of influence and power...
   *
   * Whatever this ends up depending on, it's in this
   * method for unification!
   */
  const _chooseGoodOrBadOutcome = () => {
    // Choose random number, let's say from 1 to 100;
    // we'll treat lower = bad outcome, higher = good outcome
    let max = 100
    let rand = _getRandomWithinRange(1, max)

    // use influence to tilt towards 'good'
    let randModifier = _getRandomWithinRange(5, 15)

    // The result is whatever random we had PLUS modifier times the influence
    // this should mean that the influence tilts towards good
    let result = max / (rand + randModifier * scoreStore.influence)

    return result >= 0.5 ? 'good' : 'bad'
  }

  /**
   * Set up an array of parameter-arrays to be applied to store methods.
   *
   * If an effectGroup contains more than one effect, we need to insert it
   * into the store multiple times, but if the effectGroup is a high level
   * value (like 'influence') we just need to add it once.
   *
   * This generalizes the behavior, so it will output an array of param-arrays
   * to be applied on the store methods iteratively, which makes sure we can
   * apply as many times as needed (as many key-value pairs inside effectGroup given)
   *
   * @param {*} actor
   * @param {*} cardKey
   * @param {*} effectGroup
   * @param {*} turns
   * @returns an Array of arrays that represent parameters that can be applied to
   *  store insertion methods
   */
  const _setupEffectStoreParams = (actor, cardKey, effectGroup, turns) => {
    const result = []
    Object.keys(effectGroup).forEach((groupKey) => {
      let params = []
      if (typeof effectGroup[groupKey] === 'number') {
        // this key has 1 numeric value (like 'influence')
        params = [
          actor,
          cardKey,
          '', // No group
          groupKey,
          effectGroup[groupKey],
          turns
        ]

        result.push(params)
      } else {
        // this key has an object. Go over each value
        Object.keys(effectGroup[groupKey]).forEach((subGroupKey) => {
          params = [
            actor,
            cardKey,
            groupKey,
            subGroupKey,
            effectGroup[groupKey][subGroupKey],
            turns
          ]

          result.push(params)
        })
      }
    })

    return result
  }

  /**
   * Add the card effect object to the relevant store queues
   * - 'ongoing' represent anything that is active; so:
   *    - add 'once' effect with turn limit 1
   *    - add 'per_turn' effects with their turn number limit
   * - 'outcome' represent any delayed action, and requires turns to wait
   *
   * @param {string} actor The originator of the action 'user' or 'system'
   * @param {string} cardKey The key of the card within the card object
   * @param {Object} cardEffects The object representing card effects
   */
  const addCardToEffectQueues = (actor, cardKey, cardEffects) => {
    actor = actor || 'system'

    // ADD TO ONGOING list
    // - 'once' effects
    if (cardEffects.once) {
      _setupEffectStoreParams(actor, cardKey, cardEffects.once, 1).forEach((applyParams) => {
        effectsStore.addOngoing(...applyParams)
      })
    }

    // - 'per_turn' (recurring) effects
    // For "per_turn", choose a value for 'turns' from given range
    let perTurnNumber = 1
    if (cardEffects.per_turn) {
      perTurnNumber = Array.isArray(cardEffects.per_turn.turns)
        ? _getRandomWithinRange(...cardEffects.per_turn.turns)
        : 1

      _setupEffectStoreParams(actor, cardKey, cardEffects.per_turn, perTurnNumber).forEach(
        (applyParams) => {
          effectsStore.addOngoing(...applyParams)
        }
      )
    }

    // ADD outcome TO DELAYED list
    if (cardEffects.outcome) {
      const delayedTurnsNumber =
        cardEffects.outcome && Array.isArray(cardEffects.outcome.wait_turns)
          ? _getRandomWithinRange(...cardEffects.outcome.wait_turns)
          : 0
      effectsStore.addDelayed(
        actor,
        cardKey,
        delayedTurnsNumber + perTurnNumber,
        cardEffects.outcome.good,
        cardEffects.outcome.bad
      )
    }
  }

  const prepareCards = function (cardNameArray) {
    cardNameArray = cardNameArray || userCardChoices
    // TODO!!!! Add logging into the history!!

    // Operation:
    // ## USER CARDS
    // Go over chosen user cards
    // - Choose the per_turn.turns value randomly from the given range
    //   This will be used consistently throughout the card.
    // - ADD TO ONGOING LIST
    //   - for 'once' effect, set turns=1
    //   - for per_turn effect, set turns = per_turn.turns[chosen]
    // - ADD 'outcome' TO DELAYED LIST (set turns = outcome.wait_turns + per_turn.turns[chosen])

    // Go over card choices:
    cardNameArray.value.forEach((cardKey) => {
      // Add effects to store
      addCardToEffectQueues('user', cardKey, userCardsDetails[cardKey].effect)
      // TODO: Keep record of the actual card names in play
      //       so that we can display them on the UI
    })

    // Now that everything is in the lists, go over the actual impact for this turn
    // - Order 'delayed' in the store by wait_turns
    effectsStore.sortDelayed()

    // - Go over each 'delayed':
    let del = []
    effectsStore.delayed.forEach((item, index) => {
      //    - wait_turns = wait_turns - 1
      item.wait_turns = item.wait_turns - 1
      // There shouldn't be a case where the value is negative,
      // but just in case, let's grab those too
      if (item.wait_turns <= 0) {
        //   - if wait_turns = 0
        // add to 'ongoing' with 'turns_left = 1'
        // (we will decrease these to 0 in the next step)

        // BUT!! we need to choose whether we have the delayed 'good' or 'bad' outcome
        let choice = _chooseGoodOrBadOutcome()

        // For the moment, delete msg key; we'll see how to use it in the future
        let msg = ''
        if (choice === 'good') {
          msg = item.goodOutcome.msg
          delete item.goodOutcome.msg
        } else {
          msg = item.badOutcome.msg
          delete item.badOutcome.msg
        }

        effectsStore.addOngoing(
          _setupEffectStoreParams(
            'user',
            item.cardKey,
            choice === 'good' ? item.goodOutcome : item.badOutcome,
            1,
            // Add the detail of what was chosen to 'extra'
            {
              msg,
              outcome: choice
            }
          )
        )

        // add to removal list
        del.push(index)
      }
    })
    // Actually delete from delayed
    del.forEach((i) => {
      effectsStore.removeIndexFromDelayed(i)
    })

    // TODO: REASSESS THE BELOW!!
    // Ongoing should be applied every turn until it's done
    // so no need to move it to 'immediate' when turns = 0
    // unlike delayed!!!
    // This should just 'clean out' the ongoing ones that run out

    // // - Order 'ongoing' in the store by turns_left, ascending
    // effectsStore.sortOngoing()
    // // - Go over each 'ongoing':
    // del = []
    // effectsStore.ongoing.forEach((item, index) => {
    //   //    - turns_left = turns_left -1
    //   item.turns_left = item.turns_left - 1
    //   //    - if turns_left = 0 --> remove from 'ongoing' and add to "immediate"

    //   // if (item.turns_left <= 0) {
    //   //   effectsStore.addImmediate(
    //   //     item.type,
    //   //     item.cardKey,
    //   //     item.effectName,
    //   //     item.effectGroup,
    //   //     item.effectValue,
    //   //     item.extra
    //   //   )

    //     // add to removal list
    //     del.push(index)
    //   }
    // })
    // // Actually delete from ongoing
    // del.forEach((i) => {
    //   effectsStore.removeIndexFromOngoing(i)
    // })

    // At this point, everything should be ready for application:
    // - Ongoing and Delayed are updated.
    // - Whatever came from delayed has an 'extra' info object
    // - Immediate contains all the effects that should apply in this turn
  }

  const applyTurnEffects = () => {
    // Apply user card from the 'immediate' list
    // - Go over each 'immediate', and apply the effect
    // - clear 'immediate' list.
    // Apply cards from 'ongoing' list
    // - Go over each 'ongoing'
    //   - Check turns > 0 and apply the effect
    //   - Change ongoing turns = turns - 1
    // - Go over the entire 'ongoing' list and remove all that have turns >= 0
    // FIN
  }

  // TODO: Add modifiers (this should be done in the beginning so it can apply to whatever we add to the 'immediate' list)

  // TODO: Add system card
  const decideAndApplySystemCard = () => {
    // ## SYSTEM CARDS (RANDOM events)
    // - run randomizer to decide if there's a random event this turn
    // - if there is, randomize which card the system uses
    // - Treat the card as if it's a user card, apply from the start of the operation
  }

  return {
    prepareCards
    // applyImmediateEffects
  }
}
