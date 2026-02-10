import type { Responsive } from './document'

export interface GridConfig {
  maxWidth: number
  columns: number
  gutter: number
  margin: number
  snapTolerance: number
}

export type ResponsiveGridConfig = Responsive<GridConfig>

export interface GridLine {
  x: number
  width: number
}

export interface ComputedGrid {
  containerWidth: number
  columns: GridLine[]
  gutterWidth: number
  marginWidth: number
}
