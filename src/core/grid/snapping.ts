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
  tolerance: number = 5
): { snappedRect: Rect; guides: AlignmentGuide[] } {
  const guides: AlignmentGuide[] = []
  let { x, y } = activeRect
  const { width, height } = activeRect

  // Vertical Alignments (x-axis)
  // Edges to check: Left vs Left/Right/Center, Center vs Center, Right vs Left/Right/Center
  // To simplify: check Left, Center, Right of active vs L, C, R of targets.
  
  let snappedX = false
  let bestDistX = Infinity

  const vPoints = [
    { value: x, type: 'left' },
    { value: x + width / 2, type: 'center' },
    { value: x + width, type: 'right' }
  ]

  for (const other of otherRects) {
    const targets = [
      { value: other.x, type: 'left' },
      { value: other.x + other.width / 2, type: 'center' },
      { value: other.x + other.width, type: 'right' }
    ]

    for (const v of vPoints) {
      for (const t of targets) {
        const dist = Math.abs(v.value - t.value)
        if (dist <= tolerance && dist < bestDistX) {
            // Apply snap
            const offset = t.value - v.value
            x += offset
            snappedX = true
            bestDistX = dist // Prioritize closest

            // Add guide
            guides.push({
                type: 'vertical',
                position: t.value,
                start: Math.min(y, other.y),
                end: Math.max(y + height, other.y + other.height)
            })
        }
      }
    }
  }

  // Horizontal Alignments (y-axis)
  let snappedY = false
  let bestDistY = Infinity

  const hPoints = [
    { value: y, type: 'top' },
    { value: y + height / 2, type: 'center' },
    { value: y + height, type: 'bottom' }
  ]
  
  // Re-update based on snapped X if needed? 
  // Ideally we snap X and Y independently.

  for (const other of otherRects) {
     const targets = [
      { value: other.y, type: 'top' },
      { value: other.y + other.height / 2, type: 'center' },
      { value: other.y + other.height, type: 'bottom' }
    ]

     for (const h of hPoints) {
      for (const t of targets) {
        const dist = Math.abs(h.value - t.value)
        if (dist <= tolerance && dist < bestDistY) {
            const offset = t.value - h.value
            y += offset
            snappedY = true
            bestDistY = dist

            guides.push({
                type: 'horizontal',
                position: t.value,
                start: Math.min(x, other.x),
                end: Math.max(x + width, other.x + other.width)
            })
        }
      }
    }
  }

  // Filter guides to only show the ones that match the final snapped position
  // (Simplified for now, returning all matches within tolerance might be noisy, 
  // strictly we should only return the one we snapped to).
  
  const relevantGuides = guides.filter(g => {
    if (g.type === 'vertical') {
        const cx = x + width/2
        const closeToLeft = Math.abs(g.position - x) < 1
        const closeToCenter = Math.abs(g.position - cx) < 1
        const closeToRight = Math.abs(g.position - (x+width)) < 1
        return closeToLeft || closeToCenter || closeToRight
    } else {
        const cy = y + height/2
        const closeToTop = Math.abs(g.position - y) < 1
        const closeToCenter = Math.abs(g.position - cy) < 1
        const closeToBottom = Math.abs(g.position - (y+height)) < 1
        return closeToTop || closeToCenter || closeToBottom
    }
  })

  return {
    snappedRect: { ...activeRect, x, y },
    guides: relevantGuides
  }
}
