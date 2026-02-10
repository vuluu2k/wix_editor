<template>
  <div class="h-full bg-white border-r border-gray-200">
    <Sidebar
      :active-key="ui.activeSidebarTab"
      @update:active-key="ui.activeSidebarTab = $event"
    />
  </div>
</template>

<script setup lang="ts">
import Sidebar from '@/editor/Sidebar.vue'
import { useUiStore } from '@/core/store/ui.store'

const ui = useUiStore()
</script>

