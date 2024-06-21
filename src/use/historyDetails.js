import { computed } from 'vue'
import { useHistoryStore } from '@/stores/history'

export function historyDetails() {
  const store = useHistoryStore()
  const getLastEntry = computed(() => store.getLastEntry)
  const getFullHistory = computed(() => store.getFullHistory)
  const getLastTenEntries = computed(() => store.getFullHistory.slice(0, 9))
  return {
    getLastEntry,
    getFullHistory,
    getLastTenEntries
  }
}
