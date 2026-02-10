<template>
  <div
    ref="canvasRef"
    class="w-full h-full relative overflow-auto flex justify-center canvas-bg"
    @click.self="handleCanvasClick"
    @dragover.prevent.stop="handleDragOver"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent.stop="handleDrop"
  >
    <div
      ref="artboardRef"
      class="relative bg-white shadow-xl my-8 artboard"
      :style="artboardStyle"
    >
      <!-- Grid Overlay -->
      <GridOverlay
        :config="gridConfig"
        :container-width="artboardWidth"
        :visible="store.showGrid && store.mode === 'edit'"
      />

      <!-- Node Renderer -->
      <NodeRenderer
        v-if="store.rootNode"
        :node-id="store.document.rootId"
        :nodes="store.document.nodes"
        :breakpoint="store.activeBreakpoint"
        :mode="store.mode"
        :computed-grid="computedGridData"
        @node-click="handleNodeClick"
        @node-hover="handleNodeHover"
        @node-hover-leave="handleNodeHoverLeave"
        @node-mousedown="handleNodeMouseDown"
      />

      <!-- Grid Cell Guides (cell-boundary snap indicators) -->
      <template v-if="gridCellGuides.length > 0 && store.mode === 'edit'">
        <div
          v-for="guide in gridCellGuides"
          :key="guide.key"
          class="grid-guide-line"
          :class="guide.orientation === 'v' ? 'grid-guide-vertical' : ''"
          :style="guide.style"
        >
          <div class="chk-dot-start" />
          <div class="chk-dot-end" />
          <span v-if="guide.distance > 5" class="guide-label">{{ Math.round(guide.distance) }}</span>
        </div>
      </template>

      <!-- Smart Alignment Guides (Red) -->
      <template v-if="smartGuides.length > 0 && store.mode === 'edit'">
        <div
            v-for="(guide, idx) in smartGuides"
            :key="'align-' + idx"
            class="alignment-guide-line"
            :class="guide.type === 'vertical' ? 'alignment-guide-vertical' : 'alignment-guide-horizontal'"
            :style="{
                left: guide.type === 'vertical' ? `${guide.position}px` : `${guide.start}px`,
                top: guide.type === 'vertical' ? `${guide.start}px` : `${guide.position}px`,
                height: guide.type === 'vertical' ? `${guide.end - guide.start}px` : undefined,
                width: guide.type === 'vertical' ? undefined : `${guide.end - guide.start}px`
            }"
        />
      </template>

      <!-- Selection Overlay -->
      <div
        v-if="selectionRect && store.mode === 'edit'"
        class="absolute pointer-events-none z-50 selection-box"
        :style="selectionRect"
      >
        <!-- Node label -->
        <div class="sel-label">
          {{ selectedNodeLabel }}
        </div>
        <!-- Round blue resize handles -->
        <div
          v-for="handle in resizeHandles"
          :key="handle.position"
          class="resize-handle pointer-events-auto"
          :style="handle.style"
          @mousedown.stop="startResize($event, handle.position)"
        />
      </div>

      <!-- Hover Overlay -->
      <div
        v-if="hoverRect && store.hoveredNodeId !== store.selectedNodeId && store.mode === 'edit'"
        class="absolute pointer-events-none border border-blue-400/60 z-40"
        :style="hoverRect"
      />

      <!-- Drag Grid Cell Overlay -->
      <div
        v-if="dragGridCell"
        class="absolute pointer-events-none border-2 border-dashed border-blue-500 bg-blue-500/10 z-50 transition-all duration-75"
        :style="{
            left: `${dragGridCell.rect.x}px`,
            top: `${dragGridCell.rect.y}px`,
            width: `${dragGridCell.rect.width}px`,
            height: `${dragGridCell.rect.height}px`
        }"
      />

      <!-- Snap Guide Lines -->
      <div
        v-for="(line, idx) in activeSnapLines"
        :key="'snap-' + idx"
        class="snap-guide"
        :style="{ left: `${line}px` }"
      />

      <!-- Drop cursor indicator -->
      <div
        v-if="dropCursorStyle"
        class="absolute pointer-events-none z-[60]"
        :style="dropCursorStyle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import NodeRenderer from '@/core/renderer/NodeRenderer.vue'
import GridOverlay from '@/core/grid/GridOverlay.vue'
import { useEditorStore } from '@/core/store/editor.store'
import { mergeResponsive } from '@/core/types/document'
import { computeGrid, pixelToGrid, getColZoneLeft, getColZoneWidth, calcContainerGridCell, type NodeGridData } from '@/core/grid/gridEngine'
import { snapRectToGrid, calcAlignmentGuides, type AlignmentGuide } from '@/core/grid/snapping'
import type { GridConfig } from '@/core/types/grid'

const store = useEditorStore()

// State
const canvasRef = ref<HTMLElement | null>(null)
const artboardRef = ref<HTMLElement | null>(null)


const artboardWidth = computed(() => {
  const bp = store.activeBreakpoint
  const widthMap = { desktop: 1200, tablet: 768, mobile: 375 }
  return widthMap[bp]
})

const artboardStyle = computed(() => ({
  width: `${artboardWidth.value}px`,
  minHeight: '600px',
}))

const gridConfig = computed((): GridConfig => {
  return mergeResponsive(store.document.grid, store.activeBreakpoint) as GridConfig
})

const computedGridData = computed(() => computeGrid(gridConfig.value, artboardWidth.value))

// State for Smart Guides
const smartGuides = ref<AlignmentGuide[]>([])
let dragOtherRects: { x: number; y: number; width: number; height: number; id: string }[] = []

// State for Container Grid Snapping
const dragGridCell = ref<{ col: number, row: number, rect: { x: number, y: number, width: number, height: number }, containerId: string } | null>(null)

// ─── Selection & Hover Rects ─────────────────────────────
const selectionRect = ref<Record<string, string> | null>(null)
const hoverRect = ref<Record<string, string> | null>(null)
const activeSnapLines = ref<number[]>([])
const isDragging = ref(false)

function getNodeRect(nodeId: string): Record<string, string> | null {
  const el = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null
  if (!el || !artboardRef.value) return null

  const artboardRect = artboardRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  return {
    top: `${nodeRect.top - artboardRect.top}px`,
    left: `${nodeRect.left - artboardRect.left}px`,
    width: `${nodeRect.width}px`,
    height: `${nodeRect.height}px`,
  }
}

function getNodeRectNumbers(nodeId: string): { top: number; left: number; width: number; height: number } | null {
  const el = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLElement | null
  if (!el || !artboardRef.value) return null

  const artboardRect = artboardRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  return {
    top: nodeRect.top - artboardRect.top,
    left: nodeRect.left - artboardRect.left,
    width: nodeRect.width,
    height: nodeRect.height,
  }
}

function updateSelectionRect(): void {
  if (store.selectedNodeId) {
    selectionRect.value = getNodeRect(store.selectedNodeId)
  } else {
    selectionRect.value = null
  }
}

function updateHoverRect(): void {
  if (store.hoveredNodeId) {
    hoverRect.value = getNodeRect(store.hoveredNodeId)
  } else {
    hoverRect.value = null
  }
}

const selectedNodeLabel = computed(() => {
  if (!store.selectedNode) return ''
  return store.selectedNode.meta?.name || store.selectedNode.type
})

// ─── Grid Cell Guides (cell-boundary snap indicators) ────
interface GridCellGuide {
  key: string
  orientation: 'h' | 'v'
  style: Record<string, string | number>
  distance: number
}

const gridCellGuides = computed((): GridCellGuide[] => {
  if (isDragging.value) return []
  if (!store.selectedNodeId || store.selectedNodeId === store.document.rootId) return []
  const node = store.document.nodes[store.selectedNodeId]
  if (!node || !node.grid) return []

  const rect = getNodeRectNumbers(store.selectedNodeId)
  if (!rect) return []

  const grid = computedGridData.value
  if (!grid || !grid.columns.length) return []

  // Find section offset & height
  const parentNode = node.parentId ? store.document.nodes[node.parentId] : null
  let sectionOffsetY = 0
  let sectionHeight = 400
  if (parentNode && parentNode.type === 'section') {
    const sectionEl = document.querySelector(`[data-node-id="${parentNode.id}"]`) as HTMLElement | null
    const artRect = artboardRef.value?.getBoundingClientRect()
    if (sectionEl && artRect) {
      sectionOffsetY = sectionEl.getBoundingClientRect().top - artRect.top
      sectionHeight = sectionEl.offsetHeight
    }
  }

  // Build all column boundary X positions
  const boundaries: number[] = []
  for (const col of grid.columns) {
    boundaries.push(col.x)
    boundaries.push(col.x + col.width)
  }

  const elemLeft = rect.left
  const elemRight = rect.left + rect.width
  const elemTop = rect.top
  const elemBottom = rect.top + rect.height
  const centerY = elemTop + rect.height / 2
  const centerX = elemLeft + rect.width / 2

  // Find nearest boundary to LEFT edge
  let nearestLeftBoundary = boundaries[0]
  let nearestLeftDist = Math.abs(elemLeft - boundaries[0])
  for (const bx of boundaries) {
    const d = Math.abs(elemLeft - bx)
    if (d < nearestLeftDist) { nearestLeftDist = d; nearestLeftBoundary = bx }
  }

  // Find nearest boundary to RIGHT edge
  let nearestRightBoundary = boundaries[boundaries.length - 1]
  let nearestRightDist = Math.abs(elemRight - boundaries[boundaries.length - 1])
  for (const bx of boundaries) {
    const d = Math.abs(elemRight - bx)
    if (d < nearestRightDist) { nearestRightDist = d; nearestRightBoundary = bx }
  }

  // Top & bottom distances
  const topDist = elemTop - sectionOffsetY
  const bottomDist = (sectionOffsetY + sectionHeight) - elemBottom

  // Build all 4 candidates
  const candidates: GridCellGuide[] = []

  if (nearestLeftDist > 1) {
    candidates.push({
      key: 'cell-left', orientation: 'h',
      style: {
        position: 'absolute',
        left: `${Math.min(nearestLeftBoundary, elemLeft)}px`,
        top: `${centerY}px`,
        width: `${nearestLeftDist}px`, height: '0px', zIndex: 45,
      },
      distance: Math.round(nearestLeftDist),
    })
  }
  if (nearestRightDist > 1) {
    candidates.push({
      key: 'cell-right', orientation: 'h',
      style: {
        position: 'absolute',
        left: `${Math.min(elemRight, nearestRightBoundary)}px`,
        top: `${centerY}px`,
        width: `${nearestRightDist}px`, height: '0px', zIndex: 45,
      },
      distance: Math.round(nearestRightDist),
    })
  }
  if (topDist > 1) {
    candidates.push({
      key: 'cell-top', orientation: 'v',
      style: {
        position: 'absolute',
        left: `${centerX}px`, top: `${sectionOffsetY}px`,
        width: '0px', height: `${topDist}px`, zIndex: 45,
      },
      distance: Math.round(topDist),
    })
  }
  if (bottomDist > 1) {
    candidates.push({
      key: 'cell-bottom', orientation: 'v',
      style: {
        position: 'absolute',
        left: `${centerX}px`, top: `${elemBottom}px`,
        width: '0px', height: `${bottomDist}px`, zIndex: 45,
      },
      distance: Math.round(bottomDist),
    })
  }

  // Return only the 2 nearest guides
  candidates.sort((a, b) => a.distance - b.distance)
  return candidates.slice(0, 2)
})

// ─── Resize Handles ──────────────────────────────────────
type ResizePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const resizeHandles = computed(() => {
  const allPositions: { position: ResizePosition; style: Record<string, string> }[] = [
    { position: 'nw', style: { top: '-5px', left: '-5px', cursor: 'nw-resize' } },
    { position: 'n', style: { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
    { position: 'ne', style: { top: '-5px', right: '-5px', cursor: 'ne-resize' } },
    { position: 'e', style: { top: '50%', right: '-5px', transform: 'translateY(-50%)', cursor: 'e-resize' } },
    { position: 'se', style: { bottom: '-5px', right: '-5px', cursor: 'se-resize' } },
    { position: 's', style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
    { position: 'sw', style: { bottom: '-5px', left: '-5px', cursor: 'sw-resize' } },
    { position: 'w', style: { top: '50%', left: '-5px', transform: 'translateY(-50%)', cursor: 'w-resize' } },
  ]
  // Section: only allow height resize (south handle)
  if (store.selectedNodeId) {
    const selectedNode = store.document.nodes[store.selectedNodeId]
    if (selectedNode?.type === 'section') {
      return allPositions.filter(p => p.position === 's')
    }
  }
  return allPositions
})

let resizeState: {
  active: boolean
  position: ResizePosition
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  startLeft: number
  startTop: number
} | null = null

function startResize(e: MouseEvent, position: ResizePosition): void {
  if (!store.selectedNodeId || !selectionRect.value) return

  resizeState = {
    active: true,
    position,
    startX: e.clientX,
    startY: e.clientY,
    startWidth: parseFloat(selectionRect.value.width),
    startHeight: parseFloat(selectionRect.value.height),
    startLeft: parseFloat(selectionRect.value.left),
    startTop: parseFloat(selectionRect.value.top),
  }

  isDragging.value = true
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e: MouseEvent): void {
  if (!resizeState || !store.selectedNodeId) return

  const dx = e.clientX - resizeState.startX
  const dy = e.clientY - resizeState.startY

  let newWidth = resizeState.startWidth
  let newHeight = resizeState.startHeight
  let newLeft = resizeState.startLeft
  let newTop = resizeState.startTop

  if (['e', 'ne', 'se'].includes(resizeState.position)) newWidth += dx
  if (['w', 'nw', 'sw'].includes(resizeState.position)) { newWidth -= dx; newLeft += dx }
  if (['s', 'se', 'sw'].includes(resizeState.position)) newHeight += dy
  if (['n', 'ne', 'nw'].includes(resizeState.position)) { newHeight -= dy; newTop += dy }

  newWidth = Math.max(20, newWidth)
  newHeight = Math.max(20, newHeight)

  // Convert pixel position to grid data
  const grid = computedGridData.value
  const currentNode = store.document.nodes[store.selectedNodeId]
  
  if (currentNode && currentNode.grid) {
    const oldGrid = currentNode.grid.base as NodeGridData // assume base for now or merge
    let finalGrid = { ...oldGrid }
    let shouldUpdateGrid = false

    // Helper to calculate span/marginRight based on fixed Left
    const updateRightSide = () => {
      const zoneLeft = getColZoneLeft(oldGrid.colStart, grid)
      const currentMarginLeft = oldGrid.marginLeft ?? 0
      const targetRightPixel = zoneLeft + currentMarginLeft + newWidth
      
      // Find colEnd
      let colEnd = oldGrid.colStart
      for (let i = oldGrid.colStart - 1; i < grid.columns.length; i++) {
        const col = grid.columns[i]
        const colRight = col.x + col.width
        if (targetRightPixel <= colRight + grid.gutterWidth / 2) {
          colEnd = i + 1
          break
        }
        colEnd = i + 1
      }
      const colSpan = Math.max(1, colEnd - oldGrid.colStart + 1)
      const zoneWidth = getColZoneWidth(oldGrid.colStart, colSpan, grid)
      
      finalGrid.colSpan = colSpan
      finalGrid.marginRight = Math.max(0, (zoneLeft + zoneWidth) - targetRightPixel)
      shouldUpdateGrid = true
    }

    if (resizeState.position === 'e') {
      // East: Lock Left/Top. Only update Span/Right.
      updateRightSide()
    } else if (resizeState.position === 's') {
      // South: Lock everything. Only Height updates (below).
      shouldUpdateGrid = false
    } else if (resizeState.position === 'se') {
      // South-East: Lock Left/Top. Update Span/Right.
      updateRightSide()
    } else {
      // Others: Use full recalculation
      finalGrid = pixelToGrid(newLeft, newTop, newWidth, grid)
      shouldUpdateGrid = true
    }

    if (shouldUpdateGrid) {
      store.doUpdateGrid(store.selectedNodeId, finalGrid, store.activeBreakpoint)
    }
  }

  // Update height in styles (height is not grid-managed)
  store.doUpdateStyles(
    store.selectedNodeId,
    { height: `${Math.round(newHeight)}px` },
    store.activeBreakpoint
  )

  nextTick(updateSelectionRect)
}

function onResizeEnd(): void {
  resizeState = null
  isDragging.value = false
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}

// ─── Free-Form Node Drag with Grid Snapping ──────────
let dragNodeState: {
  nodeId: string
  startX: number
  startY: number
  startLeft: number
  startTop: number
  nodeWidth: number
  nodeHeight: number
  moved: boolean
  snapshotSaved: boolean
} | null = null

function handleNodeMouseDown(payload: { nodeId: string; event: MouseEvent }): void {
  if (store.mode !== 'edit') return
  if (payload.nodeId === store.document.rootId) return

  const node = store.document.nodes[payload.nodeId]
  if (!node) return

  // Sections cannot be dragged
  if (node.type === 'section') return

  const el = document.querySelector(`[data-node-id="${payload.nodeId}"]`) as HTMLElement | null
  if (!el || !artboardRef.value) return

  const artboardRect = artboardRef.value.getBoundingClientRect()
  const nodeRect = el.getBoundingClientRect()

  dragNodeState = {
    nodeId: payload.nodeId,
    startX: payload.event.clientX,
    startY: payload.event.clientY,
    startLeft: nodeRect.left - artboardRect.left,
    startTop: nodeRect.top - artboardRect.top,
    nodeWidth: nodeRect.width,
    nodeHeight: nodeRect.height,
    moved: false,
    snapshotSaved: false,
  }

  // Pre-calculate other nodes for smart alignment
  dragOtherRects = []
  Object.values(store.document.nodes).forEach(n => {
      if (n.id === payload.nodeId || n.id === store.document.rootId) return
      const rect = getNodeRectNumbers(n.id)
      if (rect) {
          dragOtherRects.push({ ...rect, x: rect.left, y: rect.top, id: n.id })
      }
  })

  window.addEventListener('mousemove', onDragNodeMove)
  window.addEventListener('mouseup', onDragNodeEnd)
  isDragging.value = true
}

function onDragNodeMove(e: MouseEvent): void {
  if (!dragNodeState) return

  const dx = e.clientX - dragNodeState.startX
  const dy = e.clientY - dragNodeState.startY

  if (!dragNodeState.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return
  dragNodeState.moved = true

  if (!dragNodeState.snapshotSaved) {
    dragNodeState.snapshotSaved = true
  }

  let newLeft = Math.max(0, dragNodeState.startLeft + dx)
  const newTop = Math.max(0, dragNodeState.startTop + dy)

  // 1. Check for Container Grid logic
  // Find deepest container under mouse
  // Simple check: iterate dragOtherRects, if inside, check layout logic
  let bestContainer = null
  let bestArea = Infinity

  const dragRect = { x: newLeft, y: newTop, width: dragNodeState.nodeWidth, height: dragNodeState.nodeHeight }
  const dragArea = dragRect.width * dragRect.height

  for (const other of dragOtherRects) {
      // Check intersection area
      const xOverlap = Math.max(0, Math.min(dragRect.x + dragRect.width, other.x + other.width) - Math.max(dragRect.x, other.x))
      const yOverlap = Math.max(0, Math.min(dragRect.y + dragRect.height, other.y + other.height) - Math.max(dragRect.y, other.y))
      const intersectionArea = xOverlap * yOverlap

      // Threshold: 30% of dragged node area
      if (intersectionArea > dragArea * 0.3) {
          const node = store.document.nodes[other.id]
          if (node && node.layout?.type === 'grid') {
              // Prefer smallest container by area (deepest)
              // But ensure we compare apples to apples. 
              // Actually, bestArea logic (smallest container) is still good.
              if (other.width * other.height < bestArea) {
                  bestArea = other.width * other.height
                  bestContainer = { ...other, node }
              }
          }
      }
  }

  if (bestContainer) {
      // Calculate snap to container grid
      const relX = newLeft - bestContainer.x
      const relY = newTop - bestContainer.y
      
      const snap = calcContainerGridCell(
          relX, relY, 
          bestContainer.width, bestContainer.height, 
          {
              ...bestContainer.node.layout!,
              cols: bestContainer.node.layout!.cols ?? 1,
              rows: bestContainer.node.layout!.rows ?? 1
          }
      )

      dragGridCell.value = {
          col: snap.col,
          row: snap.row,
          rect: {
              x: bestContainer.x + snap.cellRect.x,
              y: bestContainer.y + snap.cellRect.y,
              width: snap.cellRect.width,
              height: snap.cellRect.height
          },
          containerId: bestContainer.id
      }
      
      // Snap ghost to cell
      // Center the node in the cell or fill it? 
      // For now, let's just highlight the cell and keep ghost flowing?
      // Or snap ghost to top-left of cell.
      // Let's snap ghost to cell top-left + some padding validation? 
      // Actually, if we snap, we should just show the cell highlight and snap the ghost to the cell center/top-left.
      
      newLeft = bestContainer.x + snap.cellRect.x
      // newTop = bestContainer.y + snap.cellRect.y -- Let's not vertical snap hard if we want to drag inside cell?
      // But grid cell usually means "fills cell" or "aligns to cell".
      // Let's snap strict for now.
      
      // We don't update finalTop/Left variables yet, we just update the ghost visual via store potentially?
      // Wait, we are calculating finalLeft/Top for `pixelToGrid` below.
      // If we are in Grid Container mode, `pixelToGrid` (Page Grid) is irrelevant!
      
      // We should SKIP the rest of the logic if in Grid Container mode.
      
      activeSnapLines.value = []
      smartGuides.value = []
      
      // Note: We are NOT updating the node's position in the store here because that would trigger "Page Grid" logic in renderer.
      // We rely on the "dragGridCell" overlay to show where it will drop.
      // But the "ghost" (rendered node) still follows mouse unless we hack it.
      // Actually, we SHOULD update the node position to match the cell so user sees it in place.
      // But we need to make sure we don't apply "Page Grid" quantization on it.
      
      // Update node visual position directly (no history spam)
      const node = store.document.nodes[dragNodeState.nodeId]
      if (node) {
          // Temporarily force absolute to render at snapped position
          // We'll reset this on drop
          const styleBase = node.styles.base || {}
          styleBase.position = 'absolute'
          styleBase.left = `${bestContainer.x + snap.cellRect.x}px`
          styleBase.top = `${bestContainer.y + snap.cellRect.y}px`
          styleBase.width = `${snap.cellRect.width}px`
          styleBase.height = `${snap.cellRect.height}px`
      }
      
  } else {
      dragGridCell.value = null
      
      // Standard Logic (Smart Guides + Page Grid)
      const el = document.querySelector(`[data-node-id="${dragNodeState.nodeId}"]`) as HTMLElement
      const currentHeight = el ? el.offsetHeight : 50
      
      const alignmentResult = calcAlignmentGuides(
          { x: newLeft, y: newTop, width: dragNodeState.nodeWidth, height: currentHeight, id: dragNodeState.nodeId },
          dragOtherRects
      )
      smartGuides.value = alignmentResult.guides

      let finalLeft = newLeft
      let finalTop = newTop

      // Check if we snapped to an element (Red Snap)
      const isSmartX = Math.abs(alignmentResult.snappedRect.x - newLeft) > 0.01
      const isSmartY = Math.abs(alignmentResult.snappedRect.y - newTop) > 0.01

      if (isSmartX) {
          finalLeft = alignmentResult.snappedRect.x
          activeSnapLines.value = [] // Prioritize element alignment over grid line
      } else {
          // Grid Snapping (Blue X axis)
          const snapResult = snapRectToGrid(
            newLeft,
            dragNodeState.nodeWidth,
            computedGridData.value,
            gridConfig.value.snapTolerance
          )
          finalLeft = snapResult.x
          activeSnapLines.value = snapResult.snappedLines
      }

      if (isSmartY) {
          finalTop = alignmentResult.snappedRect.y
      }

      // Convert pixel position to grid data and apply directly for live preview
      const grid = computedGridData.value
      const newGridData = pixelToGrid(finalLeft, finalTop, dragNodeState.nodeWidth, grid)

      const node = store.document.nodes[dragNodeState.nodeId]
      if (node) {
        // Update grid data directly for live preview (not through store to avoid history spam)
        const parentNode = node.parentId ? store.document.nodes[node.parentId] : null
        const isInGridParent = !node.parentId 
          || node.parentId === store.document.rootId 
          || parentNode?.type === 'section'
        if (isInGridParent) {
             if (!node.grid) {
              node.grid = { base: newGridData }
            } else {
              node.grid.base = { ...node.grid.base, ...newGridData }
            }
        }
      }
  }

  nextTick(updateSelectionRect)
}

function onDragNodeEnd(): void {
  if (dragNodeState?.moved) {
    const node = store.document.nodes[dragNodeState.nodeId]
    
    if (dragGridCell.value) {
        // Handle Drop into Grid Container
        store.doMoveNode(dragNodeState.nodeId, dragGridCell.value.containerId, -1)
        
        // Update Grid Props for Container Child
        store.doUpdateGrid(dragNodeState.nodeId, {
            colStart: dragGridCell.value.col,
            colSpan: 1, // Default to 1 cell
            rowStart: dragGridCell.value.row,
            rowSpan: 1,
            marginLeft: 0,
            marginRight: 0,
            marginTop: 0
        }, store.activeBreakpoint)
        
        // Reset absolute positioning styles if any
        store.doUpdateStyles(dragNodeState.nodeId, {
            left: 'auto', top: 'auto', position: 'relative'
        }, store.activeBreakpoint)
        
    } else if (node && node.grid) {
      // Check if element should be reparented to a different section
      const el = document.querySelector(`[data-node-id="${dragNodeState.nodeId}"]`) as HTMLElement | null
      const artRect = artboardRef.value?.getBoundingClientRect()
      if (el && artRect) {
        const elemCenterY = el.getBoundingClientRect().top - artRect.top + el.offsetHeight / 2
        const targetSection = findSectionAtY(elemCenterY)
        if (targetSection && targetSection !== node.parentId) {
          // Reparent to new section
          store.doMoveNode(dragNodeState.nodeId, targetSection, -1)
        }
      }
      // Standard Page Grid Drop
      store.doUpdateGrid(
        dragNodeState.nodeId,
        { ...node.grid.base },
        store.activeBreakpoint
      )
    }
  }

  // Clear guides
  smartGuides.value = []
  dragOtherRects = []
  dragGridCell.value = null
  
  dragNodeState = null
  activeSnapLines.value = []
  isDragging.value = false
  window.removeEventListener('mousemove', onDragNodeMove)
  window.removeEventListener('mouseup', onDragNodeEnd)
  nextTick(updateSelectionRect)
}

// ─── Drag & Drop from Library ────────────────────────────
const isDraggingFromLib = ref(false)
const dropCursorPos = ref<{ x: number; y: number } | null>(null)

const dropCursorStyle = computed(() => {
  if (!isDraggingFromLib.value || !dropCursorPos.value) return null
  return {
    left: `${dropCursorPos.value.x - 12}px`,
    top: `${dropCursorPos.value.y - 12}px`,
    width: '24px',
    height: '24px',
    border: '2px solid #3b82f6',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  }
})

function handleDragOver(e: DragEvent): void {
  if (!e.dataTransfer) return
  e.dataTransfer.dropEffect = 'copy'
  isDraggingFromLib.value = true

  if (artboardRef.value) {
    const rect = artboardRef.value.getBoundingClientRect()
    dropCursorPos.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }
}

function handleDragLeave(): void {
  isDraggingFromLib.value = false
  dropCursorPos.value = null
}

// Find the section under a given Y coordinate (relative to artboard)
function findSectionAtY(y: number): string | null {
  const root = store.document.nodes[store.document.rootId]
  if (!root) return null

  for (const childId of root.children) {
    const child = store.document.nodes[childId]
    if (child?.type === 'section') {
      const el = document.querySelector(`[data-node-id="${childId}"]`) as HTMLElement | null
      const artRect = artboardRef.value?.getBoundingClientRect()
      if (el && artRect) {
        const sectionRect = el.getBoundingClientRect()
        const sectionTop = sectionRect.top - artRect.top
        const sectionBottom = sectionTop + sectionRect.height
        if (y >= sectionTop && y <= sectionBottom) {
          return childId
        }
      }
    }
  }

  // Fallback: return the last section if below all
  for (let i = root.children.length - 1; i >= 0; i--) {
    const child = store.document.nodes[root.children[i]]
    if (child?.type === 'section') return root.children[i]
  }
  return null
}

function handleDrop(e: DragEvent): void {
  isDraggingFromLib.value = false
  dropCursorPos.value = null
  if (!e.dataTransfer) return

  const componentType = e.dataTransfer.getData('component-type')
  if (!componentType || !artboardRef.value) return

  const artboardRect = artboardRef.value.getBoundingClientRect()
  let dropX = e.clientX - artboardRect.left
  const dropY = e.clientY - artboardRect.top

  const snapResult = snapRectToGrid(dropX, 100, computedGridData.value, gridConfig.value.snapTolerance)
  dropX = snapResult.x

  // Convert drop position to grid data
  const grid = computedGridData.value
  const defaultGrid = pixelToGrid(dropX, dropY, 200, grid) // 200px default width
  if (defaultGrid.colSpan < 2) defaultGrid.colSpan = 3 // minimum 3 columns for new nodes

  // Find the section under the drop point, fallback to first section or root
  const targetParent = findSectionAtY(dropY) || store.document.rootId
  const newNodeId = store.doAddNode(componentType, targetParent)

  if (newNodeId) {
    store.doUpdateGrid(newNodeId, defaultGrid, store.activeBreakpoint)
    store.selectNode(newNodeId)
    nextTick(updateSelectionRect)
  }
}

// ─── Event Handlers ──────────────────────────────────────
function handleNodeClick(nodeId: string): void {
  if (store.mode !== 'edit') return
  if (dragNodeState?.moved) return
  store.selectNode(nodeId)
  nextTick(updateSelectionRect)
}

function handleNodeHover(nodeId: string): void {
  if (store.mode !== 'edit') return
  store.hoverNode(nodeId)
  nextTick(updateHoverRect)
}

function handleNodeHoverLeave(): void {
  store.hoverNode(null)
  hoverRect.value = null
}

function handleCanvasClick(): void {
  store.selectNode(null)
  selectionRect.value = null
}

// Watch for changes
watch(() => store.selectedNodeId, () => { nextTick(updateSelectionRect) })
watch(() => store.hoveredNodeId, () => { nextTick(updateHoverRect) })
watch(() => store.document, () => { nextTick(() => { updateSelectionRect(); updateHoverRect() }) }, { deep: true })

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    nextTick(() => { updateSelectionRect(); updateHoverRect() })
  })
  if (canvasRef.value) resizeObserver.observe(canvasRef.value)
})
onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
  window.removeEventListener('mousemove', onDragNodeMove)
  window.removeEventListener('mouseup', onDragNodeEnd)
})
</script>

<style scoped>
.canvas-bg {
  background-color: #f0f2f5;
  background-image: radial-gradient(circle, #d9d9d9 1px, transparent 1px);
  background-size: 20px 20px;
}
.artboard {
  border-radius: 4px;
  background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
  background-size: 20px 20px;
}

/* ── Selection box ────────────────────────────────── */
.selection-box {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.15);
}

.sel-label {
  position: absolute;
  top: -24px;
  left: 0;
  background: #3b82f6;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px 4px 0 0;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

/* ── Round blue resize handles (Wix-style) ────────── */
.resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: #3b82f6;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.25);
  z-index: 55;
}

/* (dist-lines removed — replaced by grid-cell-guides) */

/* ── Snap guide line ──────────────────────────────── */
.snap-guide {
  position: absolute;
  top: 0;
  width: 1px;
  height: 100%;
  background-color: #f43f5e;
  opacity: 0.8;
  pointer-events: none;
  z-index: 55;
}
/* ── Grid Cell Guides (cell-boundary snap indicators) ─ */
.grid-guide-line {
  position: absolute;
  height: 0;
  border-top: 1px dashed #3b82f6; /* Blue dashed line */
  pointer-events: none;
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid-guide-vertical {
  height: auto;
  width: 0 !important;
  border-top: none;
  border-left: 1px dashed #3b82f6;
}

.chk-dot-start, .chk-dot-end {
  position: absolute;
  width: 6px;
  height: 6px;
  background-color: #3b82f6;
  border-radius: 50%;
  top: -3.5px;
}

.chk-dot-start {
  left: -3px;
}

.chk-dot-end {
  right: -3px;
}

.guide-label {
  position: absolute;
  top: -20px;
  background: #3b82f6;
  color: #fff;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
}
/* ── Alignment Guides (Smart Guides - Red) ────────── */
.alignment-guide-line {
  position: absolute;
  pointer-events: none;
  z-index: 55;
  background-color: #f43f5e; /* Red */
  display: flex;
  align-items: center;
  justify-content: center;
}

.alignment-guide-vertical {
  width: 1px;
}

.alignment-guide-horizontal {
  height: 1px;
}
</style>
