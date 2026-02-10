<template>
  <div class="p-3">
    <!-- Add Section Button -->
    <button
      class="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold text-sm border border-blue-200 hover:border-blue-300 transition-colors cursor-pointer"
      @click="addSection"
    >
      <PlusOutlined />
      Add Section
    </button>

    <div class="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
      Elements
    </div>
    <div class="flex flex-col gap-2">
      <div
        v-for="comp in elements"
        :key="comp.type"
        class="flex items-center gap-3 p-2.5 rounded-lg cursor-grab bg-gray-50 hover:bg-blue-50 transition-colors border border-gray-200 hover:border-blue-300"
        draggable="true"
        @dragstart="handleDragStart($event, comp.type)"
      >
        <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-blue-600">
          <component :is="getIcon(comp.type)" />
        </div>
        <span class="text-gray-700 text-sm font-medium">{{ comp.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getAllComponents } from '@/core/registry'
import { useEditorStore } from '@/core/store/editor.store'
import {
  ContainerOutlined,
  FontSizeOutlined,
  BorderOutlined,
  PlusOutlined,
  BlockOutlined,
} from '@ant-design/icons-vue'
import { h } from 'vue'

const store = useEditorStore()

// Filter out 'section' from the draggable list — sections are added via the button
const elements = computed(() =>
  getAllComponents().filter(c => c.type !== 'section')
)

function addSection(): void {
  const rootId = store.document.rootId
  store.doAddNode('section', rootId)
}

function handleDragStart(e: DragEvent, type: string): void {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('component-type', type)
  e.dataTransfer.effectAllowed = 'copy'
}

function getIcon(type: string) {
  const icons: Record<string, ReturnType<typeof h>> = {
    container: h(ContainerOutlined),
    text: h(FontSizeOutlined),
    button: h(BorderOutlined),
    section: h(BlockOutlined),
  }
  return icons[type] || h(BorderOutlined)
}
</script>
