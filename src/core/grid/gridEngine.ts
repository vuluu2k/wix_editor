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
  layout: import('@/core/types/document').LayoutConfig
): { col: number, row: number, cellRect: { x: number, y: number, width: number, height: number } } {
  // Use the robust computeContainerGrid function
  const grid = computeContainerGrid(layout, containerWidth, containerHeight)
  
  // Find column
  let col = 1
  for (let i = 0; i < grid.columns.length; i++) {
    const c = grid.columns[i]
    if (x < c.x + c.width + grid.gutterWidth / 2) {
      col = i + 1
      break
    }
    col = i + 1
  }
  col = Math.max(1, Math.min(col, grid.columns.length))

  // Find row
  let row = 1
  for (let i = 0; i < grid.rows.length; i++) {
    const r = grid.rows[i]
    if (y < r.x + r.width + grid.rowGap / 2) {
      row = i + 1
      break
    }
    row = i + 1
  }
  row = Math.max(1, Math.min(row, grid.rows.length))

  const finalCol = grid.columns[col - 1]
  const finalRow = grid.rows[row - 1]

  return {
    col,
    row,
    cellRect: {
      x: finalCol.x,
      y: finalRow.x,
      width: finalCol.width,
      height: finalRow.width // height stored in width property of GridLine
    }
  }
}

// ─── Container Grid Computation (2D) ─────────────────────

export interface ComputedContainerGrid extends ComputedGrid {
  rows: GridLine[]
  rowGap: number
  padding: { top: number; right: number; bottom: number; left: number }
}

/**
 * Compute the 2D grid lines (cols & rows) for a container based on its LayoutConfig.
 */
export function computeContainerGrid(
  layout: import('@/core/types/document').LayoutConfig,
  width: number,
  height: number
): ComputedContainerGrid {
  const padding = layout.padding || { top: 0, right: 0, bottom: 0, left: 0 }
  const colGap = layout.colGap ?? layout.gap ?? 0
  const rowGap = layout.rowGap ?? layout.gap ?? 0

  const availableWidth = Math.max(0, width - padding.left - padding.right)
  const availableHeight = Math.max(0, height - padding.top - padding.bottom)

  // ─── Columns ───
  // Default to 1 column if undefined
  const colTracks = layout.columns?.length ? layout.columns : [{ value: 1, unit: 'fr' as const }]
  const numCols = colTracks.length
  
  // Calculate fixed widths first
  let usedWidth = 0
  let totalFr = 0
  
  const colWidths = colTracks.map(track => {
    if (track.unit === 'px') {
      usedWidth += track.value
      return track.value
    } else if (track.unit === '%') {
      const px = (track.value / 100) * availableWidth
      usedWidth += px
      return px
    } else if (track.unit === 'fr' || track.unit === 'auto') {
      totalFr += track.value
      return 0 // placeholder
    }
    return 0
  })

  // Distribute remaining space to fr tracks
  const totalGutterWidth = Math.max(0, (numCols - 1) * colGap)
  const remainingWidth = Math.max(0, availableWidth - usedWidth - totalGutterWidth)
  const frUnitWidth = totalFr > 0 ? remainingWidth / totalFr : 0

  // Finalize column lines
  const columns: GridLine[] = []
  let currentX = padding.left
  
  colTracks.forEach((track, i) => {
    let w = colWidths[i]
    if (track.unit === 'fr' || track.unit === 'auto') {
      w = track.value * frUnitWidth
    }
    columns.push({ x: currentX, width: w })
    currentX += w + colGap
  })


  // ─── Rows ───
  // Default to 1 row if undefined
  const rowTracks = layout.rows?.length ? layout.rows : [{ value: 1, unit: 'fr' as const }]
  const numRows = rowTracks.length
  
  // Calculate fixed heights
  let usedHeight = 0
  let totalRowFr = 0
  
  const rowHeights = rowTracks.map(track => {
    if (track.unit === 'px') {
      usedHeight += track.value
      return track.value
    } else if (track.unit === '%') {
      const px = (track.value / 100) * availableHeight
      usedHeight += px
      return px
    } else if (track.unit === 'fr' || track.unit === 'auto') {
      totalRowFr += track.value
      return 0 // placeholder
    }
    return 0
  })

  const totalRowGutterHeight = Math.max(0, (numRows - 1) * rowGap)
  const remainingHeight = Math.max(0, availableHeight - usedHeight - totalRowGutterHeight)
  const frRowUnitHeight = totalRowFr > 0 ? remainingHeight / totalRowFr : 0

  const rows: GridLine[] = []
  let currentY = padding.top
  
  rowTracks.forEach((track, i) => {
    let h = rowHeights[i]
    if (track.unit === 'fr' || track.unit === 'auto') {
      h = track.value * frRowUnitHeight
    }
    rows.push({ x: currentY, width: h }) // 'width' here means height for rows
    currentY += h + rowGap
  })

  return {
    containerWidth: width,
    columns,
    rows,
    gutterWidth: colGap,
    marginWidth: 0, // not used for containers usually
    rowGap,
    padding
  }
}

/**
 * Convert pixel rect → grid data (2D support for containers).
 */
export function pixelToContainerGrid(
  x: number,
  y: number,
  width: number,
  height: number,
  grid: ComputedContainerGrid
): NodeGridData {
  // ─── Compute Column Span ───
  let colStart = 1
  // Find start column
  for (let i = 0; i < grid.columns.length; i++) {
    const col = grid.columns[i]
    if (x < col.x + col.width + grid.gutterWidth / 2) {
      colStart = i + 1
      break
    }
    colStart = i + 1
  }
  
  let colEnd = colStart
  const rightEdge = x + width
  for (let i = colStart - 1; i < grid.columns.length; i++) {
    const col = grid.columns[i]
    if (rightEdge <= col.x + col.width + grid.gutterWidth / 2) {
      colEnd = i + 1
      break
    }
    colEnd = i + 1
  }
  const colSpan = Math.max(1, colEnd - colStart + 1)

  // ─── Compute Row Span ───
  let rowStart = 1
  // Find start row
  for (let i = 0; i < grid.rows.length; i++) {
    const r = grid.rows[i]
    if (y < r.x + r.width + grid.rowGap / 2) { // r.width is height
      rowStart = i + 1
      break
    }
    rowStart = i + 1
  }

  let rowEnd = rowStart
  const bottomEdge = y + height
  for (let i = rowStart - 1; i < grid.rows.length; i++) {
    const r = grid.rows[i]
    if (bottomEdge <= r.x + r.width + grid.rowGap / 2) {
      rowEnd = i + 1
      break
    }
    rowEnd = i + 1
  }
  const rowSpan = Math.max(1, rowEnd - rowStart + 1)

  // ─── Margins ───
  const colLine = grid.columns[colStart - 1]
  const rowLine = grid.rows[rowStart - 1]

  const offsetLeft = x - colLine.x
  const offsetTop = y - rowLine.x

  return {
    colStart,
    colSpan,
    rowStart,
    rowSpan,
    marginLeft: Math.round(offsetLeft),
    marginTop: Math.round(offsetTop),
    marginRight: 0, // Simplified for now
    marginBottom: 0
  }
}
