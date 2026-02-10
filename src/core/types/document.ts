export type Breakpoint = 'desktop' | 'tablet' | 'mobile'

export type Responsive<T> = {
  base: T
  bp?: Partial<Record<Breakpoint, Partial<T>>>
}

export interface EditorNode {
  id: string
  type: string
  parentId: string | null
  children: string[]
  props: Record<string, unknown>
  styles: Responsive<Record<string, string | number>>
  layoutMode: 'flow' | 'absolute'
  layout?: {
    type: 'flex' | 'grid'
    direction?: 'row' | 'column'
    justify?: string
    align?: string
    gap?: number
    padding?: { top: number; right: number; bottom: number; left: number }
    cols?: number | string
    rows?: number | string
    rowGap?: number
    colGap?: number
  }
  grid?: Responsive<{
    colStart: number
    colSpan: number
    rowStart?: number
    rowSpan?: number
    offsetX?: number
    offsetY?: number
    marginLeft?: number
    marginRight?: number
    marginTop?: number
    marginBottom?: number
  }>
  meta?: {
    name?: string
    locked?: boolean
    hidden?: boolean
  }
}

export interface PageInfo {
  id: string
  name: string
  rootId: string
}

export interface GridConfig {
  maxWidth: number
  columns: number
  gutter: number
  margin: number
  snapTolerance: number
}

export interface DocumentModel {
  rootId: string
  nodes: Record<string, EditorNode>
  pages: PageInfo[]
  activePageId: string
  grid: Responsive<GridConfig>
}

/**
 * Merge responsive value by applying breakpoint overrides on top of base.
 */
export function mergeResponsive<T extends Record<string, unknown>>(
  responsive: Responsive<T>,
  breakpoint: Breakpoint
): T {
  const base = { ...responsive.base }
  const override = responsive.bp?.[breakpoint]
  if (override) {
    return { ...base, ...override } as T
  }
  return base as T
}
