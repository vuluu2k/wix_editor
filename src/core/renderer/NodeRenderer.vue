<template>
  <div
    :style="computedStyles"
    :data-node-id="node.id"
    :data-node-type="node.type"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousedown.stop="handleMouseDown"
  >
    <!-- Container/Section: render children recursively -->
    <template v-if="isContainer">
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

const node = computed(() => props.nodes[props.nodeId])

const entry = computed(() => {
  if (!node.value) return undefined
  return resolveComponent(node.value.type)
})

const isContainer = computed(() => {
  const t = node.value?.type
  return t === 'container' || t === 'section'
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

  // ─── Section Node: Uses page grid for its children ─────
  if (node.value.type === 'section' && props.computedGrid) {
    const { columns, gutterWidth, marginWidth } = props.computedGrid
    return {
      ...styles,
      ...common,
      display: 'grid',
      gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
      columnGap: `${gutterWidth}px`,
      paddingLeft: `${marginWidth}px`,
      paddingRight: `${marginWidth}px`,
      alignItems: 'start',
      position: 'relative' as const,
      width: '100%',
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

