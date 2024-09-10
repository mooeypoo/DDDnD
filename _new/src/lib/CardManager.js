import playerCards from './definitions/playerCards'
import systemCards from './definitions/systemCards'

// This function should have no state management, only input->output
export function CardManager() {
  /**
   * Get a list of impact effects based on the card ID and the impact type.
   *
   * @param {} cardListID The string ID of the card list: 'player' or 'system'
   * @param {*} cardID The key associated with the desired card's structure in the card lists
   * @param {*} impactType The impact type to return for; 'immediate' or 'per_turn'
   * @returns An object that represents the metadata of the impact type with an array of actionable impacts that can be analyzed individually
   */
  const getImpactTypeFromCard = (cardListID, cardID, impactType = 'immediate') => {
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
  //   const getImpactListFromCard = (cardID, agent = 'user') => {
  //     // Verify params
  //     if (!cardID || (agent !== 'user' && agent !== 'system')) {
  //       return []
  //     }

  //     // Use the correct card list
  //     const cardFullList = agent === 'user' ? playerCards : systemCards

  //     // Resolve the card definition
  //     const cardDefinition = cardFullList[cardID]
  //     if (!cardDefinition) {
  //       return []
  //     }

  //     let impactSectionStructure = {}
  //     const result = { immediate: {}, ongoing: {}, delayed: {} }
  //     const meta = {
  //       cardID,
  //       agent
  //     }

  //     // Go over impacts
  //     if (cardDefinition.impact.immediate && cardDefinition.impact.immediate.score) {
  //       impactSectionStructure = cardDefinition.impact.immediate
  //       Object.keys(impactSectionStructure.score).forEach((groupKey) => {
  //         meta.msg = impactSectionStructure.msg
  //         if (typeof impactSectionStructure.score[groupKey] === 'number') {
  //           // this key has 1 numeric value without a group
  //           result.immediate.push({
  //             meta,
  //             turns: 0,
  //             score: {
  //               group: '',
  //               element: groupKey,
  //               value: impactSectionStructure.score[groupKey]
  //             }
  //           })
  //         } else {
  //           // This key is a group of keys
  //           Object.keys(impactSectionStructure.score[groupKey]).forEach((elementKey) => {
  //             result.immediate.push({
  //               meta,
  //               turns: 0,
  //               score: {
  //                 group: groupKey,
  //                 element: elementKey,
  //                 value: impactSectionStructure.score[groupKey][elementKey]
  //               }
  //             })
  //           })
  //         }
  //         // TODO: Add 'player' changes
  //       })
  //     }
  //   }
  // TODO:
  // - normalize output for 'card data' output so it's always the same format
  //   - metadata about the card (name/title/display stuff)
  //   - requirements
  // - normalize output for 'impact'
  //   - input: impact.once or impact.per_turn or impact_delayed structure
  //     (account for randomizing turns/wait_turns)
  //   - output: impact array:
  //     - 'once' and 'per turn' as a flat array where each line can be implemented or displayed on its own
  //     - 'delayed' will require choosing (random+some impact from influence) good/bad
  //       and then outputting it as a flat array just like 'once' and 'per turn'
  // - get card data by type (system/user) and card name

  return {
    getImpactTypeFromCard
  }
}
