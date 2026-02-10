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

/**
 * Calculate which cell of a Container Grid the mouse is hovering over.
 * Returns the column/row index (1-based) and the pixel rect of that cell relative to the container.
 */
export function calcContainerGridCell(
  x: number, // relative to container
  y: number, // relative to container
  containerWidth: number,
  containerHeight: number,
  layout: { cols: number | string, rows: number | string, rowGap?: number, colGap?: number, padding?: any }
): { col: number, row: number, cellRect: { x: number, y: number, width: number, height: number } } {
  const cols = typeof layout.cols === 'number' ? layout.cols : 1
  const rows = typeof layout.rows === 'number' ? layout.rows : 1
  const colGap = layout.colGap ?? 0
  const rowGap = layout.rowGap ?? 0
  const padding = layout.padding || { top: 0, left: 0, right: 0, bottom: 0 }

  const availableWidth = Math.max(0, containerWidth - padding.left - padding.right)
  const availableHeight = Math.max(0, containerHeight - padding.top - padding.bottom)

  // Calculate generic cell size (assuming equal distribution for now)
  const totalColGap = Math.max(0, (cols - 1) * colGap)
  const colWidth = (availableWidth - totalColGap) / cols

  const totalRowGap = Math.max(0, (rows - 1) * rowGap)
  const rowHeight = (availableHeight - totalRowGap) / rows

  // Find Column
  let col = 1
  for (let i = 0; i < cols; i++) {
    const cellX = padding.left + i * (colWidth + colGap)
    // Snap to closest center or just containment?
    // Containment + gap split
    if (x < cellX + colWidth + colGap / 2) {
      col = i + 1
      break
    }
    col = i + 1
  }

  // Find Row
  let row = 1
  for (let i = 0; i < rows; i++) {
    const cellY = padding.top + i * (rowHeight + rowGap)
    if (y < cellY + rowHeight + rowGap / 2) {
      row = i + 1
      break
    }
    row = i + 1
  }

  // Clamp
  col = Math.max(1, Math.min(col, cols))
  row = Math.max(1, Math.min(row, rows))

  const finalX = padding.left + (col - 1) * (colWidth + colGap)
  const finalY = padding.top + (row - 1) * (rowHeight + rowGap)

  return {
    col,
    row,
    cellRect: {
      x: finalX,
      y: finalY,
      width: colWidth,
      height: rowHeight
    }
  }
}
