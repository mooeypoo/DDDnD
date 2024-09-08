// import { computed } from 'vue'
// import { useEffectsStore } from '@/stores/effects'
import { langHelper } from '@/use/langHelper'

export function effectDetails() {
  // const effectsStore = useEffectsStore()
  const { getScoreDisplayLabel } = langHelper()

  const _getOutputViewArr = (obj) => {
    const output = []
    Object.keys(obj).forEach((groupKey) => {
      const groupContent = obj[groupKey]
      if (typeof groupContent === 'object') {
        // this is a group that has subitems.
        // go over the sub items
        Object.keys(groupContent).forEach((key) => {
          output.push({
            group: groupKey,
            ...getScoreDisplayLabel(groupKey, key),
            value: groupContent[key]
          })
        })
      } else {
        // this is a direct item without a group
        output.push({
          group: null,
          ...getScoreDisplayLabel('', groupKey),
          value: groupContent
        })
      }
    })

    return output
  }

  const getCardEffectView = function (cardEffectObj) {
    if (!cardEffectObj) return []

    const output = {
      once: [],
      recurring: null,
      num_turns: null
    }

    if (cardEffectObj.once) {
      output.once = _getOutputViewArr(cardEffectObj.once)
    }

    if (cardEffectObj.per_turn && cardEffectObj.per_turn.effect) {
      output.recurring = _getOutputViewArr(cardEffectObj.per_turn.effect)
      // Add the range of turns
      output.num_turns = Array.isArray(cardEffectObj.per_turn.turns)
        ? cardEffectObj.per_turn.turns.join(' - ')
        : cardEffectObj.per_turn.turns
    }

    return output
  }

  return {
    getCardEffectView
  }
}
