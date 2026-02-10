<template>
  <div>
    <div
      class="group flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors"
      :class="[
        isSelected ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-100',
      ]"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click.stop="handleClick"
      @mouseenter="handleHover"
      @mouseleave="handleHoverLeave"
    >
      <!-- Expand toggle for containers -->
      <span
        v-if="hasChildren"
        class="w-4 h-4 flex items-center justify-center cursor-pointer text-gray-400"
        @click.stop="toggleExpanded"
      >
        <CaretRightOutlined v-if="!expanded" class="text-[10px]" />
        <CaretDownOutlined v-else class="text-[10px]" />
      </span>
      <span v-else class="w-4" />

      <!-- Node label -->
      <span class="truncate flex-1">
        {{ node.meta?.name || node.type }}
      </span>

      <!-- Actions -->
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <a-tooltip title="Delete" v-if="node.id !== store.document.rootId">
          <DeleteOutlined
            class="text-gray-400 hover:text-red-500 text-xs cursor-pointer"
            @click.stop="handleDelete"
          />
        </a-tooltip>
      </div>
    </div>

    <!-- Children -->
    <template v-if="expanded && hasChildren">
      <LayerItem
        v-for="childId in node.children"
        :key="childId"
        :node-id="childId"
        :nodes="nodes"
        :depth="depth + 1"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CaretRightOutlined, CaretDownOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { useEditorStore } from '@/core/store/editor.store'
import type { EditorNode } from '@/core/types/document'

const props = defineProps<{
  nodeId: string
  nodes: Record<string, EditorNode>
  depth: number
}>()

const store = useEditorStore()
const expanded = ref(true)

const node = computed(() => props.nodes[props.nodeId])
const hasChildren = computed(() => (node.value?.children.length ?? 0) > 0)
const isSelected = computed(() => store.selectedNodeId === props.nodeId)

function toggleExpanded(): void {
  expanded.value = !expanded.value
}

function handleClick(): void {
  store.selectNode(props.nodeId)
}

function handleHover(): void {
  store.hoverNode(props.nodeId)
}

function handleHoverLeave(): void {
  store.hoverNode(null)
}

function handleDelete(): void {
  store.doDeleteNode(props.nodeId)
}
</script>
