import { getGridLinePositions } from './gridEngine'
import type { ComputedGrid } from '@/core/types/grid'

export interface SnapResult {
  snapped: boolean
  value: number
  guideLine: number | null
}

/**
 * Snap a position to the nearest grid line if within tolerance.
 */
export function snapToGrid(
  position: number,
  grid: ComputedGrid,
  tolerance: number
): SnapResult {
  const lines = getGridLinePositions(grid)

  let closestLine: number | null = null
  let closestDist = Infinity

  for (const line of lines) {
    const dist = Math.abs(position - line)
    if (dist < closestDist) {
      closestDist = dist
      closestLine = line
    }
  }

  if (closestLine !== null && closestDist <= tolerance) {
    return {
      snapped: true,
      value: closestLine,
      guideLine: closestLine,
    }
  }

  return {
    snapped: false,
    value: position,
    guideLine: null,
  }
}

/**
 * Snap both edges of a rect to grid lines.
 */
export function snapRectToGrid(
  x: number,
  width: number,
  grid: ComputedGrid,
  tolerance: number
): { x: number; snappedLines: number[] } {
  const leftSnap = snapToGrid(x, grid, tolerance)
  const rightSnap = snapToGrid(x + width, grid, tolerance)

  const snappedLines: number[] = []

  let finalX = x
  if (leftSnap.snapped && leftSnap.guideLine !== null) {
    finalX = leftSnap.value
    snappedLines.push(leftSnap.guideLine)
  } else if (rightSnap.snapped && rightSnap.guideLine !== null) {
    finalX = rightSnap.value - width
    snappedLines.push(rightSnap.guideLine)
  }

  return { x: finalX, snappedLines }
}

export interface AlignmentGuide {
  type: 'vertical' | 'horizontal'
  position: number // x or y value
  start: number
  end: number
  label?: string
}

interface Rect {
  x: number
  y: number
  width: number
  height: number
  id: string
}

/**
 * Calculate smart alignment guides relative to other nodes.
 * Checks for Left/Center/Right and Top/Center/Bottom alignment.
 */
export function calcAlignmentGuides(
  activeRect: Rect,
  otherRects: Rect[],
  tolerance: number = 10
): { snappedRect: Rect; guides: AlignmentGuide[] } {
  let guides: AlignmentGuide[] = []
  let { x, y } = activeRect
  const { width, height } = activeRect

  // Vertical Alignments (x-axis)
  let bestDistX = tolerance + 1 // Start slightly above tolerance

  const vPoints = [
    { value: x, type: 'left' },
    { value: x + width / 2, type: 'center' },
    { value: x + width, type: 'right' }
  ]

  // Prepare a list of all potential snaps to sort/filter? 
  // Or just iterate. Iteration is fine.
  
  // We need to check ALL combinations and find the BEST one.
  // The previous greedy approach (modifying x in loop) is problematic if we have multiple targets.
  // Better: Find best snap first, then apply it, then generate guides.

  let bestSnapX: { offset: number; candidates: { t: number, start: number, end: number }[] } | null = null

  for (const other of otherRects) {
    const targets = [
      { value: other.x, type: 'left' },
      { value: other.x + other.width / 2, type: 'center' },
      { value: other.x + other.width, type: 'right' }
    ]

    for (const v of vPoints) {
      for (const t of targets) {
        const dist = Math.abs(v.value - t.value)
        if (dist <= tolerance) {
            if (dist < bestDistX) {
                // Found a better snap
                bestDistX = dist
                bestSnapX = {
                    offset: t.value - v.value,
                    candidates: [{ t: t.value, start: Math.min(y, other.y), end: Math.max(y + height, other.y + other.height) }]
                }
            } else if (Math.abs(dist - bestDistX) < 0.1) {
                // Found an equally good snap (approx equal)
                if (bestSnapX) {
                    bestSnapX.candidates.push({ t: t.value, start: Math.min(y, other.y), end: Math.max(y + height, other.y + other.height) })
                }
            }
        }
      }
    }
  }

  // Apply X snap
  if (bestSnapX) {
      x += bestSnapX.offset
      // Generate vertical guides
      for (const c of bestSnapX.candidates) {
          guides.push({
              type: 'vertical',
              position: c.t,
              start: c.start,
              end: c.end
          })
      }
  }

  // Horizontal Alignments (y-axis)
  let bestDistY = tolerance + 1
  let bestSnapY: { offset: number; candidates: { t: number, start: number, end: number }[] } | null = null
  
  const hPoints = [
    { value: y, type: 'top' },
    { value: y + height / 2, type: 'center' },
    { value: y + height, type: 'bottom' }
  ]

  for (const other of otherRects) {
     const targets = [
      { value: other.y, type: 'top' },
      { value: other.y + other.height / 2, type: 'center' },
      { value: other.y + other.height, type: 'bottom' }
    ]

     for (const h of hPoints) {
      for (const t of targets) {
        const dist = Math.abs(h.value - t.value)
        if (dist <= tolerance) {
            if (dist < bestDistY) {
                bestDistY = dist
                bestSnapY = {
                    offset: t.value - h.value,
                    candidates: [{ t: t.value, start: Math.min(x, other.x), end: Math.max(x + width, other.x + other.width) }]
                }
            } else if (Math.abs(dist - bestDistY) < 0.1) {
                if (bestSnapY) {
                    bestSnapY.candidates.push({ t: t.value, start: Math.min(x, other.x), end: Math.max(x + width, other.x + other.width) })
                }
            }
        }
      }
    }
  }

  // Apply Y snap
  if (bestSnapY) {
      y += bestSnapY.offset
      for (const c of bestSnapY.candidates) {
          guides.push({
              type: 'horizontal',
              position: c.t,
              start: c.start,
              end: c.end
          })
      }
  }

  return {
    snappedRect: { ...activeRect, x, y },
    guides
  }
}
