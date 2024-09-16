import { ref } from 'vue'
import { useScoreStore } from '@/stores/score'
import { ViewManager } from '@/lib/ViewManager'

export function scoreDetails() {
  const scoreStore = useScoreStore()
  const { getViewDetails } = ViewManager()

  const getScoreGroupDisplayDetails = (group) => {
    const viewDetails = Object.assign({}, getViewDetails('score', group))
    const childrenElementKeys = Object.keys(viewDetails.children)
    viewDetails.children = childrenElementKeys
    return viewDetails
  }

  /**
   * Get the requested score element display details.
   *
   * @param {*} group Element's group (if not given, element is the parent)
   * @param {*} element Element's name
   * @returns An object with the view and value of the scoring element
   */
  const getScoreElementDisplayDetails = (group, element) => {
    const value = ref(scoreStore.getElementValue(group, element))
    const viewDetails = getViewDetails('score', group, element)

    // TODO: pos/neg conditions might be something that needs to be set per element?
    //       for now, all the same -- regular for positive; red for negative
    //       and negative is under 50%
    const icon = value.value >= 50 ? viewDetails.icon.pos : viewDetails.icon.neg
    const color = value.value >= 50 ? '' : 'red'
    return {
      label: viewDetails.label,
      icon,
      color,
      value
    }
  }

  return {
    getScoreGroupDisplayDetails,
    getScoreElementDisplayDetails
  }
}
