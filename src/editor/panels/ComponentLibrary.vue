<template>
  <div class="p-3">
    <div class="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
      Components
    </div>
    <div class="flex flex-col gap-2">
      <div
        v-for="comp in components"
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
import { computed, h } from 'vue'
import { getAllComponents } from '@/core/registry'
import {
  ContainerOutlined,
  FontSizeOutlined,
  BorderOutlined,
} from '@ant-design/icons-vue'

const components = computed(() => getAllComponents())

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
  }
  return icons[type] || h(BorderOutlined)
}
</script>
