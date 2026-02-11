<template>
  <div class="flex items-center justify-between w-full h-full">
    <!-- Left: Logo / Title -->
    <div class="flex items-center gap-3">
      <span class="text-gray-800 font-bold text-lg tracking-wide">✦ Wix Editor</span>
    </div>

    <!-- Center: Undo / Redo + Mode -->
    <div class="flex items-center gap-2">
      <a-tooltip title="Undo (Ctrl+Z)">
        <a-button
          type="text"
          size="small"
          :disabled="!store.canUndo"
          class="text-gray-500 hover:text-gray-800"
          @click="store.undo()"
        >
          <template #icon><UndoOutlined /></template>
        </a-button>
      </a-tooltip>
      <a-tooltip title="Redo (Ctrl+Y)">
        <a-button
          type="text"
          size="small"
          :disabled="!store.canRedo"
          class="text-gray-500 hover:text-gray-800"
          @click="store.redo()"
        >
          <template #icon><RedoOutlined /></template>
        </a-button>
      </a-tooltip>

      <a-divider type="vertical" class="bg-gray-300 mx-2" />

      <a-segmented
        :value="store.mode === 'edit' ? 'Edit' : 'Preview'"
        :options="['Edit', 'Preview']"
        size="small"
        @change="handleModeChange"
      />
    </div>

    <!-- Right: Breakpoints + Actions -->
    <div class="flex items-center gap-2">
      <a-segmented
        :value="breakpointLabel"
        :options="['Desktop', 'Tablet', 'Mobile']"
        size="small"
        @change="handleBreakpointChange"
      />

      <a-divider type="vertical" class="bg-gray-300 mx-1" />



      <a-tooltip title="Export JSON">
        <a-button
          type="text"
          size="small"
          class="text-gray-500 hover:text-gray-800"
          @click="handleExport"
        >
          <template #icon><ExportOutlined /></template>
        </a-button>
      </a-tooltip>

      <a-tooltip title="Import JSON">
        <a-button
          type="text"
          size="small"
          class="text-gray-500 hover:text-gray-800"
          @click="triggerImport"
        >
          <template #icon><ImportOutlined /></template>
        </a-button>
      </a-tooltip>

      <!-- Hidden file input for import -->
      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        class="hidden"
        @change="handleImport"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  UndoOutlined,
  RedoOutlined,
  AppstoreOutlined,
  ExportOutlined,
  ImportOutlined,
} from '@ant-design/icons-vue'
import { useEditorStore } from '@/core/store/editor.store'
import type { Breakpoint, DocumentModel } from '@/core/types/document'

const store = useEditorStore()
const fileInputRef = ref<HTMLInputElement | null>(null)

const breakpointLabel = computed(() => {
  const map: Record<Breakpoint, string> = {
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
  }
  return map[store.activeBreakpoint as Breakpoint]
})

function handleModeChange(value: string | number): void {
  store.setMode(value === 'Edit' ? 'edit' : 'preview')
}

function handleBreakpointChange(value: string | number): void {
  const map: Record<string, Breakpoint> = {
    Desktop: 'desktop',
    Tablet: 'tablet',
    Mobile: 'mobile',
  }
  store.setBreakpoint(map[value as keyof typeof map] || 'desktop')
}

function handleExport(): void {
  const doc = store.exportDocument()
  const json = JSON.stringify(doc, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.json'
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport(): void {
  fileInputRef.value?.click()
}

function handleImport(e: Event): void {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    try {
      const doc = JSON.parse(event.target?.result as string) as DocumentModel
      if (doc.rootId && doc.nodes) {
        store.loadDocument(doc)
      }
    } catch (err) {
      console.error('Failed to import document:', err)
    }
  }
  reader.readAsText(file)
  input.value = ''
}

// Keyboard shortcuts
function handleKeydown(e: KeyboardEvent): void {
  const isMeta = e.metaKey || e.ctrlKey

  if (isMeta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    store.undo()
  }
  if (isMeta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    store.redo()
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (store.selectedNodeId && store.selectedNodeId !== store.document.rootId) {
      const activeEl = document.activeElement as HTMLElement
      if (activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.isContentEditable) return
      e.preventDefault()
      store.doDeleteNode(store.selectedNodeId)
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
