import playerCards from './definitions/playerCards'
import systemCards from './definitions/systemCards'

// This function should have no state management, only input->output
export function CardManager() {
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
    const cardFullList = cardListID === 'user' ? playerCards : systemCards

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
