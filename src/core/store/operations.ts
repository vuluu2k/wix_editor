import type { DocumentModel, EditorNode, Breakpoint } from '@/core/types/document'
import { generateId } from '@/utils/id'
import { cloneDeep } from '@/utils/deepClone'
import { getComponent } from '@/core/registry'
import type { NodeGridData } from '@/core/grid/gridEngine'

/**
 * Add a new node to the document.
 */
export function addNode(
  doc: DocumentModel,
  type: string,
  parentId: string,
  index?: number,
  defaultGrid?: NodeGridData
): EditorNode | undefined {
  const entry = getComponent(type)
  if (!entry) return undefined

  const parent = doc.nodes[parentId]
  if (!parent) return undefined

  const id = generateId()
  const newNode: EditorNode = {
    id,
    type,
    parentId,
    children: [],
    props: cloneDeep(entry.defaultProps),
    styles: { base: cloneDeep(entry.defaultStyles) },
    layoutMode: 'flow',
    meta: { name: `${entry.label} ${id.slice(0, 4)}` },
  }

  // Set grid positioning if provided
  if (defaultGrid) {
    newNode.grid = {
      base: { ...defaultGrid },
    }
  }

  doc.nodes[id] = newNode

  if (index !== undefined && index >= 0 && index <= parent.children.length) {
    parent.children.splice(index, 0, id)
  } else {
    parent.children.push(id)
  }

  return newNode
}

/**
 * Delete a node and all its descendants from the document.
 */
export function deleteNode(doc: DocumentModel, nodeId: string): boolean {
  const node = doc.nodes[nodeId]
  if (!node || nodeId === doc.rootId) return false

  // Remove from parent's children
  if (node.parentId) {
    const parent = doc.nodes[node.parentId]
    if (parent) {
      parent.children = parent.children.filter((id) => id !== nodeId)
    }
  }

  // Recursively delete descendants
  const deleteDescendants = (id: string) => {
    const n = doc.nodes[id]
    if (n) {
      for (const childId of n.children) {
        deleteDescendants(childId)
      }
      delete doc.nodes[id]
    }
  }

  deleteDescendants(nodeId)
  return true
}

/**
 * Update node props (partial merge).
 */
export function updateNodeProps(
  doc: DocumentModel,
  nodeId: string,
  propsUpdate: Record<string, unknown>
): boolean {
  const node = doc.nodes[nodeId]
  if (!node) return false
  node.props = { ...node.props, ...propsUpdate }
  return true
}

/**
 * Update node styles for current breakpoint (partial merge).
 */
export function updateNodeStyles(
  doc: DocumentModel,
  nodeId: string,
  stylesUpdate: Record<string, string | number>,
  breakpoint?: Breakpoint
): boolean {
  const node = doc.nodes[nodeId]
  if (!node) return false

  if (!breakpoint || breakpoint === 'desktop') {
    node.styles.base = { ...node.styles.base, ...stylesUpdate }
  } else {
    if (!node.styles.bp) {
      node.styles.bp = {}
    }
    node.styles.bp[breakpoint] = {
      ...(node.styles.bp[breakpoint] || {}),
      ...stylesUpdate,
    }
  }

  return true
}

/**
 * Update node grid positioning data for current breakpoint.
 */
export function updateNodeGrid(
  doc: DocumentModel,
  nodeId: string,
  gridUpdate: Partial<NodeGridData>,
  breakpoint?: Breakpoint
): boolean {
  const node = doc.nodes[nodeId]
  if (!node) return false

  // Initialize grid if not exists
  if (!node.grid) {
    node.grid = {
      base: {
        colStart: 1,
        colSpan: 1,
        ...gridUpdate,
      },
    }
    return true
  }

  if (!breakpoint || breakpoint === 'desktop') {
    node.grid.base = { ...node.grid.base, ...gridUpdate }
  } else {
    if (!node.grid.bp) {
      node.grid.bp = {}
    }
    node.grid.bp[breakpoint] = {
      ...(node.grid.bp[breakpoint] || {}),
      ...gridUpdate,
    }
  }

  return true
}

/**
 * Move a node to a new parent at a specific index.
 */
export function moveNode(
  doc: DocumentModel,
  nodeId: string,
  newParentId: string,
  index: number
): boolean {
  const node = doc.nodes[nodeId]
  const newParent = doc.nodes[newParentId]
  if (!node || !newParent || nodeId === doc.rootId) return false

  // Prevent moving a node into its own descendant
  let checkId: string | null = newParentId
  while (checkId) {
    if (checkId === nodeId) return false
    checkId = doc.nodes[checkId]?.parentId ?? null
  }

  // Remove from old parent
  if (node.parentId) {
    const oldParent = doc.nodes[node.parentId]
    if (oldParent) {
      oldParent.children = oldParent.children.filter((id) => id !== nodeId)
    }
  }

  // Add to new parent
  node.parentId = newParentId
  const clampedIndex = Math.min(index, newParent.children.length)
  newParent.children.splice(clampedIndex, 0, nodeId)

  return true
}

/**
 * Duplicate a node and all its descendants.
 */
export function duplicateNode(
  doc: DocumentModel,
  nodeId: string
): string | undefined {
  const node = doc.nodes[nodeId]
  if (!node || nodeId === doc.rootId || !node.parentId) return undefined

  const idMap = new Map<string, string>()

  const cloneTree = (id: string): EditorNode => {
    const original = doc.nodes[id]
    const newId = generateId()
    idMap.set(id, newId)

    const clone: EditorNode = {
      ...cloneDeep(original),
      id: newId,
      children: original.children.map((childId) => {
        const childClone = cloneTree(childId)
        childClone.parentId = newId
        return childClone.id
      }),
    }

    doc.nodes[newId] = clone
    return clone
  }

  const cloned = cloneTree(nodeId)
  cloned.parentId = node.parentId

  // Insert after the original in parent's children
  const parent = doc.nodes[node.parentId]
  if (parent) {
    const originalIndex = parent.children.indexOf(nodeId)
    parent.children.splice(originalIndex + 1, 0, cloned.id)
  }

  // Rename
  if (cloned.meta?.name) {
    cloned.meta.name = `${cloned.meta.name} (copy)`
  }

  return cloned.id
}

/**
 * Update node meta (name, locked, hidden).
 */
export function updateNodeMeta(
  doc: DocumentModel,
  nodeId: string,
  metaUpdate: Partial<NonNullable<EditorNode['meta']>>
): boolean {
  const node = doc.nodes[nodeId]
  if (!node) return false
  node.meta = { ...node.meta, ...metaUpdate }
  return true
}
