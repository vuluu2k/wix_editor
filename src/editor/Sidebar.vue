<template>
  <div class="w-[60px] h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 z-20 shadow-sm">
    <div
      v-for="item in items"
      :key="item.key"
      class="w-10 h-10 mb-3 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-200 group relative"
      :class="[
        activeKey === item.key 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      ]"
      @click="$emit('update:activeKey', activeKey === item.key ? null : item.key)"
    >
      <component :is="item.icon" class="text-xl" />
      
      <!-- Tooltip -->
      <div 
        class="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import {
  PlusOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  BgColorsOutlined,
} from '@ant-design/icons-vue'

defineProps<{
  activeKey: string | null
}>()

defineEmits<{
  'update:activeKey': [key: string | null]
}>()

const items = [
  { key: 'add', icon: h(PlusOutlined), label: 'Add Elements' },
  { key: 'layers', icon: h(AppstoreOutlined), label: 'Layers' },
  { key: 'pages', icon: h(FileTextOutlined), label: 'Pages & Menu' },
  { key: 'theme', icon: h(BgColorsOutlined), label: 'Site Design' },
]
</script>
