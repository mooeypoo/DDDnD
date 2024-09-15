import viewDefinitions from './definitions/viewDefinitions'

export function ViewManager() {
  const _getRelevantViewData = (stateContext, groupKey, elementKey) => {
    const context = viewDefinitions[stateContext]

    if (!context) return ''

    if (!groupKey) {
      // No group; item is top level
      return context[elementKey]
    }

    if (!elementKey) {
      // This is a group, but we want the title of the group itself
      return context[groupKey]
    }

    // Otherwise, return the whole child chain
    return context[groupKey] && context[groupKey].children && context[groupKey].children[elementKey]
  }

  const getLabel = (stateContext, groupKey, elementKey) => {
    const data = _getRelevantViewData(stateContext, groupKey, elementKey)
    return data && data.title
  }
  const getIcon = (stateContext, groupKey, elementKey) => {
    const data = _getRelevantViewData(stateContext, groupKey, elementKey)
    return data && data.icon
  }

  return {
    getLabel,
    getIcon
  }
}
