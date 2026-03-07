/**
 * Game Store
 * 
 * Manages game state in the UI layer using Pinia.
 * 
 * Responsibilities:
 * - Hold current game state
 * - Call simulation engine services
 * - Expose state and actions to Vue components
 * 
 * IMPORTANT: This store must NOT implement game logic.
 * It only calls the simulation engine and stores results.
 * 
 * All game rules belong in src/domains/simulation.
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useGameStore = defineStore('game', () => {
  // TODO: Define state
  const currentGameState = ref(null)
  const scenarioBundle = ref(null)
  const seed = ref('')
  
  // TODO: Define actions
  function startNewRun(_scenarioId: string, _selectedSeed: string) {
    // TODO: Load scenario bundle
    // TODO: Call engine.createRun()
    // TODO: Store initial state
  }
  
  function getTurnBriefing() {
    // TODO: Call engine.getTurnBriefing()
    // TODO: Return briefing for UI
  }
  
  function playTurn(_actionId: string) {
    // TODO: Call engine.playTurn()
    // TODO: Update game state
  }
  
  function getRunOutcome() {
    // TODO: Call engine.getRunOutcome()
    // TODO: Return outcome for UI
  }
  
  return {
    currentGameState,
    scenarioBundle,
    seed,
    startNewRun,
    getTurnBriefing,
    playTurn,
    getRunOutcome
  }
})
