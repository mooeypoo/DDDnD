export type VersionRef = {
  id: string
  version: number
}

export type VersionedEntity = {
  id: string
  version: number
}

/**
 * Highest version currently referenced by playable entry points.
 * If nothing in play refs the id, fall back to the newest file in inventory.
 */
export function pickPlayableVersion(
  inventoryVersions: number[],
  referencedVersion: number | undefined
): number | undefined {
  if (referencedVersion !== undefined) {
    return referencedVersion
  }

  if (inventoryVersions.length === 0) {
    return undefined
  }

  return Math.max(...inventoryVersions)
}

export function recordPlayableRef(map: Map<string, number>, ref: VersionRef): void {
  const current = map.get(ref.id)
  if (current === undefined || ref.version > current) {
    map.set(ref.id, ref.version)
  }
}

export function selectPlayableEntities<T extends VersionedEntity>(
  inventory: T[],
  playableVersions: Map<string, number>
): T[] {
  const byId = new Map<string, T>()

  for (const entity of inventory) {
    const versions = inventory.filter((item) => item.id === entity.id).map((item) => item.version)
    const wanted = pickPlayableVersion(versions, playableVersions.get(entity.id))
    if (entity.version === wanted) {
      byId.set(entity.id, entity)
    }
  }

  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id))
}

export function selectHistoryEntities<T extends VersionedEntity>(
  inventory: T[],
  playable: T[]
): T[] {
  const playableKeys = new Set(playable.map((item) => `${item.id}-v${item.version}`))
  return inventory
    .filter((item) => !playableKeys.has(`${item.id}-v${item.version}`))
    .sort((left, right) => left.id.localeCompare(right.id) || left.version - right.version)
}
