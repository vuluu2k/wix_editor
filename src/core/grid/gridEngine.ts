import type { GridConfig, ComputedGrid, GridLine } from '@/core/types/grid'

/**
 * Compute the grid columns and positions based on grid configuration
 * and the available container width.
 */
export function computeGrid(config: GridConfig, containerWidth: number): ComputedGrid {
  const effectiveWidth = Math.min(containerWidth, config.maxWidth)
  const totalMargin = config.margin * 2
  const totalGutters = config.gutter * (config.columns - 1)
  const availableWidth = effectiveWidth - totalMargin - totalGutters
  const columnWidth = availableWidth / config.columns

  const columns: GridLine[] = []
  for (let i = 0; i < config.columns; i++) {
    const x = config.margin + i * (columnWidth + config.gutter)
    columns.push({
      x,
      width: columnWidth,
    })
  }

  return {
    containerWidth: effectiveWidth,
    columns,
    gutterWidth: config.gutter,
    marginWidth: config.margin,
  }
}

/**
 * Get all grid line positions (column edges) for snapping.
 */
export function getGridLinePositions(grid: ComputedGrid): number[] {
  const lines: number[] = []

  // Left margin edge
  lines.push(grid.marginWidth)

  for (const col of grid.columns) {
    lines.push(col.x) // Left edge of column
    lines.push(col.x + col.width) // Right edge of column
  }

  // Right margin edge
  lines.push(grid.containerWidth - grid.marginWidth)

  return [...new Set(lines)].sort((a, b) => a - b)
}

// ─── Grid Data Types ─────────────────────────────────────

export interface NodeGridData {
  colStart: number
  colSpan: number
  rowStart?: number
  rowSpan?: number
  marginLeft?: number
  marginRight?: number
  marginTop?: number
  marginBottom?: number
}

export interface GridPixelResult {
  left: number
  top: number
  width: number
}

// ─── Grid ↔ Pixel Conversion ─────────────────────────────

/**
 * Get the total pixel width of a column zone (colStart + colSpan).
 * This includes the columns + gutters between them.
 * colStart is 1-indexed.
 */
export function getColZoneWidth(colStart: number, colSpan: number, grid: ComputedGrid): number {
  const startIdx = Math.max(0, colStart - 1)
  const endIdx = Math.min(grid.columns.length - 1, startIdx + colSpan - 1)
  const actualSpan = endIdx - startIdx + 1

  if (actualSpan <= 0) return 0

  // Width = sum of column widths + gutters between them
  let totalWidth = 0
  for (let i = startIdx; i <= endIdx; i++) {
    totalWidth += grid.columns[i].width
  }
  totalWidth += (actualSpan - 1) * grid.gutterWidth

  return totalWidth
}

/**
 * Get the left X position of a column zone start (colStart is 1-indexed).
 */
export function getColZoneLeft(colStart: number, grid: ComputedGrid): number {
  const idx = Math.max(0, Math.min(colStart - 1, grid.columns.length - 1))
  return grid.columns[idx].x
}

/**
 * Convert grid data (colStart, colSpan, margins) → pixel position and width.
 */
export function gridToPixel(gridData: NodeGridData, grid: ComputedGrid): GridPixelResult {
  const zoneLeft = getColZoneLeft(gridData.colStart, grid)
  const zoneWidth = getColZoneWidth(gridData.colStart, gridData.colSpan, grid)

  const ml = gridData.marginLeft ?? 0
  const mr = gridData.marginRight ?? 0
  const mt = gridData.marginTop ?? 0

  return {
    left: zoneLeft + ml,
    top: mt,
    width: Math.max(20, zoneWidth - ml - mr),
  }
}

/**
 * Convert pixel position + width → grid data (colStart, colSpan, margins).
 * Finds the best-fit columns for the given rect.
 */
export function pixelToGrid(
  x: number,
  y: number,
  width: number,
  grid: ComputedGrid
): NodeGridData {
  // Find which column the left edge falls in (or is closest to)
  let colStart = 1
  for (let i = 0; i < grid.columns.length; i++) {
    const col = grid.columns[i]
    if (x < col.x + col.width + grid.gutterWidth / 2) {
      colStart = i + 1
      break
    }
    colStart = i + 1
  }

  // Find which column the right edge (x + width) falls in
  const rightEdge = x + width
  let colEnd = colStart
  for (let i = colStart - 1; i < grid.columns.length; i++) {
    const col = grid.columns[i]
    const colRight = col.x + col.width
    if (rightEdge <= colRight + grid.gutterWidth / 2) {
      colEnd = i + 1
      break
    }
    colEnd = i + 1
  }

  const colSpan = Math.max(1, colEnd - colStart + 1)

  // Calculate margins within the column zone
  const zoneLeft = getColZoneLeft(colStart, grid)
  const zoneWidth = getColZoneWidth(colStart, colSpan, grid)

  const marginLeft = Math.max(0, Math.round(x - zoneLeft))
  const marginRight = Math.max(0, Math.round((zoneLeft + zoneWidth) - (x + width)))
  const marginTop = Math.max(0, Math.round(y))

  return {
    colStart,
    colSpan,
    marginLeft: marginLeft > 0 ? marginLeft : 0,
    marginRight: marginRight > 0 ? marginRight : 0,
    marginTop,
  }
}
