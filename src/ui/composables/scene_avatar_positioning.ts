export type SceneActorSlot = 'left' | 'center' | 'right' | 'far'

export interface SceneActorPlacement {
  slot: SceneActorSlot
  leftPercent: number
  floorPercent: number
  scale: number
  zIndex: number
}

export interface SceneActorSlotInput {
  slot: SceneActorSlot
}

/**
 * Floor placement model for scene preview.
 *
 * All anchors are tuned to keep avatars on the lower floor band while
 * preserving upper-scene focal areas for environmental readability.
 */
export const SCENE_ACTOR_PLACEMENTS: Record<SceneActorSlot, SceneActorPlacement> = {
  left: {
    slot: 'left',
    leftPercent: 22,
    floorPercent: 81,
    scale: 0.94,
    zIndex: 3,
  },
  center: {
    slot: 'center',
    leftPercent: 50,
    floorPercent: 80,
    scale: 1,
    zIndex: 4,
  },
  right: {
    slot: 'right',
    leftPercent: 78,
    floorPercent: 81,
    scale: 0.94,
    zIndex: 3,
  },
  far: {
    slot: 'far',
    leftPercent: 62,
    floorPercent: 68,
    scale: 0.72,
    zIndex: 2,
  },
}

export function getSceneActorPlacement(slot: SceneActorSlot): SceneActorPlacement {
  return SCENE_ACTOR_PLACEMENTS[slot]
}

export function buildSceneActorStyle(
  slot: SceneActorSlot,
  horizontalNudgePercent = 0
): Record<string, string | number> {
  const placement = getSceneActorPlacement(slot)

  return {
    left: `${placement.leftPercent + horizontalNudgePercent}%`,
    top: `${placement.floorPercent}%`,
    zIndex: placement.zIndex,
    transform: `translate(-50%, -100%) scale(${placement.scale})`,
  }
}

const SLOT_FALLBACK_ORDER: Record<SceneActorSlot, SceneActorSlot[]> = {
  left: ['left', 'center', 'right', 'far'],
  center: ['center', 'left', 'right', 'far'],
  right: ['right', 'center', 'left', 'far'],
  far: ['far', 'center', 'left', 'right'],
}

/**
 * Guardrail 1: resolve duplicate slot selections into unique placements.
 *
 * This preserves the requested slot whenever possible, then falls back to
 * a deterministic nearest alternative slot.
 */
export function resolveGuardrailedActorSlots(actors: SceneActorSlotInput[]): SceneActorSlot[] {
  const usedSlots = new Set<SceneActorSlot>()

  return actors.map(actor => {
    const fallbackOrder = SLOT_FALLBACK_ORDER[actor.slot]
    const slot = fallbackOrder.find(candidate => !usedSlots.has(candidate)) ?? actor.slot
    usedSlots.add(slot)
    return slot
  })
}

/**
 * Guardrail 2: apply subtle horizontal spreading to reduce visual overlap.
 *
 * Returned values are percentage offsets applied to actor anchor positions.
 */
export function buildGuardrailedNudges(slots: SceneActorSlot[]): number[] {
  const nudges = new Array<number>(slots.length).fill(0)

  const nearBandIndices: number[] = []
  const farBandIndices: number[] = []

  slots.forEach((slot, index) => {
    if (slot === 'far') {
      farBandIndices.push(index)
      return
    }

    nearBandIndices.push(index)
  })

  // Spread near-band actors evenly from left to right when multiple are visible.
  if (nearBandIndices.length > 1) {
    const step = nearBandIndices.length === 2 ? 2 : 1.8
    const center = (nearBandIndices.length - 1) / 2

    nearBandIndices.forEach((actorIndex, i) => {
      nudges[actorIndex] = (i - center) * step
    })
  }

  // Far actors are typically single; keep tiny spread if multiple are ever shown.
  if (farBandIndices.length > 1) {
    const center = (farBandIndices.length - 1) / 2
    farBandIndices.forEach((actorIndex, i) => {
      nudges[actorIndex] = (i - center) * 1.2
    })
  }

  return nudges
}
