<template>
  <div class="flex h-full bg-white text-gray-800">
    <!-- Categories Sidebar -->
    <div class="w-1/3 min-w-[100px] border-r border-gray-100 bg-gray-50 flex flex-col overflow-y-auto">
      <div class="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
        Add Elements
      </div>
      <div 
        v-for="cat in categories" 
        :key="cat"
        class="px-4 py-2 text-sm cursor-pointer hover:bg-white hover:text-blue-600 transition-colors border-l-2"
        :class="activeCategory === cat ? 'bg-white text-blue-600 border-blue-600 font-medium shadow-sm' : 'border-transparent text-gray-600'"
        @mouseenter="activeCategory = cat"
      >
        {{ cat }}
      </div>
    </div>

    <!-- Components Grid -->
    <div class="flex-1 p-4 overflow-y-auto bg-white">
      <div class="mb-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-1">{{ activeCategory }}</h3>
        <p class="text-xs text-gray-500">Drag elements to the canvas</p>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div
          v-for="comp in activeComponents"
          :key="comp.type"
          class="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:shadow-md cursor-grab transition-all bg-white group"
          draggable="true"
          @dragstart="handleDragStart($event, comp.type)"
        >
          <!-- Preview Icon/Box -->
          <div class="w-full aspect-video bg-gray-50 rounded flex items-center justify-center text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-colors">
             <component :is="getIcon(comp.type)" class="text-2xl" />
          </div>
          <span class="text-xs font-medium text-gray-700">{{ comp.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { getAllComponents } from '@/core/registry'
import {
  ContainerOutlined,
  FontSizeOutlined,
  BorderOutlined,
  AppstoreAddOutlined
} from '@ant-design/icons-vue'

const components = getAllComponents()
const categories = computed(() => {
  const cats = new Set(components.map(c => c.category || 'Other'))
  return Array.from(cats).sort()
})

const activeCategory = ref(categories.value[0] || 'Layout')

const activeComponents = computed(() => {
  return components.filter(c => (c.category || 'Other') === activeCategory.value)
})

function handleDragStart(e: DragEvent, type: string): void {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('component-type', type)
  e.dataTransfer.effectAllowed = 'copy'
}

function getIcon(type: string) {
  const icons: Record<string, any> = {
    container: h(ContainerOutlined),
    text: h(FontSizeOutlined),
    button: h(BorderOutlined),
  }
  return icons[type] || h(AppstoreAddOutlined)
}
</script>
