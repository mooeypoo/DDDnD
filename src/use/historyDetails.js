import { computed } from 'vue'
import { useHistoryStore } from '@/stores/history'

export function historyDetails() {
  const store = useHistoryStore()
  const getLastEntry = computed(() => store.getLastEntry)
  const getFullHistory = computed(() => store.getFullHistory)
  const getLastTenEntries = computed(() => store.getFullHistory.slice(0, 9))

  const addEntry = function (actor, type, desc, extra) {
    // check if card is in the chosenCards array
    store.addEntry(actor, type, desc, extra || [])
  }

  return {
    addEntry,
    getLastEntry,
    getFullHistory,
    getLastTenEntries
  }
}
