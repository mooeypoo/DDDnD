import { CardManager } from '@/lib/CardManager'

export function useDeckAbstraction() {
  const { getCardPower, allCardsNamesInType, getCardDetails } = CardManager()

  const getCardDisplay = (cardID, cardType = 'player', deck = 'ddd') => {
    return getCardDetails(cardID, cardType, deck)
  }

  const getCardRequiredPower = (cardID, cardType = 'player', deck = 'ddd') =>
    getCardPower(cardID, cardType, deck)

  const getAllCardIDs = (cardType = 'player', deck = 'ddd') => {
    return allCardsNamesInType(cardType, deck)
  }

  return { getAllCardIDs, getCardDisplay, getCardRequiredPower }
}
