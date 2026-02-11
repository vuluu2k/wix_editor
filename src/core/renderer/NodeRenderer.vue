<template>
  <div
    :class="['node-item', mode === 'edit' ? 'group' : '']"
    :style="computedStyles"
    :data-node-id="node.id"
    :data-node-type="node.type"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown.stop="handleMouseDown"
  >
    <!-- Section: children go into column-2 inner grid -->
    <template v-if="node?.type === 'section'">
      <div style="grid-column: 2; position: relative;" :style="sectionInnerGridStyle">
        <NodeRenderer
          v-for="childId in node.children"
          :key="childId"
          :node-id="childId"
          :nodes="nodes"
          :breakpoint="breakpoint"
          :mode="mode"
          :computed-grid="computedGrid"
          @node-click="$emit('node-click', $event)"
          @node-hover="$emit('node-hover', $event)"
          @node-hover-leave="$emit('node-hover-leave')"
          @node-mousedown="$emit('node-mousedown', $event)"
        />
      </div>
       <!-- Add Section Button (Visible when focused or child focused) -->
      <div v-if="mode === 'edit' && isSectionFocused" 
           class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-[60] pointer-events-auto">
        <button class="bg-white hover:bg-blue-50 text-blue-600 border border-blue-600 text-xs px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1 transition-colors">
           <span class="text-lg leading-none font-light">+</span> {{ t('editor.addSection') }}
        </button>
      </div>
    </template>
    <!-- Container: render children directly -->
    <template v-else-if="isContainer">
      <NodeRenderer
        v-for="childId in node.children"
        :key="childId"
        :node-id="childId"
        :nodes="nodes"
        :breakpoint="breakpoint"
        :mode="mode"
        :computed-grid="computedGrid"
        @node-click="$emit('node-click', $event)"
        @node-hover="$emit('node-hover', $event)"
        @node-hover-leave="$emit('node-hover-leave')"
        @node-mousedown="$emit('node-mousedown', $event)"
      />
    </template>
    <!-- Leaf: render via registry -->
    <template v-else>
      <component :is="renderContent" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEditorStore } from '@/core/store/editor.store'
import type { Breakpoint, EditorNode } from '@/core/types/document'
import type { ComputedGrid } from '@/core/types/grid'
import { resolveComponent } from './resolveComponent'
import { getNodeComputedStyles } from './styleMerge'

const props = defineProps<{
  nodeId: string
  nodes: Record<string, EditorNode>
  breakpoint: Breakpoint
  mode: 'edit' | 'preview'
  computedGrid: ComputedGrid | null
}>()

const emit = defineEmits<{
  'node-click': [nodeId: string]
  'node-hover': [nodeId: string]
  'node-hover-leave': []
  'node-mousedown': [payload: { nodeId: string; event: MouseEvent }]
}>()

const store = useEditorStore()
const { t } = useI18n()

const node = computed(() => props.nodes[props.nodeId])

const entry = computed(() => {
  if (!node.value) return undefined
  return resolveComponent(node.value.type)
})

const isContainer = computed(() => {
  const t = node.value?.type
  return t === 'container' || t === 'section'
})

// Check if section is focused OR any descendant is focused
const isSectionFocused = computed(() => {
  if (node.value?.type !== 'section') return false
  if (!store.selectedNodeId) return false
  
  // 1. Is section itself selected?
  if (store.selectedNodeId === props.nodeId) return true
  
  // 2. Is selected node a descendant of this section?
  let currentId: string | null = store.selectedNodeId
  while (currentId) {
    // If we reached root without finding this section, stop
    if (!props.nodes[currentId]) break 
    
    if (props.nodes[currentId].id === props.nodeId) return true // Should be caught by #1 but safe check
    if (props.nodes[currentId].parentId === props.nodeId) return true
    
    currentId = props.nodes[currentId].parentId
  }
  
  return false
})

// Inner grid style for section's center column — page grid columns inside
const sectionInnerGridStyle = computed(() => {
  if (!props.computedGrid || node.value?.type !== 'section') return {}
  const { columns, gutterWidth } = props.computedGrid
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
    columnGap: `${gutterWidth}px`,
    width: '100%',
    minHeight: 'inherit',
  }
})

const computedStyles = computed(() => {
  if (!node.value) return {}

  // Use grid-aware style computation
  const styles = getNodeComputedStyles(
    node.value,
    props.computedGrid,
    props.breakpoint
  )

  const common = props.mode === 'edit' 
    ? { cursor: 'move', userSelect: 'none' as const } 
    : {}

  // ─── Root Node: Vertical section stack ─────────────────
  if (!node.value.parentId) {
    return {
      ...styles,
      ...common,
      display: 'flex',
      flexDirection: 'column' as const,
      width: '100%',
      minHeight: '100%',
      position: 'relative' as const,
    }
  }

  // ─── Section Node: 1fr 1200px 1fr centered layout ───────
  if (node.value.type === 'section' && props.computedGrid) {
    const { columns, gutterWidth } = props.computedGrid
    const contentWidth = columns.length > 0 
      ? (columns[columns.length - 1].x + columns[columns.length - 1].width) - columns[0].x
      : 1200
    return {
      ...styles,
      cursor: props.mode === 'edit' ? 'default' : undefined,
      userSelect: props.mode === 'edit' ? 'none' as const : undefined,
      display: 'grid',
      gridTemplateColumns: `1fr ${contentWidth}px 1fr`,
      alignItems: 'start',
      position: 'relative' as const,
      width: '100%',
      borderTop: props.mode === 'edit' ? '1px dashed rgba(59, 130, 246, 0.3)' : undefined,
      borderBottom: props.mode === 'edit' ? '1px dashed rgba(59, 130, 246, 0.3)' : undefined,
    }
  }

  // ─── Grid Layout (Container with grid config) ──────────
  if (node.value.layout?.type === 'grid') {
    const { cols, rows, rowGap, colGap, padding, gap } = node.value.layout
    const finalRowGap = rowGap ?? gap ?? 0
    const finalColGap = colGap ?? gap ?? 0
    
    return {
      ...styles,
      ...common,
      display: 'grid',
      gridTemplateColumns: typeof cols === 'number' ? `repeat(${cols}, 1fr)` : cols || '1fr',
      gridTemplateRows: typeof rows === 'number' ? `repeat(${rows}, 1fr)` : rows || 'auto',
      rowGap: `${finalRowGap}px`,
      columnGap: `${finalColGap}px`,
      paddingTop: `${padding?.top ?? 0}px`,
      paddingRight: `${padding?.right ?? 0}px`,
      paddingBottom: `${padding?.bottom ?? 0}px`,
      paddingLeft: `${padding?.left ?? 0}px`,
      alignContent: 'start',
    }
  }

  // Add cursor pointer in edit mode for draggable nodes
  if (props.mode === 'edit') {
    return { ...styles, ...common }
  }
  return styles
})

const renderContent = computed(() => {
  if (!node.value || !entry.value) return null
  return entry.value.render(node.value, { mode: props.mode })
})

function handleClick(): void {
  if (node.value) {
    emit('node-click', node.value.id)
  }
}

function handleMouseEnter(): void {
  if (node.value) {
    emit('node-hover', node.value.id)
  }
}

function handleMouseLeave(): void {
  emit('node-hover-leave')
}

function handleMouseDown(e: MouseEvent): void {
  if (node.value && props.mode === 'edit') {
    emit('node-mousedown', { nodeId: node.value.id, event: e })
  }
}
</script>

