import { CardManager } from '@/lib/CardManager'
import { ViewManager } from '@/lib/ViewManager'

export function useDeckAbstraction() {
  const {
    getRandomTurn,
    getCardPower,
    allCardsNamesInType,
    getCardDetails,
    getListOfImpactTypeFromCard
  } = CardManager()
  const { getViewDetails } = ViewManager()

  const getCardDisplay = (cardID, cardType = 'player', deck = 'ddd') => {
    return getCardDetails(cardID, cardType, deck)
  }

  const getCardImpactTurns = (cardID, cardType = 'player', deck = 'ddd') => {
    if (!cardID) {
      return {}
    }

    const per_turn = getListOfImpactTypeFromCard('per_turn', cardID, cardType, deck)
    if (per_turn && per_turn.list && Object.keys(per_turn.list).length) {
      // For the moment, all impacts have the same number of turns
      // so just pick one
      return per_turn.list[Object.keys(per_turn.list)[0]].turns
    }

    return 0
  }

  /**
   * Output a structured object that is aimed specifically for the card dialog to
   * show the relevant impacts for the given card.
   * NOTE that this will not output delayed effects, as the original
   * getListOfImpactTypeFromCard from CardManager doesn't output delayed because
   * we don't want to show those to the user, as they are the "surprise" impacts.
   *
   * @param {String} cardID The key associated with the desired card's structure in
   *  the card lists
   * @param {String} cardType The string ID of the card list: 'player' or 'system'
   * @param {String} deck Deck name. Default: 'ddd'
   * @returns
   */
  const getCardImpactDisplay = (cardID, cardType = 'player', deck = 'ddd') => {
    if (!cardID) {
      return {}
    }

    // Get the card's impacts (immediate and per_turn) in an output that is suitable
    // for the CardDetailsDialog
    const result = { immediate: [], per_turn: [] }
    const types = ['immediate', 'per_turn']
    let turns
    types.forEach((type) => {
      result[type] = result[type] || []

      getListOfImpactTypeFromCard(type, cardID, cardType, deck)
        .list?.sort((a, b) => {
          // Sort by group
          return a.score.group > b.score.group
        })
        .forEach((impact) => {
          const group = impact.score.group || '_'

          if (group !== '_') {
            // This is an item that is in a group
            const details = getViewDetails(impact.context, group)

            if (!result[type][group]) {
              // Set up the group detail
              result[type][group] = {
                view: {
                  label: details.label,
                  icon: details.icon,
                  color: details.color
                },
                items: []
              }
            }

            // Add the specific item
            result[type][group].items.push({
              view: details.children[impact.score.element],
              context: impact.context,
              turns: impact.turns,
              value: impact.score.value
            })
          } else {
            // This is an item that is top-level
            result[type][impact.score.element] = {
              view: getViewDetails(impact.context, impact.score.element),
              context: impact.context,
              turns: impact.turns,
              value: impact.score.value
            }
          }

          // turns
          // TODO: We need to 'raise' turns up to the main per_turn object
          // but this is messy and really not a good way to do it...
          if (type === 'per_turn') {
            turns = turns || impact.turns
          }
        })
    })

    result.turns = turns

    return result
  }

  const getCardRequiredPower = (cardID, cardType = 'player', deck = 'ddd') =>
    getCardPower(cardID, cardType, deck)

  const getAllCardIDs = (cardType = 'player', deck = 'ddd') => {
    return allCardsNamesInType(cardType, deck)
  }
  const chooseRandomTurn = (turnArray) => {
    if (!Array.isArray(turnArray)) {
      return turnArray
    }
    return getRandomTurn(turnArray[0], turnArray[1])
  }

  return {
    chooseRandomTurn,
    getAllCardIDs,
    getCardDisplay,
    getCardRequiredPower,
    getCardImpactDisplay,
    getCardImpactTurns
  }
}
