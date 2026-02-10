<template>
  <div class="flex flex-col h-full bg-white border-r border-gray-200 shadow-lg w-[300px]">
    <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <h3 class="text-sm font-bold text-gray-800 uppercase tracking-wider">Layers</h3>
      <button class="text-gray-400 hover:text-gray-600" @click="$emit('close')">
        Close
      </button>
    </div>
    <div class="flex-1 overflow-y-auto p-2">
      <LayersTree />
    </div>
  </div>
</template>

<script setup lang="ts">
import LayersTree from '@/editor/panels/LayersTree.vue'

defineEmits<{
  close: []
}>()
</script>
