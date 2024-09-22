import { CardManager } from '@/lib/CardManager'

export function useDeckAbstraction() {
  const { getCardPower, allCardsNamesInType, getCardDetails, getListOfImpactTypeFromCard } =
    CardManager()

  const getCardDisplay = (cardID, cardType = 'player', deck = 'ddd') => {
    return getCardDetails(cardID, cardType, deck)
  }
  const getCardImmediateImpacts = (cardID, cardType = 'player', deck = 'ddd') => {
    return getListOfImpactTypeFromCard(cardID, cardType, 'immediate', deck)
  }
  const getCardPerTurnImpacts = (cardID, cardType = 'player', deck = 'ddd') => {
    return getListOfImpactTypeFromCard(cardID, cardType, 'per_turn', deck)
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
    getCardImmediateImpacts,
    getCardPerTurnImpacts
  }
}
