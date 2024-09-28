import { CardManager } from '@/lib/CardManager'
import { ViewManager } from '@/lib/ViewManager'

export function useDeckAbstraction() {
  const { getCardPower, allCardsNamesInType, getCardDetails, getListOfImpactTypeFromCard } =
    CardManager()
  const { getViewDetails } = ViewManager()

  const getCardDisplay = (cardID, cardType = 'player', deck = 'ddd') => {
    return getCardDetails(cardID, cardType, deck)
  }

  const getCardImpactDisplay = (cardID, cardType = 'player', deck = 'ddd') => {
    if (!cardID) {
      return {}
    }

    // Get the card's impacts (immediate and per_turn) in an output that is suitable
    // for the CardDetailsDialog
    const result = { immediate: {}, per_turn: {} }
    const types = ['immediate', 'per_turn']
    let turns = []

    types.forEach((type) => {
      getListOfImpactTypeFromCard(type, cardID, cardType, deck).list?.forEach((item) => {
        const grp = item.score.group || '_'
        result[type][grp] = result[type][grp] || {
          // TODO: This isn't working :|
          display: getViewDetails(item.context, grp),
          items: []
        }

        result[type][grp].items.push({
          context: item.context,
          // Get labels
          display: getViewDetails(item.context, item.score.group, item.score.element),
          value: item.score.value,
          turns: item.turns
        })

        turns = item.turns
      })
    })

    // Insert turns as a general value
    // TODO: If we ever have turns per score, this should change
    // but right now, turns are for the entire score block, same value
    // of random turns
    result.per_turn.turns = turns

    return result
  }

  const getCardRequiredPower = (cardID, cardType = 'player', deck = 'ddd') =>
    getCardPower(cardID, cardType, deck)

  const getAllCardIDs = (cardType = 'player', deck = 'ddd') => {
    return allCardsNamesInType(cardType, deck)
  }

  return {
    getAllCardIDs,
    getCardDisplay,
    getCardRequiredPower,
    getCardImpactDisplay
  }
}
