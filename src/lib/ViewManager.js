import viewDefinitions from './definitions/viewDefinitions'

export function ViewManager() {
  const _getRelevantViewData = (type, groupKey, elementKey) => {
    const context = viewDefinitions[type]

    if (!context) return ''

    if (!groupKey) {
      // No group; item is top level
      return context[elementKey]
    }

    if (!elementKey) {
      // This is a group, but we want the label of the group itself
      return context[groupKey]
    }

    // Otherwise, return the whole child chain
    return context[groupKey] && context[groupKey].children && context[groupKey].children[elementKey]
  }
  /**
   * Return the details of the element requested
   *
   * @param {String} type Definition type: 'player', 'score'
   * @param {String} groupKey The group key for this element. Empty if it's an element without children
   * @param {String} elementKey The element key
   * @returns Element details object
   */
  const getViewDetails = (type, groupKey, elementKey) => {
    return _getRelevantViewData(type, groupKey, elementKey)
  }

  /**
   * Return the label of the element requested
   *
   * @param {String} type Definition type: 'player', 'score'
   * @param {String} groupKey The group key for this element. Empty if it's an element without children
   * @param {String} elementKey The element key
   * @returns Element label
   */
  const getLabel = (type, groupKey, elementKey) => {
    const data = _getRelevantViewData(type, groupKey, elementKey)
    return data && data.label
  }

  /**
   * Return the icon of the element requested
   *
   * @param {String} type Definition type: 'player', 'score'
   * @param {String} groupKey The group key for this element. Empty if it's an element without children
   * @param {String} elementKey The element key
   * @returns Element icon
   */
  const getIcon = (type, groupKey, elementKey) => {
    const data = _getRelevantViewData(type, groupKey, elementKey)
    return data && data.icon
  }

  return {
    getViewDetails,
    getLabel,
    getIcon
  }
}
