import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Breakpoint, DocumentModel, EditorNode } from '@/core/types/document'
import { demoDocument } from '@/core/types/demoDocument'
import { cloneDeep } from '@/utils/deepClone'
import {
  addNode,
  deleteNode,
  updateNodeProps,
  updateNodeStyles,
  updateNodeGrid,
  moveNode,
  duplicateNode,
  updateNodeMeta,
  updateNodeLayout,
} from './operations'
import type { NodeGridData } from '@/core/grid/gridEngine'

export const useEditorStore = defineStore('editor', () => {
  // ─── State ─────────────────────────────────────────────
  const document = ref<DocumentModel>(cloneDeep(demoDocument))
  const selectedNodeId = ref<string | null>(null)
  const hoveredNodeId = ref<string | null>(null)
  const activeBreakpoint = ref<Breakpoint>('desktop')
  const mode = ref<'edit' | 'preview'>('edit')


  // ─── History ───────────────────────────────────────────
  const undoStack = ref<DocumentModel[]>([])
  const redoStack = ref<DocumentModel[]>([])
  const maxHistory = 50

  function saveSnapshot(): void {
    undoStack.value.push(cloneDeep(document.value))
    redoStack.value = []
    if (undoStack.value.length > maxHistory) {
      undoStack.value.shift()
    }
  }

  // ─── Computed ──────────────────────────────────────────
  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  const selectedNode = computed((): EditorNode | null => {
    if (!selectedNodeId.value) return null
    return document.value.nodes[selectedNodeId.value] ?? null
  })

  const rootNode = computed((): EditorNode | null => {
    return document.value.nodes[document.value.rootId] ?? null
  })

  const nodes = computed(() => document.value.nodes)

  // ─── Actions ───────────────────────────────────────────
  function undo(): void {
    if (!canUndo.value) return
    const prev = undoStack.value.pop()
    if (prev) {
      redoStack.value.push(cloneDeep(document.value))
      document.value = prev
    }
  }

  function redo(): void {
    if (!canRedo.value) return
    const next = redoStack.value.pop()
    if (next) {
      undoStack.value.push(cloneDeep(document.value))
      document.value = next
    }
  }

  function selectNode(nodeId: string | null): void {
    selectedNodeId.value = nodeId
  }

  function hoverNode(nodeId: string | null): void {
    hoveredNodeId.value = nodeId
  }

  function setBreakpoint(bp: Breakpoint): void {
    activeBreakpoint.value = bp
  }

  function setMode(m: 'edit' | 'preview'): void {
    mode.value = m
  }



  function doAddNode(type: string, parentId: string, index?: number): string | undefined {
    saveSnapshot()
    const newNode = addNode(document.value, type, parentId, index)
    if (newNode) {
      selectedNodeId.value = newNode.id
      return newNode.id
    }
    return undefined
  }

  function doDeleteNode(nodeId: string): boolean {
    saveSnapshot()
    const result = deleteNode(document.value, nodeId)
    if (result && selectedNodeId.value === nodeId) {
      selectedNodeId.value = null
    }
    return result
  }

  function doUpdateProps(nodeId: string, propsUpdate: Record<string, unknown>): boolean {
    saveSnapshot()
    return updateNodeProps(document.value, nodeId, propsUpdate)
  }

  function doUpdateStyles(
    nodeId: string,
    stylesUpdate: Record<string, string | number>,
    breakpoint?: Breakpoint
  ): boolean {
    saveSnapshot()
    return updateNodeStyles(document.value, nodeId, stylesUpdate, breakpoint)
  }

  function doMoveNode(nodeId: string, newParentId: string, index: number): boolean {
    saveSnapshot()
    return moveNode(document.value, nodeId, newParentId, index)
  }

  function doDuplicateNode(nodeId: string): string | undefined {
    saveSnapshot()
    return duplicateNode(document.value, nodeId)
  }

  function doUpdateMeta(
    nodeId: string,
    metaUpdate: Partial<NonNullable<EditorNode['meta']>>
  ): boolean {
    saveSnapshot()
    return updateNodeMeta(document.value, nodeId, metaUpdate)
  }

  function doUpdateGrid(
    nodeId: string,
    gridUpdate: Partial<NodeGridData>,
    breakpoint?: Breakpoint
  ): boolean {
    saveSnapshot()
    return updateNodeGrid(document.value, nodeId, gridUpdate, breakpoint)
  }

  function doUpdateLayout(
    nodeId: string,
    layoutUpdate: Partial<NonNullable<EditorNode['layout']>>
  ): boolean {
    saveSnapshot()
    return updateNodeLayout(document.value, nodeId, layoutUpdate)
  }

  function loadDocument(doc: DocumentModel): void {
    saveSnapshot()
    document.value = cloneDeep(doc)
    selectedNodeId.value = null
    hoveredNodeId.value = null
  }

  function exportDocument(): DocumentModel {
    return cloneDeep(document.value)
  }

  return {
    // State
    document,
    selectedNodeId,
    hoveredNodeId,
    activeBreakpoint,
    mode,


    // Computed
    canUndo,
    canRedo,
    selectedNode,
    rootNode,
    nodes,

    // Actions
    undo,
    redo,
    selectNode,
    hoverNode,
    setBreakpoint,
    setMode,

    doAddNode,
    doDeleteNode,
    doUpdateProps,
    doUpdateStyles,
    doMoveNode,
    doDuplicateNode,
    doUpdateMeta,
    doUpdateGrid,
    doUpdateLayout,
    loadDocument,
    exportDocument,
    saveSnapshot,
  }
})
