import dddPlayerCards from './definitions/ddd/playerCards'
import dddSystemCards from './definitions/ddd/systemCards'

export default function CardManager() {
  /**
   * Provide the correct deck of cards. This allows the game to expand to use
   * different sets of cards beyond the initial DDD-terminology specific ones.
   *
   * @TODO Right now, there's no way from the static methods to change the deck.
   *       If and when that's added in, that will need to be added in, either as
   *       some configuration, or another optional parameter in all methods.
   *
   * @param {String} type Deck type; 'player' or 'system'
   * @param {String} deck Name of deck; 'ddd' by default.
   * @returns
   */
  const getCardDeck = (type = 'player', deck = 'ddd') => {
    if (type === 'system') {
      switch (deck) {
        default:
          return dddSystemCards
      }
    } else {
      switch (deck) {
        default:
          return dddPlayerCards
      }
    }
  }

  /**
   * Get a list of impact effects based on the card ID and the impact type.
   *
   * @param {} cardListID The string ID of the card list: 'player' or 'system'
   * @param {*} cardID The key associated with the desired card's structure in
   *  the card lists
   * @param {*} impactType The impact type to return for; 'immediate' or 'per_turn'
   * @returns An object that represents the metadata of the impact type with an
   *  array of actionable impacts that can be analyzed individually
   */
  const getListOfImpactTypeFromCard = (cardListID, cardID, impactType = 'immediate') => {
    // Verify params
    if (!cardID || (cardListID !== 'user' && cardListID !== 'system')) {
      return {}
    }
    // Use the correct card list
    const cardFullList = cardListID === 'user' ? getCardDeck('player') : getCardDeck('system')

    // Resolve the card definition
    const cardDefinition = cardFullList[cardID]
    if (
      !cardDefinition ||
      !cardDefinition.impact ||
      !cardDefinition.impact[impactType] ||
      // Delayed is a separate operation, and is ignored here
      impactType === 'delayed'
    ) {
      return []
    }

    const result = {
      msg: cardDefinition.impact[impactType].msg,
      list: []
    }

    const turns = cardDefinition.impact[impactType].turns || 1
    const contexts = ['score', 'player']
    // both 'score' and 'player' contexts
    contexts.forEach((stateContext) => {
      Object(cardDefinition.impact[impactType][stateContext]).forEach((groupKey) => {
        if (typeof cardDefinition.impact[impactType][stateContext][groupKey] === 'number') {
          // this key has 1 numeric value without a sub group
          result.list.push({
            cardID,
            type: impactType,
            context: stateContext,
            turns,
            score: {
              group: '',
              element: groupKey,
              value: cardDefinition.impact[impactType][stateContext][groupKey]
            }
          })
        } else {
          // This key is a group of sub keys
          Object.keys(cardDefinition.impact[impactType][stateContext][groupKey]).forEach(
            (elementKey) => {
              result.list.push({
                cardID,
                type: impactType,
                context: stateContext,
                turns,
                score: {
                  group: groupKey,
                  element: elementKey,
                  value: cardDefinition.impact[impactType][stateContext][groupKey][elementKey]
                }
              })
            }
          )
        }
      })
    })

    return result
  }

  // Expose public functions
  return {
    getListOfImpactTypeFromCard
  }
}
