import type { Release } from './types'

const rank: Record<Release, number> = { R1: 1, R2: 2, R3: 3 }

export function atLeast(current: Release, need: Release) {
  return rank[current] >= rank[need]
}
