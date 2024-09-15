import { ref } from 'vue'
import { useScoreStore } from '@/stores/score'
import { ViewManager } from '@/lib/ViewManager'

export function scoreDetails() {
  const scoreStore = useScoreStore()
  const { getDetails } = ViewManager()

  const scoreElementValue = (group, element) => {
    return {
      view: getDetails(group, element),
      ref: ref(scoreStore.getElementValue(group, element))
    }
  }

  return {
    scoreElementValue
  }
}
