<template>
  <div class="p-3">
    <div class="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-3">
      Layers
    </div>
    <div class="flex flex-col">
      <LayerItem
        v-if="store.rootNode"
        :node-id="store.document.rootId"
        :nodes="store.document.nodes"
        :depth="0"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/core/store/editor.store'
import LayerItem from './LayerItem.vue'

const store = useEditorStore()
</script>
