/**
 * useCategoryPresentation — resolves category display data from a card's style_tags.
 *
 * Single source of truth for categoryId, categoryLabel, categoryAccentColor, and
 * categoryIcon. Replaces the inline computed triplets previously duplicated in
 * action_card.vue and card_details_modal.vue.
 *
 * Accepts either a plain string[] (for use outside reactive contexts) or a
 * ComputedRef<string[]> / Ref<string[]> so it works inside both component script
 * setups and standalone unit tests.
 */

import { computed, isRef, type ComputedRef, type MaybeRef } from 'vue'
import { resolveCategory, CATEGORY_META } from '@/ui/composables/card_filter_sort'

export function useCategoryPresentation(styleTags: MaybeRef<string[]>) {
  const categoryId = computed<string>(() => {
    const tags = isRef(styleTags) ? styleTags.value : styleTags
    return resolveCategory(tags)
  })

  const meta = computed(() => CATEGORY_META[categoryId.value] ?? CATEGORY_META['default'])

  const categoryLabel: ComputedRef<string> = computed(() => meta.value.displayLabel)

  const categoryAccentColor: ComputedRef<string> = computed(() => meta.value.accentVar)

  const categoryIcon: ComputedRef<string> = computed(() => meta.value.icon)

  return { categoryId, categoryLabel, categoryAccentColor, categoryIcon }
}
