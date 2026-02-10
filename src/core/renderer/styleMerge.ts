import type { Breakpoint, Responsive, EditorNode } from '@/core/types/document'
import { mergeResponsive } from '@/core/types/document'
import { gridToPixel } from '@/core/grid/gridEngine'
import type { ComputedGrid } from '@/core/types/grid'
import type { NodeGridData } from '@/core/grid/gridEngine'

/**
 * Merge base styles with breakpoint-specific overrides.
 * Returns a flat CSS-compatible style object.
 */
export function mergeStyles(
  styles: Responsive<Record<string, string | number>>,
  breakpoint: Breakpoint
): Record<string, string | number> {
  const base = { ...styles.base }
  const override = styles.bp?.[breakpoint]
  if (override) {
    const merged = { ...base }
    for (const [key, val] of Object.entries(override)) {
      if (val !== undefined) {
        merged[key] = val
      }
    }
    return merged
  }
  return base
}

/**
 * Compute CSS position styles from a node's grid data.
 * Returns position/left/top/width CSS if grid data exists.
 */
export function computeGridPosition(
  node: EditorNode,
  computedGrid: ComputedGrid | null,
  breakpoint: Breakpoint
): Record<string, string | number> | null {
  if (!node.grid || !computedGrid) return null

  // Merge grid data with breakpoint
  const gridData = mergeResponsive(node.grid, breakpoint) as NodeGridData
  if (!gridData.colStart || !gridData.colSpan) return null

  // CSS Grid Positioning
  return {
    gridColumn: `${gridData.colStart} / span ${gridData.colSpan}`,
    gridRow: gridData.rowStart ? `${gridData.rowStart} / span ${gridData.rowSpan || 1}` : '1',
    marginTop: `${gridData.marginTop ?? 0}px`,
    marginLeft: `${gridData.marginLeft ?? 0}px`,
    marginRight: `${gridData.marginRight ?? 0}px`,
    // Align/Justify self start to allow margins to position exactly
    alignSelf: 'start',
    justifySelf: 'stretch',
    // Width is determined by grid column span minus margins
    width: 'auto', 
    position: 'relative', // Ensure it's not absolute
  }
}

/**
 * Get full computed styles for a node. Merges grid position + styles.
 * Grid position takes priority for position layout.
 */
export function getNodeComputedStyles(
  node: EditorNode,
  computedGrid: ComputedGrid | null,
  breakpoint: Breakpoint
): Record<string, string | number> {
  const baseStyles = mergeStyles(node.styles, breakpoint)
  const gridStyles = computeGridPosition(node, computedGrid, breakpoint)

  if (gridStyles) {
    return { ...baseStyles, ...gridStyles }
  }

  return baseStyles
}
