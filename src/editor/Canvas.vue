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

      <!-- Distance Indicator Lines (pin-to-edge like Wix) -->
      <!-- Distance lines: only 2 nearest edges, hidden during drag -->
      <template v-if="visibleDistanceLines && store.mode === 'edit'">
        <div
          v-for="line in visibleDistanceLines"
          :key="line.key"
          :class="line.cls"
          :style="line.style"
        >
          <span class="dist-label">{{ line.value }}</span>
        </div>
      </template>

      <!-- Grid Connection Guides -->
      <template v-if="gridGuides && store.mode === 'edit'">
        <div
          v-for="guide in gridGuides"
          :key="guide.key"
          class="grid-guide-line"
          :style="{
            left: `${guide.x}px`,
            top: `${guide.y}px`,
            width: `${guide.width}px`,
          }"
        >
          <div class="chk-dot-start" />
          <div class="chk-dot-end" />
          <span v-if="guide.width > 20" class="guide-label">{{ Math.round(guide.width) }}</span>
        </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import NodeRenderer from '@/core/renderer/NodeRenderer.vue'
import GridOverlay from '@/core/grid/GridOverlay.vue'
import { useEditorStore } from '@/core/store/editor.store'
import { mergeResponsive } from '@/core/types/document'
import { computeGrid, pixelToGrid, getColZoneLeft, getColZoneWidth, type NodeGridData } from '@/core/grid/gridEngine'
import { snapRectToGrid } from '@/core/grid/snapping'
import type { GridConfig } from '@/core/types/grid'

const store = useEditorStore()
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

// ─── Distance Indicators (only 2 nearest edges, hidden during drag) ──
const visibleDistanceLines = computed(() => {
  // Hide while dragging or resizing
  if (isDragging.value) return null
  if (!store.selectedNodeId || store.selectedNodeId === store.document.rootId) return null
  const rect = getNodeRectNumbers(store.selectedNodeId)
  if (!rect) return null

  const artW = artboardWidth.value
  const artH = artboardRef.value?.clientHeight || 600

  const top = Math.round(rect.top)
  const left = Math.round(rect.left)
  const bottom = Math.max(0, Math.round(artH - rect.top - rect.height))
  const right = Math.max(0, Math.round(artW - rect.left - rect.width))

  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  const lines: { key: string; cls: string; value: number; style: Record<string, string | number> }[] = []

  // Vertical axis: pick nearest (top or bottom)
  if (top <= bottom) {
    if (top > 0) lines.push({
      key: 'top', cls: 'dist-line-v', value: top,
      style: { position: 'absolute', left: `${centerX}px`, top: '0px', height: `${rect.top}px`, zIndex: '52' },
    })
  } else {
    if (bottom > 0) lines.push({
      key: 'bottom', cls: 'dist-line-v', value: bottom,
      style: { position: 'absolute', left: `${centerX}px`, top: `${rect.top + rect.height}px`, height: `${bottom}px`, zIndex: '52' },
    })
  }

  // Horizontal axis: pick nearest (left or right)
  if (left <= right) {
    if (left > 0) lines.push({
      key: 'left', cls: 'dist-line-h', value: left,
      style: { position: 'absolute', left: '0px', top: `${centerY}px`, width: `${rect.left}px`, zIndex: '52' },
    })
  } else {
    if (right > 0) lines.push({
      key: 'right', cls: 'dist-line-h', value: right,
      style: { position: 'absolute', left: `${rect.left + rect.width}px`, top: `${centerY}px`, width: `${right}px`, zIndex: '52' },
    })
  }

  return lines.length > 0 ? lines : null
})

// ─── Grid Connection Guides (Wix-style) ──────────────────
const gridGuides = computed(() => {
  if (!store.selectedNodeId || !store.selectedNode?.grid) return null
  
  // Use current interaction state if dragging/resizing
  // But for now, let's use the stored state or the DOM state
  // DOM state is smoother.
  const rect = getNodeRectNumbers(store.selectedNodeId)
  if (!rect) return null

  const grid = computedGridData.value
  
  // Calculate "Live" grid formatting based on current DOM position (rect)
  // This ensures the guide connects to the column we are currently hovering over/snapping to.
  const liveGridData = pixelToGrid(rect.left, rect.top, rect.width, grid)
  
  if (!liveGridData.colStart) return null

  const guides = []
  const centerY = rect.top + rect.height / 2

  // 1. Connection to Left Grid Column (Live)
  const zoneLeft = getColZoneLeft(liveGridData.colStart, grid)
  
  guides.push({
    key: 'grid-left',
    x: zoneLeft,
    y: centerY,
    width: rect.left - zoneLeft,
    isNegative: rect.left < zoneLeft
  })

  // 2. Connection to Right Grid Column (optional, usually we anchor Top/Left)
  // But resizing uses different anchors.
  // For now, Left Anchor is the primary one.

  return guides
})

// ─── Resize Handles ──────────────────────────────────────
type ResizePosition = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const resizeHandles = computed(() => {
  const positions: { position: ResizePosition; style: Record<string, string> }[] = [
    { position: 'nw', style: { top: '-5px', left: '-5px', cursor: 'nw-resize' } },
    { position: 'n', style: { top: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
    { position: 'ne', style: { top: '-5px', right: '-5px', cursor: 'ne-resize' } },
    { position: 'e', style: { top: '50%', right: '-5px', transform: 'translateY(-50%)', cursor: 'e-resize' } },
    { position: 'se', style: { bottom: '-5px', right: '-5px', cursor: 'se-resize' } },
    { position: 's', style: { bottom: '-5px', left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
    { position: 'sw', style: { bottom: '-5px', left: '-5px', cursor: 'sw-resize' } },
    { position: 'w', style: { top: '50%', left: '-5px', transform: 'translateY(-50%)', cursor: 'w-resize' } },
  ]
  return positions
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
  moved: boolean
  snapshotSaved: boolean
} | null = null

function handleNodeMouseDown(payload: { nodeId: string; event: MouseEvent }): void {
  if (store.mode !== 'edit') return
  if (payload.nodeId === store.document.rootId) return

  const node = store.document.nodes[payload.nodeId]
  if (!node) return

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
    moved: false,
    snapshotSaved: false,
  }

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

  // Grid Snapping (X axis)
  const snapResult = snapRectToGrid(
    newLeft,
    dragNodeState.nodeWidth,
    computedGridData.value,
    gridConfig.value.snapTolerance
  )
  newLeft = snapResult.x
  activeSnapLines.value = snapResult.snappedLines

  // Convert pixel position to grid data and apply directly for live preview
  const grid = computedGridData.value
  const newGridData = pixelToGrid(newLeft, newTop, dragNodeState.nodeWidth, grid)

  const node = store.document.nodes[dragNodeState.nodeId]
  if (node) {
    // Update grid data directly for live preview (not through store to avoid history spam)
    if (!node.grid) {
      node.grid = { base: newGridData }
    } else {
      node.grid.base = { ...node.grid.base, ...newGridData }
    }
  }

  nextTick(updateSelectionRect)
}

function onDragNodeEnd(): void {
  if (dragNodeState?.moved) {
    const node = store.document.nodes[dragNodeState.nodeId]
    if (node && node.grid) {
      // Save grid data through the store (creates undo history)
      store.doUpdateGrid(
        dragNodeState.nodeId,
        { ...node.grid.base },
        store.activeBreakpoint
      )
    }
  }

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

  const newNodeId = store.doAddNode(componentType, store.document.rootId)

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

/* ── Distance indicator lines ─────────────────────── */
.dist-line-v {
  position: absolute;
  width: 0;
  border-left: 1px dashed #f43f5e;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dist-line-h {
  position: absolute;
  height: 0;
  border-top: 1px dashed #f43f5e;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dist-label {
  position: absolute;
  background: #f43f5e;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  white-space: nowrap;
  line-height: 14px;
}

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
/* ── Grid Connection Guides (Wix-style) ───────────── */
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
</style>
