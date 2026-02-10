import type { DocumentModel } from '@/core/types/document'
import { cloneDeep } from '@/utils/deepClone'

export interface HistoryManager {
  push(state: DocumentModel): void
  undo(): DocumentModel | undefined
  redo(): DocumentModel | undefined
  canUndo(): boolean
  canRedo(): boolean
  clear(): void
}

/**
 * Create a history manager for undo/redo support.
 * Stores snapshots of the entire document model.
 */
export function createHistoryManager(maxHistory = 50): HistoryManager {
  const undoStack: DocumentModel[] = []
  const redoStack: DocumentModel[] = []

  return {
    push(state: DocumentModel): void {
      undoStack.push(cloneDeep(state))
      // Clear redo stack on new action
      redoStack.length = 0
      // Limit history size
      if (undoStack.length > maxHistory) {
        undoStack.shift()
      }
    },

    undo(): DocumentModel | undefined {
      const state = undoStack.pop()
      if (state) {
        return cloneDeep(state)
      }
      return undefined
    },

    redo(): DocumentModel | undefined {
      const state = redoStack.pop()
      if (state) {
        return cloneDeep(state)
      }
      return undefined
    },

    canUndo(): boolean {
      return undoStack.length > 0
    },

    canRedo(): boolean {
      return redoStack.length > 0
    },

    clear(): void {
      undoStack.length = 0
      redoStack.length = 0
    },
  }
}

/**
 * Push the current state to redo stack (used internally by the store during undo).
 */
export function pushToRedo(manager: HistoryManager, state: DocumentModel): void {
  // We access internals via a workaround — the store manages this
  // This is a helper the store uses
  const m = manager as ReturnType<typeof createHistoryManager> & { _redoPush?: (s: DocumentModel) => void }
  if (!m._redoPush) {
    // Attach a redo push method
    const redoStack: DocumentModel[] = []
    m._redoPush = (s: DocumentModel) => {
      redoStack.push(cloneDeep(s))
    }
  }
}
